var ethers = require("ethers");
var abis = require("../common/abis");
var constants = require("../common/constants");
var utils = require("../common/utils");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

class Script {
  constructor(ilks, numberOfCdpsToBark) {
    this.ilks = ilks;
    this.numberOfCdpsToBark = numberOfCdpsToBark;
  }

  async OnSimulationStart() {
    const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

    console.log("Keeper Agent");
    const collateral = Object.keys(constants.config_collateral)
      .filter((key) => this.ilks.length === 0 || this.ilks.includes(key))
      .reduce((obj, key) => {
        obj[key] = constants.config_collateral[key];
        return obj;
      }, {});

    this.keeper = new Keeper(provider, collateral, this.numberOfCdpsToBark);
    await this.keeper.init();
  }

  async OnBlockMine() {
    await this.keeper.triggerAuctions();
  }
}

// Default mapping true to block #15725188
const ILKS_TO_BARK = {
  "ETH-A": {
    ids: [24951, 747, 7291, 8304, 27324, 28803, 15961, 19201, 6794, 25845, 29597, 27100, 1951],
    addresses: [],
  },
  "ETH-B": { ids: [27691, 29200, 29013, 29346, 28434, 29231, 29306], addresses: [] },
  "ETH-C": { ids: [27239, 23332, 28823, 27897, 29291, 29224, 28279], addresses: [] },
  "WBTC-A": { ids: [19144, 24504, 9073, 24497, 21941, 18913, 22834, 17625], addresses: [] },
  "WBTC-B": { ids: [27624, 29486, 28944, 28662, 27855, 28970, 28354], addresses: [] },
  "WBTC-C": { ids: [29587, 28347, 26903, 28073, 09564, 26945, 26824, 26867], addresses: [] },
  "WSTETH-A": { ids: [26611, 27138, 278992, 27774, 29604, 29563, 28800, 28172, 28769], addresses: [] },
  "WSTETH-B": { ids: [28579, 29156, 28469, 29531, 29467, 29469, 28324, 29276, 29376, 29279], addresses: [] },
  "MANA-A": { ids: [28269, 28290, 28270, 25556, 12040], addresses: [] },
  "LINK-A": { ids: [23721, 29720, 23804, 22883, 23961, 23364], addresses: [] },
  "YFI-A": { ids: [], addresses: [] },
  "MATIC-A": { ids: [26236, 26248, 29294, 27148, 29556], addresses: [] },
  "UNIV2DAIETH-A": { ids: [20027], addresses: [] },
  "UNIV2USDCETH-A": { ids: [29344, 22992, 28655, 22458, 23464, 26964, 25730], addresses: [] },
  "CRVV1ETHSTETH-A": { ids: [29456, 28468, 28156, 28992, 29393, 28998, 29559], addresses: [] },
};

class Keeper {
  _provider = null;
  _signer = null;
  _wallet = null;
  _numberOfCdpsToBark = null;
  _ilkAddressesToBark = {};

  constructor(provider, collateral, numberOfCdpsToBark) {
    this._provider = provider;
    this.collateral = collateral;
    this._numberOfCdpsToBark = numberOfCdpsToBark;
  }

  async _kickAuctions(keeperAddress, ilk) {
    const dogContract = new ethers.Contract(constants.DOG_CONTRACT_ADDRESS, abis.DOG_ABI, this._signer);
    const addresses = this._ilkAddressesToBark[ilk];

    await Promise.all(
      addresses.map(async (urnAddress) => {
        if (urnAddress.barked === true) {
          console.log(`already barked ${ilk} ${urnAddress.address}` + JSON.stringify(urnAddress));
          return;
        }
        console.log(`barking at: ${ilk} ${urnAddress.address}`);

        try {
          await dogContract.callStatic.bark(ethers.utils.formatBytes32String(ilk), urnAddress.address, keeperAddress);
        } catch (e) {
          if (e.toString().includes("reverted with reason string 'Dog/not-unsafe'")) {
            console.log(`bark - skipped (${ilk} ${urnAddress.address})`);
            return;
          }
        }

        await dogContract.bark(ethers.utils.formatBytes32String(ilk), urnAddress.address, keeperAddress).then(
          (tx) => {
            return tx
              .wait()
              .then((receipt) => {
                // This is entered if the transaction receipt indicates success
                console.log(`barked: ${ilk} ${urnAddress.address}`);
                urnAddress.barked = true;
              })
              .catch((e) => console.log(`bark - error (${ilk} ${urnAddress.address})`, e.toString()));
          },
          (e) => {
            // This is entered if the status of the receipt is failure
            if (e.toString().includes("reverted with reason string 'Dog/not-unsafe'")) {
              console.log(`bark - skipped (${ilk} ${urnAddress.address})`);
            } else {
              console.log(`bark - error (${ilk} ${urnAddress.address})`, e.toString());
            }
          },
        );
      }),
    );
  }

  async _initializeIlkAddresses(block) {
    const ilkMappings = await this._getIlksAddressesToBark(Object.keys(this.collateral), block, this._numberOfCdpsToBark);
    this._ilkAddressesToBark = Object.keys(Object.fromEntries(ilkMappings)).reduce((acc, key) => {
      const addresses = ilkMappings.get(key).map((addr) => ({ address: addr, barked: false }));
      acc[key] = addresses;
      return acc;
    }, {});
  }

