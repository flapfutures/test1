import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logoImg from "@assets/image_1772106618983.png";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Star,
  Settings,
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  X,
  Search,
  Menu,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { Link } from "wouter";
import { useWallet } from "@/hooks/use-wallet";
import { WalletModal } from "@/components/wallet-modal";
import { WalletButton } from "@/components/wallet-button";
import {
  BSC_CHAIN_ID,
  BSC_RPC,
  BSC_RPCS,
  USDT_ADDRESS,
  FFX_CONTRACTS,
  FLAP_PANCAKE_POOL,
  USDT_ABI,
  VAULT_ABI,
  PERPS_ABI,
  ORACLE_ABI,
  FUNDING_ABI,
} from "@/lib/perps-contracts";

const CONTRACTS_DEPLOYED = FFX_CONTRACTS.PERPS !== "";

const MOCK_PAIRS = [
  { symbol: "FLAP", pair: "FLAP/USDT", price: 0.04823, change: 12.45, volume: "2.4M", high: 0.0512, low: 0.0421 },
  { symbol: "PEPE", pair: "PEPE/USDT", price: 0.00001234, change: 8.32, volume: "18.7M", high: 0.0000135, low: 0.000011 },
  { symbol: "DOGE", pair: "DOGE/USDT", price: 0.1542, change: -2.18, volume: "45.3M", high: 0.162, low: 0.149 },
  { symbol: "SHIB", pair: "SHIB/USDT", price: 0.00002156, change: 5.67, volume: "32.1M", high: 0.000023, low: 0.0000198 },
  { symbol: "WIF", pair: "WIF/USDT", price: 2.847, change: -1.34, volume: "8.6M", high: 2.95, low: 2.71 },
  { symbol: "BONK", pair: "BONK/USDT", price: 0.00003421, change: 15.23, volume: "14.2M", high: 0.000038, low: 0.000029 },
  { symbol: "TURBO", pair: "TURBO/USDT", price: 0.00892, change: 3.41, volume: "6.8M", high: 0.0095, low: 0.0082 },
  { symbol: "MEME", pair: "MEME/USDT", price: 0.02341, change: -4.56, volume: "11.4M", high: 0.025, low: 0.022 },
];

const fmt18 = (val: bigint): number => Number(ethers.formatEther(val));
const to18 = (val: number): bigint => ethers.parseEther(val.toFixed(18));

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([promise, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`Timeout ${ms}ms`)), ms))]);

function getReadProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(BSC_RPC);
}

async function ensureBSC(): Promise<ethers.BrowserProvider> {
  const w = window as any;
  if (!w.ethereum) throw new Error("No wallet found");
  await w.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.BrowserProvider(w.ethereum);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== BSC_CHAIN_ID) {
    try {
      await w.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x38" }] });
    } catch (e: any) {
      if (e.code === 4902) {
        await w.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: "0x38", chainName: "BNB Smart Chain", nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }, rpcUrls: [BSC_RPC], blockExplorerUrls: ["https://bscscan.com"] }],
        });
      } else throw new Error("Please switch to BSC in your wallet");
    }
    return new ethers.BrowserProvider(w.ethereum);
  }
  return provider;
}

async function getSigner(): Promise<ethers.Signer> {
  const provider = await ensureBSC();
  return provider.getSigner();
}

async function fetchDexScreenerPrice(): Promise<number | null> {
  if (!FLAP_PANCAKE_POOL) return null;
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/pairs/bsc/${FLAP_PANCAKE_POOL}`);
    const data = await res.json();
    if (data?.pair?.priceUsd) return parseFloat(data.pair.priceUsd);
  } catch {}
  return null;
}

interface OnChainPosition {
  isOpen: boolean;
  isLong: boolean;
  collateral: number;
  size: number;
  entryPrice: number;
  liquidationPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  unrealizedPnl: number;
}

function generateOrderBook(midPrice: number) {
  const asks: { price: number; size: number; total: number }[] = [];
  const bids: { price: number; size: number; total: number }[] = [];
  let askTotal = 0;
  for (let i = 14; i >= 0; i--) {
    const price = midPrice + (i + 1) * midPrice * 0.002 + Math.random() * midPrice * 0.001;
    const size = Math.floor(Math.random() * 50000 + 5000);
    askTotal += size;
    asks.unshift({ price, size, total: askTotal });
  }
  let bidTotal = 0;
  for (let i = 0; i < 15; i++) {
    const price = midPrice - (i + 1) * midPrice * 0.002 - Math.random() * midPrice * 0.001;
    const size = Math.floor(Math.random() * 50000 + 5000);
    bidTotal += size;
    bids.push({ price, size, total: bidTotal });
  }
  return { asks, bids };
}

function generateRecentTrades(midPrice: number) {
  const trades = [];
  for (let i = 0; i < 20; i++) {
    const isBuy = Math.random() > 0.45;
    trades.push({
      price: midPrice + (Math.random() - 0.5) * midPrice * 0.04,
      size: Math.floor(Math.random() * 30000 + 1000),
      time: `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      side: isBuy ? "buy" : "sell",
    });
  }
  return trades;
}

function generateCandleData() {
  const data = [];
  let price = 0.042;
  for (let i = 0; i < 80; i++) {
    const open = price;
    const change = (Math.random() - 0.48) * 0.003;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 0.001;
    const low = Math.min(open, close) - Math.random() * 0.001;
    const volume = Math.floor(Math.random() * 100000 + 10000);
    data.push({ open, close, high, low, volume, index: i });
    price = close;
  }
  return data;
}

