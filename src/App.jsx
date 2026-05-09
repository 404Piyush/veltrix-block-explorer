import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Blocks,
  Box,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Copy,
  Cpu,
  Database,
  FileCode2,
  Gauge,
  Hash,
  Layers3,
  Menu,
  Network,
  RadioTower,
  Search,
  ShieldCheck,
  TimerReset,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Separator } from "./components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { cn } from "./lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const NATIVE_SYMBOL = import.meta.env.VITE_NATIVE_SYMBOL || "VEL";
const api = axios.create({
  baseURL: API_BASE,
  timeout: 7000,
});

const NAV_ITEMS = [
  { label: "Blocks", href: "/#latest-blocks" },
  { label: "Transactions", href: "/#latest-transactions" },
  { label: "Network", href: "/#network-health" },
  { label: "API", href: "/api/dashboard", external: true },
];

const PREDEPLOY_NAMES = {
  "0x4200000000000000000000000000000000000015": "L1Block",
  "0x4200000000000000000000000000000000000016": "L2ToL1MessagePasser",
  "0x4200000000000000000000000000000000000011": "SequencerFeeVault",
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001": "SystemTx",
};

const ADDRESS_ACTIVITY_LIMIT = 10;
const ACTIVITY_TYPES = [
  { label: "All", value: "all" },
  { label: "User", value: "user" },
  { label: "System", value: "system" },
];

const formatAddress = (address, head = 8, tail = 6) => {
  if (!address) return "N/A";
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
};

const hexToNumber = (hex) => {
  if (!hex) return 0;
  if (typeof hex === "number") return hex;
  return Number.parseInt(hex, 16);
};

const formatNumber = (value) => {
  const number = typeof value === "number" ? value : hexToNumber(value);
  return new Intl.NumberFormat("en-US").format(number || 0);
};

const formatEther = (hex, digits = 5) => {
  if (!hex) return "0";
  const wei = BigInt(hex);
  const whole = wei / 10n ** 18n;
  const fraction = wei % (10n ** 18n);
  const padded = fraction.toString().padStart(18, "0").slice(0, digits);
  return `${whole.toString()}.${padded}`;
};

const formatGasPrice = (weiHex) => {
  if (!weiHex) return "...";
  const wei = BigInt(weiHex);
  if (wei === 0n) return "0 wei";
  const gwei = Number(wei) / 1e9;
  if (gwei < 0.0001) return `${wei.toLocaleString("en-US")} wei`;
  if (gwei < 0.01) return `${gwei.toFixed(6)} Gwei`;
  return `${gwei.toFixed(2)} Gwei`;
};

const formatGasRatio = (used, limit) => {
  const gasUsed = hexToNumber(used);
  const gasLimit = hexToNumber(limit);
  if (!gasLimit) return 0;
  return Math.min(100, (gasUsed / gasLimit) * 100);
};

const formatPercent = (value, digits = 2) => {
  if (!value) return "0%";
  if (value > 0 && value < 0.01) return "<0.01%";
  return `${value.toFixed(digits)}%`;
};

