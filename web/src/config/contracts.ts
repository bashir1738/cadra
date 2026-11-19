import { unichainSepolia } from "viem/chains";

export const UNICHAIN_SEPOLIA_CHAIN_ID = 1301;
export const REACTIVE_LASNA_CHAIN_ID = 5318007;

export const CONTRACT_ADDRESSES = {
  hook: (process.env.NEXT_PUBLIC_HOOK_ADDRESS || "0x8a316B53c5cE57B34Fb1f071Ebe4A6C953c990c0") as `0x${string}`,
  poolManager: (process.env.NEXT_PUBLIC_POOL_MANAGER_ADDRESS || "0x061216db95D483fc0e7e0c43976A62B7E207ba35") as `0x${string}`,
  token0: (process.env.NEXT_PUBLIC_TOKEN0 || "0x7e0Ff8d515F8eb37a11181070bD87A1CE7Ef8111") as `0x${string}`, // WETH (MockERC20)
  token1: (process.env.NEXT_PUBLIC_TOKEN1 || "0xc7D51420E40fC986901CfB7c7197558CE8CD107E") as `0x${string}`, // USDC (MockERC20)
  callback: (process.env.NEXT_PUBLIC_CALLBACK_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  reactiveProxy: "0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4" as `0x${string}`,
} as const;

export const UNISWAP_V4_POOL_KEY = {
  currency0: CONTRACT_ADDRESSES.token0,
  currency1: CONTRACT_ADDRESSES.token1,
  fee: 3000,
  tickSpacing: 60,
  hooks: CONTRACT_ADDRESSES.hook,
} as const;

export const NETWORK_CONFIG = {
  chain: unichainSepolia,
  chainId: UNICHAIN_SEPOLIA_CHAIN_ID,
  chainName: "Unichain Sepolia",
  rpcUrl: "https://sepolia.unichain.org",
  explorerUrl: "https://sepolia.uniscan.xyz",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
} as const;

export const REACTIVE_NETWORK_CONFIG = {
  chainId: REACTIVE_LASNA_CHAIN_ID,
  chainName: "Reactive Lasna",
  rpcUrl: "https://lasna-rpc.rnk.dev/",
  explorerUrl: "https://lasnascan.rnk.dev/",
  nativeCurrency: { name: "Reactive", symbol: "REACT", decimals: 18 },
} as const;
