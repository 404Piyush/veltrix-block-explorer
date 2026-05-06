import path from "node:path";

export const RPC_URL = process.env.RPC_URL || "https://veltrix-rpc.404piyush.me";
export const DB_PATH = process.env.INDEXER_DB_PATH || path.resolve("data", "veltrix-indexer.sqlite");
export const PORT = Number.parseInt(process.env.PORT || "4100", 10);
export const START_BLOCK = Number.parseInt(process.env.START_BLOCK || "0", 10);
export const BATCH_SIZE = Math.max(1, Number.parseInt(process.env.BATCH_SIZE || "100", 10));
export const POLL_INTERVAL_MS = Math.max(1000, Number.parseInt(process.env.POLL_INTERVAL_MS || "4000", 10));

export const SYSTEM_TX_FROM = "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001";
export const L1_BLOCK_ADDRESS = "0x4200000000000000000000000000000000000015";
