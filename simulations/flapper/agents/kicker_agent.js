var ethers = require('ethers')
var addressModule = require("../Modules/addressModule");
var abiModule = require("../Modules/abiModule");

class Script {
  constructor(account) {
    console.log("Kicker agent class ctor");
    this.account = account;
    this.provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    this.vowContract = new ethers.Contract(addressModule.vowAddress, abiModule.vowABI, this.provider);
  }

  async OnSimulationStart() {
    const signer = this.provider.getSigner(this.account);
    this.vowContract = this.vowContract.connect(signer);
    console.log("Connecting vow contract with signer");
  } 

  async OnBlockMine() {
    console.log("Calling flap");
    await this.vowContract
      .flap()
      .then((tx) => {
        return tx.wait().then((recipt) => {
          console.log("Kicked Vat Successfully");
        });
      })
      .catch((e) => {
        console.log("Kick Failed!", e);
      });
  }
}

module.exports = Script;
