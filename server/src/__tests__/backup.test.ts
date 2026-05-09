import { describe, it, expect } from 'vitest';
import { __test_only__ } from '../services/backup.service';

describe('Phase 19A — backup encryption round-trip', () => {
  it('encrypts and decrypts with the same passphrase', () => {
    const plain = JSON.stringify({ charts: [{ label: 'Test' }, { label: 'Two' }] });
    const env = __test_only__.encrypt(plain, 'correct horse battery staple');
    expect(env.encrypted).toBe(true);
    expect(env.ciphertext).not.toBe(plain);
    const out = __test_only__.decrypt(env, 'correct horse battery staple');
    expect(out).toBe(plain);
  });

  it('fails to decrypt with wrong passphrase', () => {
    const env = __test_only__.encrypt('secret', 'right');
    expect(() => __test_only__.decrypt(env, 'wrong')).toThrow();
  });

  it('ciphertext changes each time (different IV/salt)', () => {
    const a = __test_only__.encrypt('hello', 'pw');
    const b = __test_only__.encrypt('hello', 'pw');
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
    expect(a.salt).not.toBe(b.salt);
  });
});