  async _getIlksAddressesToBark(ilks, block, numberOfCdpsToBark) {
    if (ilks === undefined || ilks === null || Object.keys(ilks).length === 0) {
      Logger.info("No ilks provided. using default configuration");
      ilks = Object.keys(ILKS_TO_BARK);
    }
    const result = new Map();
    for (const ilk of ilks) {
      if (ILKS_TO_BARK[ilk]?.useDefault === true) {
        result.set(ilk, ILKS_TO_BARK[ilk].addresses);
        continue;
      }
      const ids = await new MakerCdpIdsFetcher().getCdpIds(ilk, block, numberOfCdpsToBark);
      console.log(`cdp ids for ilk ${ilk}`, ids);
      const addresses = await this._ilkIdsToAddress(ids);
      result.set(ilk, addresses);
    }
    return result;
  }

  async _ilkIdsToAddress(ids) {
    const DssCdpManagerContract = new ethers.Contract(
      constants.DSS_CDP_MANAGER_CONTRACT_ADDRESS,
      abis.DSS_CDP_MANAGER_ABI,
      this._signer,
    );
    const result = [];
    let counter = 0;
    for (const id of ids) {
      if (counter % 10 === 0) {
        console.log(`id number ${counter}`);
      }
      counter++;
      const sendRes = await DssCdpManagerContract.urns(id);
      if (sendRes !== ZERO_ADDRESS) {
        result.push(sendRes);
      }
    }
    return result;
  }

  _getIlks(ilks) {
    if (ilks === undefined || ilks === null || Object.keys(ilks).length === 0) {
      Log("No ilks provided");
      return {};
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

  async init() {
    this._signer = this._provider.getSigner(constants.KEEPER_WALLET_ADDRESS);
    this.ilkPips = this._getIlks(Object.keys(this.collateral));
    this.prevPrices = {};
    const block = await this._provider.getBlockNumber();
    await this._initializeIlkAddresses(block);
  }

  async triggerAuctions() {
    // Get prices
    const currentPrices = {};

    await Promise.all(
      this.ilkPips.map(async (pipData) => {
        const price = await utils.getMakeOraclePriceFromStorage(this._provider, pipData.pipAddress);
        pipData.collateralTypes.forEach((ilk) => (currentPrices[ilk] = price));
      }),
    );

    for (const name in this.collateral) {
      const collateral = this.collateral[name];
      const collateralName = collateral.name;
      if (
        this.prevPrices[collateralName] === undefined ||
        currentPrices[collateralName] >= this.prevPrices[collateralName]
      ) {
        console.log(`Price drop not detected for ${collateralName} - skipping`);
        this.prevPrices = currentPrices;
        continue;
      }

      await this._kickAuctions(constants.KEEPER_WALLET_ADDRESS, collateralName);
    }

    this.prevPrices = currentPrices;
  }
}

class MakerCdpIdsFetcher {
  TRACKER_BASE_URL = (ilk,block) => `https://cloud.chaoslabs.co/data/maker/ilks/${ilk}/vaults/?block=${block}`;
  defaultCdpIds = ILKS_TO_BARK;
  defaultResultsLimit = 50;

  async getCdpIds(ilk,block, limit = this.defaultResultsLimit) {
    try {
      const vaults = await this.fetchVaultsFromTracker(ilk, block);
      const vaultsToReturn = this.filterAndSortVaults(vaults);
      console.log(
        `Found ${vaultsToReturn.length} active CDPs for ilk ${ilk}`,
        JSON.stringify({ ilk, count: vaultsToReturn.length }),
      );
      return vaultsToReturn.slice(0, limit).map((vault) => this.tryParseInt(vault.cdpId));
    } catch (Error) {
      console.log(`Error fetching top ${limit} cdp Ids for ilk ${ilk}`, Error.message);
      return (this.defaultCdpIds[ilk]?.ids ?? []).slice(0, limit);
    }
  }

  filterAndSortVaults(vaults) {
    const filteredVaults = vaults.filter(
      (vault) => !vault.cdpId.startsWith("0x") && vault.collateralization > 0 && vault.cdpId !== "",
    );
    return filteredVaults.sort((a, b) => {
      return a.collateralization > b.collateralization ? 1 : -1;
    });
  }

  async fetchVaultsFromTracker(ilk, block) {
    const response = await axios.get(this.TRACKER_BASE_URL(ilk, block));
    const responseData = response.data;

    return this.parseVaultProperties(responseData);
  }

  parseVaultProperties(vaultsData) {
    if (vaultsData === undefined) {
      throw Error("vaultsData is undefined");
    }

    return vaultsData.map((data) => {
      return {
        cdpId: data.cdpId,
        collateralization: parseFloat(data.collateralization),
      };
    });
  }

  tryParseInt(str) {
    let retValue = 0;
    if (str !== null && str.length > 0) {
      try {
        retValue = Number(str);
      } catch {
        return retValue;
      }
    }
    return retValue;
  }
}

module.exports = Script;
