/**
 * Unit tests for envelope encryption module (Story 6-3 / AC-2, AC-8).
 *
 * Verifies:
 *  - round-trip plaintext → encrypt → decrypt → plaintext
 *  - tampered AuthTag is rejected (GCM authentication works)
 *  - wrong KEK is rejected
 *  - KEK env validation at module load
 */
import { encryptFile, decryptFile, _resetKekCache, getKek, generateKekB64 } from './envelope';

const VALID_KEK = generateKekB64();

describe('envelope encryption', () => {
  let savedKek: string | undefined;

  beforeAll(() => {
    savedKek = process.env.VAULT_KEK_B64;
  });

  afterAll(() => {
    if (savedKek === undefined) delete process.env.VAULT_KEK_B64;
    else process.env.VAULT_KEK_B64 = savedKek;
    _resetKekCache();
  });

  beforeEach(() => {
    process.env.VAULT_KEK_B64 = VALID_KEK;
    _resetKekCache();
  });

  test('round-trip preserves plaintext bytes', () => {
    const plaintext = Buffer.from('Hello, EasyLaw vault — accentué et 🔐.', 'utf8');
    const { ciphertext, encryptedDek } = encryptFile(plaintext);

    // sanity: ciphertext header is at least IV+AuthTag
    expect(ciphertext.length).toBeGreaterThanOrEqual(28);
    expect(typeof encryptedDek).toBe('string');
    expect(encryptedDek.length).toBeGreaterThan(0);

    const decrypted = decryptFile(ciphertext, encryptedDek);
    expect(decrypted.equals(plaintext)).toBe(true);
  });

  test('large binary plaintext round-trips', () => {
    const plaintext = Buffer.alloc(64 * 1024); // 64 KB
    for (let i = 0; i < plaintext.length; i++) plaintext[i] = i & 0xff;
    const { ciphertext, encryptedDek } = encryptFile(plaintext);
    const decrypted = decryptFile(ciphertext, encryptedDek);
    expect(decrypted.equals(plaintext)).toBe(true);
  });

  test('two encryptions of the same plaintext produce different ciphertexts (IV is fresh)', () => {
    const plaintext = Buffer.from('repeat-me');
    const a = encryptFile(plaintext);
    const b = encryptFile(plaintext);
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
    expect(a.encryptedDek).not.toBe(b.encryptedDek);
  });

  test('tampered ciphertext (flip last byte) is rejected with auth error', () => {
    const plaintext = Buffer.from('integrity matters');
    const { ciphertext, encryptedDek } = encryptFile(plaintext);
    const tampered = Buffer.from(ciphertext);
    tampered[tampered.length - 1] ^= 0xff;
    expect(() => decryptFile(tampered, encryptedDek)).toThrow();
  });

  test('tampered AuthTag is rejected', () => {
    const plaintext = Buffer.from('integrity matters');
    const { ciphertext, encryptedDek } = encryptFile(plaintext);
    const tampered = Buffer.from(ciphertext);
    // AuthTag lives at bytes [12, 28)
    tampered[15] ^= 0x01;
    expect(() => decryptFile(tampered, encryptedDek)).toThrow();
  });

  test('decryption with a different KEK fails', () => {
    const plaintext = Buffer.from('secret');
    const { ciphertext, encryptedDek } = encryptFile(plaintext);

    // Rotate the KEK to something else
    process.env.VAULT_KEK_B64 = generateKekB64();
    _resetKekCache();

    expect(() => decryptFile(ciphertext, encryptedDek)).toThrow();
  });

  test('truncated ciphertext blob throws explicit error', () => {
    expect(() => decryptFile(Buffer.alloc(5), 'AA==')).toThrow(/shorter than IV/);
  });

  test('encryptFile rejects non-Buffer input', () => {
    // @ts-expect-error — testing runtime guard
    expect(() => encryptFile('string-not-buffer')).toThrow(TypeError);
  });

  test('decryptFile rejects empty encryptedDek', () => {
    expect(() => decryptFile(Buffer.alloc(28), '')).toThrow(TypeError);
  });
});

describe('envelope KEK config', () => {
  let savedKek: string | undefined;

  beforeAll(() => {
    savedKek = process.env.VAULT_KEK_B64;
  });

  afterAll(() => {
    if (savedKek === undefined) delete process.env.VAULT_KEK_B64;
    else process.env.VAULT_KEK_B64 = savedKek;
    _resetKekCache();
  });

  test('missing VAULT_KEK_B64 throws', () => {
    delete process.env.VAULT_KEK_B64;
    _resetKekCache();
    expect(() => getKek()).toThrow(/VAULT_KEK_B64/);
  });

  test('KEK with wrong length throws explicit error', () => {
    process.env.VAULT_KEK_B64 = Buffer.alloc(16).toString('base64'); // 16 bytes, not 32
    _resetKekCache();
    expect(() => getKek()).toThrow(/32 bytes/);
  });

  test('valid KEK is cached across calls', () => {
    process.env.VAULT_KEK_B64 = VALID_KEK;
    _resetKekCache();
    const a = getKek();
    const b = getKek();
    expect(a).toBe(b); // same Buffer reference (cached)
  });

  test('generateKekB64 produces a base64 32-byte key', () => {
    const k = generateKekB64();
    expect(Buffer.from(k, 'base64').length).toBe(32);
  });
});
