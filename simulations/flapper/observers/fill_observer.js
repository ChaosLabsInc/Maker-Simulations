var ethers = require('ethers')
var addressModule = require("../Modules/addressModule");
var abiModule = require("../Modules/abiModule");

const DAI_MULTIPLIER = ethers.BigNumber.from(10).pow(45);

class Script {
  constructor() {
    console.log("Fill Observer ctor");
  }

  async OnBlockMine() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const flapperContract = new ethers.Contract(addressModule.flapperAddress, abiModule.flapperABI, provider);
    const fill = await flapperContract.fill();
    return ethers.BigNumber.from(fill).div(DAI_MULTIPLIER).toNumber();
  }
}

module.exports = Script;
