import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { WalletButton } from "@/components/wallet-button";
import { WalletModal } from "@/components/wallet-modal";
import { useWallet } from "@/hooks/use-wallet";
import logoImg from "@assets/image_1772106618983.png";
import { Link } from "wouter";
import {
  ArrowLeft,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Copy,
  Eye,
  Wallet,
  Bot,
  Layers,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Zap,
  Globe,
  Lock,
  AlertCircle,
  Server,
} from "lucide-react";

const MOCK_APPLICATIONS = [
  { id: "app-001", token: "MOONCAT", symbol: "MCAT", pair: "MCAT/USDT", wallet: "0xAb12...3cDe", email: "dev@mooncat.io", status: "pending", date: "2026-02-25", verified: false },
  { id: "app-002", token: "RocketDog", symbol: "RDOG", pair: "RDOG/BNB", wallet: "0xFf45...6gHi", email: "team@rocketdog.xyz", status: "pending", date: "2026-02-24", verified: true },
  { id: "app-003", token: "FlapCoin", symbol: "FLAP", pair: "FLAP/USDT", wallet: "0x7F00...3a2B", email: "admin@flap.sh", status: "approved", date: "2026-02-20", verified: true },
  { id: "app-004", token: "SafeYield", symbol: "SFY", pair: "SFY/USDT", wallet: "0xBd78...1jKl", email: "dev@safeyield.fi", status: "approved", date: "2026-02-18", verified: true },
  { id: "app-005", token: "MemeLord", symbol: "MLORD", pair: "MLORD/BNB", wallet: "0xCe90...2mNo", email: "lord@memelord.com", status: "rejected", date: "2026-02-22", verified: false },
  { id: "app-006", token: "BullRun", symbol: "BULL", pair: "BULL/USDT", wallet: "0xDf01...3pQr", email: "team@bullrun.io", status: "pending", date: "2026-02-26", verified: true },
];

const MOCK_LISTED_TOKENS = [
  { symbol: "FLAP", pair: "FLAP/USDT", status: "live", volume24h: "$128K", oi: "$45K", traders: 34, fees24h: "$384", deployDate: "2026-02-20" },
  { symbol: "SFY", pair: "SFY/USDT", status: "live", volume24h: "$67K", oi: "$22K", traders: 18, fees24h: "$201", deployDate: "2026-02-18" },
];

const MOCK_PLATFORM_STATS = {
  totalApplications: 6,
  pendingApplications: 3,
  approvedTokens: 2,
  rejectedApplications: 1,
  totalVolume24h: "$195K",
  totalVolumeAll: "$4.8M",
  totalFees24h: "$585",
  totalFeesAll: "$14.4K",
  activeTraders: 52,
  totalTrades: 3420,
  totalLiquidations: 41,
  masterContractBalance: "$2,400",
  totalBotWallets: 2,
  activeBots: 2,
};

