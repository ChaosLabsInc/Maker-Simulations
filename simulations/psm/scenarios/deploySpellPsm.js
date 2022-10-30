var ethers = require("ethers");
var abis = require("../modules/abis");

class Script {
  constructor(psmAddress, tin, tout) {
    this.provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    this.psmAddress = psmAddress;
    this.tin = tin;
    this.tout = tout;
  }

  async OnSimulationStart() {
    const proxyAddress = "0xbe8e3e3618f7474f8cb1d074a26affef007e98fb";
    const pauseAddress = "0xbE286431454714F511008713973d3B053A2d38f3";
    const account0Address = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

    // Set balance for gas
    const transferAmount = ethers.BigNumber.from(500).mul(ethers.BigNumber.from("100000000000000"));
    await this.provider.send("hardhat_setBalance", [proxyAddress, transferAmount.toHexString()]);
    await this.provider.send("hardhat_setBalance", [pauseAddress, transferAmount.toHexString()]);
    // Setup Hardhat.
    await this.provider.send("hardhat_impersonateAccount", [proxyAddress]);
    await this.provider.send("hardhat_impersonateAccount", [pauseAddress]);
    const account0Signer = await this.provider.getSigner(account0Address);

    // Signers.
    const pauseSigner = await this.provider.getSigner(pauseAddress);
    const proxySigner = await this.provider.getSigner(proxyAddress);

    // Deploy Contracts.
    const DssSpell = new ethers.ContractFactory(NEW_SPELL_ABI, SPELL_CONTRACT_BYTECODE, account0Signer);
    const dssSpellContract = await DssSpell.deploy();

    // Contracts.
    const dssSpell = new ethers.Contract(dssSpellContract.address, NEW_SPELL_ABI, this.provider);
    const pauseContract = new ethers.Contract(pauseAddress, abis.PAUSE_ABI, this.provider);
    const proxyContract = new ethers.Contract(proxyAddress, abis.PROXY_ABI, this.provider);
    const psmContract = new ethers.Contract(this.psmAddress, abis.PSM_ABI, this.provider);

    // Connect.
    const connectedDssSpell = dssSpell.connect(proxySigner);
    const proxyConnectedPauseContract = pauseContract.connect(proxySigner);
    const pauseConnectedProxyContract = proxyContract.connect(pauseSigner);
    const proxyConnectedPsmContract = psmContract.connect(proxySigner);

    console.log("before tin:", await proxyConnectedPsmContract.tin());
    console.log("before tout:", await proxyConnectedPsmContract.tout());

    // Set values in the spell actions for parameter configuration.
    // We have to call it through pause proxy exec method in order to call the set value with delegate call of
    // the proxy(we would change the memory of proxy contract).
    const actionAdders = await dssSpellContract.action();
    let iface = new ethers.utils.Interface(abis.SPELL_ACTION);

    const parsedTin = ethers.utils.parseEther(parseFloat(this.tin).toFixed(18));
    const parsedTout = ethers.utils.parseEther(parseFloat(this.tout).toFixed(18));

    const encodeSetValues = iface.encodeFunctionData("setValues", [this.psmAddress, parsedTin, parsedTout]);
    await this.waitTx(await pauseConnectedProxyContract.exec(actionAdders, encodeSetValues));

    // Schedule.
    await this.waitTx(await proxyConnectedPauseContract.setOwner(dssSpellContract.address));
    await this.waitTx(await connectedDssSpell.schedule());

    // Rewind the time
    const delay = await proxyConnectedPauseContract.delay();
    await this.provider.send("evm_increaseTime", [Number(delay) + 10]);
    await this.provider.send("evm_mine", []);

    // Cast/execute Spell.
    await this.waitTx(await connectedDssSpell.cast());

    console.log("after tin:", await proxyConnectedPsmContract.tin());
    console.log("after tout:", await proxyConnectedPsmContract.tout());
  }

  async waitTx(tx) {
    return await tx.wait();
  }
}

module.exports = Script;

