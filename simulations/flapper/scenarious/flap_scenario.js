var addressModule = require("../Modules/addressModule");
var abiModule = require("../Modules/abiModule");
var ethers = require("ethers");
var BigNumber = require("@ethersproject/bignumber").BigNumber

const vatDaiStorageSlot = 5;

class Script {
  constructor() {
    console.log("Flap scenario ctor");
  }

  async OnSimulationStart() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    await this.AddDaiBalanceToVow(provider);
    await this.ZeroVowDebt(provider);
    await this.checkFlap(provider);
  }

  async AddDaiBalanceToVow(provider) {
    await this.GetStorageAtMapping(provider, addressModule.vatAddress, addressModule.vowAddress, vatDaiStorageSlot);
    await this.SetStorageAtMapping(
      provider,
      addressModule.vatAddress,
      addressModule.vowAddress,
      vatDaiStorageSlot,
      "0x10000000000000000004c3e2982aacc52de12386eab78c2d05ce23b01335a4da", // a really big number
    );
    await this.GetStorageAtMapping(provider, addressModule.vatAddress, addressModule.vowAddress, vatDaiStorageSlot);
  }

  async ZeroVowDebt(provider) {
    const vatContract = new ethers.Contract(addressModule.vatAddress, abiModule.vatABI, provider);
    const sin = await vatContract.sin(addressModule.vowAddress);
    const newSin = ethers.utils.hexZeroPad(ethers.BigNumber.from(sin).toHexString(), 32);
    await provider.send("hardhat_setStorageAt", [addressModule.vowAddress, "0x5", newSin]);
  }

  GetMappingStorageKey(key, slot) {
    // The pre-image used to compute the Storage location
    const newKeyPreimage = ethers.utils.concat([
      // Mappings' keys in Solidity must all be word-aligned (32 bytes)
      ethers.utils.hexZeroPad(key, 32),
      // Similarly with the slot-index into the Solidity variable layout
      ethers.utils.hexZeroPad(BigNumber.from(slot).toHexString(), 32),
    ]);
    const newKey = ethers.utils.keccak256(newKeyPreimage);
    return newKey;
  }

  async GetStorageAtMapping(provider, contractAddr, key, slot) {
    const newKey = this.GetMappingStorageKey(key, slot);
    const value = await provider.getStorageAt(contractAddr, newKey);
    console.log("Value:", value);
  }

  async SetStorageAtMapping(provider, contractAddr, key, slot, valueSet) {
    const newKey = this.GetMappingStorageKey(key, slot);
    await provider.send("hardhat_setStorageAt", [contractAddr, ethers.utils.hexStripZeros(newKey), valueSet]);
  }

  async checkFlap(provider) {
    const firstCheck = await this.calculateGap(provider); //has to be positive
    const secondCheck = await this.calculateDebtCheck(provider); //has to be zero
    console.log("** first check passed: ", firstCheck > 0);
    console.log("** second check passed: ", secondCheck === 0);
  }

  async calculateGap(provider) {
    const vowContract = new ethers.Contract(addressModule.vowAddress, abiModule.vowABI, provider);
    const vatContract = new ethers.Contract(addressModule.vatAddress, abiModule.vatABI, provider);
    const sin = await vatContract.sin(addressModule.vowAddress);
    const dai = await vatContract.dai(addressModule.vowAddress);
    const bump = await vowContract.bump();
    const hump = await vowContract.hump();
    return parseInt(dai) - (parseInt(sin) + parseInt(bump) + parseInt(hump));
  }

  async calculateDebtCheck(provider) {
    const vowContract = new ethers.Contract(addressModule.vowAddress, abiModule.vowABI, provider);
    const vatContract = new ethers.Contract(addressModule.vatAddress, abiModule.vatABI, provider);
    const sin = await vatContract.sin(addressModule.vowAddress);
    const Sin = await vowContract.Sin();
    const Ash = await vowContract.Ash();

    return parseInt(sin) - parseInt(Sin) + parseInt(Ash);
  }
}

module.exports = Script;
