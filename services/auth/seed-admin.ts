import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import crypto from 'crypto';

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function seed() {
  const adminPasswordHash = await bcrypt.hash('AdminPassword123', 10);
  const clientPasswordHash = await bcrypt.hash('ClientPassword123', 10);

  const adminId = crypto.randomUUID();
  const clientId = crypto.randomUUID();

  db.serialize(() => {
    // Enable tables if they do not exist
    db.run("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, password_hash TEXT NOT NULL, role TEXT DEFAULT 'client', lang TEXT DEFAULT 'PT', is_verified INTEGER DEFAULT 0, verification_token TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT)");

    // Insert Admin
    db.run(
      "INSERT OR REPLACE INTO users (id, email, name, password_hash, role, lang, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [adminId, 'admin@easylaw.pt', 'Cabinet Administrator', adminPasswordHash, 'admin_cabinet', 'FR', 1],
      (err) => {
        if (err) console.error('Error seeding admin:', err);
        else console.log('Successfully seeded Admin account: admin@easylaw.pt / AdminPassword123');
      }
    );

    // Insert Client
    db.run(
      "INSERT OR REPLACE INTO users (id, email, name, password_hash, role, lang, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [clientId, 'client@easylaw.pt', 'Jean Dupont', clientPasswordHash, 'client', 'FR', 1],
      (err) => {
        if (err) console.error('Error seeding client:', err);
        else {
          console.log('Successfully seeded Client account: client@easylaw.pt / ClientPassword123');
          db.close();
        }
      }
    );
  });
}

seed().catch(console.error);
