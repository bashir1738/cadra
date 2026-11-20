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
    hookAddress: (process.env.HOOK_ADDRESS || process.env.NEXT_PUBLIC_HOOK_ADDRESS || "0x728D9b5f428B736A26D07879F55C3982Ddf890C0") as `0x${string}`,
    poolManagerAddress: (process.env.POOL_MANAGER_ADDRESS || process.env.NEXT_PUBLIC_POOL_MANAGER_ADDRESS || "0x29f2b190eacD76F0cBEC50bA669aab7F4600da4C") as `0x${string}`,
    token0: (process.env.TOKEN0 || process.env.NEXT_PUBLIC_TOKEN0 || "0x688Cfa2501c44CB6B3886f4C5662c55b73f36e8D") as `0x${string}`,
    token1: (process.env.TOKEN1 || process.env.NEXT_PUBLIC_TOKEN1 || "0xB4AB6C3Ae39df89bA203F01ef08e39775Fe1F0c6") as `0x${string}`,
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
