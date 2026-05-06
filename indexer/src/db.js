import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

import { DB_PATH, L1_BLOCK_ADDRESS, SYSTEM_TX_FROM } from "./config.js";

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blocks (
    number INTEGER PRIMARY KEY,
    hash TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    gas_used TEXT NOT NULL,
    gas_limit TEXT NOT NULL,
    transaction_count INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    hash TEXT PRIMARY KEY,
    block_number INTEGER NOT NULL,
    transaction_index INTEGER NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT,
    value TEXT NOT NULL,
    gas TEXT,
    gas_price TEXT,
    type TEXT,
    explorer_type TEXT NOT NULL,
    input TEXT,
    FOREIGN KEY(block_number) REFERENCES blocks(number)
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_block ON transactions(block_number DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address, block_number DESC);
  CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address, block_number DESC);
`);

const getMetaStmt = db.prepare("SELECT value FROM meta WHERE key = ?");
const setMetaStmt = db.prepare(`
  INSERT INTO meta (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

const upsertBlockStmt = db.prepare(`
  INSERT INTO blocks (number, hash, timestamp, gas_used, gas_limit, transaction_count)
  VALUES (@number, @hash, @timestamp, @gasUsed, @gasLimit, @transactionCount)
  ON CONFLICT(number) DO UPDATE SET
    hash = excluded.hash,
    timestamp = excluded.timestamp,
    gas_used = excluded.gas_used,
    gas_limit = excluded.gas_limit,
    transaction_count = excluded.transaction_count
`);

const upsertTxStmt = db.prepare(`
  INSERT INTO transactions (
    hash, block_number, transaction_index, from_address, to_address, value, gas, gas_price, type, explorer_type, input
  )
  VALUES (
    @hash, @blockNumber, @transactionIndex, @fromAddress, @toAddress, @value, @gas, @gasPrice, @type, @explorerType, @input
  )
  ON CONFLICT(hash) DO UPDATE SET
    block_number = excluded.block_number,
    transaction_index = excluded.transaction_index,
    from_address = excluded.from_address,
    to_address = excluded.to_address,
    value = excluded.value,
    gas = excluded.gas,
    gas_price = excluded.gas_price,
    type = excluded.type,
    explorer_type = excluded.explorer_type,
    input = excluded.input
`);

const saveBlockTx = db.transaction((block) => {
  const transactions = block.transactions || [];
  upsertBlockStmt.run({
    number: Number.parseInt(block.number, 16),
    hash: block.hash,
    timestamp: Number.parseInt(block.timestamp, 16),
    gasUsed: block.gasUsed,
    gasLimit: block.gasLimit,
    transactionCount: transactions.length,
  });

  for (const tx of transactions) {
    upsertTxStmt.run(normalizeTransaction(tx));
  }

  setMeta("last_indexed_block", String(Number.parseInt(block.number, 16)));
});

export function getMeta(key, fallback = null) {
  return getMetaStmt.get(key)?.value ?? fallback;
}

export function setMeta(key, value) {
  setMetaStmt.run(key, String(value));
}

export function getLastIndexedBlock() {
  return Number.parseInt(getMeta("last_indexed_block", "-1"), 10);
}

export function saveBlock(block) {
  saveBlockTx(block);
}

export function getIndexerStats() {
  const indexedBlocks = db.prepare("SELECT COUNT(*) AS count FROM blocks").get().count;
  const indexedTxs = db.prepare("SELECT COUNT(*) AS count FROM transactions").get().count;
  return {
    indexedBlocks,
    indexedTxs,
    lastIndexedBlock: getLastIndexedBlock(),
  };
}

export function getAddress(address) {
  const normalized = address.toLowerCase();
  const txs = db
    .prepare(`
      SELECT
        hash,
        block_number AS blockNumber,
        transaction_index AS transactionIndex,
        from_address AS fromAddress,
        to_address AS toAddress,
        value,
        gas,
        gas_price AS gasPrice,
        type,
        explorer_type AS explorerType
      FROM transactions
      WHERE from_address = ? OR to_address = ?
      ORDER BY block_number DESC, transaction_index DESC
      LIMIT 100
    `)
    .all(normalized, normalized)
    .map((tx) => ({
      ...tx,
      from: tx.fromAddress,
      to: tx.toAddress,
      direction: tx.fromAddress === normalized ? "out" : "in",
      blockNumberHex: `0x${tx.blockNumber.toString(16)}`,
    }));

  return {
    transactions: txs,
    indexedTransactionCount: txs.length,
    indexer: getIndexerStats(),
  };
}

function classifyTx(tx) {
  const isSystem =
    tx?.type === "0x7e" ||
    tx?.from?.toLowerCase() === SYSTEM_TX_FROM ||
    tx?.to?.toLowerCase() === L1_BLOCK_ADDRESS;

  return isSystem ? "system" : "user";
}

function normalizeTransaction(tx) {
  return {
    hash: tx.hash,
    blockNumber: Number.parseInt(tx.blockNumber, 16),
    transactionIndex: Number.parseInt(tx.transactionIndex || "0x0", 16),
    fromAddress: tx.from.toLowerCase(),
    toAddress: tx.to ? tx.to.toLowerCase() : null,
    value: tx.value || "0x0",
    gas: tx.gas || null,
    gasPrice: tx.gasPrice || null,
    type: tx.type || null,
    explorerType: classifyTx(tx),
    input: tx.input || null,
  };
}
