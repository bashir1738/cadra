/**
 * Contract ABIs for Cadra bots
 */

export const CadraHookAbi = [
  {
    type: "function",
    name: "createVault",
    inputs: [
      {
        name: "key",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
      { name: "perfFeeBps", type: "uint16" },
      {
        name: "mandate",
        type: "tuple",
        components: [
          { name: "minTick", type: "int24" },
          { name: "maxTick", type: "int24" },
          { name: "maxConcentrationBps", type: "uint16" },
          { name: "minRangeWidth", type: "int24" },
          { name: "maxShortfallBps", type: "uint16" },
        ],
      },
    ],
    outputs: [{ name: "vaultId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "postBond",
    inputs: [
      { name: "vaultId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rebalance",
    inputs: [
      { name: "vaultId", type: "uint256" },
      {
        name: "ranges",
        type: "tuple[]",
        components: [
          { name: "tickLower", type: "int24" },
          { name: "tickUpper", type: "int24" },
          { name: "shareBps", type: "uint16" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "enforce",
    inputs: [{ name: "vaultId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "settle",
    inputs: [{ name: "vaultId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getVault",
    inputs: [{ name: "vaultId", type: "uint256" }],
    outputs: [
      {
        name: "vault",
        type: "tuple",
        components: [
          { name: "curator", type: "address" },
          { name: "poolId", type: "bytes32" },
          { name: "perfFeeBps", type: "uint16" },
          { name: "bond", type: "uint256" },
          { name: "capacity", type: "uint256" },
          { name: "capacityMultiplier", type: "uint8" },
          { name: "carriedDeficit", type: "uint256" },
          { name: "epoch", type: "uint256" },
          { name: "epochStart", type: "uint256" },
          { name: "isParked", type: "bool" },
          { name: "bandLeft", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "BandLeft",
    inputs: [
      { name: "vaultId", type: "uint256", indexed: true },
      { name: "tick", type: "int24", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VaultParked",
    inputs: [
      { name: "vaultId", type: "uint256", indexed: true },
      { name: "epoch", type: "uint256", indexed: false },
      { name: "shortfallBps", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Settled",
    inputs: [
      { name: "vaultId", type: "uint256", indexed: true },
      { name: "epoch", type: "uint256", indexed: false },
      { name: "vaultValue", type: "uint256", indexed: false },
      { name: "paceValue", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "bondPaid", type: "uint256", indexed: false },
      { name: "carriedDeficit", type: "uint256", indexed: false },
    ],
  },
] as const;

export const ERC20Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;