const timeAgo = (timestamp) => {
  if (!timestamp) return "pending";
  const seconds = Math.max(0, Math.floor((Date.now() - hexToNumber(timestamp) * 1000) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const labelAddress = (address) => {
  if (!address) return "Contract creation";
  const label = PREDEPLOY_NAMES[address.toLowerCase()];
  return label ? `${label} (${formatAddress(address, 8, 5)})` : formatAddress(address);
};

const typeBadgeClass = (type) =>
  type === "system"
    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

const copyText = async (value) => {
  if (!value || !navigator.clipboard) return;
  await navigator.clipboard.writeText(value);
};

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>{children}</main>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="brand-mark grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <Blocks className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold">VELTRIX</div>
            <div className="text-xs text-muted-foreground">Blockchain Explorer</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-md border border-border bg-card/70 p-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Button key={item.label} asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <a href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined}>
                {item.label}
                {item.external && <ArrowUpRight className="size-3.5" />}
              </a>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary sm:inline-flex">
            <span className="mr-1 size-1.5 rounded-full bg-emerald-400" />
            Veltrix L2
          </Badge>
          <Button variant="outline" size="icon" aria-label="Toggle navigation" className="md:hidden" onClick={() => setOpen((value) => !value)}>
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-background/98 px-4 py-3 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                className="flex h-10 items-center justify-between rounded-md border border-border bg-card px-3 text-sm text-muted-foreground"
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
                {item.external ? <ArrowUpRight className="size-4" /> : <ChevronDown className="size-4 -rotate-90" />}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

function ExplorerSearch({ compact = false }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    setError("");

    if (value.startsWith("0x")) {
      if (/^0x[a-fA-F0-9]{64}$/.test(value)) {
        navigate(`/tx/${value}`);
        return;
      }
      if (/^0x[a-fA-F0-9]{40}$/.test(value)) {
        navigate(`/address/${value}`);
        return;
      }
      setError("Enter a valid transaction hash, block hash, or address.");
      return;
    }

    if (!/^(0|[1-9]\d*)$/.test(value)) {
      setError("Enter a block number, transaction hash, block hash, or address.");
      return;
    }

    navigate(`/block/${value}`);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", compact ? "max-w-2xl" : "max-w-4xl")}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className={cn(
              "h-12 rounded-md border-border bg-card/90 pl-12 pr-4 font-mono shadow-inner placeholder:font-sans",
              !compact && "h-14 text-base"
            )}
            placeholder="Search address, transaction, block hash, or block number"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (error) setError("");
            }}
          />
        </div>
        <Button className={cn("h-12 px-5 shadow-elevated", !compact && "h-14 px-7")} type="submit">
          <Search className="size-4" />
          Search
        </Button>
      </div>
      {error && <div className="mt-2 text-sm text-destructive-foreground">{error}</div>}
    </form>
  );
}

