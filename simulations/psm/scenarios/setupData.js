var ethers = require("ethers");
var abis = require("../modules/abis");

const ILK_REGISTRY_ADDRESS = "0x5a464c28d19848f44199d003bef5ecc87d090f87";
const USDC_TOKEN = { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", curveIndex: 1 };

class Script {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  }

  async OnSimulationStart() {
    const initialBlockNumber = await this.provider.getBlockNumber();
    const ilkNum = 50;

    const ilkRegistryContract = new ethers.Contract(ILK_REGISTRY_ADDRESS, abis.ILK_REGISTRY_ABI, this.provider);
    const ilkList = await ilkRegistryContract.list(0, ilkNum - 1);
    const ilkJoins = new Set();
    const ilksInfo = [];
    let usdcCollateral = 0;
    let totalCollateral = 0;

    for (const ilk of ilkList) {
      const ilkInfo = await ilkRegistryContract.info(ilk);
      const ilkJoin = ilkInfo[6];

      if (ilkJoins.has(ilkJoin)) {
        continue;
      }

      const dec = ilkInfo[3];
      const ilkGem = ilkInfo[4];
      const ilkPip = ilkInfo[5];

      const gemAmount = await balanceOf(this.provider, ilkGem, ilkJoin);
      const gemAmountFormat = ethers.utils.formatUnits(gemAmount, dec);

      if (ilkGem === USDC_TOKEN.address) {
        usdcCollateral += parseFloat(gemAmountFormat);
      } else {
        let gemPrice = await getMakeOraclePriceFromStorage(this.provider, ilkPip);
        if (gemPrice === 0) {
          gemPrice = 1;
        }
        const value = gemAmountFormat * gemPrice;
        totalCollateral += value;
      }

      console.log(ilkInfo);
      ilkJoins.add(ilkJoin);
      ilksInfo.push(ilkInfo);
    }
    _set("ilksInfo", ilksInfo);
    _set("initialBlockNumber", initialBlockNumber);

    _set("profit", 0);
    _set("daiPriceOnCurve", 1);
    _set("fees", 0);
    _set("arbitrageSize", 0);
    _set("expectedProfit", 0);
    _set("slippage", 0);
    _set("sellPressure", 0);
    _set("daiPrice", 1);
    _set("tin", 0);
    _set("usdcCollateral", usdcCollateral);
    _set("nonUsdcCollateral", totalCollateral);
  }
}

module.exports = Script;

async function balanceOf(provider, erc20AssetAddress, userAddress) {
  const erc20Contract = new ethers.Contract(erc20AssetAddress, abis.ERC20ABI, provider);
  return await erc20Contract.balanceOf(userAddress);
}

async function getMakeOraclePriceFromStorage(provider, pipAddress) {
  const data = await provider.getStorageAt(pipAddress, 3);

  const sliced = data.slice(34);
  const formattedPrice = await ethers.utils.formatUnits(
    ethers.BigNumber.from(parseInt(sliced, 16).toLocaleString().replace(/,/g, "")).toString(),
    18,
  );
  return parseFloat(formattedPrice);
}
