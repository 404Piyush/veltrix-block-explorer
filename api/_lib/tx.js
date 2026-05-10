const ERC20_TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const PREDEPLOY_NAMES = {
  "0x4200000000000000000000000000000000000015": "L1Block",
  "0x4200000000000000000000000000000000000016": "L2ToL1MessagePasser",
  "0x4200000000000000000000000000000000000011": "SequencerFeeVault",
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001": "SystemTx",
};

function normalizeAddress(address) {
  return address ? address.toLowerCase() : "";
}

function shortAddress(address, head = 8, tail = 6) {
  if (!address) return "N/A";
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

export function labelAddress(address) {
  if (!address) return "Contract creation";
  const normalized = normalizeAddress(address);
  return PREDEPLOY_NAMES[normalized] ? `${PREDEPLOY_NAMES[normalized]} (${shortAddress(address, 8, 5)})` : shortAddress(address);
}

function parseTopicAddress(topic) {
  if (!topic || topic.length < 42) return null;
  return `0x${topic.slice(-40)}`.toLowerCase();
}

function parseHexQuantity(hexValue) {
  if (!hexValue || hexValue === "0x") return 0n;
  return BigInt(hexValue);
}

export function decodeTokenTransfers(receipt) {
  const logs = receipt?.logs || [];
  return logs
    .filter((log) => log?.topics?.[0]?.toLowerCase() === ERC20_TRANSFER_TOPIC)
    .map((log, index) => ({
      index,
      tokenAddress: normalizeAddress(log.address),
      tokenLabel: labelAddress(log.address),
      from: parseTopicAddress(log.topics?.[1]),
      fromLabel: labelAddress(parseTopicAddress(log.topics?.[1])),
      to: parseTopicAddress(log.topics?.[2]),
      toLabel: labelAddress(parseTopicAddress(log.topics?.[2])),
      amountRaw: parseHexQuantity(log.data).toString(),
      amountHex: log.data,
      logIndex: log.logIndex,
    }));
}

export function buildTxProvenance(tx, receipt) {
  const to = tx?.to ? tx.to.toLowerCase() : null;
  const from = tx?.from ? tx.from.toLowerCase() : null;
  const toLabel = tx?.to ? labelAddress(tx.to) : "Contract creation";
  const fromLabel = labelAddress(tx?.from);
  const isNativeValue = parseHexQuantity(tx?.value) > 0n;
  const isKnownPredeploy = Boolean(PREDEPLOY_NAMES[to || ""]);

  return {
    from,
    fromLabel,
    to,
    toLabel,
    executionKind: tx?.to ? (isKnownPredeploy ? "Predeploy call" : "Contract call") : "Contract creation",
    isKnownPredeploy,
    hasNativeValue: isNativeValue,
    logCount: receipt?.logs?.length || 0,
    status: receipt?.status === "0x1" ? "success" : receipt?.status === "0x0" ? "failed" : "pending",
  };
}
