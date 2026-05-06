import { rpcCall, sendError, sendJson } from "./_lib/rpc.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const [latestBlockHex, gasPriceHex, chainIdHex, clientVersion] = await Promise.all([
      rpcCall("eth_blockNumber"),
      rpcCall("eth_gasPrice"),
      rpcCall("eth_chainId"),
      rpcCall("web3_clientVersion"),
    ]);

    const latestBlockNum = Number.parseInt(latestBlockHex, 16);
    const blockPromises = [];

    for (let i = 0; i < 6; i += 1) {
      const num = latestBlockNum - i;
      if (num < 0) break;
      blockPromises.push(rpcCall("eth_getBlockByNumber", [`0x${num.toString(16)}`, true]));
    }

    const blockResults = await Promise.all(blockPromises);
    const latestTxs = blockResults.flatMap((block) => block?.transactions || []).slice(0, 6);

    sendJson(res, 200, {
      latestBlock: latestBlockNum,
      gasPrice: (Number.parseInt(gasPriceHex, 16) / 1e9).toFixed(2),
      chainId: Number.parseInt(chainIdHex, 16),
      clientVersion,
      blocks: blockResults.map((block) => ({
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        transactionCount: block.transactions.length,
        miner: block.miner,
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
      })),
      transactions: latestTxs,
    }, 2);
  } catch (error) {
    sendError(res, error);
  }
}
