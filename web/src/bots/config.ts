/**
 * Cadra Bot Configuration
 * Loads environment variables or provides local Anvil testnet defaults.
 * NEVER commit real private keys.
 */

export interface BotConfig {
  rpcUrl: string;
  hookAddress: `0x${string}`;
  poolManagerAddress: `0x${string}`;
  token0: `0x${string}`;
  token1: `0x${string}`;
  swapperPrivateKey: `0x${string}`;
  keeperPrivateKey: `0x${string}`;
  curatorPrivateKeys: {
    tight: `0x${string}`;
    wide: `0x${string}`;
    lazy: `0x${string}`;
    reckless: `0x${string}`;
  };
}

export function getConfig(): BotConfig {
  return {
    rpcUrl: process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.unichain.org",
    hookAddress: (process.env.HOOK_ADDRESS || process.env.NEXT_PUBLIC_HOOK_ADDRESS || "0x8a316B53c5cE57B34Fb1f071Ebe4A6C953c990c0") as `0x${string}`,
    poolManagerAddress: (process.env.POOL_MANAGER_ADDRESS || process.env.NEXT_PUBLIC_POOL_MANAGER_ADDRESS || "0x061216db95D483fc0e7e0c43976A62B7E207ba35") as `0x${string}`,
    token0: (process.env.TOKEN0 || process.env.NEXT_PUBLIC_TOKEN0 || "0x7e0Ff8d515F8eb37a11181070bD87A1CE7Ef8111") as `0x${string}`,
    token1: (process.env.TOKEN1 || process.env.NEXT_PUBLIC_TOKEN1 || "0xc7D51420E40fC986901CfB7c7197558CE8CD107E") as `0x${string}`,
    // Bot accounts on Unichain Sepolia (loaded from environment)
    swapperPrivateKey: (process.env.SWAPPER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`,
    keeperPrivateKey: (process.env.KEEPER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`,
    curatorPrivateKeys: {
      tight: (process.env.CURATOR_TIGHT_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`,
      wide: (process.env.CURATOR_WIDE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`,
      lazy: (process.env.CURATOR_LAZY_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`,
      reckless: (process.env.CURATOR_RECKLESS_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`,
    },
  };
}
