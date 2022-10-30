// Addresses
const KEEPER_WALLET_ADDRESS = "0x16fb96a5fa0427af0c8f7cf1eb4870231c8154b6";
const MCD_SPOT_CONTRACT_ADDRESS = "0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3";
const DOG_CONTRACT_ADDRESS = "0x135954d155898D42C90D2a57824C690e0c7BEf1B";
const DSS_CDP_MANAGER_CONTRACT_ADDRESS = "0x5ef30b9986345249bc32d8928B7ee64DE9435E39";

const config_collateral = {
  "ETH-A": {
    name: "ETH-A",
    decimals: 18,
    erc20addr: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    clipper: "0xc67963a226eddd77B91aD8c421630A1b0AdFF270",
  },
  "ETH-B": {
    name: "ETH-B",
    decimals: 18,
    erc20addr: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    clipper: "0x71eb894330e8a4b96b8d6056962e7F116F50e06F",
  },
  "ETH-C": {
    name: "ETH-C",
    decimals: 18,
    erc20addr: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    clipper: "0xc2b12567523e3f3CBd9931492b91fe65b240bc47",
  },
  "WBTC-A": {
    name: "WBTC-A",
    decimals: 8,
    erc20addr: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    clipper: "0x0227b54AdbFAEec5f1eD1dFa11f54dcff9076e2C",
  },
  "WBTC-B": {
    name: "WBTC-B",
    decimals: 8,
    erc20addr: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    clipper: "0xe30663C6f83A06eDeE6273d72274AE24f1084a22",
  },
  "WBTC-C": {
    name: "WBTC-C",
    decimals: 8,
    erc20addr: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    clipper: "0x39F29773Dcb94A32529d0612C6706C49622161D1",
  },
  "RENBTC-A": {
    name: "RENBTC-A",
    decimals: 8,
    erc20addr: "0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D",
    clipper: "0x834719BEa8da68c46484E001143bDDe29370a6A3",
  },
  "MANA-A": {
    name: "MANA-A",
    decimals: 18,
    erc20addr: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942",
    clipper: "0xF5C8176E1eB0915359E46DEd16E52C071Bb435c0",
  },
  "LINK-A": {
    name: "LINK-A",
    decimals: 18,
    erc20addr: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    clipper: "0x832Dd5f17B30078a5E46Fdb8130A68cBc4a74dC0",
  },
  "YFI-A": {
    name: "YFI-A",
    decimals: 18,
    erc20addr: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
    clipper: "0x9daCc11dcD0aa13386D295eAeeBBd38130897E6f",
  },
  "UNI-A": {
    name: "UNI-A",
    decimals: 18,
    erc20addr: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    clipper: "0x3713F83Ee6D138Ce191294C131148176015bC29a",
  },
  "MATIC-A": {
    name: "MATIC-A",
    decimals: 18,
    erc20addr: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    clipper: "0x29342F530ed6120BDB219D602DaFD584676293d1",
  },
  "UNIV2DAIETH-A": {
    name: "UNIV2DAIETH-A",
    decimals: 18,
    token0: {
      name: "DAI",
      decimals: 18,
    },
    token1: {
      name: "ETH",
      decimals: 18,
    },
    erc20addr: "0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11",
    clipper: "0x9F6981bA5c77211A34B76c6385c0f6FA10414035",
  },
  "UNIV2USDCETH-A": {
    name: "UNIV2USDCETH-A",
    decimals: 18,
    token0: {
      name: "USDC",
      decimals: 6,
    },
    token1: {
      name: "ETH",
      decimals: 18,
    },
    erc20addr: "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc",
    clipper: "0x93AE03815BAF1F19d7F18D9116E4b637cc32A131",
  },
  "WSTETH-A": {
    name: "WSTETH-A",
    decimals: 18,
    erc20addr: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    clipper: "0x49A33A28C4C7D9576ab28898F4C9ac7e52EA457A",
  },
  "WSTETH-B": {
    name: "WSTETH-B",
    decimals: 18,
    erc20addr: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    clipper: "0x3ea60191b7d5990a3544B6Ef79983fD67e85494A",
  },
  "CRVV1ETHSTETH-A": {
    name: "CRVV1ETHSTETH-A",
    decimals: 18,
    erc20addr: "0x06325440D014e39736583c165C2963BA99fAf14E",
    clipper: "0x1926862F899410BfC19FeFb8A3C69C7Aed22463a",
  },
};

const PIPMapping = {
  ETH: {
    ilks: ["ETH-A", "ETH-B", "ETH-C"],
    pipAddress: "0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763",
  },
  WBTC: {
    ilks: ["WBTC-A", "WBTC-B", "WBTC-C", "RENBTC-A"],
    pipAddress: "0xf185d0682d50819263941e5f4EacC763CC5C6C42",
  },
  STETH: {
    ilks: ["WSTETH-A", "WSTETH-B"],
    pipAddress: "0xFe7a2aC0B945f12089aEEB6eCebf4F384D9f043F",
  },
  MANA: {
    ilks: ["MANA-A"],
    pipAddress: "0x8067259EA630601f319FccE477977E55C6078C13",
  },
  LINK: {
    ilks: ["LINK-A"],
    pipAddress: "0x9B0C694C6939b5EA9584e9b61C7815E8d97D9cC7",
  },
  YFI: {
    ilks: ["YFI-A"],
    pipAddress: "0x5F122465bCf86F45922036970Be6DD7F58820214",
  },
  MATIC: {
    ilks: ["MATIC-A"],
    pipAddress: "0x8874964279302e6d4e523Fb1789981C39a1034Ba",
  },
  UNIV2DAIETH: {
    ilks: ["UNIV2DAIETH-A"],
    pipAddress: "0xFc8137E1a45BAF0030563EC4F0F851bd36a85b7D",
  },
  UNIV2USDCETH: {
    ilks: ["UNIV2USDCETH-A"],
    pipAddress: "0xf751f24DD9cfAd885984D1bA68860F558D21E52A",
  },
  CRVV1ETHSTETH: {
    ilks: ["CRVV1ETHSTETH-A"],
    pipAddress: "0x0a7da4e31582a2fb4fd4067943e88f127f70ab39",
  },
};

module.exports = {
  KEEPER_WALLET_ADDRESS,
  MCD_SPOT_CONTRACT_ADDRESS,
  DOG_CONTRACT_ADDRESS,
  DSS_CDP_MANAGER_CONTRACT_ADDRESS,
  config_collateral,
  PIPMapping,
};
