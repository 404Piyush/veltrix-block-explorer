# Veltrix Block Explorer

Production-ready block explorer for the Veltrix Sepolia L2.

It provides a fast public dashboard, block and transaction detail views, address inspection, and a thin serverless API layer that reads directly from the Veltrix RPC without requiring a separate indexer.

## Highlights

- Real-time dashboard for latest blocks, sampled transactions, gas price, client version, and chain metadata.
- Search-driven navigation for block numbers, block hashes, transaction hashes, and addresses.
- Serverless API routes for Vercel under `/api/*`.
- React + Vite frontend with a standalone deployment path.
- Direct RPC architecture backed by `veltrix-rpc.404piyush.me`.

## Stack

- Frontend: React, Vite, Tailwind CSS, Radix UI
- API layer: Vercel serverless functions
- Address history: optional VPS indexer in `indexer/`
- Data source: Veltrix JSON-RPC
- Deployment target: Vercel

## Repository Layout

```text
api/        Vercel serverless API routes
indexer/    Optional VPS service for indexed address history
public/     Static assets
src/        Explorer frontend
vercel.json SPA rewrite config
```

## Environment

Create a local `.env` from `.env.example`.

Required values:

```bash
RPC_URL=https://veltrix-rpc.404piyush.me
INDEXER_API_URL=https://explorer-api.404piyush.me
VITE_API_BASE=/api
```

Notes:

- `RPC_URL` is used by the serverless API routes.
- `INDEXER_API_URL` enables full indexed address history when the VPS indexer is deployed.
- `VITE_API_BASE` should stay as `/api` for Vercel.
- For purely local frontend work against another backend, `VITE_API_BASE` can point to a full URL.

## Local Development

Install dependencies:

```bash
npm install
```

Run the frontend only:

```bash
npm run dev
```

Run the full Vercel-style app locally:

```bash
vercel dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Vercel Deployment

Recommended production setup:

- Project root: this repository root
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

Set this environment variable in Vercel:

```bash
RPC_URL=https://veltrix-rpc.404piyush.me
INDEXER_API_URL=https://explorer-api.404piyush.me
```

Suggested domains:

- `explorer.404piyush.me`
- `www.explorer.404piyush.me` if needed

## API Surface

- `GET /api/dashboard`
- `GET /api/block/:identifier`
- `GET /api/tx/:hash`
- `GET /api/address/:address`

These routes proxy read-only explorer queries to the Veltrix RPC and shape the response for the UI.

## Production Notes

- This explorer is intentionally thin and RPC-backed. It is not an archive indexer.
- Full address history requires the included `indexer/` service because Ethereum JSON-RPC does not expose address transaction lists.
- Keep the RPC endpoint private to your own infrastructure; the explorer should never embed secrets in the browser bundle.
