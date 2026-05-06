import { ADDRESS_PATTERN, rpcCall, sendError, sendJson } from "../_lib/rpc.js";

const DEFAULT_SCAN_DEPTH = 500;
const MAX_SCAN_DEPTH = 1000;
const INDEXER_API_URL = process.env.INDEXER_API_URL || "";

function scanDepthFromRequest(req) {
  const requested = Number.parseInt(req.query.depth, 10);
  if (!Number.isFinite(requested) || requested <= 0) return DEFAULT_SCAN_DEPTH;
  return Math.min(requested, MAX_SCAN_DEPTH);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const { address } = req.query;
    const value = Array.isArray(address) ? address[0] : address;
    if (!ADDRESS_PATTERN.test(value || "")) {
      sendJson(res, 400, { error: "Invalid address" });
      return;
    }

    const normalizedAddress = value.toLowerCase();
    const scanDepth = scanDepthFromRequest(req);

    const [balance, txCount, code, latestBlockHex] = await Promise.all([
      rpcCall("eth_getBalance", [value, "latest"]),
      rpcCall("eth_getTransactionCount", [value, "latest"]),
      rpcCall("eth_getCode", [value, "latest"]),
      rpcCall("eth_blockNumber"),
    ]);

    const latestBlock = Number.parseInt(latestBlockHex, 16);
    const fromBlock = Math.max(0, latestBlock - scanDepth + 1);
    const blockRequests = [];

    for (let blockNumber = latestBlock; blockNumber >= fromBlock; blockNumber -= 1) {
      blockRequests.push(rpcCall("eth_getBlockByNumber", [`0x${blockNumber.toString(16)}`, true]));
    }

    const blocks = await Promise.all(blockRequests);
    const recentTransactions = blocks
      .flatMap((block) =>
        (block?.transactions || [])
          .filter((tx) => tx.from?.toLowerCase() === normalizedAddress || tx.to?.toLowerCase() === normalizedAddress)
          .map((tx) => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            blockNumber: tx.blockNumber,
            transactionIndex: tx.transactionIndex,
            direction: tx.from?.toLowerCase() === normalizedAddress ? "out" : "in",
          }))
      )
      .slice(0, 25);
    const indexedHistory = await fetchIndexedAddress(value);
    const indexedTransactions = indexedHistory?.transactions || [];

    sendJson(res, 200, {
      address: value,
      balance,
      transactionCount: Number.parseInt(txCount, 16),
      isContract: code !== "0x",
      latestBlock,
      scannedBlockDepth: scanDepth,
      indexer: indexedHistory?.indexer || null,
      recentTransactions: indexedTransactions.length > 0 ? indexedTransactions : recentTransactions,
      recentSource: indexedTransactions.length > 0 ? "indexer" : "recent-scan",
      indexedTransactionCount: indexedHistory?.indexedTransactionCount || 0,
    }, 5);
  } catch (error) {
    sendError(res, error);
  }
}

async function fetchIndexedAddress(address) {
  if (!INDEXER_API_URL) return null;

  try {
    const response = await fetch(`${INDEXER_API_URL.replace(/\/$/, "")}/api/address/${address}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
