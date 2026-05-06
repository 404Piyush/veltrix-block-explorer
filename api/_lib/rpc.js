const RPC_URL = process.env.RPC_URL || process.env.VELTRIX_RPC_URL || "https://veltrix-rpc.404piyush.me";
const RPC_TIMEOUT_MS = 6000;

export const HEX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;
export const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
export const BLOCK_NUMBER_PATTERN = /^(0|[1-9]\d*)$/;
export const HEX_QUANTITY_PATTERN = /^0x[a-fA-F0-9]+$/;

export async function rpcCall(method, params = []) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    signal: controller.signal,
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    }),
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`RPC request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || "Unknown RPC error");
  }

  return payload.result;
}

export function sendJson(res, statusCode, body, cacheSeconds = 0) {
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("cache-control", cacheSeconds > 0 ? `s-maxage=${cacheSeconds}, stale-while-revalidate=10` : "no-store");
  res.status(statusCode).json(body);
}

export function sendError(res, error) {
  const message = error instanceof Error && error.name === "AbortError" ? "RPC request timed out" : error instanceof Error ? error.message : "Unexpected error";
  sendJson(res, 500, { error: message });
}