function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const { data: indexedBlocks } = useApi("/blocks?limit=6");
  const { data: indexedTransactions } = useApi("/transactions?limit=6&type=all");

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = () => {
      api
        .get("/dashboard")
        .then((response) => {
          if (!mounted) return;
          setData(response.data);
          setError("");
        })
        .catch((requestError) => {
          if (!mounted) return;
          setError(requestError.message);
        });
    };

    fetchDashboard();
    const interval = window.setInterval(fetchDashboard, 3000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const chainHealth = useMemo(() => {
    if (!data) return [];
    const latestBlock = Number(data.latestBlock || 0);
    const gas = Number(data.gasPrice || 0);
    const userTxCount = data.userTxCount || 0;
    const systemTxCount = data.systemTxCount || 0;
    return [
      { label: "Sync Height", value: `${formatNumber(latestBlock)} / ${formatNumber(latestBlock)}`, tone: "emerald" },
      { label: "Base Fee Trend", value: gas > 10 ? "Elevated" : "Normal", tone: gas > 10 ? "amber" : "emerald" },
      { label: "Recent Throughput", value: `${userTxCount} user / ${systemTxCount} system`, tone: "cyan" },
    ];
  }, [data]);

  const displayBlocks = indexedBlocks?.blocks?.length ? indexedBlocks.blocks : data?.blocks || [];
  const displayTransactions = indexedTransactions?.transactions?.length ? indexedTransactions.transactions : data?.transactions || [];

  return (
    <Shell>
      <section className="hero-band border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-center">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
                <RadioTower className="mr-1 size-3" />
                Live RPC
              </Badge>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-balance sm:text-5xl lg:text-6xl">
              Veltrix Block Explorer
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Blocks, transactions, accounts, and RPC health in one live execution console.
            </p>
            <div className="mt-8">
              <ExplorerSearch />
            </div>
          </div>

          <Card className="depth-panel overflow-hidden border-border/80 bg-card/88">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Network Overview</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Updated every 3 seconds</p>
                </div>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  <Activity className="mr-1 size-3" />
                  Online
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {error && <div className="border-b border-destructive/30 bg-destructive/10 p-4 text-sm text-red-200">{error}</div>}
              <div className="grid grid-cols-2 border-b border-border">
                <MiniMetric label="Latest block" value={data ? formatNumber(data.latestBlock) : "..."} icon={Box} />
                <MiniMetric label="Gas quote" value={data ? formatGasPrice(data.gasPriceWei) : "..."} icon={Zap} />
                <MiniMetric label="Chain ID" value={data ? data.chainId : "..."} icon={ShieldCheck} />
                <MiniMetric label="Client" value={data ? data.clientVersion?.split("/")?.[0] : "..."} icon={Cpu} />
              </div>
              <div className="space-y-3 p-5">
                {chainHealth.map((item) => (
                  <HealthRow key={item.label} {...item} />
                ))}
              </div>
              <NetworkScene latestBlock={data?.latestBlock} transactions={displayTransactions.length} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Latest Block" value={data ? formatNumber(data.latestBlock) : "..."} detail="Head of canonical chain" icon={Layers3} tone="cyan" />
          <StatCard label="Gas Quote" value={data ? formatGasPrice(data.gasPriceWei) : "..."} detail="Current L2 RPC quote" icon={Gauge} tone="amber" />
          <StatCard label="Recent User Txs" value={data ? `${data.userTxCount} recent` : "..."} detail={data ? `${data.systemTxCount} OP Stack system txs sampled` : "From latest sampled blocks"} icon={ArrowLeftRight} tone="emerald" />
          <StatCard
            label="Explorer Mode"
            value={indexedTransactions?.indexer ? "Indexed" : "Realtime"}
            detail={indexedTransactions?.indexer ? `Indexer head ${formatNumber(indexedTransactions.indexer.lastIndexedBlock)}` : "Polling live JSON-RPC"}
            icon={Database}
            tone="rose"
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <LatestBlocks blocks={displayBlocks} />
          <LatestTransactions transactions={displayTransactions} />
        </div>

        <div id="network-health" className="mt-8 grid scroll-mt-24 gap-6 lg:grid-cols-3">
          <InsightCard title="Gas Utilization" icon={Gauge} data={data} />
          <FeaturePanel />
          <WatchlistPanel />
        </div>
      </section>
    </Shell>
  );
}

