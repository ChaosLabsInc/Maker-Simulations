
var addressModule = require("../Modules/addressModule");
var abiModule = require("../Modules/abiModule");
var ethers = require("ethers")

const DAI_MULTIPLIER = ethers.BigNumber.from(10).pow(45);

class Script {
  constructor(newBump) {
    console.log("Lot size scenario ctor");
    this.newBump = newBump;
  }

  async OnSimulationStart() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    await this.ChangeBumpSize(provider, this.newBump);
  }

  async ChangeBumpSize(provider, newBump) {
    try {
      const vowContract = new ethers.Contract(addressModule.vowAddress, abiModule.vowABI, provider);
      const bump = await vowContract.bump();
      const newBumpFormatted = ethers.utils.hexZeroPad(
        ethers.BigNumber.from(newBump).mul(DAI_MULTIPLIER).toHexString(),
        32,
      );
      await provider.send("hardhat_setStorageAt", [addressModule.vowAddress, "0xA", newBumpFormatted]);
      const bumpAfter = await vowContract.bump();
      console.log(` old bump: ${bump} // new bump: ${bumpAfter}`);
      console.log(
        `Formatted: old bump: ${ethers.BigNumber.from(bump)
          .div(DAI_MULTIPLIER)
          .toNumber()} // new bump: ${ethers.BigNumber.from(bumpAfter).div(DAI_MULTIPLIER).toNumber()}`,
      );
    } catch (ex) {
      console.log(ex);
      throw ex;
    }
  }
}

module.exports = Script;