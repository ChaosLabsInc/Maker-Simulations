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
    // the target DAI to raise from the auction
    return auctionsDetails.reduce((acc, obj) => {
      // tob is stored on the clipper contract with (18 + 27 decimals)
      const auctionTab = parseFloat(ethers.utils.formatUnits(obj["tab"], 45));
      return acc + auctionTab;
    }, 0);
  }
}

module.exports = Script;
