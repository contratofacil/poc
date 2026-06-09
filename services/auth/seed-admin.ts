import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const adminPasswordHash = await bcrypt.hash('AdminPassword123', 10);
  const clientPasswordHash = await bcrypt.hash('ClientPassword123', 10);

  const adminId = crypto.randomUUID();
  const clientId = crypto.randomUUID();

  await pool.query(`
    INSERT INTO users (id, email, name, password_hash, role, lang, is_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      is_verified = EXCLUDED.is_verified
  `, [adminId, 'admin@easylaw.pt', 'Cabinet Administrator', adminPasswordHash, 'admin_cabinet', 'FR', 1]);
  console.log('Admin account seeded: admin@easylaw.pt / AdminPassword123');

  await pool.query(`
    INSERT INTO users (id, email, name, password_hash, role, lang, is_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      is_verified = EXCLUDED.is_verified
  `, [clientId, 'client@easylaw.pt', 'Jean Dupont', clientPasswordHash, 'client', 'FR', 1]);
  console.log('Client account seeded: client@easylaw.pt / ClientPassword123');

  await pool.end();
}

seed().catch(console.error);
