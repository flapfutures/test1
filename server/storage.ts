import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users, type User } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export const storage = {
  async getUser(walletAddress: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.walletAddress, walletAddress.toLowerCase()));
    return rows[0];
  },

  async upsertUser(walletAddress: string): Promise<User> {
    const addr = walletAddress.toLowerCase();
    const existing = await this.getUser(addr);
    if (existing) return existing;
    const inserted = await db.insert(users).values({ walletAddress: addr, nonce: randomUUID() }).returning();
    return inserted[0];
  },

  async setNonce(walletAddress: string, nonce: string): Promise<void> {
    await db.update(users).set({ nonce }).where(eq(users.walletAddress, walletAddress.toLowerCase()));
  },
};
