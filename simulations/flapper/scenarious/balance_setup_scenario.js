var ethers = require('ethers')

class Script {
  
  constructor(account, amount) {
    console.log("Balance setup scenario ctor");
    this.account = account;
    this.amount = amount;
  }

  async OnSimulationStart() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

    const wei = ethers.utils.parseUnits(`${this.amount}`, 18);
    await provider.send("hardhat_setBalance", [this.account, wei._hex]);
    const accountBalance = await provider.getBalance(this.account);
    const balanceInEth = ethers.utils.formatUnits(accountBalance, 18);

    console.log(`Account Address: ${this.account}`);
    console.log(`Account Balance: ${balanceInEth}`);

    await provider.send("hardhat_impersonateAccount", [this.account]);
  }
}

module.exports = Script;
