import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, boolean, numeric, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  nonce: text("nonce"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Exchange Perps (Gate.io integration) ─────────────────────────────────────

export const exchangeTradingAccounts = pgTable("exchange_trading_accounts", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  gateSubUid: text("gate_sub_uid"),
  gateApiKey: text("gate_api_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const exchangeUserBalances = pgTable("exchange_user_balances", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  available: numeric("available").notNull().default("0"),
  unrealisedPnl: numeric("unrealised_pnl").notNull().default("0"),
  total: numeric("total").notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const exchangeDepositHistory = pgTable("exchange_deposit_history", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  txHash: text("tx_hash"),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull().default("USDT"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  depositAddress: text("deposit_address"),
  chain: text("chain").default("BSC"),
  subUid: text("sub_uid"),
  expiresAt: timestamp("expires_at"),
  creditedAt: timestamp("credited_at"),
  gateDepositId: text("gate_deposit_id"),
});

export const exchangeWithdrawalHistory = pgTable("exchange_withdrawal_history", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  txHash: text("tx_hash"),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull().default("USDT"),
  toAddress: text("to_address"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  chain: text("chain").default("BSC"),
  subUid: text("sub_uid"),
  gateWithdrawalId: text("gate_withdrawal_id"),
  completedAt: timestamp("completed_at"),
  errorMsg: text("error_msg"),
});

export const exchangeSubaccountPool = pgTable("exchange_subaccount_pool", {
  id: serial("id").primaryKey(),
  gateSubUid: text("gate_sub_uid").notNull().unique(),
  gateLoginName: text("gate_login_name"),
  gateApiKey: text("gate_api_key"),
  inUse: boolean("in_use").notNull().default(false),
  assignedWallet: text("assigned_wallet"),
  assignedAt: timestamp("assigned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Platform-wide settings (key-value store) ───────────────────────────────────
export const platformSettings = pgTable("platform_settings", {
  key:       text("key").primaryKey(),
  value:     text("value").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type User = typeof users.$inferSelect;
export const insertUserSchema = createInsertSchema(users).pick({ walletAddress: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
