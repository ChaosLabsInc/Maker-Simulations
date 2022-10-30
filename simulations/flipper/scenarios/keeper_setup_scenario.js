var ethers = require("ethers");
var constants = require("../common/constants");

class Script {
  constructor() {}

  async OnSimulationStart() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

    console.log("keeper setup scenario");

    const wei = ethers.utils.parseEther("500");
    await provider.send("hardhat_setBalance", [constants.KEEPER_WALLET_ADDRESS, wei.toHexString()]);

    const keeperBalance = await provider.getBalance(constants.KEEPER_WALLET_ADDRESS);
    const balanceInEth = ethers.utils.formatEther(keeperBalance);

    console.log(`Keeper Address: ${constants.KEEPER_WALLET_ADDRESS}`);
    console.log(`Keeper Balance: ${balanceInEth}`);

    await provider.send("hardhat_impersonateAccount", [constants.KEEPER_WALLET_ADDRESS]);
    await provider.send("anvil_setCode", [constants.KEEPER_WALLET_ADDRESS, ""]);
  }
}

module.exports = Script;
