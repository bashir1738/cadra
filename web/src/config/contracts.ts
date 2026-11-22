import { unichainSepolia } from "viem/chains";

export const UNICHAIN_SEPOLIA_CHAIN_ID = 1301;
export const REACTIVE_LASNA_CHAIN_ID = 5318007;

export const CONTRACT_ADDRESSES = {
  hook: (process.env.NEXT_PUBLIC_HOOK_ADDRESS || "0x6974BEEfCD6B8Bf30ee2838d830eEbFb892f50c0") as `0x${string}`,
  poolManager: (process.env.NEXT_PUBLIC_POOL_MANAGER_ADDRESS || "0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C") as `0x${string}`,
  token0: (process.env.NEXT_PUBLIC_TOKEN0 || "0x31d0220469e10c4E71834a79b1f276d740d3768F") as `0x${string}`, // Official Circle USDC
  token1: (process.env.NEXT_PUBLIC_TOKEN1 || "0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6") as `0x${string}`, // WETH (MockERC20)
  callback: (process.env.NEXT_PUBLIC_CALLBACK_ADDRESS || "0x8DA8f1C989493cd51D6a48e042a73224F2E6C0e2") as `0x${string}`,
  reactive: (process.env.NEXT_PUBLIC_REACTIVE_ADDRESS || "0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C") as `0x${string}`,
  reactiveProxy: "0x9299472A6399Fd1027ebF067571Eb3e3D7837FC4" as `0x${string}`,
  reactiveSystem: "0x8888888888888888888888888888888888888888" as `0x${string}`,
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
  chainName: "Reactive Lasna Omni",
  rpcUrl: "https://lasna-rpc.rnk.dev/",
  explorerUrl: "https://lasna-omni.reactscan.net",
  nativeCurrency: { name: "Reactive", symbol: "REACT", decimals: 18 },
} as const;
