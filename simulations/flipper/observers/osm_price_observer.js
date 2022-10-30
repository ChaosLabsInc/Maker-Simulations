var ethers = require("ethers");
var constants = require("../common/constants");
var utils = require("../common/utils");

class Script {
  constructor(ilks) {
    this.ilks = ilks;
  }

  async OnBlockMine() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const ilkMappings = this.getIlks(this.ilks);
    let result = { observations: {} };
    for (let pipData of ilkMappings) {
      const pipAddress = pipData.pipAddress;
      const price = await utils.getMakeOraclePriceFromStorage(provider, pipAddress);
      pipData.collateralTypes.forEach((type) => (result.observations[`${type} Price`] = price));
    }

    return result;
  }

  getIlks(ilks) {
    if (ilks === undefined || ilks === null || Object.keys(ilks).length === 0) {
      Log("No ilks provided. using default configuration");
      return Object.entries(constants.PIPMapping).map(([_, data]) => data);
    }

    return Object.entries(constants.PIPMapping)
      .map(([_, data]) => {
        const collateralTypesForAddress = data.ilks.filter((value) => ilks.includes(value));
        return {
          collateralTypes: collateralTypesForAddress,
          pipAddress: data.pipAddress,
        };
      })
      .filter((data) => data.collateralTypes.length > 0);
  }
}

module.exports = Script;
