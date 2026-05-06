import { rpcCall, sendError, sendJson } from "../_lib/rpc.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const { hash } = req.query;
    const txHash = Array.isArray(hash) ? hash[0] : hash;

    const [tx, receipt] = await Promise.all([
      rpcCall("eth_getTransactionByHash", [txHash]),
      rpcCall("eth_getTransactionReceipt", [txHash]),
    ]);

    sendJson(res, 200, { tx, receipt });
  } catch (error) {
    sendError(res, error);
  }
}
