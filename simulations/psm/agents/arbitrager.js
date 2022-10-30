var ethers = require("ethers");
var abis = require("../modules/abis");

const MAX_ARB_AMOUNT = 6000000;
const CURVE_CONSTANTS = {
  curve3PoolAddress: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
};
const DAI_TOKEN = { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", curveIndex: 0 };
const USDC_TOKEN = { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", curveIndex: 1 };

const MAKER_CONSTANTS = {
  startingBlockNumber: 15166306,
  MCD_SPOT_CONTRACT_ADDRESS: "0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3",
  PsmAddress: "0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A",
  daiAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  gemJoinAddress: "0x0A59649758aa4d66E25f08Dd01271e891fe52199",
};

const ARBITRAGER_ADDRESS = "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503";

class Script {
  constructor() {
    console.log("Arbitrager class ctor");
    this.provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    this.curve3PoolContract = new ethers.Contract(CURVE_CONSTANTS.curve3PoolAddress, abis.curvePairABI, this.provider);
    this.makerPsmUsdcA = new ethers.Contract(MAKER_CONSTANTS.PsmAddress, abis.makerPsmUsdcABI, this.provider);
    this.activeInstancesLimitation = 1;
  }

  async OnSimulationStart() {
    await this.provider.send("hardhat_impersonateAccount", [ARBITRAGER_ADDRESS]);

    const signer = this.provider.getSigner(ARBITRAGER_ADDRESS);
    this.makerPsmUsdcA = this.makerPsmUsdcA.connect(signer);
    this.curve3PoolContract = this.curve3PoolContract.connect(signer);

    this.usdcDecimals = await this.decimals(USDC_TOKEN.address);
    this.daiDecimals = await this.decimals(DAI_TOKEN.address);

    this.tIn = ethers.utils.formatEther(await this.makerPsmUsdcA.tin());
    console.log("TIn value: ", this.tIn);
    _set("tin", this.tIn);
  }

  async OnBlockMine() {
    const arbitragerInitUsdcBalance = await this.balanceOf(USDC_TOKEN.address, ARBITRAGER_ADDRESS);

    const [arbAmount, minDy] = await this.calcOptimalArbAmount(
      MAX_ARB_AMOUNT,
      this.tIn,
      this.daiDecimals,
      this.usdcDecimals,
      /*numberOfIterations=*/ 10,
    );
    console.log("Arb size: ", arbAmount);

    if (arbAmount < minDy && parseFloat(arbAmount) > 0) {
      console.log("Arb amount", arbAmount);
      // Execute arb.

      // Arbitrager swaps dai for usdc.
      const daiOut = await this.swapOnPsm(ARBITRAGER_ADDRESS, USDC_TOKEN, DAI_TOKEN, arbAmount);

      console.log(`Swap ${daiOut} dai for usdc`);

      // Arbitrager sells dai on Curve.
      await this.exchangeOnCurve(
        ARBITRAGER_ADDRESS,
        DAI_TOKEN,
        USDC_TOKEN,
        /*amount=*/ ethers.utils.parseEther(parseFloat(daiOut).toFixed(this.daiDecimals)),
      );

      // Print profit.
      let arbitragerFinalUsdcBalance = await this.balanceOf(USDC_TOKEN.address, ARBITRAGER_ADDRESS);
      console.log("Arbitrager usdc final balance: ", arbitragerFinalUsdcBalance);

      const profit = arbitragerFinalUsdcBalance - arbitragerInitUsdcBalance;
      let formatProfit = ethers.utils.formatUnits(profit, this.usdcDecimals);
      console.log("Profit: ", formatProfit);

      const protocolProfit = arbAmount * this.tIn;
      console.log("Protocol fees: ", protocolProfit);

      _set("profit", parseFloat(formatProfit));
      _set("fees", protocolProfit);
      _set("arbitrageSize", arbAmount);
    } else {
      console.log("Arb not profitable due to slippage");
    }
  }

  async calcOptimalArbAmount(maxArbAmount, tIn, inDecimals, outDecimals, numberOfIterations = 20) {
    let arbAmount = maxArbAmount;
    let minDy = 0;
    for (let i = 0; i < numberOfIterations; i++) {
      const dx = ethers.utils.parseUnits(parseFloat(arbAmount * (1 - tIn)).toFixed(inDecimals), inDecimals);
      minDy = ethers.utils.formatUnits(
        await this.curve3PoolContract.get_dy(DAI_TOKEN.curveIndex, USDC_TOKEN.curveIndex, dx),
        outDecimals,
      );
      console.log("Try arb amount: ", arbAmount);
      console.log("Min dy: ", minDy);

      if (arbAmount < minDy) {
        return [arbAmount, minDy];
      }
      arbAmount /= 2;
    }
    return [0, 0];
  }

  async swapOnPsm(address, tokenIn, tokenOut, amount) {
    // Initial dai.
    const initialDaiBalance = await this.balanceOf(tokenOut.address, address);

    // Sell Gem.
    const gemDecimals = await this.decimals(tokenIn.address);
    const gemAmount = ethers.utils.parseUnits(amount.toString(), gemDecimals);
    console.log("Gem Amount: ", gemAmount);

    await this.approve(tokenIn.address, address, MAKER_CONSTANTS.PsmAddress, gemAmount);
    await this.approve(tokenIn.address, address, MAKER_CONSTANTS.gemJoinAddress, gemAmount);

    console.log(`Approved ${amount} usdc, balance is ${await this.balanceOf(tokenIn.address, address)}`);

    const sellTx = await this.makerPsmUsdcA.sellGem(address, gemAmount);
    await sellTx.wait();

    console.log("Swapped on psm");

    const finalDaiBalance = await this.balanceOf(tokenOut.address, address);
    const amountOut = ethers.utils.formatEther(finalDaiBalance) - ethers.utils.formatEther(initialDaiBalance);

    return amountOut;
  }

  async balanceOf(erc20AssetAddress, userAddress) {
    const erc20Contract = new ethers.Contract(erc20AssetAddress, abis.ERC20ABI, this.provider);
    return await erc20Contract.balanceOf(userAddress);
  }

  async decimals(erc20AssetAddress) {
    const erc20Contract = new ethers.Contract(erc20AssetAddress, abis.ERC20ABI, this.provider);
    return await erc20Contract.decimals();
  }

  async approve(erc20AssetAddress, userAddress, approvedAddress, amount) {
    const erc20Contract = new ethers.Contract(erc20AssetAddress, abis.ERC20ABI, this.provider);
    const signer = this.provider.getSigner(userAddress);
    // Connect.
    const connectedErc20Contract = erc20Contract.connect(signer);
    // Approve sale.
    const tx = await connectedErc20Contract.approve(approvedAddress, amount);
    await tx.wait();
  }

  async exchangeOnCurve(address, tokenIn, tokenOut, amount) {
    await this.approve(tokenIn.address, address, CURVE_CONSTANTS.curve3PoolAddress, amount);

    console.log(`Approved ${amount} dai`);

    // Get amount out.
    const minDy = await this.curve3PoolContract.get_dy(tokenIn.curveIndex, tokenOut.curveIndex, amount);

    console.log(minDy);

    // Exchange.
    const tx = await this.curve3PoolContract.exchange(tokenIn.curveIndex, tokenOut.curveIndex, amount, 0);
    await tx.wait();

    console.log(`Exchanged ${amount}`);
  }
}

module.exports = Script;