function TopBar({
  selectedPair,
  onPairSelect,
  markPrice,
  fundingRate,
  onConnectWallet,
  address,
}: {
  selectedPair: typeof MOCK_PAIRS[0];
  onPairSelect: (p: typeof MOCK_PAIRS[0]) => void;
  markPrice: number | null;
  fundingRate: number | null;
  onConnectWallet: () => void;
  address: string | null;
}) {
  const [showPairList, setShowPairList] = useState(false);
  const [pairSearch, setPairSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredPairs = MOCK_PAIRS.filter(
    (p) => p.symbol.toLowerCase().includes(pairSearch.toLowerCase()) || p.pair.toLowerCase().includes(pairSearch.toLowerCase())
  );

  const displayPrice = markPrice ?? selectedPair.price;
  const isPositive = selectedPair.change >= 0;
  const dec = displayPrice < 0.001 ? 8 : displayPrice < 1 ? 5 : 4;
  const fundingDisplay = fundingRate !== null ? `${(fundingRate / 1e16).toFixed(4)}%` : "0.0100%";

  return (
    <div className="h-12 border-b border-border/40 bg-card/30 flex items-center relative z-50" data-testid="perps-topbar">
      <div className="flex items-center h-full">
        <Link href="/" className="flex items-center gap-2 px-3 sm:px-4 h-full border-r border-border/30" data-testid="link-back-home">
          <img src={logoImg} alt="FLAP" className="w-6 h-6" />
          <span className="font-heading font-bold text-sm text-white hidden sm:inline">FLAP</span>
        </Link>

        <div className="relative">
          <button
            onClick={() => setShowPairList(!showPairList)}
            className="flex items-center gap-2 px-3 sm:px-4 h-12 border-r border-border/30 hover-elevate"
            data-testid="button-pair-selector"
          >
            <span className="font-heading font-bold text-sm sm:text-base text-white">{selectedPair.pair}</span>
            <span className="text-xs text-muted-foreground">Perp</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {showPairList && (
            <div className="absolute top-12 left-0 w-72 bg-card border border-border/40 rounded-md shadow-lg z-50" data-testid="panel-pair-list">
              <div className="p-2 border-b border-border/30">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search token..."
                    value={pairSearch}
                    onChange={(e) => setPairSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background/50"
                    data-testid="input-pair-search"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredPairs.map((p) => (
                  <button
                    key={p.symbol}
                    onClick={() => { onPairSelect(p); setShowPairList(false); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs hover-elevate"
                    data-testid={`button-pair-${p.symbol.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {p.symbol.substring(0, 2)}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-white">{p.pair}</div>
                        <div className="text-[10px] text-muted-foreground">Vol ${p.volume}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white">{p.price}</div>
                      <div className={p.change >= 0 ? "text-green-400" : "text-red-400"}>
                        {p.change >= 0 ? "+" : ""}{p.change}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4 lg:gap-6 px-4 flex-1">
        <div>
          <div className={`font-mono text-lg font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {displayPrice.toFixed(dec)}
          </div>
        </div>
        <div className="h-8 w-px bg-border/30" />
        {[
          { label: "24h Change", value: `${isPositive ? "+" : ""}${selectedPair.change}%`, color: isPositive ? "text-green-400" : "text-red-400" },
          { label: "24h High", value: selectedPair.high.toFixed(dec), color: "text-white" },
          { label: "24h Low", value: selectedPair.low.toFixed(dec), color: "text-white" },
          { label: "24h Volume", value: `$${selectedPair.volume}`, color: "text-white" },
          { label: "Funding", value: fundingDisplay, color: fundingRate !== null && fundingRate < 0 ? "text-red-400" : "text-green-400" },
        ].map((stat) => (
          <div key={stat.label} className="text-right">
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            <div className={`font-mono text-xs ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto px-3 sm:px-4">
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex w-8 h-8" data-testid="button-favorite" aria-label="Add to favorites">
          <Star className="w-4 h-4" />
        </Button>
        {address ? (
          <WalletButton />
        ) : (
          <Button size="sm" className="text-xs h-8" onClick={onConnectWallet} data-testid="button-connect">
            <Wallet className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Connect</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden w-8 h-8"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="button-mobile-stats"
          aria-label="Toggle market stats"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-12 left-0 right-0 bg-card border-b border-border/40 p-3 md:hidden z-40 grid grid-cols-3 gap-3">
          {[
            { label: "Mark Price", value: displayPrice.toFixed(dec), color: isPositive ? "text-green-400" : "text-red-400" },
            { label: "24h Change", value: `${isPositive ? "+" : ""}${selectedPair.change}%`, color: isPositive ? "text-green-400" : "text-red-400" },
            { label: "24h Vol", value: `$${selectedPair.volume}`, color: "text-white" },
            { label: "Funding", value: fundingDisplay, color: "text-green-400" },
            { label: "24h High", value: selectedPair.high.toFixed(dec), color: "text-white" },
            { label: "24h Low", value: selectedPair.low.toFixed(dec), color: "text-white" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              <div className={`font-mono text-xs ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CandlestickChart() {
  const candles = useMemo(() => generateCandleData(), []);
  const maxHigh = Math.max(...candles.map((c) => c.high));
  const minLow = Math.min(...candles.map((c) => c.low));
  const range = maxHigh - minLow;
  const maxVol = Math.max(...candles.map((c) => c.volume));

  const chartW = 800;
  const chartH = 320;
  const volH = 60;
  const candleW = chartW / candles.length;
  const bodyW = candleW * 0.6;

  const priceToY = (p: number) => chartH - ((p - minLow) / range) * (chartH - 20) - 10;

  return (
    <div className="w-full h-full flex flex-col" data-testid="chart-container">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/20">
        <div className="flex items-center gap-1 flex-wrap">
          {["1m", "5m", "15m", "1H", "4H", "1D", "1W"].map((tf) => (
            <button
              key={tf}
              className={`px-2 py-1 text-[10px] font-mono rounded ${tf === "15m" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
              data-testid={`button-tf-${tf}`}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 text-[10px] text-muted-foreground font-mono" data-testid="button-indicators">Indicators</button>
          <Button variant="ghost" size="icon" className="w-7 h-7" aria-label="Chart settings">
            <Settings className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        <svg viewBox={`0 0 ${chartW} ${chartH + volH}`} className="w-full h-full" preserveAspectRatio="none">
          {[0.25, 0.5, 0.75].map((pct) => (
            <line key={pct} x1="0" y1={chartH * pct} x2={chartW} y2={chartH * pct} stroke="hsl(250 15% 15%)" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}

          {candles.map((c) => {
            const x = c.index * candleW + candleW / 2;
            const isGreen = c.close >= c.open;
            const color = isGreen ? "#22c55e" : "#ef4444";
            const bodyTop = priceToY(Math.max(c.open, c.close));
            const bodyBottom = priceToY(Math.min(c.open, c.close));
            const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
            return (
              <g key={c.index}>
                <line x1={x} y1={priceToY(c.high)} x2={x} y2={priceToY(c.low)} stroke={color} strokeWidth="1" />
                <rect x={x - bodyW / 2} y={bodyTop} width={bodyW} height={bodyHeight} fill={color} rx="0.5" />
                <rect x={c.index * candleW + candleW * 0.15} y={chartH + volH - (c.volume / maxVol) * volH} width={candleW * 0.7} height={(c.volume / maxVol) * volH} fill={isGreen ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"} />
              </g>
            );
          })}

          <line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke="hsl(250 15% 15%)" strokeWidth="0.5" />

          {(() => {
            const last = candles[candles.length - 1];
            const y = priceToY(last.close);
            const isGreen = last.close >= last.open;
            return (
              <g>
                <line x1="0" y1={y} x2={chartW} y2={y} stroke={isGreen ? "#22c55e" : "#ef4444"} strokeWidth="0.5" strokeDasharray="3 3" />
                <rect x={chartW - 70} y={y - 8} width="70" height="16" fill={isGreen ? "#22c55e" : "#ef4444"} rx="2" />
                <text x={chartW - 35} y={y + 4} textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace">{last.close.toFixed(5)}</text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

function OrderBook({ markPrice }: { markPrice: number | null }) {
  const mid = markPrice ?? 0.04823;
  const { asks, bids } = useMemo(() => generateOrderBook(mid), [mid]);
  const maxTotal = Math.max(asks[asks.length - 1]?.total || 1, bids[bids.length - 1]?.total || 1);
  const dec = mid < 0.001 ? 8 : mid < 1 ? 5 : 4;

  return (
    <div className="flex flex-col h-full" data-testid="orderbook">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/20">
        <span className="text-xs font-semibold text-white">Order Book</span>
        <div className="flex gap-1">
          {["both", "bids", "asks"].map((mode) => (
            <button key={mode} className={`w-5 h-5 rounded flex items-center justify-center ${mode === "both" ? "bg-primary/20" : ""}`} data-testid={`button-ob-${mode}`}>
              {mode === "both" && <div className="flex flex-col gap-0.5"><div className="w-3 h-1 bg-red-400 rounded-sm" /><div className="w-3 h-1 bg-green-400 rounded-sm" /></div>}
              {mode === "bids" && <div className="w-3 h-3 bg-green-400/30 rounded-sm" />}
              {mode === "asks" && <div className="w-3 h-3 bg-red-400/30 rounded-sm" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border/10">
        <span>Price(USDT)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden flex flex-col justify-end">
          {asks.map((a, i) => (
            <div key={`ask-${i}`} className="relative grid grid-cols-3 px-3 py-[2px] text-[11px] font-mono">
              <div className="absolute inset-y-0 right-0 bg-red-500/8" style={{ width: `${(a.total / maxTotal) * 100}%` }} />
              <span className="relative text-red-400">{a.price.toFixed(dec)}</span>
              <span className="relative text-right text-muted-foreground">{a.size.toLocaleString()}</span>
              <span className="relative text-right text-muted-foreground">{a.total.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="px-3 py-2 border-y border-border/20 flex items-center gap-2">
          <span className="font-mono text-base font-bold text-green-400" data-testid="text-spread-price">{mid.toFixed(dec)}</span>
          <span className="text-[10px] text-muted-foreground">${mid.toFixed(dec)}</span>
          <TrendingUp className="w-3 h-3 text-green-400" />
        </div>

        <div className="flex-1 overflow-hidden">
          {bids.map((b, i) => (
            <div key={`bid-${i}`} className="relative grid grid-cols-3 px-3 py-[2px] text-[11px] font-mono">
              <div className="absolute inset-y-0 right-0 bg-green-500/8" style={{ width: `${(b.total / maxTotal) * 100}%` }} />
              <span className="relative text-green-400">{b.price.toFixed(dec)}</span>
              <span className="relative text-right text-muted-foreground">{b.size.toLocaleString()}</span>
              <span className="relative text-right text-muted-foreground">{b.total.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentTrades({ markPrice }: { markPrice: number | null }) {
  const mid = markPrice ?? 0.04823;
  const trades = useMemo(() => generateRecentTrades(mid), [mid]);
  const dec = mid < 0.001 ? 8 : mid < 1 ? 5 : 4;

  return (
    <div className="flex flex-col h-full" data-testid="recent-trades">
      <div className="flex items-center px-3 py-2 border-b border-border/20">
        <span className="text-xs font-semibold text-white">Recent Trades</span>
      </div>
      <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border/10">
        <span>Price(USDT)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {trades.map((t, i) => (
          <div key={i} className="grid grid-cols-3 px-3 py-[2px] text-[11px] font-mono">
            <span className={t.side === "buy" ? "text-green-400" : "text-red-400"}>{t.price.toFixed(dec)}</span>
            <span className="text-right text-muted-foreground">{t.size.toLocaleString()}</span>
            <span className="text-right text-muted-foreground">{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderForm({
  markPrice,
  userBalance,
  openPosition,
  closePosition,
  hasOpenPos,
  onConnectWallet,
  address,
  txStatus,
  isSubmitting,
  maxLeverage,
  tradingFeeBps,
}: {
  markPrice: number | null;
  userBalance: number;
  openPosition: (isLong: boolean, collateral: number, leverage: number, tp: number, sl: number) => Promise<void>;
  closePosition: () => Promise<void>;
  hasOpenPos: boolean;
  onConnectWallet: () => void;
  address: string | null;
  txStatus: string | null;
  isSubmitting: boolean;
  maxLeverage: number;
  tradingFeeBps: number;
}) {
  const [side, setSide] = useState<"long" | "short">("long");
  const [orderType, setOrderType] = useState("market");
  const [leverage, setLeverage] = useState([5]);
  const [marginMode, setMarginMode] = useState("cross");
  const [price, setPrice] = useState(markPrice ? markPrice.toFixed(5) : "0.04823");
  const [collateral, setCollateral] = useState("");
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");

  useEffect(() => {
    if (markPrice && orderType === "market") setPrice(markPrice.toFixed(5));
  }, [markPrice, orderType]);

  const collateralNum = parseFloat(collateral) || 0;
  const positionSize = collateralNum * leverage[0];
  const fee = positionSize * (tradingFeeBps / 10000);
  const dec = markPrice && markPrice < 0.001 ? 8 : markPrice && markPrice < 1 ? 5 : 4;

  const handleSubmit = async () => {
    if (!address) { onConnectWallet(); return; }
    if (!CONTRACTS_DEPLOYED) return;
    await openPosition(side === "long", collateralNum, leverage[0], parseFloat(tp) || 0, parseFloat(sl) || 0);
  };

  return (
    <div className="flex flex-col h-full" data-testid="order-form">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
        <button onClick={() => setMarginMode("cross")} className={`text-[10px] font-semibold px-2 py-1 rounded ${marginMode === "cross" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`} data-testid="button-margin-cross">Cross</button>
        <button onClick={() => setMarginMode("isolated")} className={`text-[10px] font-semibold px-2 py-1 rounded ${marginMode === "isolated" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`} data-testid="button-margin-isolated">Isolated</button>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Leverage</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{leverage[0]}x</Badge>
        </div>
      </div>

      <div className="flex border-b border-border/20">
        <button onClick={() => setSide("long")} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${side === "long" ? "bg-green-500/10 text-green-400 border-b-2 border-green-400" : "text-muted-foreground"}`} data-testid="button-side-long">Long</button>
        <button onClick={() => setSide("short")} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${side === "short" ? "bg-red-500/10 text-red-400 border-b-2 border-red-400" : "text-muted-foreground"}`} data-testid="button-side-short">Short</button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <Select value={orderType} onValueChange={setOrderType}>
          <SelectTrigger className="h-8 text-xs bg-background/50" data-testid="select-order-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="limit">Limit</SelectItem>
            <SelectItem value="market">Market</SelectItem>
          </SelectContent>
        </Select>

        {orderType !== "market" && (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Price (USDT)</label>
            <div className="relative">
              <Input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="h-8 text-xs font-mono pr-16 bg-background/50" data-testid="input-price" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">USDT</span>
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Collateral (USDT)</label>
          <div className="relative">
            <Input type="text" placeholder="0.00" value={collateral} onChange={(e) => setCollateral(e.target.value)} className="h-8 text-xs font-mono pr-16 bg-background/50" data-testid="input-amount" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">USDT</span>
          </div>
        </div>

        <div className="flex gap-1">
          {[25, 50, 75, 100].map((pct) => (
            <button key={pct} onClick={() => setCollateral(((userBalance * pct) / 100).toFixed(2))} className="flex-1 py-1 text-[10px] font-mono text-muted-foreground bg-secondary/50 rounded hover-elevate" data-testid={`button-pct-${pct}`}>{pct}%</button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-muted-foreground">Leverage</label>
            <span className="text-[10px] font-mono text-white">{leverage[0]}x</span>
          </div>
          <Slider value={leverage} onValueChange={setLeverage} max={maxLeverage || 50} min={1} step={1} className="mb-1" data-testid="slider-leverage" />
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
            <span>1x</span>
            <span>{Math.floor((maxLeverage || 50) / 4)}x</span>
            <span>{Math.floor((maxLeverage || 50) / 2)}x</span>
            <span>{Math.floor(((maxLeverage || 50) * 3) / 4)}x</span>
            <span>{maxLeverage || 50}x</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Position Size</span>
            <span className="text-white font-mono">{positionSize > 0 ? `$${positionSize.toFixed(2)}` : "--"}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Fee ({tradingFeeBps / 100}%)</span>
            <span className="text-white font-mono">{fee > 0 ? `$${fee.toFixed(4)}` : "0.05%"}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">TP</label>
            <Input placeholder="--" value={tp} onChange={(e) => setTp(e.target.value)} className="h-7 text-[10px] font-mono bg-background/50" data-testid="input-tp" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground mb-1 block">SL</label>
            <Input placeholder="--" value={sl} onChange={(e) => setSl(e.target.value)} className="h-7 text-[10px] font-mono bg-background/50" data-testid="input-sl" />
          </div>
        </div>

        {txStatus && (
          <div className="text-[10px] px-2 py-1.5 rounded bg-primary/10 text-primary border border-primary/20">{txStatus}</div>
        )}

        <Button
          className={`w-full h-10 text-sm font-semibold ${side === "long" ? "bg-green-600 text-white no-default-hover-elevate no-default-active-elevate" : "bg-red-600 text-white no-default-hover-elevate no-default-active-elevate"}`}
          onClick={handleSubmit}
          disabled={isSubmitting || (!address ? false : !CONTRACTS_DEPLOYED)}
          data-testid="button-place-order"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : !address ? "Connect Wallet" : !CONTRACTS_DEPLOYED ? "Contracts Pending" : side === "long" ? "Open Long" : "Open Short"}
        </Button>

        <div className="pt-2 border-t border-border/20 space-y-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Vault Balance</span>
            <span className="text-white font-mono">{userBalance.toFixed(2)} USDT</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PositionsPanel({
  position,
  markPrice,
  onClose,
  onConnectWallet,
  address,
  txStatus,
  isSubmitting,
}: {
  position: OnChainPosition | null;
  markPrice: number | null;
  onClose: () => Promise<void>;
  onConnectWallet: () => void;
  address: string | null;
  txStatus: string | null;
  isSubmitting: boolean;
}) {
  const dec = markPrice && markPrice < 0.001 ? 8 : markPrice && markPrice < 1 ? 5 : 4;

  return (
    <div className="h-full flex flex-col bg-card/20" data-testid="positions-panel">
      <Tabs defaultValue="positions" className="flex flex-col h-full">
        <TabsList className="h-auto p-0 bg-transparent rounded-none border-b border-border/20 justify-start gap-0 w-full">
          {[
            { value: "positions", label: "Positions", count: position?.isOpen ? 1 : 0 },
            { value: "orders", label: "Open Orders", count: 0 },
            { value: "history", label: "Order History", count: 0 },
            { value: "trades", label: "Trade History", count: 0 },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 sm:px-4 py-2" data-testid={`tab-${tab.value}`}>
              {tab.label}
              {tab.count > 0 && <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1 rounded">{tab.count}</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="positions" className="flex-1 overflow-auto mt-0 p-0">
          {!address ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
              <Wallet className="w-8 h-8 mb-2 opacity-30" />
              <span className="text-xs mb-2">Connect wallet to view positions</span>
              <Button size="sm" className="text-xs h-7" onClick={onConnectWallet}>Connect</Button>
            </div>
          ) : !position?.isOpen ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
              <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
              <span className="text-xs">{CONTRACTS_DEPLOYED ? "No open positions" : "Contracts not deployed yet"}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="text-[10px] text-muted-foreground border-b border-border/10">
                    <th className="text-left px-3 py-2 font-medium">Symbol</th>
                    <th className="text-left px-2 py-2 font-medium">Size</th>
                    <th className="text-right px-2 py-2 font-medium">Entry Price</th>
                    <th className="text-right px-2 py-2 font-medium">Mark Price</th>
                    <th className="text-right px-2 py-2 font-medium">PnL(USDT)</th>
                    <th className="text-right px-2 py-2 font-medium">Margin</th>
                    <th className="text-right px-2 py-2 font-medium">Liq. Price</th>
                    <th className="text-right px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/5 text-[11px]" data-testid="row-position-0">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">FLAP/USDT</span>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{Math.round(position.size / position.collateral)}x</Badge>
                      </div>
                      <span className={position.isLong ? "text-green-400 text-[10px]" : "text-red-400 text-[10px]"}>{position.isLong ? "Long" : "Short"}</span>
                    </td>
                    <td className="px-2 py-2.5 font-mono text-white">${position.size.toFixed(2)}</td>
                    <td className="text-right px-2 py-2.5 font-mono text-muted-foreground">{position.entryPrice.toFixed(dec)}</td>
                    <td className="text-right px-2 py-2.5 font-mono text-white">{(markPrice ?? 0).toFixed(dec)}</td>
                    <td className="text-right px-2 py-2.5">
                      <div className={`font-mono ${position.unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {position.unrealizedPnl >= 0 ? "+" : ""}{position.unrealizedPnl.toFixed(2)}
                      </div>
                      <div className={`font-mono text-[10px] ${position.unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {position.collateral > 0 ? `${((position.unrealizedPnl / position.collateral) * 100).toFixed(2)}%` : "0%"}
                      </div>
                    </td>
                    <td className="text-right px-2 py-2.5 font-mono text-muted-foreground">{position.collateral.toFixed(2)}</td>
                    <td className="text-right px-2 py-2.5 font-mono text-yellow-400">{position.liquidationPrice.toFixed(dec)}</td>
                    <td className="text-right px-3 py-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2 border-red-500/30 text-red-400"
                        onClick={onClose}
                        disabled={isSubmitting}
                        data-testid="button-close-pos"
                      >
                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Close"}
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
              {txStatus && <div className="px-3 py-2 text-[10px] text-primary">{txStatus}</div>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="flex-1 mt-0 p-0">
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <Clock className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-xs">No open orders</span>
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 mt-0 p-0">
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <Clock className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-xs">No order history</span>
          </div>
        </TabsContent>

        <TabsContent value="trades" className="flex-1 mt-0 p-0">
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-xs">No trade history</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssetsPanel({
  userBalance,
  walletUsdtBalance,
  needsApproval,
  address,
  onConnectWallet,
  onDeposit,
  onWithdraw,
  txStatus,
  isSubmitting,
}: {
  userBalance: number;
  walletUsdtBalance: number;
  needsApproval: boolean;
  address: string | null;
  onConnectWallet: () => void;
  onDeposit: (amount: number) => Promise<void>;
  onWithdraw: (amount: number) => Promise<void>;
  txStatus: string | null;
  isSubmitting: boolean;
}) {
  const [amount, setAmount] = useState("");
  const amountNum = parseFloat(amount) || 0;

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border/20">
        <span className="text-xs font-semibold text-white">Assets</span>
      </div>

      {!address ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
          <Wallet className="w-8 h-8 mb-2 opacity-30" />
          <span className="text-xs text-center">Connect wallet to view assets</span>
          <Button size="sm" className="mt-3 text-xs h-7" onClick={onConnectWallet} data-testid="button-connect-assets">Connect</Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Wallet USDT</span>
              <span className="font-mono text-white">{walletUsdtBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Vault Balance</span>
              <span className="font-mono text-white">{userBalance.toFixed(2)}</span>
            </div>
          </div>

          {CONTRACTS_DEPLOYED && (
            <>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Amount (USDT)</label>
                <div className="relative">
                  <Input type="text" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 text-xs font-mono pr-16 bg-background/50" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">USDT</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => onDeposit(amountNum)}
                  disabled={isSubmitting || amountNum <= 0}
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ArrowDownToLine className="w-3 h-3 mr-1" />Deposit</>}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs border-border/30"
                  onClick={() => onWithdraw(amountNum)}
                  disabled={isSubmitting || amountNum <= 0 || amountNum > userBalance}
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ArrowUpFromLine className="w-3 h-3 mr-1" />Withdraw</>}
                </Button>
              </div>

              {needsApproval && (
                <div className="text-[10px] text-yellow-400 text-center">USDT approval required on first deposit</div>
              )}

              {txStatus && (
                <div className="text-[10px] px-2 py-1.5 rounded bg-primary/10 text-primary border border-primary/20">{txStatus}</div>
              )}
            </>
          )}

          {!CONTRACTS_DEPLOYED && (
            <div className="text-[10px] text-muted-foreground text-center pt-2">Contracts deploying soon</div>
          )}
        </div>
      )}
    </div>
  );
}

function MobileOrderBookDrawer({ show, onClose, markPrice }: { show: boolean; onClose: () => void; markPrice: number | null }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-sm font-semibold text-white">Order Book</span>
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></Button>
      </div>
      <div className="flex-1 overflow-hidden"><OrderBook markPrice={markPrice} /></div>
    </div>
  );
}

export default function Perps() {
  const { address, connect, pendingWallet, approvePendingWallet, rejectPendingWallet } = useWallet();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState(MOCK_PAIRS[0]);
  const [mobileTab, setMobileTab] = useState<"chart" | "orderbook" | "trades">("chart");
  const [showMobileOB, setShowMobileOB] = useState(false);
  const [rightTab, setRightTab] = useState<"orderbook" | "trades">("orderbook");

  const [markPrice, setMarkPrice] = useState<number | null>(null);
  const [fundingRate, setFundingRate] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [walletUsdtBalance, setWalletUsdtBalance] = useState(0);
  const [needsApproval, setNeedsApproval] = useState(true);
  const [position, setPosition] = useState<OnChainPosition | null>(null);
  const [maxLeverage, setMaxLeverage] = useState(50);
  const [tradingFeeBps, setTradingFeeBps] = useState(5);

  const [tradeTxStatus, setTradeTxStatus] = useState<string | null>(null);
  const [balanceTxStatus, setBalanceTxStatus] = useState<string | null>(null);
  const [isTradeSubmitting, setIsTradeSubmitting] = useState(false);
  const [isBalanceSubmitting, setIsBalanceSubmitting] = useState(false);

  const loadMarketData = useCallback(async () => {
    if (!CONTRACTS_DEPLOYED) {
      const dexPrice = await fetchDexScreenerPrice();
      if (dexPrice) setMarkPrice(dexPrice);
      return;
    }
    try {
      const provider = getReadProvider();
      const oracle = new ethers.Contract(FFX_CONTRACTS.ORACLE, ORACLE_ABI, provider);
      const funding = new ethers.Contract(FFX_CONTRACTS.FUNDING, FUNDING_ABI, provider);
      const perps = new ethers.Contract(FFX_CONTRACTS.PERPS, PERPS_ABI, provider);

      const [markRaw, fundingRaw, maxLevRaw, feeBpsRaw] = await Promise.allSettled([
        oracle.getMarkPrice(),
        funding.getCurrentFundingRate(),
        perps.maxLeverage(),
        perps.tradingFeeBps(),
      ]);

      if (markRaw.status === "fulfilled") setMarkPrice(fmt18(markRaw.value));
      if (fundingRaw.status === "fulfilled") setFundingRate(Number(fundingRaw.value));
      if (maxLevRaw.status === "fulfilled") setMaxLeverage(Number(maxLevRaw.value));
      if (feeBpsRaw.status === "fulfilled") setTradingFeeBps(Number(feeBpsRaw.value));
    } catch {}
  }, []);

  const loadUserData = useCallback(async () => {
    if (!address) { setUserBalance(0); setWalletUsdtBalance(0); setPosition(null); return; }
    if (!CONTRACTS_DEPLOYED) {
      try {
        const provider = getReadProvider();
        const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
        const bal = await usdt.balanceOf(address);
        setWalletUsdtBalance(fmt18(bal));
      } catch {}
      return;
    }
    try {
      const provider = getReadProvider();
      const vault = new ethers.Contract(FFX_CONTRACTS.VAULT, VAULT_ABI, provider);
      const perps = new ethers.Contract(FFX_CONTRACTS.PERPS, PERPS_ABI, provider);
      const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);

      const [vaultBal, usdtBal, allowance, posRaw, pnlRaw] = await Promise.allSettled([
        vault.traderBalances(address),
        usdt.balanceOf(address),
        usdt.allowance(address, FFX_CONTRACTS.VAULT),
        perps.positions(address),
        perps.getUnrealizedPnL(address),
      ]);

      if (vaultBal.status === "fulfilled") setUserBalance(fmt18(vaultBal.value));
      if (usdtBal.status === "fulfilled") setWalletUsdtBalance(fmt18(usdtBal.value));
      if (allowance.status === "fulfilled") setNeedsApproval(allowance.value === 0n);
      if (posRaw.status === "fulfilled" && posRaw.value.isOpen) {
        const p = posRaw.value;
        setPosition({
          isOpen: true,
          isLong: p.isLong,
          collateral: fmt18(p.collateral),
          size: fmt18(p.size),
          entryPrice: fmt18(p.entryPrice),
          liquidationPrice: fmt18(p.liquidationPrice),
          takeProfitPrice: fmt18(p.takeProfitPrice),
          stopLossPrice: fmt18(p.stopLossPrice),
          unrealizedPnl: pnlRaw.status === "fulfilled" ? Number(ethers.formatEther(pnlRaw.value)) : 0,
        });
      } else {
        setPosition(null);
      }
    } catch {}
  }, [address]);

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 30000);
    return () => clearInterval(interval);
  }, [loadMarketData]);

  useEffect(() => {
    loadUserData();
    const interval = setInterval(loadUserData, 15000);
    return () => clearInterval(interval);
  }, [loadUserData]);

  const handleOpenPosition = useCallback(async (isLong: boolean, collateral: number, leverage: number, tp: number, sl: number) => {
    if (!CONTRACTS_DEPLOYED || !address) return;
    setIsTradeSubmitting(true);
    try {
      const signer = await getSigner();
      const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
      const vault = new ethers.Contract(FFX_CONTRACTS.VAULT, VAULT_ABI, signer);
      const perps = new ethers.Contract(FFX_CONTRACTS.PERPS, PERPS_ABI, signer);

      if (collateral > userBalance) {
        setTradeTxStatus("Insufficient vault balance. Please deposit first.");
        setTimeout(() => setTradeTxStatus(null), 5000);
        return;
      }

      const collateralWei = to18(collateral);
      const tpWei = tp > 0 ? to18(tp) : 0n;
      const slWei = sl > 0 ? to18(sl) : 0n;

      setTradeTxStatus("Simulating trade...");
      try {
        await perps.openPosition.staticCall(isLong, collateralWei, BigInt(leverage), tpWei, slWei);
      } catch (simErr: any) {
        const reason = simErr.reason || simErr.shortMessage || simErr.message || "";
        setTradeTxStatus(`Trade will fail — ${reason.slice(0, 80)}`);
        setTimeout(() => setTradeTxStatus(null), 6000);
        return;
      }

      setTradeTxStatus("Confirm in your wallet...");
      const tx = await perps.openPosition(isLong, collateralWei, BigInt(leverage), tpWei, slWei);
      setTradeTxStatus("Waiting for confirmation...");
      await tx.wait();
      setTradeTxStatus("Position opened!");
      await loadUserData();
      setTimeout(() => setTradeTxStatus(null), 4000);
    } catch (e: any) {
      const msg = e.reason || e.shortMessage || e.message || "Transaction failed";
      setTradeTxStatus(msg.includes("user rejected") ? "Transaction rejected" : msg.slice(0, 80));
      setTimeout(() => setTradeTxStatus(null), 5000);
    } finally {
      setIsTradeSubmitting(false);
    }
  }, [address, userBalance, loadUserData]);

  const handleClosePosition = useCallback(async () => {
    if (!CONTRACTS_DEPLOYED || !address) return;
    setIsTradeSubmitting(true);
    try {
      const signer = await getSigner();
      const perps = new ethers.Contract(FFX_CONTRACTS.PERPS, PERPS_ABI, signer);
      setTradeTxStatus("Confirm close in your wallet...");
      const tx = await perps.closePosition();
      setTradeTxStatus("Waiting for confirmation...");
      await tx.wait();
      setTradeTxStatus("Position closed!");
      await loadUserData();
      setTimeout(() => setTradeTxStatus(null), 4000);
    } catch (e: any) {
      const msg = e.reason || e.shortMessage || e.message || "Transaction failed";
      setTradeTxStatus(msg.includes("user rejected") ? "Transaction rejected" : msg.slice(0, 80));
      setTimeout(() => setTradeTxStatus(null), 5000);
    } finally {
      setIsTradeSubmitting(false);
    }
  }, [address, loadUserData]);

  const handleDeposit = useCallback(async (amount: number) => {
    if (!CONTRACTS_DEPLOYED || !address || amount <= 0) return;
    setIsBalanceSubmitting(true);
    try {
      const signer = await getSigner();
      const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
      const vault = new ethers.Contract(FFX_CONTRACTS.VAULT, VAULT_ABI, signer);
      const amountWei = to18(amount);

      const allowance = await usdt.allowance(address, FFX_CONTRACTS.VAULT);
      if (allowance < amountWei) {
        setBalanceTxStatus("Approving USDT...");
        const approveTx = await usdt.approve(FFX_CONTRACTS.VAULT, ethers.MaxUint256);
        await approveTx.wait();
        setNeedsApproval(false);
      }

      setBalanceTxStatus("Confirm deposit in your wallet...");
      const tx = await vault.traderDeposit(amountWei);
      setBalanceTxStatus("Waiting for confirmation...");
      await tx.wait();
      setBalanceTxStatus("Deposited!");
      await loadUserData();
      setTimeout(() => setBalanceTxStatus(null), 3000);
    } catch (e: any) {
      const msg = e.reason || e.shortMessage || e.message || "Deposit failed";
      setBalanceTxStatus(msg.includes("user rejected") ? "Transaction rejected" : msg.slice(0, 80));
      setTimeout(() => setBalanceTxStatus(null), 5000);
    } finally {
      setIsBalanceSubmitting(false);
    }
  }, [address, loadUserData]);

  const handleWithdraw = useCallback(async (amount: number) => {
    if (!CONTRACTS_DEPLOYED || !address || amount <= 0 || amount > userBalance) return;
    setIsBalanceSubmitting(true);
    try {
      const signer = await getSigner();
      const vault = new ethers.Contract(FFX_CONTRACTS.VAULT, VAULT_ABI, signer);
      const amountWei = to18(amount);
      setBalanceTxStatus("Confirm withdrawal in your wallet...");
      const tx = await vault.traderWithdraw(amountWei);
      setBalanceTxStatus("Waiting for confirmation...");
      await tx.wait();
      setBalanceTxStatus("Withdrawn!");
      await loadUserData();
      setTimeout(() => setBalanceTxStatus(null), 3000);
    } catch (e: any) {
      const msg = e.reason || e.shortMessage || e.message || "Withdrawal failed";
      setBalanceTxStatus(msg.includes("user rejected") ? "Transaction rejected" : msg.slice(0, 80));
      setTimeout(() => setBalanceTxStatus(null), 5000);
    } finally {
      setIsBalanceSubmitting(false);
    }
  }, [address, userBalance, loadUserData]);

  const openWalletModal = useCallback(() => setIsWalletModalOpen(true), []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" data-testid="page-perps">
      <TopBar
        selectedPair={selectedPair}
        onPairSelect={setSelectedPair}
        markPrice={markPrice}
        fundingRate={fundingRate}
        onConnectWallet={openWalletModal}
        address={address}
      />

      <div className="hidden lg:grid flex-1 overflow-hidden" style={{ gridTemplateColumns: "1fr 280px 280px", gridTemplateRows: "1fr 220px" }}>
        <div className="border-r border-border/20 border-b border-border/20 overflow-hidden">
          <CandlestickChart />
        </div>

        <div className="border-r border-border/20 border-b border-border/20 overflow-hidden">
          <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as "orderbook" | "trades")} className="flex flex-col h-full">
            <TabsList className="h-auto p-0 bg-transparent rounded-none border-b border-border/20 justify-start gap-0 w-full">
              <TabsTrigger value="orderbook" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2">Order Book</TabsTrigger>
              <TabsTrigger value="trades" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2">Trades</TabsTrigger>
            </TabsList>
            <TabsContent value="orderbook" className="flex-1 overflow-hidden mt-0 p-0"><OrderBook markPrice={markPrice} /></TabsContent>
            <TabsContent value="trades" className="flex-1 overflow-hidden mt-0 p-0"><RecentTrades markPrice={markPrice} /></TabsContent>
          </Tabs>
        </div>

        <div className="border-b border-border/20 overflow-hidden row-span-1">
          <OrderForm
            markPrice={markPrice}
            userBalance={userBalance}
            openPosition={handleOpenPosition}
            closePosition={handleClosePosition}
            hasOpenPos={position?.isOpen ?? false}
            onConnectWallet={openWalletModal}
            address={address}
            txStatus={tradeTxStatus}
            isSubmitting={isTradeSubmitting}
            maxLeverage={maxLeverage}
            tradingFeeBps={tradingFeeBps}
          />
        </div>

        <div className="col-span-2 overflow-hidden">
          <PositionsPanel
            position={position}
            markPrice={markPrice}
            onClose={handleClosePosition}
            onConnectWallet={openWalletModal}
            address={address}
            txStatus={tradeTxStatus}
            isSubmitting={isTradeSubmitting}
          />
        </div>

        <div className="overflow-hidden border-l border-border/20">
          <AssetsPanel
            userBalance={userBalance}
            walletUsdtBalance={walletUsdtBalance}
            needsApproval={needsApproval}
            address={address}
            onConnectWallet={openWalletModal}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            txStatus={balanceTxStatus}
            isSubmitting={isBalanceSubmitting}
          />
        </div>
      </div>

      <div className="hidden md:grid lg:hidden flex-1 overflow-hidden" style={{ gridTemplateColumns: "1fr 260px", gridTemplateRows: "1fr 200px" }}>
        <div className="border-r border-border/20 border-b border-border/20 overflow-hidden">
          <CandlestickChart />
        </div>

        <div className="border-b border-border/20 overflow-hidden">
          <Tabs defaultValue="order" className="flex flex-col h-full">
            <TabsList className="h-auto p-0 bg-transparent rounded-none border-b border-border/20 justify-start gap-0 w-full">
              <TabsTrigger value="order" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2">Order</TabsTrigger>
              <TabsTrigger value="book" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2">Book</TabsTrigger>
              <TabsTrigger value="trades" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs px-3 py-2">Trades</TabsTrigger>
            </TabsList>
            <TabsContent value="order" className="flex-1 overflow-hidden mt-0 p-0">
              <OrderForm markPrice={markPrice} userBalance={userBalance} openPosition={handleOpenPosition} closePosition={handleClosePosition} hasOpenPos={position?.isOpen ?? false} onConnectWallet={openWalletModal} address={address} txStatus={tradeTxStatus} isSubmitting={isTradeSubmitting} maxLeverage={maxLeverage} tradingFeeBps={tradingFeeBps} />
            </TabsContent>
            <TabsContent value="book" className="flex-1 overflow-hidden mt-0 p-0"><OrderBook markPrice={markPrice} /></TabsContent>
            <TabsContent value="trades" className="flex-1 overflow-hidden mt-0 p-0"><RecentTrades markPrice={markPrice} /></TabsContent>
          </Tabs>
        </div>

        <div className="col-span-2 overflow-hidden">
          <PositionsPanel position={position} markPrice={markPrice} onClose={handleClosePosition} onConnectWallet={openWalletModal} address={address} txStatus={tradeTxStatus} isSubmitting={isTradeSubmitting} />
        </div>
      </div>

      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        <div className="flex border-b border-border/20">
          {(["chart", "orderbook", "trades"] as const).map((tab) => (
            <button key={tab} onClick={() => setMobileTab(tab)} className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${mobileTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`} data-testid={`button-mobile-tab-${tab}`}>
              {tab === "chart" ? "Chart" : tab === "orderbook" ? "Book" : "Trades"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {mobileTab === "chart" && <CandlestickChart />}
          {mobileTab === "orderbook" && <OrderBook markPrice={markPrice} />}
          {mobileTab === "trades" && <RecentTrades markPrice={markPrice} />}
        </div>

        <div className="border-t border-border/20 max-h-[45vh] overflow-hidden">
          <OrderForm markPrice={markPrice} userBalance={userBalance} openPosition={handleOpenPosition} closePosition={handleClosePosition} hasOpenPos={position?.isOpen ?? false} onConnectWallet={openWalletModal} address={address} txStatus={tradeTxStatus} isSubmitting={isTradeSubmitting} maxLeverage={maxLeverage} tradingFeeBps={tradingFeeBps} />
        </div>
      </div>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        pendingWallet={pendingWallet}
        onApprove={approvePendingWallet}
        onReject={rejectPendingWallet}
      />
    </div>
  );
}
