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
    rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
    hookAddress: (process.env.HOOK_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    poolManagerAddress: (process.env.POOL_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    token0: (process.env.TOKEN0 || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    token1: (process.env.TOKEN1 || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    // Anvil test default accounts
    swapperPrivateKey: (process.env.SWAPPER_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80") as `0x${string}`,
    keeperPrivateKey: (process.env.KEEPER_PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d") as `0x${string}`,
    curatorPrivateKeys: {
      tight: (process.env.CURATOR_TIGHT_KEY || "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a") as `0x${string}`,
      wide: (process.env.CURATOR_WIDE_KEY || "0x7c852118294e51e653712a77e0e3dd7f0d00a4ee5b04f98f2040cb876f9e4a60") as `0x${string}`,
      lazy: (process.env.CURATOR_LAZY_KEY || "0x47e179ec340f61711fce9740b48e0583d94902ff3b99c853fe7f5ecb63084b2d") as `0x${string}`,
      reckless: (process.env.CURATOR_RECKLESS_KEY || "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba") as `0x${string}`,
    },
  };
}
