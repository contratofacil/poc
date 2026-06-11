/**
 * Seed des 8 comptes de test EasyLaw — un par rôle.
 * Usage : npx tsx seed-test-users.ts
 *
 * Ces comptes correspondent aux fixtures Playwright dans
 * apps/frontend/tests/e2e/fixtures/test-users.ts
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { initDb, run, get, closeDb } from './db';

interface TestAccount {
  email: string;
  name: string;
  role: string;
  password: string;
  lang: 'FR' | 'PT';
}

const TEST_ACCOUNTS: TestAccount[] = [
  { email: 'superadmin@test.easylaw.pt', name: 'Alice Fontaine',      role: 'super_admin',    password: 'SuperAdmin123!', lang: 'FR' },
  { email: 'admin@test.easylaw.pt',      name: 'Bruno Pereira',       role: 'admin',          password: 'Admin123!',      lang: 'FR' },
  { email: 'cabinet@test.easylaw.pt',    name: 'Cabinet Oliveira',    role: 'cabinet_avocat', password: 'Cabinet123!',    lang: 'PT' },
  { email: 'avocat@test.easylaw.pt',     name: 'Maître Sofia Silva',  role: 'avocat',         password: 'Avocat123!',     lang: 'PT' },
  { email: 'associe@test.easylaw.pt',    name: 'Maître João Costa',   role: 'avocat_associe', password: 'Associe123!',    lang: 'PT' },
  { email: 'juriste@test.easylaw.pt',    name: 'Dr. Ana Santos',      role: 'juriste',        password: 'Juriste123!',    lang: 'FR' },
  { email: 'salarie@test.easylaw.pt',    name: 'Jean Dupont',         role: 'salarie',        password: 'Salarie123!',    lang: 'FR' },
  { email: 'assistant@test.easylaw.pt',  name: 'Marie Ferreira',      role: 'assistant',      password: 'Assistant123!',  lang: 'PT' },
];

async function seedTestUsers() {
  await initDb();

  console.log('🌱 Seeding test accounts...\n');

  for (const account of TEST_ACCOUNTS) {
    const existing = await get<{ id: string }>(
      'SELECT id FROM users WHERE email = ?',
      [account.email],
    );

    const passwordHash = await bcrypt.hash(account.password, 10);
    const id = existing?.id ?? crypto.randomUUID();
    const createdAt = new Date().toISOString();

    if (existing) {
      await run(
        `UPDATE users SET name = ?, password_hash = ?, role = ?, lang = ?, is_verified = 1, deleted_at = NULL WHERE id = ?`,
        [account.name, passwordHash, account.role, account.lang, id],
      );
      console.log(`  ↻  Updated : ${account.email} → ${account.role}`);
    } else {
      await run(
        `INSERT INTO users (id, email, name, password_hash, role, lang, is_verified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        [id, account.email, account.name, passwordHash, account.role, account.lang, createdAt],
      );
      console.log(`  ✓  Created : ${account.email} → ${account.role}`);
    }
  }

  console.log('\n✅ Test accounts ready.\n');
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│  Compte                          Rôle             Mot de passe  │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  for (const a of TEST_ACCOUNTS) {
    const emailPad  = a.email.padEnd(34);
    const rolePad   = a.role.padEnd(15);
    console.log(`│  ${emailPad} ${rolePad}  ${a.password.padEnd(12)} │`);
  }
  console.log('└─────────────────────────────────────────────────────────────────┘');

  await closeDb();
}

seedTestUsers().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
