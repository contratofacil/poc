import { createRemoteJWKSet, jwtVerify } from 'jose';
import crypto from 'crypto';
import { run, get } from './db';

/**
 * Pont Privy → utilisateurs EasyLaw.
 *
 * Le frontend s'authentifie via Privy (privy.io) et envoie le token d'accès
 * Privy (ES256, signé par Privy) en Bearer. Ce module le vérifie contre le
 * JWKS public de l'app Privy, puis rattache le DID Privy à une ligne `users` :
 *   1. par `privy_did` si déjà lié ;
 *   2. sinon par email (récupéré via l'API Privy) — le rôle existant est
 *      conservé, le DID est lié ;
 *   3. sinon l'utilisateur est créé avec le rôle par défaut `client`.
 */

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || '';

const JWKS = PRIVY_APP_ID
  ? createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`))
  : null;

export interface AuthUserRow {
  id: string;
  email: string;
  role: string;
  deleted_at?: string | null;
}

export const isPrivyConfigured = (): boolean => !!PRIVY_APP_ID;

/** Vérifie un token d'accès Privy et renvoie le DID (`sub`), ou null. */
export const verifyPrivyToken = async (token: string): Promise<string | null> => {
  if (!JWKS) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'privy.io',
      audience: PRIVY_APP_ID,
    });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
};

/** Récupère l'email d'un utilisateur Privy via l'API serveur (Basic auth). */
const fetchPrivyEmail = async (did: string): Promise<{ email: string | null; name: string | null }> => {
  if (!PRIVY_APP_SECRET) return { email: null, name: null };
  const res = await fetch(`https://auth.privy.io/api/v1/users/${did}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString('base64')}`,
      'privy-app-id': PRIVY_APP_ID,
    },
  });
  if (!res.ok) return { email: null, name: null };
  const data: any = await res.json();
  const accounts: any[] = data.linked_accounts || [];
  const emailAccount = accounts.find((a) => typeof a.address === 'string' && a.address.includes('@'))
    || accounts.find((a) => typeof a.email === 'string');
  const email = emailAccount?.address || emailAccount?.email || null;
  const name = accounts.find((a) => typeof a.name === 'string')?.name || null;
  return { email, name };
};

/**
 * Résout (ou provisionne) l'utilisateur local correspondant à un DID Privy.
 * Renvoie null si le token est valide mais qu'aucun utilisateur ne peut être
 * résolu (ex: pas d'email côté Privy et pas de liaison existante).
 */
export const resolvePrivyUser = async (did: string): Promise<AuthUserRow | null> => {
  const linked = await get<AuthUserRow>(
    'SELECT id, email, role, deleted_at FROM users WHERE privy_did = ? AND deleted_at IS NULL',
    [did]
  );
  if (linked) return linked;

  const { email, name } = await fetchPrivyEmail(did);
  if (!email) return null;

  const byEmail = await get<AuthUserRow>(
    'SELECT id, email, role, deleted_at FROM users WHERE email = ? AND deleted_at IS NULL',
    [email]
  );
  if (byEmail) {
    await run('UPDATE users SET privy_did = ? WHERE id = ?', [did, byEmail.id]);
    return byEmail;
  }

  // Premier login Privy sans compte existant → provisionnement en `client`.
  // password_hash aléatoire : le compte n'est utilisable que via Privy.
  const id = crypto.randomUUID();
  await run(
    `INSERT INTO users (id, email, name, password_hash, role, lang, is_verified, privy_did)
     VALUES (?, ?, ?, ?, 'client', 'PT', 1, ?)`,
    [id, email, name, crypto.randomBytes(32).toString('hex'), did]
  );
  return { id, email, role: 'client' };
};
