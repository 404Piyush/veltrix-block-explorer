import { RPC_URL } from "./config.js";

let requestId = 1;

export async function rpcCall(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: requestId++,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC ${method} failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || `RPC ${method} failed`);
  }

  return payload.result;
}

export async function latestBlockNumber() {
  return Number.parseInt(await rpcCall("eth_blockNumber"), 16);
}

export async function blockByNumber(blockNumber) {
  return rpcCall("eth_getBlockByNumber", [`0x${blockNumber.toString(16)}`, true]);
}
