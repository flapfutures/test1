import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./storage";
import { platformSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { ethers } from "ethers";
import { registerExchangePerpsRoutes } from "./exchange-perps-routes";
import { storage } from "./storage";

const BSC_RPC = "https://bsc-dataseed.binance.org";

// ── GeckoTerminal OHLCV in-memory cache ───────────────────────────────────────
interface CacheEntry { candles: any[]; ts: number; }
const ohlcvCache  = new Map<string, CacheEntry>();
const orientCache = new Map<string, "base" | "quote">();
const CACHE_TTL: Record<string, number> = {
  "1m": 30_000, "5m": 60_000, "15m": 90_000,
  "1H": 5 * 60_000, "4H": 10 * 60_000, "1D": 30 * 60_000, "1W": 60 * 60_000,
};

async function geckoFetch(url: string): Promise<number[][]> {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (r.status === 429) return null as any;
  const data = await r.json();
  return (data?.data?.attributes?.ohlcv_list ?? []) as number[][];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

declare module "express-session" {
  interface SessionData {
    walletAddress?: string;
    dev88Authed?: boolean;
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Auth ───────────────────────────────────────────────────────────────────

  app.post("/api/auth/nonce", async (req, res) => {
    const { walletAddress } = req.body;
    if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    const user = await storage.upsertUser(walletAddress);
    const nonce = randomUUID();
    await storage.setNonce(walletAddress, nonce);
    return res.json({ nonce, message: `Sign this message to login to Flap Futures.\n\nNonce: ${nonce}` });
  });

  app.post("/api/auth/verify", async (req, res) => {
    const { walletAddress, signature, message } = req.body;
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: "walletAddress, signature, and message required" });
    }
    try {
      const user = await storage.getUser(walletAddress);
      if (!user || !user.nonce) return res.status(401).json({ error: "Request a nonce first" });
      const recovered = ethers.verifyMessage(message, signature);
      if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ error: "Signature does not match wallet" });
      }
      const freshNonce = randomUUID();
      await storage.setNonce(walletAddress, freshNonce);
      req.session.walletAddress = walletAddress.toLowerCase();
      return res.json({ success: true, walletAddress: walletAddress.toLowerCase() });
    } catch {
      return res.status(401).json({ error: "Signature verification failed" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.walletAddress) return res.json({ authenticated: false });
    return res.json({ authenticated: true, walletAddress: req.session.walletAddress });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {});
    return res.json({ success: true });
  });

  // ── Spot: OHLCV candle data via GeckoTerminal ─────────────────────────────
  app.get("/api/spot/ohlcv/:pairAddress", async (req, res) => {
    const { pairAddress } = req.params;
    const addr = pairAddress.toLowerCase();
    const tf   = (req.query.tf as string) ?? "15m";
    const tfMap: Record<string, { period: string; agg: number; limit: number }> = {
      "1m":  { period: "minute", agg: 1,  limit: 1000 },
      "5m":  { period: "minute", agg: 5,  limit: 1000 },
      "15s": { period: "minute", agg: 1,  limit: 1000 },
      "15m": { period: "minute", agg: 15, limit: 1000 },
      "1H":  { period: "hour",   agg: 1,  limit: 1000 },
      "4H":  { period: "hour",   agg: 4,  limit: 1000 },
      "1D":  { period: "day",    agg: 1,  limit: 365  },
      "1W":  { period: "day",    agg: 1,  limit: 730  },
    };
    const cfg       = tfMap[tf] ?? tfMap["15m"];
    const priceHint = parseFloat(req.query.priceHint as string ?? "0") || 0;
    const cacheKey  = `${addr}:${tf}`;
    const ttl       = CACHE_TTL[tf] ?? 90_000;

    const cached = ohlcvCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < ttl) {
      res.set("Cache-Control", "public, max-age=30");
      return res.json({ candles: cached.candles, cached: true });
    }

    const buildUrl = (token: "base" | "quote") =>
      `https://api.geckoterminal.com/api/v2/networks/bsc/pools/${addr}/ohlcv/${cfg.period}?aggregate=${cfg.agg}&limit=${cfg.limit}&currency=usd&token=${token}`;

    try {
      let orient = orientCache.get(addr);
      let raw: number[][] | null = null;

      if (orient) {
        raw = await geckoFetch(buildUrl(orient));
      } else {
        raw = await geckoFetch(buildUrl("base"));
        if (raw === null) {
          if (cached) return res.json({ candles: cached.candles, stale: true });
          return res.json({ candles: [], rateLimited: true });
        }
        if (priceHint > 0 && raw.length > 0) {
          const lastClose = raw[raw.length - 1]?.[4] ?? 0;
          const ratio = lastClose > 0
            ? Math.max(priceHint, lastClose) / Math.min(priceHint, lastClose)
            : 9999;
          if (ratio > 5) {
            const altRaw = await geckoFetch(buildUrl("quote"));
            if (altRaw && altRaw.length > 0) {
              const altClose = altRaw[altRaw.length - 1]?.[4] ?? 0;
              const altRatio = altClose > 0
                ? Math.max(priceHint, altClose) / Math.min(priceHint, altClose)
                : 9999;
              if (altRatio < ratio) { raw = altRaw; orient = "quote"; }
              else { orient = "base"; }
            } else { orient = "base"; }
          } else { orient = "base"; }
        } else { orient = "base"; }
        orientCache.set(addr, orient);
      }

      if (raw === null) {
        if (cached) return res.json({ candles: cached.candles, stale: true });
        return res.json({ candles: [], rateLimited: true });
      }

      const seenTs = new Set<number>();
      let candles = raw
        .map(([t, o, h, l, c, v]) => ({
          time: t > 1e12 ? Math.floor(t / 1000) : Math.floor(t),
          open: o, high: h, low: l, close: c, volume: v,
        }))
        .sort((a, b) => a.time - b.time)
        .filter((c) => { if (seenTs.has(c.time)) return false; seenTs.add(c.time); return true; });

      if (tf === "1W" && candles.length > 0) {
        const WEEK = 7 * 86400;
        const firstMon = candles[0].time - ((candles[0].time % WEEK + 86400 * 3) % WEEK);
        const buckets = new Map<number, { open: number; high: number; low: number; close: number; volume: number }>();
        for (const c of candles) {
          const wk = firstMon + Math.floor((c.time - firstMon) / WEEK) * WEEK;
          const b  = buckets.get(wk);
          if (!b) { buckets.set(wk, { open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }); }
          else    { b.high = Math.max(b.high, c.high); b.low = Math.min(b.low, c.low); b.close = c.close; b.volume += c.volume; }
        }
        candles = Array.from(buckets.entries())
          .sort(([a], [b]) => a - b)
          .map(([time, b]) => ({ time, ...b }));
      }

      ohlcvCache.set(cacheKey, { candles, ts: Date.now() });
      res.set("Cache-Control", "public, max-age=30");
      return res.json({ candles });
    } catch (e: any) {
      if (cached) return res.json({ candles: cached.candles, stale: true });
      return res.status(500).json({ error: e?.message ?? String(e) });
    }
  });

  // ── Spot: token logo proxy ───────────────────────────────────────────────
  app.get("/api/spot/logo/:address", async (req, res) => {
    const addr = req.params.address.toLowerCase();
    const sources = [
      `https://dd.dexscreener.com/ds-data/tokens/bsc/${addr}.png`,
      `https://assets.trustwallet.com/blockchains/smartchain/assets/${req.params.address}/logo.png`,
      `https://tokens.pancakeswap.finance/images/${req.params.address}.png`,
    ];
    for (const url of sources) {
      try {
        const r = await fetch(url, { redirect: "follow" });
        if (r.ok && (r.headers.get("content-type") ?? "").startsWith("image/")) {
          res.set("Content-Type", r.headers.get("content-type")!);
          res.set("Cache-Control", "public, max-age=86400");
          const buf = Buffer.from(await r.arrayBuffer());
          return res.send(buf);
        }
      } catch { /* try next */ }
    }
    return res.status(404).end();
  });

  // ── Spot: token pair lookup ──────────────────────────────────────────────
  app.get("/api/spot/token/:address", async (req, res) => {
    const { address } = req.params;
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "MORALIS_API_KEY not configured" });
    try {
      const mRes = await fetch(
        `https://deep-index.moralis.io/api/v2.2/erc20/${address}/price?chain=0x38&include=percent_change`,
        { headers: { "X-API-Key": apiKey, accept: "application/json" } },
      );
      const mData = await mRes.json();
      const pairAddress: string | undefined = mData?.pairAddress;
      if (pairAddress) {
        const dsRes = await fetch(`https://api.dexscreener.com/latest/dex/pairs/bsc/${pairAddress}`);
        const dsData = await dsRes.json();
        const pair = dsData?.pairs?.[0] ?? null;
        if (pair) return res.json({ pair, source: "moralis+dexscreener" });
      }
      const fbRes  = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      const fbData = await fbRes.json();
      const bsc = ((fbData?.pairs ?? []) as any[])
        .filter((p: any) => p.chainId === "bsc")
        .sort((a: any, b: any) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
      return res.json({ pair: bsc[0] ?? null, source: "dexscreener-fallback" });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message ?? String(e) });
    }
  });

  // ── Dev88 Password Gate ────────────────────────────────────────────────────
  app.get("/api/dev88/check", (req, res) => {
    return res.json({ authed: req.session?.dev88Authed === true });
  });

  app.post("/api/dev88/auth", (req, res) => {
    const { password } = req.body as { password?: string };
    const correct = process.env.DEV88_PASSWORD || "";
    if (!correct) return res.status(500).json({ error: "DEV88_PASSWORD not configured" });
    if (password !== correct) return res.status(401).json({ error: "Wrong password" });
    req.session.dev88Authed = true;
    return res.json({ authed: true });
  });

  app.post("/api/dev88/logout", (req, res) => {
    req.session.dev88Authed = false;
    return res.json({ ok: true });
  });

  // ── Platform settings ────────────────────────────────────────────────────
  app.get("/api/platform/settings", async (req, res) => {
    try {
      const rows = await db.select().from(platformSettings);
      const map: Record<string, string> = {};
      rows.forEach(r => { map[r.key] = r.value; });
      return res.json(map);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/platform/settings", async (req, res) => {
    if (!req.session?.dev88Authed) return res.status(403).json({ error: "Forbidden" });
    try {
      const { key, value } = req.body as { key: string; value: string };
      if (!key) return res.status(400).json({ error: "key required" });
      await db.insert(platformSettings)
        .values({ key, value: value ?? "", updatedAt: new Date() })
        .onConflictDoUpdate({ target: platformSettings.key, set: { value: value ?? "", updatedAt: new Date() } });
      return res.json({ ok: true, key, value });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/admin/platform/settings/:key", async (req, res) => {
    if (!req.session?.dev88Authed) return res.status(403).json({ error: "Forbidden" });
    try {
      await db.delete(platformSettings).where(eq(platformSettings.key, req.params.key));
      return res.json({ ok: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── FFX token access check ───────────────────────────────────────────────
  const FFX_REQUIRED = BigInt("1000000") * BigInt(10 ** 18);
  const ERC20_BALANCE_ABI = ["function balanceOf(address) view returns (uint256)"];

  app.get("/api/exchange/ffx-access", async (req, res) => {
    try {
      const wallet = (req.query.wallet as string || "").toLowerCase();
      if (!wallet) return res.status(400).json({ error: "wallet required" });
      const rows = await db.select().from(platformSettings).where(eq(platformSettings.key, "ffx_token_address"));
      const ffxContract = rows[0]?.value?.trim() || "";
      if (!ffxContract) {
        return res.json({ hasAccess: true, balance: "0", required: "1000000", contractSet: false });
      }
      const provider = new ethers.JsonRpcProvider(BSC_RPC);
      const token = new ethers.Contract(ffxContract, ERC20_BALANCE_ABI, provider);
      const balance: bigint = await token.balanceOf(wallet);
      const hasAccess = balance >= FFX_REQUIRED;
      const balanceHuman = (Number(balance) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 0 });
      return res.json({ hasAccess, balance: balanceHuman, required: "1,000,000", contractSet: true });
    } catch (e: any) {
      return res.json({ hasAccess: true, balance: "0", required: "1,000,000", contractSet: true, error: e.message });
    }
  });

  // ── Exchange Perps (Gate.io) ───────────────────────────────────────────────
  registerExchangePerpsRoutes(app);

  return httpServer;
}