export default function Dev88() {
  const { address, pendingWallet, approvePendingWallet, rejectPendingWallet } = useWallet();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("applications");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredApps = MOCK_APPLICATIONS.filter(
    (app) =>
      app.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background" data-testid="page-dev88">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild data-testid="button-back-home">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <img src={logoImg} alt="Flap Futures" className="w-7 h-7" />
              <span className="font-heading font-bold text-sm text-white hidden sm:inline">FLAP FUTURES</span>
            </Link>
            <span className="text-border mx-2 hidden sm:inline">/</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-mono bg-red-500/10 text-red-400 border-red-500/20" data-testid="badge-platform-admin">
                Platform Admin
              </Badge>
            </div>
          </div>
          {address ? <WalletButton /> : (
            <Button size="sm" className="text-xs h-8" onClick={() => setWalletModalOpen(true)}>
              <Wallet className="w-3.5 h-3.5 mr-1.5" />Connect
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Applications", value: MOCK_PLATFORM_STATS.totalApplications, icon: Users, color: "text-primary" },
            { label: "Pending", value: MOCK_PLATFORM_STATS.pendingApplications, icon: Clock, color: "text-yellow-400" },
            { label: "Live Tokens", value: MOCK_PLATFORM_STATS.approvedTokens, icon: CheckCircle, color: "text-green-400" },
            { label: "24h Volume", value: MOCK_PLATFORM_STATS.totalVolume24h, icon: BarChart3, color: "text-blue-400" },
            { label: "24h Fees", value: MOCK_PLATFORM_STATS.totalFees24h, icon: DollarSign, color: "text-green-400" },
            { label: "Active Traders", value: MOCK_PLATFORM_STATS.activeTraders, icon: Activity, color: "text-white" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/50 border-border/30 p-3 sm:p-4" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`font-mono text-sm sm:text-base font-semibold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="applications" className="text-xs" data-testid="tab-applications">
              Applications
              {MOCK_PLATFORM_STATS.pendingApplications > 0 && (
                <span className="ml-1.5 w-4 h-4 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-mono flex items-center justify-center">
                  {MOCK_PLATFORM_STATS.pendingApplications}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tokens" className="text-xs" data-testid="tab-tokens">Listed Tokens</TabsTrigger>
            <TabsTrigger value="infrastructure" className="text-xs" data-testid="tab-infrastructure">Infrastructure</TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs" data-testid="tab-revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card className="bg-card/50 border-border/30 p-5 sm:p-6" data-testid="card-applications">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                <h3 className="font-heading font-semibold text-base text-white">Developer Applications</h3>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search token or wallet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-secondary/50 border-border/30 text-sm h-9"
                    data-testid="input-search-apps"
                  />
                </div>
              </div>

              <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="text-[10px] text-muted-foreground border-b border-border/20">
                      <th className="text-left pb-2.5 font-medium">Token</th>
                      <th className="text-left pb-2.5 font-medium">Pair</th>
                      <th className="text-left pb-2.5 font-medium">Wallet</th>
                      <th className="text-left pb-2.5 font-medium">Email</th>
                      <th className="text-center pb-2.5 font-medium">Verified</th>
                      <th className="text-center pb-2.5 font-medium">Status</th>
                      <th className="text-left pb-2.5 font-medium">Date</th>
                      <th className="text-right pb-2.5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="border-b border-border/10 last:border-0" data-testid={`row-app-${app.id}`}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-[10px] font-mono font-bold text-primary">{app.symbol.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{app.token}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{app.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-xs text-muted-foreground">{app.pair}</td>
                        <td className="py-3 font-mono text-xs text-muted-foreground">{app.wallet}</td>
                        <td className="py-3 text-xs text-muted-foreground">{app.email}</td>
                        <td className="py-3 text-center">
                          {app.verified ? (
                            <CheckCircle className="w-4 h-4 text-green-400 inline" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 inline" />
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-mono ${
                              app.status === "approved"
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : app.status === "rejected"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}
                          >
                            {app.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{app.date}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {app.status === "pending" && (
                              <>
                                <Button variant="ghost" size="icon" aria-label={`Approve ${app.token}`} data-testid={`button-approve-${app.id}`}>
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                </Button>
                                <Button variant="ghost" size="icon" aria-label={`Reject ${app.token}`} data-testid={`button-reject-${app.id}`}>
                                  <XCircle className="w-4 h-4 text-red-400" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" aria-label={`View ${app.token} details`} data-testid={`button-view-${app.id}`}>
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tokens">
            <Card className="bg-card/50 border-border/30 p-5 sm:p-6" data-testid="card-listed-tokens">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="font-heading font-semibold text-base text-white">Listed Tokens</h3>
                <Badge variant="secondary" className="text-[10px] font-mono">{MOCK_LISTED_TOKENS.length} live</Badge>
              </div>

              <div className="space-y-3">
                {MOCK_LISTED_TOKENS.map((token) => (
                  <Card key={token.symbol} className="bg-secondary/30 border-border/20 p-4" data-testid={`card-token-${token.symbol.toLowerCase()}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-mono font-bold text-primary">{token.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{token.symbol}</p>
                            <Badge variant="secondary" className="text-[10px] font-mono bg-green-500/10 text-green-400 border-green-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 inline-block animate-pulse" />
                              Live
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{token.pair}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                        <div>
                          <p className="text-[10px] text-muted-foreground">24h Vol</p>
                          <p className="font-mono text-xs text-white">{token.volume24h}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Open Interest</p>
                          <p className="font-mono text-xs text-white">{token.oi}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Traders</p>
                          <p className="font-mono text-xs text-white">{token.traders}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">24h Fees</p>
                          <p className="font-mono text-xs text-green-400">{token.fees24h}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-xs" asChild data-testid={`button-admin-${token.symbol.toLowerCase()}`}>
                          <Link href={`/admin/${token.symbol.toLowerCase()}`}>
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Admin
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`View ${token.symbol} on BSCScan`} data-testid={`button-bscscan-${token.symbol.toLowerCase()}`}>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="infrastructure">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-card/50 border-border/30 p-5 sm:p-6" data-testid="card-master-contract">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <h3 className="font-heading font-semibold text-base text-white">Master Contract</h3>
                  <Badge variant="secondary" className="text-[10px] font-mono bg-green-500/10 text-green-400 border-green-500/20">
                    Active
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">Address</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-white">0xMa5t...eR01</span>
                      <Button variant="ghost" size="icon" aria-label="Copy master contract address" data-testid="button-copy-master">
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">Balance</span>
                    <span className="font-mono text-sm text-white">{MOCK_PLATFORM_STATS.masterContractBalance}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">Tokens Deployed</span>
                    <span className="font-mono text-sm text-white">{MOCK_PLATFORM_STATS.approvedTokens}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2">
                    <span className="text-sm text-muted-foreground">Network</span>
                    <span className="font-mono text-sm text-yellow-400">BSC Mainnet</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 border-border/30 p-5 sm:p-6" data-testid="card-bot-wallets">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <h3 className="font-heading font-semibold text-base text-white">Bot Wallets</h3>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {MOCK_PLATFORM_STATS.activeBots}/{MOCK_PLATFORM_STATS.totalBotWallets} active
                  </Badge>
                </div>
                <div className="space-y-3">
                  {[
                    { token: "FLAP", address: "0xBo12...Fl01", balance: "0.15 BNB", status: "running", lastAction: "Oracle update 2m ago" },
                    { token: "SFY", address: "0xBo34...Sf02", balance: "0.08 BNB", status: "running", lastAction: "Liquidation scan 5m ago" },
                  ].map((bot) => (
                    <Card key={bot.token} className="bg-secondary/30 border-border/20 p-4" data-testid={`card-bot-${bot.token.toLowerCase()}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{bot.token} Bot</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{bot.address}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs text-white">{bot.balance}</p>
                          <p className="text-[10px] text-muted-foreground">{bot.lastAction}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>

              <Card className="bg-card/50 border-border/30 p-5 sm:p-6 lg:col-span-2" data-testid="card-deployed-ecosystems">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <h3 className="font-heading font-semibold text-base text-white">Deployed Ecosystems</h3>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" data-testid="button-refresh-ecosystems">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                <div className="space-y-4">
                  {MOCK_LISTED_TOKENS.map((token) => (
                    <div key={token.symbol} data-testid={`ecosystem-${token.symbol.toLowerCase()}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-white">{token.symbol}</span>
                        <span className="font-mono text-xs text-muted-foreground">{token.pair}</span>
                        <Badge variant="secondary" className="text-[10px] font-mono bg-green-500/10 text-green-400 border-green-500/20">Active</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
                        {["Vault", "Oracle", "Perps", "Funding", "Liquidation", "Insurance", "Bot"].map((contract) => (
                          <Card key={contract} className="bg-secondary/30 border-border/20 p-2.5 flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-green-500/10 flex items-center justify-center shrink-0">
                              {contract === "Vault" && <Lock className="w-3 h-3 text-green-400" />}
                              {contract === "Oracle" && <Globe className="w-3 h-3 text-green-400" />}
                              {contract === "Perps" && <BarChart3 className="w-3 h-3 text-green-400" />}
                              {contract === "Funding" && <Zap className="w-3 h-3 text-green-400" />}
                              {contract === "Liquidation" && <AlertCircle className="w-3 h-3 text-green-400" />}
                              {contract === "Insurance" && <Shield className="w-3 h-3 text-green-400" />}
                              {contract === "Bot" && <Bot className="w-3 h-3 text-green-400" />}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">{contract}</span>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue">
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-card/50 border-border/30 p-5 sm:p-6" data-testid="card-revenue-overview">
                <h3 className="font-heading font-semibold text-base text-white mb-5">Revenue Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">24h Trading Fees</span>
                    <span className="font-mono text-sm font-semibold text-green-400">{MOCK_PLATFORM_STATS.totalFees24h}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">All Time Fees</span>
                    <span className="font-mono text-sm font-semibold text-white">{MOCK_PLATFORM_STATS.totalFeesAll}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">Verification Fees Collected</span>
                    <span className="font-mono text-sm text-white">$600</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2 border-b border-border/10">
                    <span className="text-sm text-muted-foreground">24h Volume</span>
                    <span className="font-mono text-sm text-white">{MOCK_PLATFORM_STATS.totalVolume24h}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2">
                    <span className="text-sm text-muted-foreground">All Time Volume</span>
                    <span className="font-mono text-sm text-white">{MOCK_PLATFORM_STATS.totalVolumeAll}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 border-border/30 p-5 sm:p-6" data-testid="card-revenue-breakdown">
                <h3 className="font-heading font-semibold text-base text-white mb-5">Per-Token Revenue (24h)</h3>
                <div className="space-y-3">
                  {MOCK_LISTED_TOKENS.map((token) => (
                    <Card key={token.symbol} className="bg-secondary/30 border-border/20 p-4" data-testid={`card-revenue-${token.symbol.toLowerCase()}`}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-[10px] font-mono font-bold text-primary">{token.symbol.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-medium text-white">{token.symbol}</span>
                        </div>
                        <span className="font-mono text-sm font-semibold text-green-400">{token.fees24h}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Volume</p>
                          <p className="font-mono text-xs text-white">{token.volume24h}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">OI</p>
                          <p className="font-mono text-xs text-white">{token.oi}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Traders</p>
                          <p className="font-mono text-xs text-white">{token.traders}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>

              <Card className="bg-card/50 border-border/30 p-5 sm:p-6 lg:col-span-2" data-testid="card-platform-stats">
                <h3 className="font-heading font-semibold text-base text-white mb-5">Platform Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Trades", value: MOCK_PLATFORM_STATS.totalTrades.toLocaleString(), icon: BarChart3 },
                    { label: "Total Liquidations", value: MOCK_PLATFORM_STATS.totalLiquidations, icon: AlertTriangle },
                    { label: "Active Traders", value: MOCK_PLATFORM_STATS.activeTraders, icon: Users },
                    { label: "Active Bots", value: MOCK_PLATFORM_STATS.activeBots, icon: Bot },
                  ].map((item) => (
                    <Card key={item.label} className="bg-secondary/30 border-border/20 p-4 text-center" data-testid={`card-pstat-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="font-mono text-lg font-bold text-white">{item.value}</p>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        pendingWallet={pendingWallet}
        onApprove={approvePendingWallet}
        onReject={rejectPendingWallet}
      />
    </div>
  );
}
