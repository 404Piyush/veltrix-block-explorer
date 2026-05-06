import { BATCH_SIZE, POLL_INTERVAL_MS, START_BLOCK } from "./config.js";
import { blockByNumber, latestBlockNumber } from "./rpc.js";
import { getLastIndexedBlock, saveBlock } from "./db.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function syncOnce() {
  const latest = await latestBlockNumber();
  const current = getLastIndexedBlock();
  const next = Math.max(current + 1, START_BLOCK);
  const end = Math.min(latest, next + BATCH_SIZE - 1);

  if (next > latest) {
    return { latest, indexed: current, count: 0 };
  }

  for (let blockNumber = next; blockNumber <= end; blockNumber += 1) {
    const block = await blockByNumber(blockNumber);
    if (block) saveBlock(block);
  }

  return { latest, indexed: end, count: end - next + 1 };
}

export async function syncLoop() {
  for (;;) {
    try {
      const result = await syncOnce();
      if (result.count > 0) {
        console.log(`indexed ${result.count} blocks, last=${result.indexed}, head=${result.latest}`);
      }
    } catch (error) {
      console.error("indexer sync failed:", error.message);
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

syncLoop();
