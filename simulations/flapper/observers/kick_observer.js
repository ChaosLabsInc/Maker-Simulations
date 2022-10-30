var ethers = require('ethers')
var addressModule = require("../Modules/addressModule");
var abiModule = require("../Modules/abiModule");

class Script {
  constructor() {
    console.log("Kick Observer ctor");
  }

  async OnBlockMine() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const flapperContractWeb3 = new web3.eth.Contract(abiModule.flapperABI, addressModule.flapperAddress);
    const currentBlock = await provider.getBlockNumber();
    const events = await flapperContractWeb3.getPastEvents("Kick", {
      fromBlock: currentBlock,
      toBlock: currentBlock,
    });

    return events.length;
  }
}

module.exports = Script;
