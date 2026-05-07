export const INDEXER_API_URL = process.env.INDEXER_API_URL || "";

export async function fetchIndexerJson(path, query = {}) {
  if (!INDEXER_API_URL) return null;

  const url = new URL(`${INDEXER_API_URL.replace(/\/$/, "")}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
