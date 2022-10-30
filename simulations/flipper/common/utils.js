var ethers = require("ethers");

async function getMakeOraclePriceFromStorage(provider, pipAddress) {
  const data = await provider.getStorageAt(pipAddress, 3);
  const sliced = data.slice(34);
  const formattedPrice = ethers.utils.formatUnits(
    ethers.BigNumber.from(parseInt(sliced, 16).toLocaleString().replace(/,/g, "")).toString(),
    18,
  );
  return parseFloat(formattedPrice);
}

module.exports = {
  getMakeOraclePriceFromStorage,
};
