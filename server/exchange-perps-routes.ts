import type { Express, Request } from "express";
import { createHash, createHmac } from "crypto";
import * as http from "http";
import * as https from "https";
import { db } from "./storage";
import {
  exchangeTradingAccounts, exchangeSubaccountPool,
  exchangeDepositHistory, exchangeWithdrawalHistory,
} from "@shared/schema";
import { eq, desc, and, gt } from "drizzle-orm";

const GATEIO_BASE = "https://api.gateio.ws/api/v4";
const SETTLE = "usdt";

// ── HTTP helper ───────────────────────────────────────────────────────────────

function httpRequest(url: string, options: any = {}): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib: any = parsed.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: options.method || "GET",
        headers: options.headers || {},
        timeout: 30000,
      },
      (resp: any) => {
        let data = "";
        resp.on("data", (chunk: any) => (data += chunk));
        resp.on("end", () => resolve({ status: resp.statusCode, data }));
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ── Gate.io API helpers ───────────────────────────────────────────────────────

async function gatePublicRequest(endpoint: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${GATEIO_BASE}${endpoint}${qs ? "?" + qs : ""}`;
  const resp = await httpRequest(url, { headers: { Accept: "application/json" } });
  return JSON.parse(resp.data);
}

function gateSign(method: string, path: string, queryString: string, body: string, timestamp: string, secret: string) {
  const bodyHash = createHash("sha512").update(body || "").digest("hex");
  const signStr = `${method}\n${path}\n${queryString}\n${bodyHash}\n${timestamp}`;
  return createHmac("sha512", secret).update(signStr).digest("hex");
}

async function gateAuthRequest(method: string, endpoint: string, params: Record<string, string> = {}, body: any = null, subUid?: string) {
  const key = process.env.GATEIO_API_KEY;
  const secret = process.env.GATEIO_API_SECRET;
  if (!key || !secret) throw new Error("Gate.io API credentials not configured");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const qs = new URLSearchParams(params).toString();
  const bodyStr = body ? JSON.stringify(body) : "";
  const apiPath = `/api/v4${endpoint}`;
  const sign = gateSign(method, apiPath, qs, bodyStr, timestamp, secret);
  const url = `${GATEIO_BASE}${endpoint}${qs ? "?" + qs : ""}`;
  const headers: Record<string, string> = {
    KEY: key, Timestamp: timestamp, SIGN: sign,
    "Content-Type": "application/json", Accept: "application/json",
  };
  if (subUid) headers["X-Gate-Sub-Account"] = subUid;
  const resp = await httpRequest(url, { method, headers, body: bodyStr || undefined });
  return JSON.parse(resp.data);
}

// ── Sub-account routing ───────────────────────────────────────────────────────

function walletFromReq(req: Request): string | null {
  const w = (req.headers["x-wallet-address"] as string) || (req.query.wallet as string);
  return w ? w.toLowerCase() : null;
}

async function getOrAssignSubAccount(wallet: string): Promise<string | null> {
  // Check existing assignment
  const existing = await db
    .select()
    .from(exchangeTradingAccounts)
    .where(eq(exchangeTradingAccounts.walletAddress, wallet))
    .limit(1);

  if (existing.length > 0 && existing[0].gateSubUid) {
    return existing[0].gateSubUid;
  }

  // Find next available sub-account from pool
  const pool = await db
    .select()
    .from(exchangeSubaccountPool)
    .where(eq(exchangeSubaccountPool.inUse, false))
    .limit(1);

  if (pool.length === 0) return null;

  const slot = pool[0];

  // Mark slot as in-use
  await db
    .update(exchangeSubaccountPool)
    .set({ inUse: true, assignedWallet: wallet, assignedAt: new Date() })
    .where(eq(exchangeSubaccountPool.id, slot.id));

  // Create trading account record
  await db
    .insert(exchangeTradingAccounts)
    .values({ walletAddress: wallet, gateSubUid: slot.gateSubUid })
    .onConflictDoUpdate({
      target: exchangeTradingAccounts.walletAddress,
      set: { gateSubUid: slot.gateSubUid, updatedAt: new Date() },
    });

  return slot.gateSubUid;
}

// ── Routes ────────────────────────────────────────────────────────────────────

export function registerExchangePerpsRoutes(app: Express) {

  // ── Public market data ────────────────────────────────────────────────────

  app.get("/api/exchange/tickers", async (req, res) => {
    try {
      const contract = req.query.contract as string | undefined;
      const params: Record<string, string> = {};
      if (contract) params.contract = contract;
      const data = await gatePublicRequest(`/futures/${SETTLE}/tickers`, params);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/ticker", async (req, res) => {
    try {
      const contract = (req.query.contract as string) || "BTC_USDT";
      const data = await gatePublicRequest(`/futures/${SETTLE}/tickers`, { contract });
      res.json(Array.isArray(data) ? data[0] : data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/orderbook", async (req, res) => {
    try {
      const contract = (req.query.contract as string) || "BTC_USDT";
      const limit = (req.query.limit as string) || "20";
      const data = await gatePublicRequest(`/futures/${SETTLE}/order_book`, { contract, limit });
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/trades", async (req, res) => {
    try {
      const contract = (req.query.contract as string) || "BTC_USDT";
      const limit = (req.query.limit as string) || "30";
      const data = await gatePublicRequest(`/futures/${SETTLE}/trades`, { contract, limit });
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/candles", async (req, res) => {
    try {
      const contract = (req.query.contract as string) || "BTC_USDT";
      const interval = (req.query.interval as string) || "5m";
      const limit = (req.query.limit as string) || "100";
      const data = await gatePublicRequest(`/futures/${SETTLE}/candlesticks`, { contract, interval, limit });
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/contracts", async (req, res) => {
    try {
      const data = await gatePublicRequest(`/futures/${SETTLE}/contracts`);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/contracts/:name", async (req, res) => {
    try {
      const data = await gatePublicRequest(`/futures/${SETTLE}/contracts/${req.params.name}`);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Wallet connect — assigns a sub-account to the wallet ─────────────────

  app.post("/api/exchange/connect", async (req, res) => {
    try {
      const wallet = walletFromReq(req) || (req.body?.wallet as string)?.toLowerCase();
      if (!wallet) return res.status(400).json({ error: "wallet address required" });
      const subUid = await getOrAssignSubAccount(wallet);
      if (!subUid) return res.status(503).json({ error: "No available trading slots" });
      const pool = await db
        .select()
        .from(exchangeSubaccountPool)
        .where(eq(exchangeSubaccountPool.gateSubUid, subUid))
        .limit(1);
      res.json({ ok: true, sub_uid: subUid, login_name: pool[0]?.gateLoginName });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Authenticated trading (per-user sub-account) ──────────────────────────

  app.get("/api/exchange/account", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      const subUid = wallet ? await getOrAssignSubAccount(wallet) : undefined;
      const data = await gateAuthRequest("GET", `/futures/${SETTLE}/accounts`, {}, null, subUid ?? undefined);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/positions", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      const subUid = wallet ? await getOrAssignSubAccount(wallet) : undefined;
      const data = await gateAuthRequest("GET", `/futures/${SETTLE}/positions`, {}, null, subUid ?? undefined);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/position/:contract", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      const subUid = wallet ? await getOrAssignSubAccount(wallet) : undefined;
      const data = await gateAuthRequest("GET", `/futures/${SETTLE}/positions/${req.params.contract}`, {}, null, subUid ?? undefined);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/exchange/position/:contract/leverage", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      const subUid = wallet ? await getOrAssignSubAccount(wallet) : undefined;
      const { leverage } = req.body;
      const data = await gateAuthRequest("POST", `/futures/${SETTLE}/positions/${req.params.contract}/leverage`, {}, { leverage: String(leverage), cross_leverage_limit: "0" }, subUid ?? undefined);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/orders/open", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      const subUid = wallet ? await getOrAssignSubAccount(wallet) : undefined;
      const contract = (req.query.contract as string) || "BTC_USDT";
      const data = await gateAuthRequest("GET", `/futures/${SETTLE}/orders`, { contract, status: "open" }, null, subUid ?? undefined);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/orders/finished", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      const subUid = wallet ? await getOrAssignSubAccount(wallet) : undefined;
      const contract = (req.query.contract as string) || "BTC_USDT";
      const limit = (req.query.limit as string) || "20";
      const data = await gateAuthRequest("GET", `/futures/${SETTLE}/orders`, { contract, status: "finished", limit }, null, subUid ?? undefined);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/exchange/order", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      if (!wallet) return res.status(401).json({ error: "Wallet not connected" });
      const subUid = await getOrAssignSubAccount(wallet);
      if (!subUid) return res.status(503).json({ error: "No trading account available" });
      const data = await gateAuthRequest("POST", `/futures/${SETTLE}/orders`, {}, req.body, subUid);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/exchange/order/:orderId", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      const subUid = wallet ? await getOrAssignSubAccount(wallet) : undefined;
      const data = await gateAuthRequest("DELETE", `/futures/${SETTLE}/orders/${req.params.orderId}`, {}, null, subUid ?? undefined);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/exchange/close-position", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      if (!wallet) return res.status(401).json({ error: "Wallet not connected" });
      const subUid = await getOrAssignSubAccount(wallet);
      if (!subUid) return res.status(503).json({ error: "No trading account available" });
      const { contract } = req.body;
      const position = await gateAuthRequest("GET", `/futures/${SETTLE}/positions/${contract}`, {}, null, subUid);
      if (!position || position.size === 0) return res.json({ message: "No open position" });
      const closeOrder = { contract, size: 0, price: "0", tif: "ioc", close: true };
      const data = await gateAuthRequest("POST", `/futures/${SETTLE}/orders`, {}, closeOrder, subUid);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/exchange/position-history", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      const subUid = wallet ? await getOrAssignSubAccount(wallet) : undefined;
      const contract = req.query.contract as string | undefined;
      const params: Record<string, string> = {};
      if (contract) params.contract = contract;
      const data = await gateAuthRequest("GET", `/futures/${SETTLE}/position_close`, params, null, subUid ?? undefined);
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Status — returns trading availability + sub-account info ─────────────

  app.get("/api/exchange/status", async (req, res) => {
    try {
      const configured = !!(process.env.GATEIO_API_KEY && process.env.GATEIO_API_SECRET);
      const wallet = walletFromReq(req);
      let subUid: string | null = null;
      let loginName: string | null = null;
      if (wallet && configured) {
        const existing = await db
          .select()
          .from(exchangeTradingAccounts)
          .where(eq(exchangeTradingAccounts.walletAddress, wallet))
          .limit(1);
        if (existing.length > 0 && existing[0].gateSubUid) {
          subUid = existing[0].gateSubUid;
          const pool = await db
            .select()
            .from(exchangeSubaccountPool)
            .where(eq(exchangeSubaccountPool.gateSubUid, subUid))
            .limit(1);
          loginName = pool[0]?.gateLoginName ?? null;
        }
      }
      res.json({ ok: true, trading_enabled: configured, sub_uid: subUid, login_name: loginName });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Deposit / Withdraw ────────────────────────────────────────────────────
  // All deposit/withdraw is isolated to exchange-perps-routes only.
  // Architecture:
  //   Deposit  → user's sub-account deposit address (unique per sub-account on Gate.io)
  //              → user sends USDT directly → funds land in sub-account → detected by poll
  //   Withdraw → sub-account balance transfer to master → Gate.io external withdrawal

  // GET /api/exchange/deposit-address?chain=BSC
  // Returns the unique Gate.io deposit address for the user's sub-account
  app.get("/api/exchange/deposit-address", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      if (!wallet) return res.status(401).json({ error: "Wallet not connected" });
      const subUid = await getOrAssignSubAccount(wallet);
      if (!subUid) return res.status(503).json({ error: "No trading slot available" });
      const chain = (req.query.chain as string) || "BSC";
      const data = await gateAuthRequest("GET", "/wallet/deposit_address", { currency: "USDT" }, null, subUid);
      // Gate.io returns an array of address objects per chain
      const addrs: any[] = Array.isArray(data) ? data : (data?.multichain_addresses ?? []);
      const entry = addrs.find((a: any) =>
        (a.chain ?? "").toUpperCase() === chain.toUpperCase() ||
        (a.name ?? "").toUpperCase().includes(chain.toUpperCase())
      ) ?? addrs[0];
      if (!entry) return res.status(404).json({ error: "Deposit address not available for this chain" });
      return res.json({
        address: entry.address,
        chain: entry.chain ?? chain,
        memo: entry.payment_id ?? null,
        sub_uid: subUid,
      });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // POST /api/exchange/deposit/start  { chain, amount }
  // Creates a pending deposit record and returns the deposit address
  app.post("/api/exchange/deposit/start", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      if (!wallet) return res.status(401).json({ error: "Wallet not connected" });
      const subUid = await getOrAssignSubAccount(wallet);
      if (!subUid) return res.status(503).json({ error: "No trading slot available" });
      const { chain = "BSC" } = req.body as { chain?: string; amount?: string };

      // Get sub-account deposit address from Gate.io
      let depositAddress = "";
      let resolvedChain = chain;
      try {
        const data = await gateAuthRequest("GET", "/wallet/deposit_address", { currency: "USDT" }, null, subUid);
        const addrs: any[] = Array.isArray(data) ? data : (data?.multichain_addresses ?? []);
        const entry = addrs.find((a: any) =>
          (a.chain ?? "").toUpperCase() === chain.toUpperCase() ||
          (a.name ?? "").toUpperCase().includes(chain.toUpperCase())
        ) ?? addrs[0];
        depositAddress = entry?.address ?? "";
        resolvedChain = entry?.chain ?? chain;
      } catch { /* address fetch failed — record without address */ }

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
      const [row] = await db.insert(exchangeDepositHistory).values({
        walletAddress: wallet,
        amount: "0",
        currency: "USDT",
        status: "pending",
        depositAddress: depositAddress || null,
        chain: resolvedChain,
        subUid: subUid,
        expiresAt: expiresAt,
      }).returning();

      return res.json({
        ok: true,
        sessionId: row.id,
        depositAddress,
        chain: resolvedChain,
        expiresAt: expiresAt.toISOString(),
        sub_uid: subUid,
      });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // GET /api/exchange/deposits  — user's deposit history
  app.get("/api/exchange/deposits", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      if (!wallet) return res.status(401).json({ error: "Wallet not connected" });
      const rows = await db
        .select()
        .from(exchangeDepositHistory)
        .where(eq(exchangeDepositHistory.walletAddress, wallet))
        .orderBy(desc(exchangeDepositHistory.createdAt))
        .limit(50);
      return res.json(rows);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // GET /api/exchange/deposit/:id  — check single deposit status
  app.get("/api/exchange/deposit/:id", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      if (!wallet) return res.status(401).json({ error: "Wallet not connected" });
      const id = parseInt(req.params.id);
      const rows = await db
        .select()
        .from(exchangeDepositHistory)
        .where(and(eq(exchangeDepositHistory.id, id), eq(exchangeDepositHistory.walletAddress, wallet)))
        .limit(1);
      if (!rows.length) return res.status(404).json({ error: "Deposit not found" });
      return res.json(rows[0]);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // POST /api/exchange/withdraw  { amount, toAddress, chain }
  app.post("/api/exchange/withdraw", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      if (!wallet) return res.status(401).json({ error: "Wallet not connected" });
      const subUid = await getOrAssignSubAccount(wallet);
      if (!subUid) return res.status(503).json({ error: "No trading account" });

      const { amount, toAddress, chain = "BSC" } = req.body as {
        amount?: string; toAddress?: string; chain?: string;
      };
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 1) {
        return res.status(400).json({ error: "Minimum withdrawal is 1 USDT" });
      }
      if (!toAddress || !/^0x[0-9a-fA-F]{40}$/.test(toAddress)) {
        return res.status(400).json({ error: "Valid BSC wallet address required" });
      }

      // Check sub-account available balance
      const acct = await gateAuthRequest("GET", `/futures/${SETTLE}/accounts`, {}, null, subUid);
      const available = parseFloat(acct?.available ?? "0");
      if (available < parseFloat(amount)) {
        return res.status(400).json({ error: `Insufficient balance. Available: ${available.toFixed(4)} USDT` });
      }

      // Step 1: Transfer from sub-account futures → master futures
      await gateAuthRequest("POST", "/wallet/sub_account_transfers", {}, {
        currency: "USDT",
        sub_account: subUid,
        direction: "from",
        amount: amount,
        type: "futures",
      });

      // Step 2: Withdraw from master to user's wallet
      let gateWithdrawalId = "";
      let errMsg = "";
      try {
        const wdResult = await gateAuthRequest("POST", "/withdrawals", {}, {
          currency: "USDT",
          address: toAddress,
          amount: amount,
          chain: chain === "BSC" ? "BSC" : chain,
        });
        gateWithdrawalId = wdResult?.id ?? "";
      } catch (e: any) {
        errMsg = e.message;
      }

      const [row] = await db.insert(exchangeWithdrawalHistory).values({
        walletAddress: wallet,
        amount: amount,
        currency: "USDT",
        toAddress: toAddress,
        chain: chain,
        subUid: subUid,
        status: errMsg ? "failed" : "processing",
        gateWithdrawalId: gateWithdrawalId || null,
        errorMsg: errMsg || null,
      }).returning();

      if (errMsg) return res.status(500).json({ error: errMsg, record_id: row.id });
      return res.json({ ok: true, withdrawalId: row.id, gateId: gateWithdrawalId, status: "processing" });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // GET /api/exchange/withdrawals  — user's withdrawal history
  app.get("/api/exchange/withdrawals", async (req, res) => {
    try {
      const wallet = walletFromReq(req);
      if (!wallet) return res.status(401).json({ error: "Wallet not connected" });
      const rows = await db
        .select()
        .from(exchangeWithdrawalHistory)
        .where(eq(exchangeWithdrawalHistory.walletAddress, wallet))
        .orderBy(desc(exchangeWithdrawalHistory.createdAt))
        .limit(50);
      return res.json(rows);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── Background deposit poll ──────────────────────────────────────────────
  // Every 60s: check Gate.io deposit history for each sub-account with pending deposits
  // When a matching deposit arrives → mark credited
  async function pollPendingDeposits() {
    try {
      const now = new Date();
      const pending = await db
        .select()
        .from(exchangeDepositHistory)
        .where(and(
          eq(exchangeDepositHistory.status, "pending"),
          gt(exchangeDepositHistory.expiresAt, now),
        ));
      if (!pending.length) return;

      for (const dep of pending) {
        if (!dep.subUid) continue;
        try {
          // Fetch recent deposits for this sub-account
          const since = Math.floor(dep.createdAt.getTime() / 1000) - 60;
          const gateDeposits = await gateAuthRequest(
            "GET", "/wallet/deposits",
            { currency: "USDT", limit: "20", from: String(since) },
            null, dep.subUid
          );
          const arr: any[] = Array.isArray(gateDeposits) ? gateDeposits : [];
          for (const gd of arr) {
            if (gd.status !== "done") continue;
            // Already linked — mark credited
            if (dep.gateDepositId === String(gd.id)) {
              await db.update(exchangeDepositHistory)
                .set({ status: "credited", creditedAt: new Date(), gateDepositId: String(gd.id) })
                .where(eq(exchangeDepositHistory.id, dep.id));
              break;
            }
            // Match by deposit address (any amount received at this address counts)
            const addrMatch = dep.depositAddress &&
              gd.address &&
              String(gd.address).toLowerCase() === String(dep.depositAddress).toLowerCase();
            if (addrMatch) {
              const gdAmt = parseFloat(String(gd.amount ?? 0));
              await db.update(exchangeDepositHistory)
                .set({ status: "credited", creditedAt: new Date(), gateDepositId: String(gd.id), txHash: gd.txid, amount: String(gdAmt) })
                .where(eq(exchangeDepositHistory.id, dep.id));
              console.log(`[exchange] Deposit credited: ${gdAmt} USDT → wallet ${dep.walletAddress}`);
              break;
            }
          }
        } catch { /* skip individual failures */ }
      }

      // Expire sessions past their deadline
      await db.update(exchangeDepositHistory)
        .set({ status: "expired" })
        .where(and(
          eq(exchangeDepositHistory.status, "pending"),
          // expired ones: expiresAt <= now (no direct "lte" — use a raw approach via gt negation isn't clean, do it in JS)
        ));
      // JS-side expiry for any that slipped through
      for (const dep of pending) {
        if (dep.expiresAt && dep.expiresAt <= now) {
          await db.update(exchangeDepositHistory)
            .set({ status: "expired" })
            .where(eq(exchangeDepositHistory.id, dep.id));
        }
      }
    } catch { /* suppress poll errors */ }
  }

  setInterval(pollPendingDeposits, 60_000);
}
