# Veltrix Explorer Indexer

Small VPS service for address transaction history.

The Vercel explorer can read basic live chain data directly through RPC, but JSON-RPC cannot answer "show all transactions for this address". This service backfills Veltrix blocks into SQLite and exposes indexed address history.

## Run Locally

```bash
cd indexer
npm install
RPC_URL=https://veltrix-rpc.404piyush.me npm start
```

Health:

```bash
curl http://localhost:4100/health
```

Address history:

```bash
curl http://localhost:4100/api/address/0x83FEb86BF4BF50092dcB4f5e41bAE2603172eE8E
```

## Environment

```bash
RPC_URL=https://veltrix-rpc.404piyush.me
INDEXER_DB_PATH=/var/lib/veltrix-explorer/indexer.sqlite
PORT=4100
START_BLOCK=0
BATCH_SIZE=100
POLL_INTERVAL_MS=4000
```

## Vercel Integration

Set this in the Vercel explorer project after deploying the indexer behind HTTPS:

```bash
INDEXER_API_URL=https://explorer-api.404piyush.me
```
