import { HEX_HASH_PATTERN, rpcCall, sendError, sendJson } from "../_lib/rpc.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const { hash } = req.query;
    const txHash = Array.isArray(hash) ? hash[0] : hash;
    if (!HEX_HASH_PATTERN.test(txHash || "")) {
      sendJson(res, 400, { error: "Invalid transaction hash" });
      return;
    }

    const [tx, receipt] = await Promise.all([
      rpcCall("eth_getTransactionByHash", [txHash]),
      rpcCall("eth_getTransactionReceipt", [txHash]),
    ]);

    if (!tx) {
      sendJson(res, 404, { error: "Transaction not found" });
      return;
    }

    sendJson(res, 200, { tx, receipt }, receipt ? 30 : 2);
  } catch (error) {
    sendError(res, error);
  }
}
