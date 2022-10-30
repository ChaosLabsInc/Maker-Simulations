var ethers = require("ethers");
var abis = require("../common/abis");
var constants = require("../common/constants");

class Script {
  constructor(fromBlock, ilk) {
    this.fromBlock = fromBlock;
    this.ilk = ilk;
  }

  async OnBlockMine() {
    const dogContractWeb3 = new web3.eth.Contract(abis.DOG_ABI, constants.DOG_CONTRACT_ADDRESS);
    const ilkAsBytes = ethers.utils.formatBytes32String(this.ilk);

    const events = await dogContractWeb3.getPastEvents("Bark", {
      fromBlock: this.fromBlock,
      toBlock: "latest",
    });

    const res = events?.find((event) => event.returnValues.ilk === ilkAsBytes) !== undefined;
    const errorMessage = res ? "" : `${this.ilk} was not liquidated`;
    return { result: res, errorMessage: errorMessage };
  }
}

module.exports = Script;
