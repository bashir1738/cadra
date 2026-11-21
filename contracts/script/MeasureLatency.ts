import { createPublicClient, http } from "viem";
import { unichainSepolia } from "viem/chains";

const unichainClient = createPublicClient({
  chain: unichainSepolia,
  transport: http("https://sepolia.unichain.org"),
});

const lasnaClient = createPublicClient({
  chain: {
    id: 5318007,
    name: "Reactive Lasna",
    nativeCurrency: { name: "lREACT", symbol: "lREACT", decimals: 18 },
    rpcUrls: { default: { http: ["https://lasna-rpc.rnk.dev/"] } },
  },
  transport: http("https://lasna-rpc.rnk.dev/"),
});

export async function runLatencyBenchmark() {
  const latestLasna = await lasnaClient.getBlockNumber();
  const delays: number[] = [];
  let prev = await lasnaClient.getBlock({ blockNumber: latestLasna - BigInt(10) });

  for (let i = 9; i >= 0; i--) {
    const cur = await lasnaClient.getBlock({ blockNumber: latestLasna - BigInt(i) });
    delays.push(Number(cur.timestamp - prev.timestamp));
    prev = cur;
  }

  delays.sort((a, b) => a - b);
  const medianBlockTime = delays[Math.floor(delays.length / 2)];
  console.log(`Median Reactive Lasna Block Time: ${medianBlockTime}s`);
  return medianBlockTime;
}
