import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const superAdminHash = await bcrypt.hash('AdminPassword123', 10);
  const avocat1Hash    = await bcrypt.hash('Avocat123!', 10);
  const juriste1Hash   = await bcrypt.hash('Juriste123!', 10);
  const salarie1Hash   = await bcrypt.hash('Salarie123!', 10);

  const users = [
    { id: crypto.randomUUID(), email: 'superadmin@easylaw.pt', name: 'Super Administrateur', hash: superAdminHash, role: 'super_admin' },
    { id: crypto.randomUUID(), email: 'admin@easylaw.pt',      name: 'Administrateur',       hash: superAdminHash, role: 'admin' },
    { id: crypto.randomUUID(), email: 'cabinet@easylaw.pt',    name: 'Cabinet Avocat',        hash: avocat1Hash,   role: 'cabinet_avocat' },
    { id: crypto.randomUUID(), email: 'avocat@easylaw.pt',     name: 'Maître Silva',          hash: avocat1Hash,   role: 'avocat' },
    { id: crypto.randomUUID(), email: 'associe@easylaw.pt',    name: 'Maître Costa',          hash: avocat1Hash,   role: 'avocat_associe' },
    { id: crypto.randomUUID(), email: 'juriste@easylaw.pt',    name: 'Dr. Santos',            hash: juriste1Hash,  role: 'juriste' },
    { id: crypto.randomUUID(), email: 'salarie@easylaw.pt',    name: 'Jean Dupont',           hash: salarie1Hash,  role: 'salarie' },
    { id: crypto.randomUUID(), email: 'assistant@easylaw.pt',  name: 'Marie Ferreira',        hash: salarie1Hash,  role: 'assistant' },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, email, name, password_hash, role, lang, is_verified)
       VALUES ($1, $2, $3, $4, $5, 'PT', 1)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         role = EXCLUDED.role,
         is_verified = EXCLUDED.is_verified`,
      [u.id, u.email, u.name, u.hash, u.role]
    );
    console.log(`Seeded: ${u.email} → ${u.role}`);
  }

  await pool.end();
}

seed().catch(console.error);
