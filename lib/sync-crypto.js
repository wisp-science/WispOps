import { randomBytes, scrypt } from 'node:crypto';
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
const AAD = Buffer.from('WispOps encrypted sync v1; scrypt N=32768 r=8 p=1; XChaCha20-Poly1305');
export const MAX_SYNC_BYTES = 8 * 1024 * 1024;
async function derive(passphrase, salt) {
    if (typeof passphrase !== 'string' || passphrase.length < 12 || passphrase.length > 1024)
        throw new Error('Sync passphrase must contain 12–1024 characters');
    return new Promise((resolve, reject) => scrypt(passphrase, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, key) => e ? reject(e) : resolve(key)));
}
export async function sealSync(value, passphrase) {
    const plain = Buffer.from(JSON.stringify(value));
    if (plain.length > MAX_SYNC_BYTES / 2)
        throw new Error('Sync snapshot is too large');
    const salt = randomBytes(16), nonce = randomBytes(24), key = await derive(passphrase, salt);
    try {
        return JSON.stringify({ format: 'wispops-sync', version: 1, salt: salt.toString('base64'), nonce: nonce.toString('base64'), ciphertext: Buffer.from(xchacha20poly1305(key, nonce, AAD).encrypt(plain)).toString('base64') });
    }
    finally {
        key.fill(0);
        plain.fill(0);
    }
}
export async function openSync(text, passphrase) {
    if (Buffer.byteLength(text) > MAX_SYNC_BYTES)
        throw new Error('Sync snapshot is too large');
    try {
        const e = JSON.parse(text);
        if (e.format !== 'wispops-sync' || e.version !== 1 || typeof e.salt !== 'string' || typeof e.nonce !== 'string' || typeof e.ciphertext !== 'string')
            throw new Error();
        const salt = Buffer.from(e.salt, 'base64'), nonce = Buffer.from(e.nonce, 'base64'), ciphertext = Buffer.from(e.ciphertext, 'base64');
        if (salt.length !== 16 || nonce.length !== 24 || ciphertext.length < 16)
            throw new Error();
        const key = await derive(passphrase, salt);
        try {
            const plain = xchacha20poly1305(key, nonce, AAD).decrypt(ciphertext);
            try {
                return JSON.parse(Buffer.from(plain).toString('utf8'));
            }
            finally {
                plain.fill(0);
            }
        }
        finally {
            key.fill(0);
        }
    }
    catch {
        throw new Error('Cannot decrypt sync snapshot: incorrect passphrase, damaged data or unsupported format');
    }
}