const NEW_SPELL_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "action",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "cast",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "done",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "eta",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "expiration",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "log",
    outputs: [
      {
        internalType: "contract Changelog",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextCastTime",
    outputs: [
      {
        internalType: "uint256",
        name: "castTime",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "officeHours",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [
      {
        internalType: "contract PauseAbstract",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "schedule",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "sig",
    outputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tag",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const SPELL_CONTRACT_BYTECODE =
  "0x6101006040523480156200001257600080fd5b5062278d004201604051620000279062000234565b604051809103906000f08015801562000044573d6000803e3d6000fd5b5073da0ab1e0017debcd72be8599041a2aa3ba7e740f73ffffffffffffffffffffffffffffffffffffffff166321f8a7216040518163ffffffff1660e01b815260040180807f4d43445f50415553450000000000000000000000000000000000000000000000815250602001905060206040518083038186803b158015620000cb57600080fd5b505afa158015620000e0573d6000803e3d6000fd5b505050506040513d6020811015620000f757600080fd5b810190808051906020019092919050505073ffffffffffffffffffffffffffffffffffffffff1660e08173ffffffffffffffffffffffffffffffffffffffff1660601b815250508160c081815250508073ffffffffffffffffffffffffffffffffffffffff1660a08173ffffffffffffffffffffffffffffffffffffffff1660601b815250506040516024016040516020818303038152906040527f61461954000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff8381831617835250505050600190805190602001906200021792919062000242565b50600080829050803f9150816080818152505050505050620002e8565b610818806200113283390190565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200028557805160ff1916838001178555620002b6565b82800160010185558215620002b6579182015b82811115620002b557825182559160200191906001019062000298565b5b509050620002c59190620002c9565b5090565b5b80821115620002e4576000816000905550600101620002ca565b5090565b60805160a05160601c60c05160e05160601c610dd76200035b6000398061067352806107355280610a9a5280610b4352508061040552806109aa5250806103e15280610467528061050f52806107715280610b7f5280610ccb52508061044152806107925280610ba05250610dd76000f3fe608060405234801561001057600080fd5b50600436106100ce5760003560e01c80637284e4161161008c578063ae8421e111610066578063ae8421e1146102db578063b0604a26146102fb578063f7992d8514610305578063fe7d47bb14610323576100ce565b80637284e4161461021a5780638456cb591461029d57806396d373e5146102d1576100ce565b8062a7029b146100d35780630a7a1c4d146101565780634665096d1461018a57806351973ec9146101a857806351f91066146101dc5780636e832f07146101fa575b600080fd5b6100db610341565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561011b578082015181840152602081019050610100565b50505050905090810190601f1680156101485780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b61015e6103df565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610192610403565b6040518082815260200191505060405180910390f35b6101b0610427565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6101e461043f565b6040518082815260200191505060405180910390f35b610202610463565b60405180821515815260200191505060405180910390f35b61022261050b565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610262578082015181840152602081019050610247565b50505050905090810190601f16801561028f5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6102a5610671565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6102d9610695565b005b6102e3610995565b60405180821515815260200191505060405180910390f35b6103036109a8565b005b61030d610cc1565b6040518082815260200191505060405180910390f35b61032b610cc7565b6040518082815260200191505060405180910390f35b60018054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156103d75780601f106103ac576101008083540402835291602001916103d7565b820191906000526020600020905b8154815290600101906020018083116103ba57829003601f168201915b505050505081565b7f000000000000000000000000000000000000000000000000000000000000000081565b7f000000000000000000000000000000000000000000000000000000000000000081565b73da0ab1e0017debcd72be8599041a2aa3ba7e740f81565b7f000000000000000000000000000000000000000000000000000000000000000081565b60007f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16636e832f076040518163ffffffff1660e01b815260040160206040518083038186803b1580156104cb57600080fd5b505afa1580156104df573d6000803e3d6000fd5b505050506040513d60208110156104f557600080fd5b8101908080519060200190929190505050905090565b60607f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16637284e4166040518163ffffffff1660e01b815260040160006040518083038186803b15801561057357600080fd5b505afa158015610587573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f8201168201806040525060208110156105b157600080fd5b81019080805160405193929190846401000000008211156105d157600080fd5b838201915060208201858111156105e757600080fd5b825186600182028301116401000000008211171561060457600080fd5b8083526020830192505050908051906020019080838360005b8381101561063857808201518184015260208101905061061d565b50505050905090810190601f1680156106655780820380516001836020036101000a031916815260200191505b50604052505050905090565b7f000000000000000000000000000000000000000000000000000000000000000081565b600260009054906101000a900460ff1615610718576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260128152602001807f7370656c6c2d616c72656164792d63617374000000000000000000000000000081525060200191505060405180910390fd5b6001600260006101000a81548160ff0219169083151502179055507f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663168ccd677f00000000000000000000000000000000000000000000000000000000000000007f000000000000000000000000000000000000000000000000000000000000000060016000546040518563ffffffff1660e01b8152600401808573ffffffffffffffffffffffffffffffffffffffff168152602001848152602001806020018381526020018281038252848181546001816001161561010002031660029004815260200191508054600181600116156101000203166002900480156108765780601f1061084b57610100808354040283529160200191610876565b820191906000526020600020905b81548152906001019060200180831161085957829003601f168201915b505095505050505050600060405180830381600087803b15801561089957600080fd5b505af11580156108ad573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f8201168201806040525060208110156108d757600080fd5b81019080805160405193929190846401000000008211156108f757600080fd5b8382019150602082018581111561090d57600080fd5b825186600182028301116401000000008211171561092a57600080fd5b8083526020830192505050908051906020019080838360005b8381101561095e578082015181840152602081019050610943565b50505050905090810190601f16801561098b5780820380516001836020036101000a031916815260200191505b5060405250505050565b600260009054906101000a900460ff1681565b7f0000000000000000000000000000000000000000000000000000000000000000421115610a3e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260198152602001807f5468697320636f6e74726163742068617320657870697265640000000000000081525060200191505060405180910390fd5b6000805414610a98576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526025815260200180610d7d6025913960400191505060405180910390fd5b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16636a42b8f86040518163ffffffff1660e01b815260040160206040518083038186803b158015610afe57600080fd5b505afa158015610b12573d6000803e3d6000fd5b505050506040513d6020811015610b2857600080fd5b810190808051906020019092919050505042016000819055507f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff166346d2fbbb7f00000000000000000000000000000000000000000000000000000000000000007f000000000000000000000000000000000000000000000000000000000000000060016000546040518563ffffffff1660e01b8152600401808573ffffffffffffffffffffffffffffffffffffffff16815260200184815260200180602001838152602001828103825284818154600181600116156101000203166002900481526020019150805460018160011615610100020316600290048015610c845780601f10610c5957610100808354040283529160200191610c84565b820191906000526020600020905b815481529060010190602001808311610c6757829003601f168201915b505095505050505050600060405180830381600087803b158015610ca757600080fd5b505af1158015610cbb573d6000803e3d6000fd5b50505050565b60005481565b60007f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1663bf0fbcec6000546040518263ffffffff1660e01b81526004018082815260200191505060206040518083038186803b158015610d3c57600080fd5b505afa158015610d50573d6000803e3d6000fd5b505050506040513d6020811015610d6657600080fd5b810190808051906020019092919050505090509056fe54686973207370656c6c2068617320616c7265616479206265656e207363686564756c6564a26469706673582212201d724b40013fc217897a2e4f10dc6aa52776fe23cf90c384b50e2ba0d0e8fa1264736f6c634300060c0033608060405260008060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000600255600060035534801561009d57600080fd5b5061076b806100ad6000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c8063be776bcd11610066578063be776bcd146101a2578063bf0fbcec146101d6578063c664e6bc14610218578063f99e36bc14610270578063fae036d51461027a5761009e565b8063424f7beb146100a3578063568d4b6f146100d757806361461954146100f55780636e832f07146100ff5780637284e4161461011f575b600080fd5b6100ab610298565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100df6102bc565b6040518082815260200191505060405180910390f35b6100fd6102c2565b005b6101076103e0565b60405180821515815260200191505060405180910390f35b6101276103e5565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561016757808201518184015260208101905061014c565b50505050905090810190601f1680156101945780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101aa610401565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b610202600480360360208110156101ec57600080fd5b8101908080359060200190929190505050610427565b6040518082815260200191505060405180910390f35b61026e6004803603606081101561022e57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919080359060200190929190505050610515565b005b610278610569565b005b61028261070d565b6040518082815260200191505060405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60025481565b738de6ddbcd5053d32292aaa0d2105a32d108484a66335329d4c426102e56103e0565b6040518363ffffffff1660e01b8152600401808364ffffffffff16815260200182151581526020019250505060206040518083038186803b15801561032957600080fd5b505af415801561033d573d6000803e3d6000fd5b505050506040513d602081101561035357600080fd5b81019080805190602001909291905050506103d6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260148152602001807f4f757473696465206f666669636520686f75727300000000000000000000000081525060200191505060405180910390fd5b6103de610569565b565b600090565b6040518060600160405280602281526020016107146022913981565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff64ffffffffff1682111561045d57600080fd5b738de6ddbcd5053d32292aaa0d2105a32d108484a663d255745683426104816103e0565b6040518463ffffffff1660e01b8152600401808464ffffffffff1681526020018364ffffffffff1681526020018215158152602001935050505060206040518083038186803b1580156104d357600080fd5b505af41580156104e7573d6000803e3d6000fd5b505050506040513d60208110156104fd57600080fd5b81019080805190602001909291905050509050919050565b82600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508160028190555080600381905550505050565b738de6ddbcd5053d32292aaa0d2105a32d108484a663eb3ffe9e600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff166002546040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff168152602001807f74696e00000000000000000000000000000000000000000000000000000000008152506020018281526020019250505060006040518083038186803b15801561062257600080fd5b505af4158015610636573d6000803e3d6000fd5b50505050738de6ddbcd5053d32292aaa0d2105a32d108484a663eb3ffe9e600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff166003546040518363ffffffff1660e01b8152600401808373ffffffffffffffffffffffffffffffffffffffff168152602001807f746f7574000000000000000000000000000000000000000000000000000000008152506020018281526020019250505060006040518083038186803b1580156106f357600080fd5b505af4158015610707573d6000803e3d6000fd5b50505050565b6003548156fe4368616f73204c616273207370656c6c20636f6e66696775726174696f6e2070736da2646970667358221220a976cc7f7034bdb155ff2e1504f0954eff2a45ba070bebf74e08898f9db69fbd64736f6c634300060c0033";