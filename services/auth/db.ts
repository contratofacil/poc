import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

// If testing, default to ':memory:' database if not specified otherwise
const dbFile = process.env.NODE_ENV === 'test' 
  ? (process.env.DATABASE_FILE || ':memory:') 
  : (process.env.DATABASE_FILE || 'database.sqlite');

const dbPath = dbFile === ':memory:' ? ':memory:' : path.resolve(__dirname, dbFile);
const schemaPath = path.resolve(__dirname, 'db-schema.sql');

export const db = new sqlite3.Database(dbPath);

export const initDb = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema, (err) => {
        if (err) {
          console.error('Failed to initialize database schema:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const run = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export const get = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
};

export const all = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

export const closeDb = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