function MiniMetric({ label, value, icon: Icon }) {
  return (
    <div className="flex min-h-28 items-center gap-3 border-r border-t border-border p-5 first:border-t-0 [&:nth-child(2)]:border-r-0 [&:nth-child(2)]:border-t-0 [&:nth-child(4)]:border-r-0">
      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="truncate text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}

function HealthRow({ label, value, tone }) {
  const tones = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    cyan: "bg-primary",
  };

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className={cn("size-2 rounded-full", tones[tone])} />
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function StatCard({ label, value, detail, icon: Icon, tone }) {
  const tones = {
    cyan: "bg-primary/12 text-primary",
    amber: "bg-amber-500/12 text-amber-300",
    emerald: "bg-emerald-500/12 text-emerald-300",
    rose: "bg-orange-500/12 text-orange-300",
  };

  return (
    <Card className="depth-panel border-border/80 bg-card/88">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-2 truncate text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{detail}</div>
          </div>
          <div className={cn("grid size-11 shrink-0 place-items-center rounded-md", tones[tone])}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LatestBlocks({ blocks }) {
  return (
    <Card id="latest-blocks" className="depth-panel scroll-mt-24 border-border/80 bg-card/88">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border">
        <div>
          <CardTitle className="text-lg">Latest Blocks</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Freshly indexed execution blocks</p>
        </div>
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          Live
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {blocks.map((block) => (
            <Link key={block.hash} to={`/block/${hexToNumber(block.number)}`} className="block p-4 transition-colors hover:bg-muted/35">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary/12 text-primary">
                    <Box className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">Block {formatNumber(block.number)}</span>
                      <Badge variant="secondary">{block.userTransactionCount} user / {block.systemTransactionCount} system</Badge>
                    </div>
                    <div className="mt-1 truncate font-mono text-xs text-muted-foreground">{block.hash}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {timeAgo(block.timestamp)}
                    </div>
                  </div>
                </div>
                <GasPill used={block.gasUsed} limit={block.gasLimit} />
              </div>
            </Link>
          ))}
          {!blocks.length && <EmptyState label="Waiting for block data" />}
        </div>
      </CardContent>
    </Card>
  );
}

function LatestTransactions({ transactions }) {
  return (
    <Card id="latest-transactions" className="depth-panel scroll-mt-24 border-border/80 bg-card/88">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border">
        <div>
          <CardTitle className="text-lg">Latest Transactions</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Recent transfers and contract calls</p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          Indexed
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Txn Hash</TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.hash}>
                <TableCell>
                  <Link to={`/tx/${tx.hash}`} className="flex items-center gap-2 font-mono text-sm text-primary hover:text-primary/80">
                    <Hash className="size-4" />
                    {formatAddress(tx.hash, 10, 8)}
                  </Link>
	                  <Badge variant="outline" className={cn("mt-2", typeBadgeClass(tx.explorerType))}>
	                    {tx.explorerType === "system" ? "System" : "User"}
	                  </Badge>
	                </TableCell>
	                <TableCell>
	                  <div className="flex min-w-52 items-center gap-2 text-xs">
	                    <span className="font-mono text-muted-foreground">{labelAddress(tx.from)}</span>
	                    <ArrowRight className="size-3 text-muted-foreground" />
	                    <span className="font-mono text-muted-foreground">{labelAddress(tx.to)}</span>
	                  </div>
	                </TableCell>
                <TableCell className="text-right font-mono text-sm">{formatEther(tx.value, 4)} {NATIVE_SYMBOL}</TableCell>
              </TableRow>
            ))}
            {!transactions.length && (
              <TableRow>
                <TableCell colSpan={3}>
                  <EmptyState label="Waiting for transaction data" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function GasPill({ used, limit }) {
  const ratio = formatGasRatio(used, limit);
  return (
    <div className="hidden min-w-28 sm:block">
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>Gas</span>
        <span>{formatPercent(ratio)}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(1, ratio)}%` }} />
      </div>
    </div>
  );
}

function InsightCard({ title, icon: Icon, data }) {
  const blocks = data?.blocks || [];
  const averageGas = blocks.length
    ? blocks.reduce((sum, block) => sum + formatGasRatio(block.gasUsed, block.gasLimit), 0) / blocks.length
    : 0;

  return (
    <Card className="depth-panel border-border/80 bg-card/88">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-amber-300" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="text-4xl font-semibold">{formatPercent(averageGas)}</div>
        <p className="mt-2 text-sm text-muted-foreground">Average gas used across the latest sampled blocks.</p>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(1, averageGas)}%` }} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border border-border bg-background/60 p-3">
            <div className="text-muted-foreground">Peak block</div>
            <div className="mt-1 font-semibold">{blocks[0] ? formatNumber(blocks[0].number) : "..."}</div>
          </div>
          <div className="rounded-md border border-border bg-background/60 p-3">
            <div className="text-muted-foreground">Sample size</div>
            <div className="mt-1 font-semibold">{blocks.length} blocks</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturePanel() {
  const features = [
    { label: "Contract intelligence", icon: FileCode2 },
    { label: "Wallet profiling", icon: Wallet },
    { label: "Block finality feed", icon: TimerReset },
  ];

  return (
    <Card className="depth-panel border-border/80 bg-card/88">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base">Explorer Toolkit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {features.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between rounded-md border border-border bg-background/60 p-3">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-md bg-primary/12 text-primary">
                <Icon className="size-4" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </div>
            <CheckCircle2 className="size-4 text-emerald-300" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WatchlistPanel() {
  return (
    <Card className="depth-panel border-border/80 bg-card/88">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-base">Signal Watch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Mempool pressure</div>
            <div className="text-sm text-muted-foreground">Normal inclusion latency</div>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">Low</Badge>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Contract activity</div>
            <div className="text-sm text-muted-foreground">Trace-ready transaction links</div>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            Ready
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailLayout({ title, eyebrow, children, loading, error }) {
  return (
    <Shell>
      <section className="border-b border-border bg-card/45">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowRight className="size-4 rotate-180" />
                Back to dashboard
              </Link>
              <div className="text-sm uppercase tracking-wide text-primary">{eyebrow}</div>
              <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
            </div>
            <ExplorerSearch compact />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && <EmptyState label="Loading on-chain data" />}
        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-red-200">{error}</div>}
        {!loading && !error && children}
      </section>
    </Shell>
  );
}

function BlockPage() {
  const { identifier } = useParams();
  const { data, loading, error } = useApi(`/block/${identifier}`);
  const txs = data?.transactions || [];

  return (
    <DetailLayout title={data ? `Block ${formatNumber(data.number)}` : "Block"} eyebrow="Block detail" loading={loading} error={error}>
      {data && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="depth-panel border-border/80 bg-card/88">
            <CardHeader className="border-b border-border">
              <CardTitle>Block Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <DetailRow label="Hash" value={data.hash} copy />
              <DetailRow label="Parent hash" value={data.parentHash} copy />
              <DetailRow label="Miner" value={data.miner} copy />
              <DetailRow label="Timestamp" value={timeAgo(data.timestamp)} />
              <DetailRow label="Gas used" value={`${formatNumber(data.gasUsed)} / ${formatNumber(data.gasLimit)}`} />
              <DetailRow label="Transactions" value={txs.length} />
            </CardContent>
          </Card>
          <TransactionsTable transactions={txs} />
        </div>
      )}
    </DetailLayout>
  );
}

function TransactionPage() {
  const { hash } = useParams();
  const { data, loading, error } = useApi(`/tx/${hash}`);
  const tx = data?.tx;
  const receipt = data?.receipt;

  return (
    <DetailLayout title="Transaction" eyebrow={hash ? formatAddress(hash, 14, 12) : "Transaction detail"} loading={loading} error={error}>
      {tx && (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Card className="depth-panel border-border/80 bg-card/88">
            <CardHeader className="border-b border-border">
              <CardTitle>Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <DetailRow label="Hash" value={tx.hash} copy />
              <DetailRow label="From" value={tx.from} copy />
              <DetailRow label="To" value={tx.to || "Contract creation"} copy={Boolean(tx.to)} />
              <DetailRow label="Value" value={`${formatEther(tx.value)} ${NATIVE_SYMBOL}`} />
              <DetailRow label="Gas price" value={`${formatNumber(tx.gasPrice)} wei`} />
              <DetailRow label="Nonce" value={formatNumber(tx.nonce)} />
              <DetailRow label="Block" value={tx.blockNumber ? formatNumber(tx.blockNumber) : "Pending"} />
            </CardContent>
          </Card>
          <Card className="depth-panel border-border/80 bg-card/88">
            <CardHeader className="border-b border-border">
              <CardTitle>Execution Receipt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <DetailRow label="Status" value={receipt?.status === "0x1" ? "Success" : "Failed or pending"} />
              <DetailRow label="Gas used" value={receipt?.gasUsed ? formatNumber(receipt.gasUsed) : "Pending"} />
              <DetailRow label="Contract address" value={receipt?.contractAddress || "N/A"} copy={Boolean(receipt?.contractAddress)} />
              <DetailRow label="Logs" value={receipt?.logs?.length || 0} />
            </CardContent>
          </Card>
        </div>
      )}
    </DetailLayout>
  );
}

function AddressPage() {
  const { address } = useParams();
  const [activityType, setActivityType] = useState("all");
  const [offset, setOffset] = useState(0);
  const addressPath = `/address/${address}?limit=${ADDRESS_ACTIVITY_LIMIT}&offset=${offset}&type=${activityType}`;
  const { data, loading, error } = useApi(addressPath);
  const recentTransactions = data?.recentTransactions || [];
  const activitySource = data?.recentSource === "indexer" ? "Indexed history" : `Latest ${formatNumber(data?.scannedBlockDepth)} blocks`;
  const page = data?.page || { limit: ADDRESS_ACTIVITY_LIMIT, offset: 0, type: activityType, hasMore: false };
  const currentPage = Math.floor((page.offset || 0) / (page.limit || ADDRESS_ACTIVITY_LIMIT)) + 1;

  return (
    <DetailLayout title="Address" eyebrow={address ? formatAddress(address, 14, 12) : "Address detail"} loading={loading} error={error}>
      {data && (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="depth-panel border-border/80 bg-card/88">
            <CardHeader className="border-b border-border">
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <DetailRow label="Address" value={data.address} copy />
              <DetailRow label="Balance" value={`${formatEther(data.balance)} ${NATIVE_SYMBOL}`} />
              <DetailRow label="Submitted tx count" value={formatNumber(data.transactionCount)} />
              <DetailRow label="Type" value={data.isContract ? "Smart contract" : "Externally owned account"} />
              <DetailRow label="Activity source" value={activitySource} />
              {data.indexer && <DetailRow label="Indexer head" value={`${formatNumber(data.indexer.lastIndexedBlock)} / ${formatNumber(data.latestBlock)}`} />}
            </CardContent>
          </Card>
          <Card className="depth-panel border-border/80 bg-card/88">
            <CardHeader className="border-b border-border">
              <CardTitle>Profile Signals</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-5">
              <Signal label="Verification" value={data.isContract ? "Contract bytecode detected" : "Wallet account"} icon={BadgeCheck} />
              <Signal
                label="Activity"
                value={`${formatNumber(data.transactionCount)} submitted by nonce, ${formatNumber(data.indexedTransactionCount || recentTransactions.length)} indexed matches`}
                icon={Activity}
              />
              <Signal label="Holdings" value={`${formatEther(data.balance, 4)} ${NATIVE_SYMBOL} native balance`} icon={CircleDollarSign} />
            </CardContent>
          </Card>
          <Card className="depth-panel border-border/80 bg-card/88 lg:col-span-2">
            <CardHeader className="gap-4 border-b border-border md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <CardTitle>Address Activity</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activitySource} · page {formatNumber(currentPage)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {ACTIVITY_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
	                    variant={activityType === type.value ? "default" : "outline"}
	                    size="sm"
	                    onClick={() => {
	                      setActivityType(type.value);
	                      setOffset(0);
	                    }}
	                  >
                    {type.label}
                  </Button>
                ))}
                <Badge variant="secondary">{formatNumber(data.indexedTransactionCount || recentTransactions.length)} indexed</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <TransactionsTable
                transactions={recentTransactions}
                emptyLabel={`No matching transactions from ${activitySource.toLowerCase()}`}
                embedded
              />
              <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {formatNumber(page.offset || 0)}-{formatNumber((page.offset || 0) + recentTransactions.length)} of{" "}
                  {formatNumber(data.indexedTransactionCount || recentTransactions.length)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(page.offset || 0) <= 0 || loading}
                    onClick={() => setOffset(Math.max(0, offset - ADDRESS_ACTIVITY_LIMIT))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!page.hasMore || loading}
                    onClick={() => setOffset(offset + ADDRESS_ACTIVITY_LIMIT)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DetailLayout>
  );
}

function TransactionRows({ transactions, emptyLabel }) {
  return (
    <Table>
      <TableHeader>
	        <TableRow>
	          <TableHead>Hash</TableHead>
	          <TableHead>Type</TableHead>
	          <TableHead>From</TableHead>
	          <TableHead>To</TableHead>
	          <TableHead>Block</TableHead>
          <TableHead className="text-right">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
	          <TableRow key={tx.hash}>
	            <TableCell>
	              <Link to={`/tx/${tx.hash}`} className="font-mono text-primary hover:text-primary/80">
	                {formatAddress(tx.hash, 10, 8)}
	              </Link>
	            </TableCell>
	            <TableCell>
	              <Badge variant="outline" className={typeBadgeClass(tx.explorerType)}>
	                {tx.explorerType === "system" ? "System" : "User"}
	              </Badge>
	            </TableCell>
	            <TableCell className="font-mono text-xs text-muted-foreground">{labelAddress(tx.from)}</TableCell>
	            <TableCell className="font-mono text-xs text-muted-foreground">{labelAddress(tx.to)}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {tx.blockNumber ? (
                <Link to={`/block/${hexToNumber(tx.blockNumber)}`} className="hover:text-foreground">
                  {formatNumber(tx.blockNumber)}
                </Link>
              ) : (
                "Pending"
              )}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">{formatEther(tx.value, 4)} {NATIVE_SYMBOL}</TableCell>
          </TableRow>
        ))}
	        {!transactions.length && (
	          <TableRow>
	            <TableCell colSpan={6}>
	              <EmptyState label={emptyLabel} />
	            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function TransactionsTable({ transactions, emptyLabel = "No transactions in this block", embedded = false }) {
  if (embedded) {
    return <TransactionRows transactions={transactions} emptyLabel={emptyLabel} />;
  }

  return (
    <Card className="depth-panel border-border/80 bg-card/88">
      <CardHeader className="border-b border-border">
        <CardTitle>Transactions In Block</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <TransactionRows transactions={transactions} emptyLabel={emptyLabel} />
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value, copy = false }) {
  return (
    <div className="grid gap-2 rounded-md border border-border bg-background/60 p-3 sm:grid-cols-[150px_1fr] sm:items-center">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 truncate font-mono text-sm">{value}</span>
        {copy && (
          <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => copyText(value)} aria-label={`Copy ${label}`}>
            <Copy className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Signal({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background/60 p-3">
      <div className="grid size-10 place-items-center rounded-md bg-emerald-500/12 text-emerald-300">
        <Icon className="size-4" />
      </div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex min-h-28 items-center justify-center p-6 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Network className="size-4" />
        {label}
      </div>
    </div>
  );
}

function useApi(path) {
  const [state, setState] = useState({ path: "", data: null, error: "" });

  useEffect(() => {
    let mounted = true;

    api
      .get(path)
      .then((response) => {
        if (!mounted) return;
        setState({ path, data: response.data, error: "" });
      })
      .catch((error) => {
        if (!mounted) return;
        setState({ path, data: null, error: error.message });
      });

    return () => {
      mounted = false;
    };
  }, [path]);

  return { data: state.path === path ? state.data : null, loading: state.path !== path, error: state.path === path ? state.error : "" };
}

function NetworkScene({ latestBlock = 0, transactions = 0 }) {
  const blockDigits = String(latestBlock || 0).slice(-5).padStart(5, "0");

  return (
    <div className="scene-wrap border-t border-border p-5">
      <div className="chain-scene" aria-label="Live Veltrix block stream">
        <div className="scene-grid" />
        <div className="block-stack" style={{ "--tx-load": Math.min(8, transactions + 2) }}>
          <div className="block-cube cube-a">
            <span>{blockDigits}</span>
          </div>
          <div className="block-cube cube-b" />
          <div className="block-cube cube-c" />
        </div>
        <div className="scene-readout">
          <span>HEAD</span>
          <strong>{formatNumber(latestBlock)}</strong>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/block/:identifier" element={<BlockPage />} />
        <Route path="/tx/:hash" element={<TransactionPage />} />
        <Route path="/address/:address" element={<AddressPage />} />
      </Routes>
    </Router>
  );
}

export default App;
