import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Use PostgreSQL if DATABASE_URL is set, otherwise fall back to SQLite (POC local)
const USE_PG = !!process.env.DATABASE_URL;

// --- PostgreSQL path ---
const pool = USE_PG ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

// --- SQLite path (only loaded when DATABASE_URL is not set) ---
const dbFile = process.env.NODE_ENV === 'test'
  ? (process.env.DATABASE_FILE || ':memory:')
  : (process.env.DATABASE_FILE || 'database.sqlite');
const dbPath = dbFile === ':memory:' ? ':memory:' : path.resolve(__dirname, dbFile);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sqliteDb = USE_PG ? null : (() => { const sqlite3 = require('sqlite3'); return new sqlite3.Database(dbPath); })();

function toPostgresParams(sql: string, params: any[]): { text: string; values: any[] } {
  let i = 0;
  const text = sql.replace(/\?/g, () => `$${++i}`);
  return { text, values: params };
}

/**
 * Story 6-3: lightweight migrations for columns that CREATE TABLE IF NOT EXISTS
 * can't add to pre-existing tables. Adding new tables via the schema file is
 * fine; adding new columns to existing tables needs ALTER TABLE.
 *
 * The list below stays small: each entry tries `ALTER TABLE ... ADD COLUMN`
 * and swallows the "duplicate column" / "already exists" error so the call is
 * idempotent across fresh and stale databases.
 */
const ADD_COLUMN_MIGRATIONS: Array<{ table: string; column: string; sql: string }> = [
  { table: 'contracts', column: 'r2_key', sql: 'ALTER TABLE contracts ADD COLUMN r2_key TEXT' },
];

async function runAdditiveMigrations(): Promise<void> {
  for (const m of ADD_COLUMN_MIGRATIONS) {
    try {
      if (USE_PG && pool) {
        await pool.query(m.sql);
      } else {
        await new Promise<void>((resolve, reject) => {
          sqliteDb!.exec(m.sql, (err: any) => err ? reject(err) : resolve());
        });
      }
    } catch (err: any) {
      const msg = String(err?.message || err);
      // SQLite: "duplicate column name". PG: "column ... already exists". Both fine.
      if (/duplicate column|already exists/i.test(msg)) continue;
      // Table doesn't exist yet (e.g. very first init before schema applies) — also fine.
      if (/no such table/i.test(msg)) continue;
      throw err;
    }
  }
}

export const initDb = async (): Promise<void> => {
  const schemaPath = path.resolve(__dirname, 'db-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  if (USE_PG && pool) {
    await pool.query(schema);
  } else {
    await new Promise<void>((resolve, reject) => {
      sqliteDb!.exec(schema, (err: any) => err ? reject(err) : resolve());
    });
  }
  await runAdditiveMigrations();
};

export const run = async (sql: string, params: any[] = []): Promise<void> => {
  if (USE_PG && pool) {
    const { text, values } = toPostgresParams(sql, params);
    await pool.query(text, values);
  } else {
    await new Promise<void>((resolve, reject) => {
      sqliteDb!.run(sql, params, (err: any) => err ? reject(err) : resolve());
    });
  }
};

export const get = async <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  if (USE_PG && pool) {
    const { text, values } = toPostgresParams(sql, params);
    const result = await pool.query(text, values);
    return result.rows[0] as T | undefined;
  } else {
    return new Promise<T | undefined>((resolve, reject) => {
      sqliteDb!.get(sql, params, (err: any, row: any) => err ? reject(err) : resolve(row as T));
    });
  }
};

export const all = async <T>(sql: string, params: any[] = []): Promise<T[]> => {
  if (USE_PG && pool) {
    const { text, values } = toPostgresParams(sql, params);
    const result = await pool.query(text, values);
    return result.rows as T[];
  } else {
    return new Promise<T[]>((resolve, reject) => {
      sqliteDb!.all(sql, params, (err: any, rows: any) => err ? reject(err) : resolve(rows as T[]));
    });
  }
};

export const closeDb = async (): Promise<void> => {
  if (USE_PG && pool) {
    await pool.end();
  } else {
    await new Promise<void>((resolve, reject) => {
      sqliteDb!.close((err: any) => err ? reject(err) : resolve());
    });
  }
};

export { pool };
