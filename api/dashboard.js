import { rpcCall, sendError, sendJson } from "./_lib/rpc.js";

const SYSTEM_TX_FROM = "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001";
const L1_BLOCK_ADDRESS = "0x4200000000000000000000000000000000000015";

function classifyTx(tx) {
  const isSystem =
    tx?.type === "0x7e" ||
    tx?.from?.toLowerCase() === SYSTEM_TX_FROM ||
    tx?.to?.toLowerCase() === L1_BLOCK_ADDRESS;

  return {
    ...tx,
    explorerType: isSystem ? "system" : "user",
  };
}

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
    const enrichedBlocks = blockResults.map((block) => {
      const transactions = (block?.transactions || []).map(classifyTx);
      return { ...block, transactions };
    });
    const latestTxs = enrichedBlocks.flatMap((block) => block?.transactions || []).slice(0, 6);
    const userTxCount = latestTxs.filter((tx) => tx.explorerType === "user").length;
    const systemTxCount = latestTxs.length - userTxCount;

    sendJson(res, 200, {
      latestBlock: latestBlockNum,
      gasPrice: (Number.parseInt(gasPriceHex, 16) / 1e9).toFixed(2),
      chainId: Number.parseInt(chainIdHex, 16),
      clientVersion,
      userTxCount,
      systemTxCount,
      blocks: enrichedBlocks.map((block) => ({
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        transactionCount: block.transactions.length,
        userTransactionCount: block.transactions.filter((tx) => tx.explorerType === "user").length,
        systemTransactionCount: block.transactions.filter((tx) => tx.explorerType === "system").length,
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
