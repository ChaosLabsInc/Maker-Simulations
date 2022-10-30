var ethers = require("ethers");
var abis = require("../common/abis");
var constants = require("../common/constants");

class Script {
  constructor(ilk) {
    this.ilk = ilk;
  }

  async OnBlockMine() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

    const ilkInfo = constants.config_collateral[this.ilk];
    const clipperContract = await new ethers.Contract(ilkInfo.clipper, abis.CLIPPER_ABI, provider);

    const auctionIds = (await clipperContract.list()) ?? [];

    const auctionsDetails = await Promise.all(
      auctionIds.map(async (auctionId) => await clipperContract.sales(auctionId)),
    );

    // the amount of collateral available for purchase
    return auctionsDetails.reduce((acc, obj) => {
      const auctionLot = parseFloat(ethers.utils.formatEther(obj["lot"]));
      return acc + auctionLot;
    }, 0);
  }
}

module.exports = Script;
