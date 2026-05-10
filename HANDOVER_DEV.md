# Veltrix Explorer - Developer Handover

## Current State
- UI: Vite React explorer with custom component system
- Frontend deploy: Vercel
- Backend: Vercel API routes plus VPS indexer proxy
- Live RPC: `https://veltrix-rpc.404piyush.me`
- Live explorer: `https://veltrix-explorer.404piyush.me`
- Indexer API: `https://veltrix-rpc.404piyush.me/explorer-api`

## Done
1. Refactored the UI into the current dark theme and layout system.
2. Switched gas price, chain ID, and block metrics to live network data.
3. Aligned explorer defaults to chain ID `0xce608` and native symbol `VEL`.
4. Added the VPS-backed indexer path for address history, paginated blocks, and paginated transactions.
5. Fixed the address page fallback so indexed history is used when available.
6. Moved the custom domain to the current Vercel production deploy.

## Live Management
- Production UI: `https://veltrix-explorer.404piyush.me`
- Vercel API base: `/api`
- VPS indexer service: `veltrix-explorer-indexer.service`

## Key Files
- `src/App.jsx`: main explorer UI
- `api/address/[address].js`: address history aggregation
- `api/_lib/indexer.js`: indexer proxy helper
- `indexer/src/*`: SQLite indexer service

## Remaining
- Add ERC-20 / token tracker support.
- Expand transaction detail pages with richer labels and provenance.
- Improve block and address labeling depth from indexed data.
