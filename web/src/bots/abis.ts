/**
 * Contract ABIs for Cadra protocol & bots
 */

export { CADRA_HOOK_ABI, CadraHookAbi } from "../config/cadraHookAbi";

export const CADRA_CALLBACK_ABI = [
  {
    type: "event",
    name: "EnforceExecuted",
    inputs: [
      { name: "vaultId", type: "uint256", indexed: true },
      { name: "success", type: "bool", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SettleExecuted",
    inputs: [
      { name: "vaultId", type: "uint256", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SettleFailed",
    inputs: [
      { name: "vaultId", type: "uint256", indexed: true },
      { name: "reason", type: "bytes", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

export const CADRA_REACTIVE_ABI = [
  { type: "function", name: "owner", inputs: [], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  { type: "function", name: "hook", inputs: [], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  { type: "function", name: "callbackRecipient", inputs: [], outputs: [{ name: "", type: "address" }], stateMutability: "view" },
  { type: "function", name: "callbackGasLimit", inputs: [], outputs: [{ name: "", type: "uint64" }], stateMutability: "view" },
  { type: "function", name: "setCallbackGasLimit", inputs: [{ name: "gasLimit", type: "uint64" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "setCallbackRecipient", inputs: [{ name: "recipient", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "clearCallbackRecipient", inputs: [], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "subscribeHook", inputs: [{ name: "hook_", type: "address" }], outputs: [], stateMutability: "nonpayable" },
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
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
