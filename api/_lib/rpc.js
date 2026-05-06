const RPC_URL = process.env.RPC_URL || process.env.VELTRIX_RPC_URL || "https://veltrix-rpc.404piyush.me";

export async function rpcCall(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || "Unknown RPC error");
  }

  return payload.result;
}

export function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body);
}

export function sendError(res, error) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  sendJson(res, 500, { error: message });
}
