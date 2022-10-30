var ethers = require('ethers')
var addressModule = require("../Modules/addressModule");
var abiModule = require("../Modules/abiModule");

class Script {
  constructor() {
    console.log("Fill Assertion ctor");
    this.provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  }

  async OnBlockMine() {
    const flapperContract = new ethers.Contract(addressModule.flapperAddress, abiModule.flapperABI, this.provider);
    const fill = await flapperContract.fill();
    return { result: fill > 0, errorMessage: `Fill amount never exceeded 0` };
  }
}

module.exports = Script;
