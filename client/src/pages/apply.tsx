import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@assets/image_1772106618983.png";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  FileCheck,
  Rocket,
  Wallet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  Copy,
  Info,
  Zap,
  Lock,
  Bot,
  BarChart3,
  Layers,
  ChevronRight,
  Loader2,
  Search,
  TrendingUp,
  Droplets,
} from "lucide-react";
import { SiTelegram, SiX, SiGithub } from "react-icons/si";

const steps = [
  { id: 1, label: "Token Info",   icon: FileCheck },
  { id: 2, label: "Pair Config",  icon: BarChart3 },
  { id: 3, label: "Team Verify",  icon: Shield },
  { id: 4, label: "Confirm & Pay",icon: Wallet },
];

const deployedContracts = [
  { name: "Vault", desc: "Holds trader collateral (USDT/BNB)", icon: Lock },
  { name: "Oracle", desc: "TWAP price feed from liquidity pool", icon: Globe },
  { name: "Perps", desc: "Core trading engine for positions", icon: BarChart3 },
  { name: "Funding", desc: "Funding rate calculations", icon: Zap },
  { name: "Liquidation", desc: "Position health monitoring", icon: AlertCircle },
  { name: "Insurance", desc: "Backstop fund for bad debt", icon: Shield },
];

const TIER_META: Record<string, { emoji: string; label: string; color: string; border: string; bg: string }> = {
  SEED:   { emoji: "🌱", label: "SEED",   color: "text-green-400",  border: "border-green-500/30",  bg: "bg-green-500/10" },
  LAUNCH: { emoji: "🚀", label: "LAUNCH", color: "text-blue-400",   border: "border-blue-500/30",   bg: "bg-blue-500/10" },
  RISE:   { emoji: "🔥", label: "RISE",   color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10" },
  PRIME:  { emoji: "💎", label: "PRIME",  color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  ELITE:  { emoji: "👑", label: "ELITE",  color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10" },
};

const TIER_PARAMS: Record<string, { maxLev: number; maxPos: number; maxOI: number; spread: number; vault: number; insurance: number; gas: number }> = {
  SEED:   { maxLev: 3,  maxPos: 35,    maxOI: 1500,   spread: 0.25, vault: 1500,   insurance: 50,    gas: 6  },
  LAUNCH: { maxLev: 5,  maxPos: 100,   maxOI: 3000,   spread: 0.3,  vault: 3000,   insurance: 100,   gas: 6  },
  RISE:   { maxLev: 10, maxPos: 100,   maxOI: 2500,   spread: 0.3,  vault: 2500,   insurance: 300,   gas: 8  },
  PRIME:  { maxLev: 10, maxPos: 100,   maxOI: 6000,   spread: 0.2,  vault: 6000,   insurance: 800,   gas: 10 },
  ELITE:  { maxLev: 20, maxPos: 100,   maxOI: 15000,  spread: 0.1,  vault: 15000,  insurance: 2000,  gas: 15 },
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

interface TokenResult {
  found: boolean;
  error?: string;
  address?: string;
  name?: string;
  symbol?: string;
  logo?: string;
  priceUsd?: number;
  mcap?: number;
  liquidity?: number;
  volume24h?: number;
  checks?: {
    flapOrigin: boolean;
    pancakeV2: boolean;
    hasName: boolean;
    hasLogo: boolean;
    fixedSupply: boolean;
    marketCapOk: boolean;
    liquidityOk: boolean;
  };
  allPassed?: boolean;
  tier?: string | null;
  tierData?: { vault: number; insurance: number; gas: number; maxLev: number; maxPos: number; maxOI: number } | null;
}

const DEV_WALLET = "0x3f99b2a75bd2ad2091a793a682afdec07e2947f8";

export default function Apply() {
  const [currentStep, setCurrentStep] = useState(1);
  const [caInput, setCaInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<TokenResult | null>(null);
  const [checkError, setCheckError] = useState("");
  const [connectedWallet, setConnectedWallet] = useState<string>("");
  const [walletVerifying, setWalletVerifying] = useState(false);
  const [walletVerified, setWalletVerified] = useState<boolean | null>(null);
  const [walletVerifyMsg, setWalletVerifyMsg] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDevMode = connectedWallet.toLowerCase() === DEV_WALLET;

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts[0]) setConnectedWallet(accounts[0].toLowerCase());
    });
    const handleChange = (accounts: string[]) => {
      setConnectedWallet(accounts[0]?.toLowerCase() || "");
    };
    eth.on("accountsChanged", handleChange);
    return () => eth.removeListener("accountsChanged", handleChange);
  }, []);

  async function connectWallet() {
    const eth = (window as any).ethereum;
    if (!eth) return alert("MetaMask not detected. Please install MetaMask.");
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      if (accounts[0]) setConnectedWallet(accounts[0].toLowerCase());
    } catch {}
  }

  const [formData, setFormData] = useState({
    tokenAddress: "",
    tokenName: "",
    tokenSymbol: "",
    website: "",
    twitter: "",
    telegram: "",
    github: "",
    contactEmail: "",
    devWallet: "",
    teamDescription: "",
    pairType: "usdt",
    maxLeverage: "5",
    agreedTerms: false,
  });

  const updateField = (field: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (isDevMode) return true;
    switch (currentStep) {
      case 1: return result?.allPassed === true;
      case 2: return !!formData.pairType;
      case 3: return walletVerified === true && formData.devWallet.length > 10 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail);
      case 4: return formData.agreedTerms;
      default: return false;
    }
  };

  async function verifyWallet() {
    const wallet = formData.devWallet.trim().toLowerCase();
    const ca = formData.tokenAddress.trim().toLowerCase();
    if (!/^0x[0-9a-f]{40}$/.test(wallet)) {
      setWalletVerifyMsg("Invalid wallet address format.");
      setWalletVerified(false);
      return;
    }
    setWalletVerifying(true);
    setWalletVerified(null);
    setWalletVerifyMsg("");
    try {
      const res = await fetch(`/api/verify-wallet?ca=${encodeURIComponent(ca)}&wallet=${encodeURIComponent(wallet)}`);
      const data = await res.json();
      setWalletVerified(data.eligible);
      setWalletVerifyMsg(data.message || "");
    } catch {
      setWalletVerified(false);
      setWalletVerifyMsg("Network error — please try again.");
    } finally {
      setWalletVerifying(false);
    }
  }

  async function verifyToken(address: string) {
    setChecking(true);
    setResult(null);
    setCheckError("");
    try {
      const res = await fetch(`/api/verify-token?ca=${encodeURIComponent(address)}`);
      const data: TokenResult = await res.json();
      setResult(data);
      if (data.found && data.allPassed) {
        updateField("tokenAddress", address);
        updateField("tokenName", data.name || "");
        updateField("tokenSymbol", data.symbol || "");
        if (data.tier && TIER_PARAMS[data.tier]) {
          updateField("maxLeverage", String(TIER_PARAMS[data.tier].maxLev));
        }
      }
    } catch {
      setCheckError("Network error — please try again.");
    } finally {
      setChecking(false);
    }
  }

  const handleCaChange = (val: string) => {
    setCaInput(val);
    setResult(null);
    setCheckError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const cleaned = val.trim().toLowerCase();
    if (/^0x[0-9a-f]{40}$/.test(cleaned)) {
      debounceRef.current = setTimeout(() => verifyToken(cleaned), 400);
    }
  };

  const checkItems = result?.checks
    ? [
        { key: "flapOrigin",  label: "Launched on flap.sh",       sub: "Flap.sh Token Detected" },
        { key: "pancakeV2",   label: "PancakeSwap V2 Pool",        sub: "Pair v2 Detected" },
        { key: "hasName",     label: "Name & Ticker",              sub: `${result.name || "—"} (${result.symbol || "—"})` },
        { key: "hasLogo",     label: "Token Logo",                 sub: "Logo Detected" },
        { key: "fixedSupply", label: "Fixed 1B Supply",            sub: "Enforced by flap.sh protocol" },
        { key: "marketCapOk", label: "Market Cap ≥ $25,000",       sub: result.mcap ? fmt(result.mcap) : "—" },
        { key: "liquidityOk", label: "Pool Liquidity ≥ $5,000",    sub: result.liquidity ? fmt(result.liquidity) : "—" },
      ]
    : [];

  const tier = result?.tier;
  const tierMeta = tier ? TIER_META[tier] : null;
  const tierParams = tier ? TIER_PARAMS[tier] : null;

  return (
    <div className="min-h-screen bg-background" data-testid="page-apply">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="w-8 h-8">
              <Link href="/"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <img src={logoImg} alt="Flap Futures" className="w-7 h-7" />
              <span className="font-heading font-bold text-sm text-white">FLAP FUTURES</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {isDevMode && (
              <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30 text-[10px] font-mono px-2 py-0.5">
                DEV MODE
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={connectWallet}
              className={`text-xs ${isDevMode ? "border-lime-500/30 text-lime-400" : "border-primary/30 text-primary"}`}
            >
              <Wallet className="w-3.5 h-3.5 mr-1.5" />
              {connectedWallet
                ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}`
                : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-10">
          <Badge variant="secondary" className="mb-4 text-xs font-mono">Developer Application</Badge>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3 text-white">
            List Your Token on <span className="text-gradient">Flap Futures</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Open a perpetual trading market for your BSC token. We deploy 6 smart contracts + 1 bot wallet automatically.
          </p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto px-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap ${
                  step.id === currentStep
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : step.id < currentStep
                      ? "text-green-400 cursor-pointer"
                      : "text-muted-foreground cursor-default"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                  step.id === currentStep ? "bg-primary text-white"
                    : step.id < currentStep ? "bg-green-500/20 text-green-400"
                      : "bg-secondary text-muted-foreground"
                }`}>
                  {step.id < currentStep ? <CheckCircle className="w-3.5 h-3.5" /> : step.id}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className={`w-4 h-4 mx-1 shrink-0 ${i < currentStep - 1 ? "text-green-400" : "text-muted-foreground/30"}`} />
              )}
            </div>
          ))}
        </div>

        <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>

          {/* ── STEP 1: Token Info ── */}
          {currentStep === 1 && (
            <Card className="bg-card/50 border-border/30 p-6 sm:p-8">
              <h2 className="font-heading font-semibold text-lg sm:text-xl text-white mb-1">Token Information</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Paste your BSC contract address — we auto-detect everything.
              </p>

              {/* CA Input */}
              <div className="relative mb-6">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {checking
                    ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    : <Search className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
                <Input
                  placeholder="0x... paste your token contract address"
                  value={caInput}
                  onChange={(e) => handleCaChange(e.target.value)}
                  className="pl-9 font-mono text-sm bg-secondary/50 border-border/30 h-12"
                  spellCheck={false}
                  autoComplete="off"
                />
                {checking && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-primary font-medium">
                    Checking...
                  </div>
                )}
              </div>

              {checkError && (
                <Card className="bg-red-500/10 border-red-500/30 p-3 mb-4 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{checkError}</p>
                </Card>
              )}

              {result && !result.found && (
                <Card className="bg-red-500/10 border-red-500/30 p-4 mb-4 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{result.error}</p>
                </Card>
              )}

              <AnimatePresence>
                {result?.found && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Token Card */}
                    <Card className="bg-secondary/30 border-border/20 p-4">
                      <div className="flex items-center gap-4">
                        {result.logo ? (
                          <img src={result.logo} alt={result.symbol} className="w-12 h-12 rounded-full shrink-0 bg-secondary" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-primary font-bold text-sm">{result.symbol?.slice(0, 2)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-base">{result.name}</span>
                            <span className="font-mono text-xs text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded">{result.symbol}</span>
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground/60 mt-0.5 truncate">{result.address}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-sm font-semibold text-white">${result.priceUsd?.toFixed(8)}</p>
                          <p className="text-[11px] text-muted-foreground">per token</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/20">
                        <div className="text-center">
                          <p className="text-[11px] text-muted-foreground mb-0.5">Market Cap</p>
                          <p className="font-mono text-sm font-semibold text-white">{result.mcap ? fmt(result.mcap) : "—"}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] text-muted-foreground mb-0.5">Liquidity</p>
                          <p className="font-mono text-sm font-semibold text-white">{result.liquidity ? fmt(result.liquidity) : "—"}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] text-muted-foreground mb-0.5">24h Volume</p>
                          <p className="font-mono text-sm font-semibold text-white">{result.volume24h ? fmt(result.volume24h) : "—"}</p>
                        </div>
                      </div>
                    </Card>

                    {/* Validation Checklist */}
                    <Card className="bg-secondary/30 border-border/20 p-4">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Qualification Checks</h4>
                      <div className="space-y-2.5">
                        {checkItems.map(({ key, label, sub }) => {
                          const passed = result.checks?.[key as keyof typeof result.checks];
                          return (
                            <div key={key} className="flex items-center gap-3">
                              {passed
                                ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                                : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                              }
                              <div className="flex-1 min-w-0">
                                <span className={`text-sm font-medium ${passed ? "text-white" : "text-muted-foreground"}`}>{label}</span>
                                <span className="text-[11px] text-muted-foreground ml-2">{sub}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Tier + Capital — only if all passed */}
                    {result.allPassed && tierMeta && tierParams && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        {/* Tier Badge */}
                        <Card className={`${tierMeta.bg} ${tierMeta.border} border p-4`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Assigned Tier</p>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{tierMeta.emoji}</span>
                                <span className={`font-heading font-bold text-xl ${tierMeta.color}`}>{tierMeta.label}</span>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="flex items-center gap-1.5 justify-end">
                                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Max {tierParams.maxLev}x leverage</span>
                              </div>
                              <div className="flex items-center gap-1.5 justify-end">
                                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">${tierParams.maxPos} max position</span>
                              </div>
                              <div className="flex items-center gap-1.5 justify-end">
                                <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">${tierParams.maxOI.toLocaleString()} max OI</span>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Capital Required */}
                        <Card className="bg-primary/5 border-primary/20 p-4">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Capital Required to Go Live</h4>
                          <div className="space-y-3">
                            {/* Vault Funding Bar */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  <Lock className="w-3.5 h-3.5" /> Vault Funding
                                </span>
                                <span className="font-mono text-white font-medium">${tierParams.vault.toLocaleString()} USDT</span>
                              </div>
                              <div className="relative h-2 bg-secondary/60 rounded-full flex overflow-hidden">
                                <div className="h-full bg-red-500/70"    style={{ width: "30%" }} />
                                <div className="h-full bg-yellow-500/70" style={{ width: "20%" }} />
                                <div className="h-full bg-blue-500/70"   style={{ width: "25%" }} />
                                <div className="h-full bg-primary/80"    style={{ width: "25%" }} />
                              </div>
                              <div className="grid grid-cols-4 text-[9px] gap-0.5">
                                <div>
                                  <p className="text-red-400 font-bold uppercase">Low</p>
                                  <p className="text-muted-foreground font-mono">${Math.round(tierParams.vault * 0.3).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-yellow-400 font-bold uppercase">Medium</p>
                                  <p className="text-muted-foreground font-mono">${Math.round(tierParams.vault * 0.5).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-blue-400 font-bold uppercase">Normal</p>
                                  <p className="text-muted-foreground font-mono">${Math.round(tierParams.vault * 0.75).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-primary font-bold uppercase">Recommended</p>
                                  <p className="text-muted-foreground font-mono">${tierParams.vault.toLocaleString()}</p>
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                                Min to open market: <span className="text-red-400 font-mono font-semibold">${Math.round(tierParams.vault * 0.3).toLocaleString()} USDT</span> (30%). Community can co-fund the vault and earn trading fees.
                              </p>
                            </div>

                            <div className="border-t border-border/20 pt-2 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  <Shield className="w-3.5 h-3.5" /> Insurance Fund
                                </span>
                                <span className="font-mono text-white font-medium">${tierParams.insurance.toLocaleString()} USDT</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  <Zap className="w-3.5 h-3.5" /> Gas (BNB transactions)
                                </span>
                                <span className="font-mono text-white font-medium">~${tierParams.gas} BNB</span>
                              </div>
                            </div>

                            <div className="border-t border-border/20 pt-2 flex justify-between">
                              <span className="text-sm font-semibold text-white">Total (recommended)</span>
                              <span className="font-mono text-base font-bold text-primary">
                                ~${(tierParams.vault + tierParams.insurance + tierParams.gas).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )}

                    {/* Failed notice */}
                    {!result.allPassed && (
                      <Card className="bg-red-500/5 border-red-500/20 p-4 flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-400">Token does not qualify</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Fix the failed checks above before applying. All 7 checks must pass.
                          </p>
                        </div>
                      </Card>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!result && !checking && !checkError && (
                <div className="text-center py-10 text-muted-foreground/40">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Paste a contract address to begin verification</p>
                  <p className="text-xs mt-1 opacity-60">Only flap.sh tokens (ending in 7777 or 8888) qualify</p>
                </div>
              )}

              {isDevMode && (
                <div className="mt-4 flex items-center gap-2 bg-lime-500/10 border border-lime-500/20 rounded-lg px-4 py-2.5">
                  <Zap className="w-4 h-4 text-lime-400 shrink-0" />
                  <p className="text-xs text-lime-400 font-mono">DEV MODE — all step validations bypassed</p>
                </div>
              )}
            </Card>
          )}

          {/* ── STEP 2: Pair Config ── */}
          {currentStep === 2 && (
            <Card className="bg-card/50 border-border/30 p-6 sm:p-8">
              <h2 className="font-heading font-semibold text-lg sm:text-xl text-white mb-1">Pair Configuration</h2>
              <p className="text-sm text-muted-foreground mb-6">Configure your perpetual trading pair settings.</p>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-3 block">Trading Pair</label>
                  <Card className="bg-secondary/30 border-border/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <span className="text-green-400 font-mono font-bold text-xs">USDT</span>
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{formData.tokenSymbol || "TOKEN"} / USDT Perpetual</p>
                        <p className="text-xs text-muted-foreground">Collateral in USDT — BSC (BEP-20)</p>
                      </div>
                    </div>
                  </Card>
                </div>
                {/* Market Limits — 3 independent boxes */}
                {(() => {
                  const tp = result?.tier ? TIER_PARAMS[result.tier] : null;
                  return (
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="bg-secondary/30 border-border/20 p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Max Position</p>
                        <p className="font-mono text-lg font-bold text-white">{tp ? `$${tp.maxPos}` : "—"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">per trade</p>
                      </Card>
                      <Card className="bg-secondary/30 border-border/20 p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Max Total OI</p>
                        <p className="font-mono text-lg font-bold text-white">{tp ? `$${tp.maxOI.toLocaleString()}` : "—"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">open interest</p>
                      </Card>
                      <Card className="bg-secondary/30 border-border/20 p-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Spread</p>
                        <p className="font-mono text-lg font-bold text-white">{tp ? `${tp.spread}%` : "—"}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">entry/exit cost</p>
                      </Card>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-3 block">Features</label>
                  <div className="grid sm:grid-cols-2 gap-3">

                    {/* 1. Blockchain Trading Engine */}
                    <Card className="bg-secondary/30 border-border/20 p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white mb-0.5">Blockchain Trading Engine</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">On-chain perpetuals on BSC. No custody, no order books. Pure smart contract execution.</p>
                      </div>
                    </Card>

                    {/* 2. Leverage levels */}
                    <Card className="bg-secondary/30 border-border/20 p-4">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">
                            Max Leverage
                            {result?.tier && TIER_PARAMS[result.tier]
                              ? ` — ${TIER_PARAMS[result.tier].maxLev}x`
                              : ""}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Available leverage multipliers</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          const presets: Record<string, number[]> = {
                            SEED:   [1, 2, 3],
                            LAUNCH: [1, 2, 3, 5],
                            RISE:   [1, 2, 3, 5, 10],
                            PRIME:  [1, 2, 3, 5, 10],
                            ELITE:  [5, 10, 15, 20],
                          };
                          const levels = result?.tier ? (presets[result.tier] ?? [1, 2, 3, 5]) : [1, 2, 3, 5];
                          const maxLev = levels[levels.length - 1];
                          return levels.map((lev) => (
                            <span
                              key={lev}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                lev === maxLev
                                  ? "bg-primary/20 border-primary/40 text-primary"
                                  : "bg-secondary/60 border-border/30 text-muted-foreground"
                              }`}
                            >
                              x{lev}
                            </span>
                          ));
                        })()}
                      </div>
                    </Card>

                    {/* 3. Admin Control Dashboard */}
                    <Card className="bg-secondary/30 border-border/20 p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white mb-0.5">Admin Control Dashboard</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Full market control panel. Pause trading, fund vault, configure spread, view analytics.</p>
                      </div>
                    </Card>

                    {/* 4. Bot Perpetual */}
                    <Card className="bg-secondary/30 border-border/20 p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white mb-0.5">Perpetual Bot</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">24/7 automated oracle price updates, TP/SL execution, and liquidation keeper.</p>
                      </div>
                    </Card>

                    {/* 5. Community Vault LP */}
                    <Card className="bg-secondary/30 border-border/20 p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Droplets className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white mb-0.5">Community Vault LP</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Your community can deposit USDT as liquidity and earn a share of all trading fees.</p>
                      </div>
                    </Card>

                    {/* 6. Auto-Liquidation Engine */}
                    <Card className="bg-secondary/30 border-border/20 p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white mb-0.5">Auto-Liquidation Engine</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Underwater positions auto-closed to protect vault solvency. Insurance fund as backstop.</p>
                      </div>
                    </Card>

                  </div>

                  {/* 7. AI Daily Report — outside grid, always full width */}
                  <Card className="bg-gradient-to-r from-primary/10 to-purple-900/20 border-primary/25 p-4 flex items-center gap-4 mt-3">
                    <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-white">AI Daily Report</p>
                        <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 rounded px-1.5 py-0.5 font-mono">Powered by Claude Anthropic</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Every 24h at UTC midnight — Claude AI analyzes your market's volume, P&L, long/short ratio, and vault health.
                        Delivers a strategy report with actionable recommendations to your admin dashboard.
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          )}

          {/* ── STEP 3: Team Verify ── */}
          {currentStep === 3 && (
            <Card className="bg-card/50 border-border/30 p-6 sm:p-8">
              <h2 className="font-heading font-semibold text-lg sm:text-xl text-white mb-1">Team Verification</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter the developer wallet address for this token. We verify eligibility on-chain.
              </p>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Developer Wallet Address (BSC) *</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="0x..."
                      value={formData.devWallet}
                      onChange={(e) => {
                        updateField("devWallet", e.target.value);
                        setWalletVerified(null);
                        setWalletVerifyMsg("");
                      }}
                      className="font-mono text-sm bg-secondary/50 border-border/30 flex-1"
                      spellCheck={false}
                    />
                    <Button
                      onClick={verifyWallet}
                      disabled={walletVerifying || formData.devWallet.length < 10}
                      variant="outline"
                      className="border-primary/30 text-primary shrink-0"
                    >
                      {walletVerifying
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : "Verify"
                      }
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contact Email *</label>
                  <Input
                    type="email"
                    placeholder="you@gmail.com, you@yahoo.com, any email..."
                    value={formData.contactEmail}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
                    className="bg-secondary/50 border-border/30"
                  />
                </div>

                {/* Verification result */}
                {walletVerified === true && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-green-500/10 border-green-500/30 p-4 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-400">Wallet Verified</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{walletVerifyMsg}</p>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {walletVerified === false && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-red-500/10 border-red-500/30 p-4 flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-400">Not Eligible</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{walletVerifyMsg}</p>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {walletVerified === null && !walletVerifying && (
                  <Card className="bg-secondary/20 border-border/20 p-4 flex items-start gap-3">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Only the token deployer or a top-10 holder wallet can open a market for this token.
                      Enter your wallet address and click Verify.
                    </p>
                  </Card>
                )}

                <Card className="bg-primary/5 border-primary/20 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">$100 USDT Verification Fee</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        In the final step, you will send <span className="text-white font-medium">$100 USDT</span> to the Master Contract.
                        This is held on-chain and forwarded to the platform upon approval, or returned if rejected.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          )}

          {/* ── STEP 4: Confirm & Pay ── */}
          {currentStep === 4 && (
            <Card className="bg-card/50 border-border/30 p-6 sm:p-8">
              <h2 className="font-heading font-semibold text-lg sm:text-xl text-white mb-1">Confirm & Pay Verification Fee</h2>
              <p className="text-sm text-muted-foreground mb-6">Review your application and send the verification token.</p>
              <div className="space-y-4 mb-6">
                <Card className="bg-secondary/30 border-border/20 p-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-3">Token Details</h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Contract</span>
                      <span className="font-mono text-white truncate max-w-[200px]">{formData.tokenAddress || "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Name</span>
                      <span className="text-white">{formData.tokenName || "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Symbol</span>
                      <span className="font-mono text-white">{formData.tokenSymbol || "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Pair</span>
                      <span className="font-mono text-white">{formData.tokenSymbol || "TOKEN"}/{formData.pairType === "usdt" ? "USDT" : "BNB"}</span>
                    </div>
                  </div>
                </Card>
                <Card className="bg-secondary/30 border-border/20 p-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-3">Team Info</h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Dev Wallet</span>
                      <span className="font-mono text-white truncate max-w-[200px]">{formData.devWallet || "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Email</span>
                      <span className="text-white">{formData.contactEmail || "—"}</span>
                    </div>
                  </div>
                </Card>
                <Card className="bg-primary/5 border-primary/20 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Verification Fee</h4>
                        <p className="text-xs text-muted-foreground">Pay $100 USDT (BEP-20)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-white">$100</p>
                      <p className="text-[10px] text-muted-foreground font-mono">USDT</p>
                    </div>
                  </div>
                  <div className="bg-secondary/30 rounded-md p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Send to Master Contract</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-white">0x7F...3a2B</span>
                        <Button variant="ghost" size="icon" className="w-6 h-6" aria-label="Copy">
                          <Copy className="w-3 h-3 text-primary" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreedTerms}
                      onChange={(e) => updateField("agreedTerms", e.target.checked)}
                      className="mt-1 rounded border-border accent-primary"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      I confirm that I am the owner or authorized team member of the token listed above.
                      I understand that $100 USDT will be sent as a verification fee, returned if rejected.
                      Upon approval, 6 smart contracts and 1 bot wallet will be deployed for my token.
                    </span>
                  </label>
                </Card>
              </div>
            </Card>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="ghost"
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button
            onClick={() => currentStep < 4 ? setCurrentStep(currentStep + 1) : undefined}
            disabled={!canProceed()}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {currentStep === 4 ? "Submit Application" : "Next"}
            {currentStep < 4 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
