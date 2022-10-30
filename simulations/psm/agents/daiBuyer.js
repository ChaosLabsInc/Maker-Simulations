var ethers = require("ethers");
var abis = require("../modules/abis");

// Curve constants
const CURVE_CONSTANTS = {
  curve3PoolAddress: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
};
const DAI_BUYER = "0x55fe002aeff02f77364de339a1292923a15844b8";
const DAI_TOKEN = { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", curveIndex: 0, decimals: 18 };
const USDC_TOKEN = { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", curveIndex: 1, decimals: 6 };

class Script {
  constructor(sellPressure) {
    this.sellPressure = sellPressure;
    this.provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    this.activeInstancesLimitation = 1;
  }

  async OnSimulationStart() {
    await this.provider.send("hardhat_impersonateAccount", [DAI_BUYER]);
    this.signer = this.provider.getSigner(DAI_BUYER);
    this.curve3PoolContract = new ethers.Contract(CURVE_CONSTANTS.curve3PoolAddress, abis.curvePairABI, this.signer);
  }

  async OnBlockMine() {
    const formatRandomSellPressure = parseFloat(this.sellPressure * (Math.random() + 1)).toFixed(USDC_TOKEN.decimals);
    const sellPressure = ethers.utils.parseUnits(formatRandomSellPressure, USDC_TOKEN.decimals);
    console.log("Sell pressure: ", sellPressure);

    try {
      await this.approve(this.signer, USDC_TOKEN.address, CURVE_CONSTANTS.curve3PoolAddress, sellPressure);

      // Get amount out
      const minDy = await this.curve3PoolContract.get_dy(USDC_TOKEN.curveIndex, DAI_TOKEN.curveIndex, sellPressure);

      console.log(
        `Current DAI price on curve: ${
          ethers.utils.formatUnits(sellPressure, USDC_TOKEN.decimals) /
          ethers.utils.formatUnits(minDy, DAI_TOKEN.decimals)
        }`,
      );

      // Exchange
      await this.curve3PoolContract
        .exchange(USDC_TOKEN.curveIndex, DAI_TOKEN.curveIndex, sellPressure, 0)
        .then(async (tx) => await tx.wait());
      _set("sellPressure", parseFloat(formatRandomSellPressure));
      console.log(`exchanged ${sellPressure} USDC for DAI`);
    } catch (e) {
      _set("sellPressure", 0);
      console.log("dump failed!", e);
    }
  }

  async approve(signer, erc20AssetAddress, approvedAddress, amount) {
    const erc20Contract = new ethers.Contract(erc20AssetAddress, abis.ERC20ABI, signer);

    // Approve sale
    await erc20Contract.approve(approvedAddress, amount).then(async (tx) => await tx.wait());
  }
}

module.exports = Script;
