import { rpcCall, sendError, sendJson } from "../_lib/rpc.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const { identifier } = req.query;
    const value = Array.isArray(identifier) ? identifier[0] : identifier;
    const isHex = value.startsWith("0x");
    const method = isHex && value.length === 66 ? "eth_getBlockByHash" : "eth_getBlockByNumber";
    const params =
      method === "eth_getBlockByNumber"
        ? [value.startsWith("0x") ? value : `0x${Number.parseInt(value, 10).toString(16)}`, true]
        : [value, true];

    const block = await rpcCall(method, params);
    sendJson(res, 200, block);
  } catch (error) {
    sendError(res, error);
  }
}
