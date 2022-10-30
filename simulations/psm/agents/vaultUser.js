var ethers = require("ethers");
var abis = require("../modules/abis");

const VAULT_USER = "0x12949651a3a7cf952a06fc7f97e13e40f377db9c";

class Script {
  constructor(collateralAmountEth, maxDepeg) {
    this.collateralAmountEth = collateralAmountEth;
    this.maxDepeg = maxDepeg;
    this.provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    this.activeInstancesLimitation = 1;
  }

  async OnSimulationStart() {
    await this.provider.send("hardhat_impersonateAccount", [VAULT_USER]);
    this.signer = this.provider.getSigner(VAULT_USER);

    const ilkList = _get("ilksInfo");
    this.ilk = ilkList[0];
    this.gemJoinContract = new ethers.Contract(this.ilk[6], abis.GEM_JOIN_ABI, this.signer);
    this.amount = ethers.utils.parseUnits(this.collateralAmountEth.toString(), this.ilk[3]);
    this.tin = _get("tin");
    this.vaultUserBalance = await this.balanceOf(this.ilk[4], VAULT_USER);
  }

  async OnBlockMine() {
    // open vault
    if (this.vaultUserBalance > this.amount) {
      const price = _get("daiPrice");
      const depeg = Math.abs(1 - price);
      console.log("price: ", price);
      console.log("depeg: ", depeg);

      if (depeg < this.tin + this.maxDepeg) {
        console.log("open vault");
        await this.approve(this.ilk[4], VAULT_USER, this.ilk[6], this.amount);
        console.log("approved");
        await this.gemJoinContract.join(VAULT_USER, this.amount).then(async (tx) => await tx.wait());
        console.log("deposited collateral: ", this.ilk[0]);
      }

      this.vaultUserBalance = await this.balanceOf(this.ilk[4], VAULT_USER);
    }
  }

  async balanceOf(erc20AssetAddress, userAddress) {
    const erc20Contract = new ethers.Contract(erc20AssetAddress, abis.ERC20ABI, this.provider);
    return await erc20Contract.balanceOf(userAddress);
  }

  async approve(erc20AssetAddress, userAddress, approvedAddress, amount) {
    const signer = this.provider.getSigner(userAddress);
    const erc20Contract = new ethers.Contract(erc20AssetAddress, abis.ERC20ABI, signer);

    // approve sale
    await erc20Contract.approve(approvedAddress, amount).then(async (tx) => await tx.wait());
  }
}

module.exports = Script;

