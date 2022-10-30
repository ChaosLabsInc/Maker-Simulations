var ethers = require("ethers");
var abis = require("../common/abis");
var constants = require("../common/constants");
var utils = require("../common/utils");

const priceFunctions = {
  Constant: (initialPrice, intervalsPassed, pricePercentageDelta) => initialPrice,
  // Decrease the price by 'priceDelta' every 'blockUpdateInterval' blocks
  Descending: (initialPrice, intervalsPassed, pricePercentageDelta) =>
    Math.max(initialPrice - intervalsPassed * (pricePercentageDelta * initialPrice), 0),
  // Increase the price by 'priceDelta' every 'blockUpdateInterval' blocks
  Ascending: (initialPrice, intervalsPassed, pricePercentageDelta) =>
    initialPrice + intervalsPassed * (pricePercentageDelta * initialPrice),
  // Combination of increase and decease function. the price fluctuates according to number of intervals passed
  Volatile: (initialPrice, intervalsPassed, pricePercentageDelta) =>
    Math.max(
      initialPrice + (intervalsPassed % 2 ? 1 : -1) * (pricePercentageDelta * initialPrice) * intervalsPassed,
      0,
    ),
};

class Script {
  ETH_FROM = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"; // Hardhat Account #0 initialized with 10000 ETH

  constructor(blockUpdateInterval, collateralType, initialPrice, priceFunction, pricePercentageDelta) {
    this.blockUpdateInterval = blockUpdateInterval;
    this.collateralType = collateralType;
    this.initialPrice = initialPrice;
    this.priceFunction = priceFunction;
    this.pricePercentageDelta = pricePercentageDelta;
  }

  async OnSimulationStart() {
    this.provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    this.startingBlockNumber = await this.provider.getBlockNumber();
    this.intervalsPassed = 1; // As we are setting the initial price at the beginning of the scenario there is no need to set it again

    const pipMapping = this.getIlks(this.collateralType);
    this.pipAddress = pipMapping.pipAddress;
    this.ilks = pipMapping.ilks;

    if (this.initialPrice === undefined || this.initialPrice === "" || this.initialPrice < 0) {
      this.initialPrice = await utils.getMakeOraclePriceFromStorage(this.provider, this.pipAddress);
      console.log(`🪙 Initial price for ${this.ilks}: [${this.initialPrice}]`);
    } else {
      if (initialPrice < 0) {
        this.initialPrice = 0;
      }
      console.log(`🪙 Setting Initial price for ${this.ilks}: New price: [${this.initialPrice}]`);
      await setOSMPrice(this.ilks, this.pipAddress, this.initialPrice);
    }

    this.account0Signer = this.provider.getSigner(this.ETH_FROM);
    this.spotContract = new ethers.Contract(constants.MCD_SPOT_CONTRACT_ADDRESS, abis.SPOT_ABI, this.account0Signer);
  }

  async OnBlockMine() {
    if (this.priceFunction === "Constant") {
      return;
    }

    const currentBlockNumber = await this.provider.getBlockNumber();
    const currentInterval = parseInt((currentBlockNumber - this.startingBlockNumber) / this.blockUpdateInterval) + 1;
    console.log(`blocks passed ${currentBlockNumber - this.startingBlockNumber}, current interval ${currentInterval}`);

    if (currentInterval <= this.intervalsPassed) {
      console.log("waiting for next block");
      return;
    }

    const fractionDelta = parseFloat(this.pricePercentageDelta) / 100;
    const newPrice = priceFunctions[this.priceFunction](this.initialPrice, currentInterval, fractionDelta);
    console.log(`🪙 Price for ${this.ilks}: New price: [${newPrice}]`);
    await this.setOSMPrice(this.provider, this.spotContract, this.ilks, this.pipAddress, newPrice);

    this.intervalsPassed = currentInterval;
  }

  async setOSMPrice(provider, spotContract, ilks, osmAddress, price) {
    const slot = "0x3";
    const res = await this.makerOraclePriceStorageFormat(price);
    await provider.send("hardhat_setStorageAt", [osmAddress, slot, res]);
    for (let ilk of ilks) {
      await spotContract.poke(ethers.utils.formatBytes32String(ilk));
    }
  }

  async makerOraclePriceStorageFormat(price) {
    const bigNumber = ethers.utils.parseUnits(price.toString(), 18);
    const storedPrice = ethers.utils
      .hexlify(ethers.utils.zeroPad(bigNumber._hex, 32))
      .replace(/0x00000000000000000000000000000000/g, "0x00000000000000000000000000000001");
    return storedPrice;
  }

  getIlks(collateralType) {
    if (collateralType === undefined || collateralType === null || Object.keys(collateralType).length === 0) {
      Log("No collateral type provided. using default configuration");
      return Object.entries(constants.PIPMapping)[0][1];
    }

    const ilks = Object.keys(constants.PIPMapping).filter((collateral) => collateral === collateralType);
    return ilks.length > 0 ? constants.PIPMapping[ilks[0]] : Object.entries(constants.PIPMapping)[0][1];
  }
}

module.exports = Script;
