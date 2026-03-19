import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import logoImg from "@assets/image_1772106618983.png";
import WaveCanvas from "@/components/WaveCanvas";
import ShimmerBorder from "@/components/ShimmerBorder";
import MobileSidebar from "@/components/MobileSidebar";
import {
  ArrowRight,
  Shield,
  Zap,
  BarChart3,
  Lock,
  Globe,
  Layers,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Rocket,
  FileCheck,
  Bot,
  Wallet,
} from "lucide-react";
import { SiTelegram, SiX, SiDiscord, SiGithub } from "react-icons/si";
import { Link } from "wouter";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Markets", href: "#trading" },
  { label: "Why Us", href: "#why" },
];

const tradingPairs = [
  { token: "FLAP", pair: "FLAP/USDT", price: "0.00234", change: "+12.4", volume: "45.2K", oi: "12.8K", high: "0.00260", low: "0.00210", trending: true },
  { token: "PEPE2", pair: "PEPE2/USDT", price: "0.00089", change: "-3.2", volume: "28.1K", oi: "8.4K", high: "0.00095", low: "0.00082", trending: false },
  { token: "MOON", pair: "MOON/USDT", price: "0.0156", change: "+5.7", volume: "67.3K", oi: "22.1K", high: "0.0168", low: "0.0142", trending: true },
  { token: "DEGEN", pair: "DEGEN/USDT", price: "0.00421", change: "+1.8", volume: "15.6K", oi: "5.2K", high: "0.00445", low: "0.00398", trending: true },
  { token: "WAGMI", pair: "WAGMI/USDT", price: "0.00067", change: "-8.1", volume: "9.8K", oi: "3.1K", high: "0.00075", low: "0.00060", trending: false },
];

