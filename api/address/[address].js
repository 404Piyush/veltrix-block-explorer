import { ADDRESS_PATTERN, rpcCall, sendError, sendJson } from "../_lib/rpc.js";

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

    const [balance, txCount, code] = await Promise.all([
      rpcCall("eth_getBalance", [value, "latest"]),
      rpcCall("eth_getTransactionCount", [value, "latest"]),
      rpcCall("eth_getCode", [value, "latest"]),
    ]);

    sendJson(res, 200, {
      address: value,
      balance,
      transactionCount: Number.parseInt(txCount, 16),
      isContract: code !== "0x",
    }, 5);
  } catch (error) {
    sendError(res, error);
  }
}
