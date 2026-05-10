# Veltrix Explorer - Developer Handover

## 🔍 Application State
- **UI:** Vite React explorer with custom component system
- **Frontend Deploy:** Vercel
- **Backend:** Vercel API routes + VPS indexer proxy
- **Live RPC:** `https://veltrix-rpc.404piyush.me`
- **Live Explorer:** `https://veltrix-explorer.404piyush.me`
- **Indexer API:** `https://veltrix-rpc.404piyush.me/explorer-api`

## 🛠️ Recent Changes
1. **UI Upgrade:** Fully refactored from "Boring UI" to a premium Shadcn/UI dark theme with real-time data streaming.
2. **Data Integration:** Fixed Gas Price, Chain ID, and Block metrics to pull from live network data rather than placeholders.
3. **Network Migration:** Aligned with Chain ID `0xce608` and native symbol `VEL`.
4. **Indexer Integration:** Address history, paginated blocks, and paginated transactions are served through the VPS indexer instead of shallow latest-block scans.

## 🚀 Management
- **Production UI:** `https://veltrix-explorer.404piyush.me`
- **Vercel API Base:** `/api`
- **VPS Indexer:** Managed via `veltrix-explorer-indexer.service`.

## 🚧 Next for Dev
- Implement ERC-20 / Token Tracker support in the indexer and UI.
- Expand tx detail pages and labeling depth from indexed data.
