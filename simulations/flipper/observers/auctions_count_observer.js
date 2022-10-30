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
    console.log(`Number of active auctions for ilk ${this.ilk}: ${auctionIds.length}`);
    return auctionIds.length;
  }
}

module.exports = Script;
