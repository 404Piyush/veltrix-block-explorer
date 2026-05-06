import express from "express";

import { PORT } from "./config.js";
import { getAddress, getIndexerStats } from "./db.js";
import "./sync.js";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

const app = express();

app.use((req, res, next) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("x-content-type-options", "nosniff");
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    ...getIndexerStats(),
  });
});

app.get("/api/address/:address", (req, res) => {
  const { address } = req.params;
  if (!ADDRESS_PATTERN.test(address)) {
    res.status(400).json({ error: "Invalid address" });
    return;
  }

  res.json(getAddress(address));
});

app.use((error, _req, res, _next) => {
  void _next;
  console.error("indexer request failed:", error.message);
  res.status(500).json({ error: "Indexer request failed" });
});

app.listen(PORT, () => {
  console.log(`Veltrix explorer indexer listening on ${PORT}`);
});
