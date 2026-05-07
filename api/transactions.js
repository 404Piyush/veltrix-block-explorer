import { fetchIndexerJson } from "./_lib/indexer.js";
import { sendError, sendJson } from "./_lib/rpc.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const data = await fetchIndexerJson("/api/transactions", req.query);
    if (!data) {
      sendJson(res, 503, { error: "Indexer unavailable" });
      return;
    }

    sendJson(res, 200, data);
  } catch (error) {
    sendError(res, error);
  }
}