function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
          : "bg-transparent"
      }`}
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16 sm:h-20">
          <a href="#" className="flex items-center gap-2 sm:gap-3 shrink-0" data-testid="link-home">
            <img src={logoImg} alt="FLAP FUTURES" className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-white">
              FLAP <span className="text-gradient" style={{ letterSpacing: "0.06em" }}>FUTURES</span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-1" data-testid="nav-desktop">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-muted-foreground transition-colors rounded-md hover-elevate"
                data-testid={`link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ShimmerBorder borderRadius="8px" borderSize={2}>
              <Button size="sm" asChild className="inline-flex" data-testid="button-launch-app">
                <Link href="/perps">
                  Launch App
                </Link>
              </Button>
            </ShimmerBorder>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20" data-testid="section-hero">
      <WaveCanvas />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32" style={{ zIndex: 2 }}>
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-6 sm:mb-8 px-4 py-1.5 text-xs font-mono bg-lime-subtle border-lime-subtle text-lime-soft" data-testid="badge-live">
                <span className="w-2 h-2 rounded-full bg-lime mr-2 inline-block animate-pulse" />
                LIVE ON BNB SMART CHAIN
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-heading font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-6 sm:mb-8 text-3d"
              data-testid="text-hero-title"
            >
              PERPETUAL
              <br />
              TRADING FOR
              <br />
              <a href="https://flap.sh/bnb/board" target="_blank" rel="noopener noreferrer" className="text-gradient hover:opacity-80 transition-opacity">FLAP.SH TOKEN</a>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4"
              data-testid="text-hero-description"
            >
              Turn any <a href="https://flap.sh/bnb/board" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">flap.sh</a> token into a perpetual market — trade long or short with <span className="text-lime-soft font-semibold">flexible leverage</span>. Non-custodial,
              fully on-chain, and accessible to every level of trader.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4"
            >
              <ShimmerBorder borderRadius="8px" borderSize={2} className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-base px-8 h-12" asChild data-testid="button-start-trading">
                  <Link href="/perps">
                    Start Trading
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </ShimmerBorder>
              <ShimmerBorder borderRadius="8px" borderSize={2} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full text-base px-8 h-12 glass-button" asChild data-testid="button-list-token">
                  <a href="https://flap.sh/launch" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    Launch Your Perps
                    <Rocket className="w-4 h-4" />
                  </a>
                </Button>
              </ShimmerBorder>
            </motion.div>
          </div>
        </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: FileCheck,
      title: "Apply to List",
      desc: "Submit your token details through our simple application form. We review every project to ensure quality.",
    },
    {
      step: "02",
      icon: Shield,
      title: "Get Verified",
      desc: "Complete a quick verification to confirm token ownership. This keeps the platform safe and trustworthy.",
    },
    {
      step: "03",
      icon: Layers,
      title: "We Set Everything Up",
      desc: "Once approved, we handle all the technical setup. Your trading market is ready in minutes — no extra work needed.",
    },
    {
      step: "04",
      icon: Bot,
      title: "Automated & Secure",
      desc: "Our systems run 24/7 to keep your market healthy, prices accurate, and trades executing smoothly.",
    },
    {
      step: "05",
      icon: Rocket,
      title: "Start Trading",
      desc: "Your token goes live on the platform. Traders can open long or short positions with leverage instantly.",
    },
    {
      step: "06",
      icon: TrendingUp,
      title: "Earn Revenue",
      desc: "Track your market's performance from your dashboard. Earn a share of trading fees as volume grows.",
    },
  ];

  return (
    <section id="how-it-works" className="relative py-20 sm:py-32" data-testid="section-how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="secondary" className="mb-4 text-xs font-mono" style={{ color: "#d5f704" }} data-testid="badge-how">Process</Badge>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 text-3d-sm" data-testid="text-how-title">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto" data-testid="text-how-subtitle">
            From application to live trading in minutes. Fully automated, fully on-chain.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="h-full"
            >
              <Card
                className="relative p-6 sm:p-7 h-full hover-elevate overflow-hidden"
                data-testid={`card-step-${s.step}`}
                style={{
                  background: "linear-gradient(145deg, hsl(250,45%,12%) 0%, hsl(250,45%,9%) 100%)",
                  border: "1px solid rgba(122,51,250,0.18)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 0% 0%, rgba(122,51,250,0.08) 0%, transparent 60%)",
                  }}
                />

                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div
                    className="flex items-center justify-center rounded-xl"
                    style={{
                      width: 48,
                      height: 48,
                      background: "linear-gradient(135deg, rgba(122,51,250,0.2) 0%, rgba(145,72,255,0.1) 100%)",
                      border: "1px solid rgba(122,51,250,0.35)",
                      boxShadow: "0 0 16px rgba(122,51,250,0.15)",
                    }}
                  >
                    <s.icon className="w-5 h-5" style={{ color: "#d5f704" }} />
                  </div>

                  <span
                    className="font-mono font-black leading-none select-none"
                    style={{
                      fontSize: "3rem",
                      background: "linear-gradient(180deg, rgba(122,51,250,0.35) 0%, rgba(122,51,250,0.05) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {s.step}
                  </span>
                </div>

                <div
                  className="mb-3 relative z-10"
                  style={{ height: 2, width: 32, background: "linear-gradient(90deg, #7a33fa, transparent)" }}
                />

                <h3 className="font-heading font-bold text-base sm:text-lg mb-2 text-white relative z-10 tracking-tight">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed relative z-10" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {s.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EcosystemSection() {
  const contracts = [
    { icon: Wallet, name: "Secure Custody", desc: "Your funds are held securely on-chain. Deposit and withdraw anytime with full transparency.", color: "text-blue-400" },
    { icon: Globe, name: "Real-Time Pricing", desc: "Accurate price feeds sourced directly on-chain. No third-party dependencies or delays.", color: "text-green-400" },
    { icon: BarChart3, name: "Perpetual Trading", desc: "Go long or short with leverage. A professional-grade trading experience fully on-chain.", color: "text-purple-400" },
    { icon: TrendingUp, name: "Fair Rates", desc: "Dynamic rates keep markets balanced and ensure fair pricing across all positions.", color: "text-yellow-400" },
    { icon: Shield, name: "Risk Management", desc: "Automated systems protect the platform and traders from excessive risk exposure.", color: "text-red-400" },
    { icon: Lock, name: "Market Stability", desc: "Built-in safeguards ensure platform resilience even during extreme market conditions.", color: "text-cyan-400" },
  ];

  return (
    <section id="ecosystem" className="relative py-20 sm:py-32" data-testid="section-ecosystem">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="secondary" className="mb-4 text-xs font-mono" style={{ color: "#d5f704" }} data-testid="badge-ecosystem">Architecture</Badge>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 text-3d-sm" data-testid="text-ecosystem-title">
            Our <span className="text-gradient">Ecosystem</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto" data-testid="text-ecosystem-subtitle">
            Every listed token gets its own dedicated trading infrastructure, deployed automatically.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {contracts.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="h-full"
            >
              <Card
                className="relative p-6 sm:p-7 h-full hover-elevate overflow-hidden"
                data-testid={`card-eco-${c.name.toLowerCase().replace(/\s/g, "-")}`}
                style={{
                  background: "linear-gradient(145deg, hsl(250,45%,12%) 0%, hsl(250,45%,9%) 100%)",
                  border: "1px solid rgba(122,51,250,0.18)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 0% 0%, rgba(122,51,250,0.08) 0%, transparent 60%)",
                  }}
                />

                <div
                  className="flex items-center justify-center rounded-xl mb-5 relative z-10"
                  style={{
                    width: 48,
                    height: 48,
                    background: "linear-gradient(135deg, rgba(122,51,250,0.2) 0%, rgba(145,72,255,0.1) 100%)",
                    border: "1px solid rgba(122,51,250,0.35)",
                    boxShadow: "0 0 16px rgba(122,51,250,0.15)",
                  }}
                >
                  <c.icon className="w-5 h-5" style={{ color: "#d5f704" }} />
                </div>

                <div
                  className="mb-3 relative z-10"
                  style={{ height: 2, width: 32, background: "linear-gradient(90deg, #7a33fa, transparent)" }}
                />

                <h3 className="font-heading font-bold text-base sm:text-lg mb-2 text-white relative z-10 tracking-tight">
                  {c.name}
                </h3>
                <p className="text-sm leading-relaxed relative z-10" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {c.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 sm:mt-12"
        >
          <Card className="p-6 sm:p-8 bg-card/50 border-border/30" data-testid="card-master-brain">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="w-16 h-16 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Layers className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-lg sm:text-xl mb-2 text-white">Automated Infrastructure</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  All trading infrastructure is set up automatically when a token is approved. Each market gets its own
                  dedicated systems to ensure reliable and secure operations.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function TradingBoardSection() {
  const [activeTab, setActiveTab] = useState<"usdt" | "bnb">("usdt");

  const filteredPairs = tradingPairs.filter((p) =>
    activeTab === "usdt" ? p.pair.includes("USDT") : p.pair.includes("BNB")
  );

  return (
    <section id="trading" className="relative py-20 sm:py-32" data-testid="section-trading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="secondary" className="mb-4 text-xs font-mono" style={{ color: "#d5f704" }} data-testid="badge-trading">Active Markets</Badge>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 text-3d-sm" data-testid="text-trading-title">
            Trading <span className="text-gradient">Board</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto" data-testid="text-trading-subtitle">
            Browse all listed <a href="https://flap.sh/bnb/board" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">flap.sh</a> tokens. Choose USDT or BNB pairs and start trading perpetuals.
          </p>
        </div>

        <Card className="bg-card/50 border-border/30" data-testid="card-trading-board">
          <div className="flex items-center justify-between gap-4 p-4 sm:p-6 border-b border-border/30">
            <div className="flex gap-1">
              <Button
                variant={activeTab === "usdt" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("usdt")}
                data-testid="button-tab-usdt"
              >
                USDT Pairs
              </Button>
              <Button
                variant={activeTab === "bnb" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("bnb")}
                data-testid="button-tab-bnb"
              >
                BNB Pairs
              </Button>
            </div>
            <Badge variant="secondary" className="text-xs font-mono hidden sm:inline-flex bg-lime-subtle border-lime-subtle text-lime-soft" data-testid="badge-live-count">
              <span className="w-1.5 h-1.5 rounded-full bg-lime mr-1.5 inline-block animate-pulse" />
              {tradingPairs.length} Markets Live
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border/20">
                  <th className="text-left px-4 sm:px-6 py-3 font-medium">Pair</th>
                  <th className="text-right px-4 py-3 font-medium">Price</th>
                  <th className="text-right px-4 py-3 font-medium">24h Change</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">24h High</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">24h Low</th>
                  <th className="text-right px-4 py-3 font-medium">Volume</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Open Interest</th>
                  <th className="text-right px-4 sm:px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPairs.map((p) => {
                  const isPositive = p.change.startsWith("+");
                  return (
                    <tr
                      key={p.pair}
                      className="border-b border-border/10 hover-elevate transition-colors"
                      data-testid={`row-pair-${p.token.toLowerCase()}`}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {p.token.substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-white">{p.pair}</div>
                            <div className="text-xs text-muted-foreground">Perpetual</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right px-4 py-4 font-mono text-sm text-white">${p.price}</td>
                      <td className="text-right px-4 py-4">
                        <span className={`inline-flex items-center gap-0.5 text-sm font-mono ${isPositive ? "text-green-400" : "text-red-400"}`}>
                          {isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {p.change}%
                        </span>
                      </td>
                      <td className="text-right px-4 py-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">${p.high}</td>
                      <td className="text-right px-4 py-4 font-mono text-xs text-muted-foreground hidden sm:table-cell">${p.low}</td>
                      <td className="text-right px-4 py-4 font-mono text-sm text-white">${p.volume}</td>
                      <td className="text-right px-4 py-4 font-mono text-xs text-muted-foreground hidden md:table-cell">${p.oi}</td>
                      <td className="text-right px-4 sm:px-6 py-4">
                        <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary" data-testid={`button-trade-${p.token.toLowerCase()}`}>
                          Trade
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 sm:p-6 border-t border-border/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{tradingPairs.length} markets · Preview data</span>
            <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary" asChild data-testid="button-view-all-markets">
              <Link href="/perps">View All Markets</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

function WhyFlapSection() {
  const features = [
    {
      icon: BarChart3,
      title: "Precision Trading",
      desc: "Execute trades with tight spreads and real-time pricing. Built for traders who demand accuracy and speed.",
    },
    {
      icon: Layers,
      title: "Deep Liquidity",
      desc: "Access pooled liquidity across markets to support large, confident trades with minimal slippage.",
    },
    {
      icon: Zap,
      title: "Advanced Tools",
      desc: "Leverage, limit orders, take-profit and stop-loss — built for control, speed, and a competitive edge.",
    },
    {
      icon: Shield,
      title: "Confidence in Every Trade",
      desc: "Whether you're new or a pro, enjoy a streamlined experience built for clarity and control.",
    },
  ];

  return (
    <section id="why" className="relative py-20 sm:py-32" data-testid="section-why">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="secondary" className="mb-4 text-xs font-mono" style={{ color: "#d5f704" }} data-testid="badge-why">Advantages</Badge>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 text-3d-sm" data-testid="text-why-title">
            Why FLAP <span className="text-gradient">FUTURES</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="h-full"
            >
              <Card
                className="relative p-6 sm:p-7 h-full hover-elevate overflow-hidden"
                data-testid={`card-why-${i}`}
                style={{
                  background: "linear-gradient(145deg, hsl(250,45%,12%) 0%, hsl(250,45%,9%) 100%)",
                  border: "1px solid rgba(122,51,250,0.18)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 0% 0%, rgba(122,51,250,0.08) 0%, transparent 60%)",
                  }}
                />

                <div
                  className="flex items-center justify-center rounded-xl mb-5 relative z-10"
                  style={{
                    width: 48,
                    height: 48,
                    background: "linear-gradient(135deg, rgba(122,51,250,0.2) 0%, rgba(145,72,255,0.1) 100%)",
                    border: "1px solid rgba(122,51,250,0.35)",
                    boxShadow: "0 0 16px rgba(122,51,250,0.15)",
                  }}
                >
                  <f.icon className="w-5 h-5" style={{ color: "#d5f704" }} />
                </div>

                <div
                  className="mb-3 relative z-10"
                  style={{ height: 2, width: 32, background: "linear-gradient(90deg, #7a33fa, transparent)" }}
                />

                <h3 className="font-heading font-bold text-base sm:text-lg mb-2 text-white relative z-10 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed relative z-10" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {f.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ListTokenSection() {
  return (
    <section id="list-token" className="relative py-20 sm:py-32" data-testid="section-list-token">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="relative bg-card/50 border-border/30 p-8 sm:p-12 lg:p-16" data-testid="card-list-token">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 text-xs font-mono" style={{ color: "#d5f704" }} data-testid="badge-developers">For Token Projects</Badge>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-6 text-3d-sm" data-testid="text-list-title">
                List Your <span className="text-gradient">Token</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6" data-testid="text-list-desc">
                Built a token on <a href="https://flap.sh/bnb/board" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">flap.sh</a>? Get your own perpetual trading market up and running in minutes.
                The full trading infrastructure is provisioned and ready before you are — just connect your token and take control from a clean dashboard.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Simple application — just provide your token details",
                  "Quick verification to confirm ownership",
                  "Everything is set up for you automatically",
                  "Your market goes live for all traders",
                  "Track volume, traders, and earnings from your dashboard",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3" data-testid={`text-list-step-${i}`}>
                    <div className="w-6 h-6 rounded-full bg-lime-subtle flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-lime-soft">✓</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="w-full sm:w-auto" asChild data-testid="button-apply-listing">
                  <Link href="/apply">
                    Apply for Listing
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto glass-button" asChild data-testid="button-admin-dashboard">
                  <Link href="/admin/demo">
                    Admin Dashboard
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="p-5 bg-secondary/30 border-border/20" data-testid="card-listing-preview">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-lime-muted text-lime-soft border-lime-subtle text-xs">Live</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: "Total Volume", value: "$124.5K" },
                    { label: "Open Interest", value: "$28.2K" },
                    { label: "Active Traders", value: "47" },
                    { label: "Fees Earned", value: "$373.50" },
                  ].map((stat) => (
                    <div key={stat.label} data-testid={`stat-preview-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                      <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                      <div className="font-heading font-semibold text-white text-sm">{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mb-2">Recent Activity</div>
                <div className="space-y-2">
                  {[
                    { type: "Long", amount: "$250", time: "2m ago", color: "text-green-400" },
                    { type: "Liquidation", amount: "$120", time: "5m ago", color: "text-red-400" },
                    { type: "Short", amount: "$500", time: "12m ago", color: "text-red-400" },
                    { type: "Long", amount: "$180", time: "18m ago", color: "text-green-400" },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center justify-between text-xs" data-testid={`activity-${i}`}>
                      <span className={activity.color}>{activity.type}</span>
                      <span className="text-white font-mono">{activity.amount}</span>
                      <span className="text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative py-20 sm:py-32" data-testid="section-cta">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 sm:p-12 bg-card/50 border-border/30 text-center" data-testid="card-cta">
          <h3 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl mb-4 text-white" data-testid="text-cta-title">
            Trade smarter.<br />Earn more.
          </h3>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8" data-testid="text-cta-desc">
            Connect your wallet and start trading perpetuals on <a href="https://flap.sh/bnb/board" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">flap.sh</a> tokens. Or list your own token and open a new market.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button size="lg" className="w-full sm:w-auto text-base px-8" asChild data-testid="button-cta-launch">
              <Link href="/perps">
                Launch Trading App
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 glass-button" asChild data-testid="button-cta-flap">
              <a href="https://flap.sh/bnb/board" target="_blank" rel="noopener noreferrer">
                Visit flap.sh
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/30 py-12 sm:py-16" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
          <div>
            <a href="#" className="flex items-center gap-2 mb-4" data-testid="link-footer-logo">
              <img src={logoImg} alt="FLAP FUTURES" className="w-8 h-8" />
              <span className="font-heading font-bold text-lg text-white">
                FLAP <span className="text-gradient">FUTURES</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4" data-testid="text-footer-desc">
              Decentralized perpetual trading infrastructure for every token on <a href="https://flap.sh/bnb/board" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">flap.sh</a>.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a href="#" aria-label="Telegram" className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover-elevate" data-testid="link-footer-telegram">
                <SiTelegram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="X (Twitter)" className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover-elevate" data-testid="link-footer-x">
                <SiX className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Discord" className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover-elevate" data-testid="link-footer-discord">
                <SiDiscord className="w-4 h-4" />
              </a>
              <a href="#" aria-label="GitHub" className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover-elevate" data-testid="link-footer-github">
                <SiGithub className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-4">Platform</h4>
            <ul className="space-y-3">
              {["Trading Board", "List Your Token", "Dev Dashboard", "Documentation"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground transition-colors" data-testid={`link-footer-${link.toLowerCase().replace(/\s/g, "-")}`}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              {["Whitepaper", "Smart Contracts", "API Reference", "Bug Bounty"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground transition-colors" data-testid={`link-footer-${link.toLowerCase().replace(/\s/g, "-")}`}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {["Terms of Service", "Privacy Policy", "Risk Disclosure", "Cookie Policy"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground transition-colors" data-testid={`link-footer-${link.toLowerCase().replace(/\s/g, "-")}`}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground" data-testid="text-copyright">
            2025 FLAP FUTURES. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground text-center sm:text-right" data-testid="text-disclaimer">
            Trading involves significant risk. This is not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 pointer-events-none blob-bg-overlay" style={{ zIndex: 0 }} />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <Header />
      <MobileSidebar />
      <HeroSection />
      <HowItWorksSection />
      <EcosystemSection />
      <TradingBoardSection />
      <WhyFlapSection />
      <ListTokenSection />
      <CTASection />
      <Footer />
    </div>
  );
}
