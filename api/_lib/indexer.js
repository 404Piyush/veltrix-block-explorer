import https from "node:https";

const DEFAULT_INDEXER_API_URL = "https://veltrix-rpc.404piyush.me/explorer-api";

export const INDEXER_API_URL = process.env.INDEXER_API_URL || DEFAULT_INDEXER_API_URL;
const INDEXER_TIMEOUT_MS = 5000;

export async function fetchIndexerJson(path, query = {}) {
  if (!INDEXER_API_URL) return null;

  const url = new URL(`${INDEXER_API_URL.replace(/\/$/, "")}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INDEXER_TIMEOUT_MS);

  try {
    if (typeof fetch === "function") {
      const response = await fetch(url, {
        headers: { accept: "application/json" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      if (!response.ok) return null;
      return response.json();
    }

    return await fetchJsonWithHttps(url);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function fetchJsonWithHttps(url) {
  return new Promise((resolve) => {
    const request = https.get(url, { headers: { accept: "application/json" }, timeout: INDEXER_TIMEOUT_MS }, (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        resolve(null);
        return;
      }

      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(null);
        }
      });
    });

    request.on("timeout", () => {
      request.destroy();
      resolve(null);
    });
    request.on("error", () => resolve(null));
  });
}
