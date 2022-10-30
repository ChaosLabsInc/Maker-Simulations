var ethers = require('ethers');
var addressModule = require("../Modules/addressModule");
var abiModule = require("../Modules/abiModule");

class Script {
  constructor() {
    console.log("Total auctions Observer ctor");
  }

  async OnBlockMine() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const flapperContract = new ethers.Contract(addressModule.flapperAddress, abiModule.flapperABI, provider);
    const auctionCount = await flapperContract.kicks();

    return Number(auctionCount);
  }
}

module.exports = Script;