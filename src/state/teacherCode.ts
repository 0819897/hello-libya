/**
 * Teacher code: turning teacher mode ON needs a code chosen by the school.
 *
 * The code itself is never in the repository or the app. It is stored as the GitHub Actions secret
 * TEACHER_CODE; at build time vite.config.ts turns it into a salted PBKDF2-SHA256 hash, and only that
 * hash ships in the app. Without the secret, teacher mode cannot be turned on at all.
 *
 * This stops students, not a determined programmer: the app has no server, so a short code could be
 * brute-forced from the hash offline. That is an accepted trade-off for a children's learning app.
 */
export type TeacherHash = { salt: string; iterations: number; hash: string };

export const MAX_TRIES = 5;
export const LOCK_MS = 5 * 60 * 1000;
const LOCK_KEY = 'eq.teacherlock.v1';

export const builtInHash: TeacherHash | null =
  typeof __TEACHER_HASH__ !== 'undefined' ? (__TEACHER_HASH__ as TeacherHash | null) : null;

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const unhex = (s: string) => new Uint8Array((s.match(/../g) ?? []).map(h => parseInt(h, 16)));

/** Normalises what the teacher typed: trims spaces and turns Arabic-Indic digits (٠١٢…) into 0-9. */
export function normaliseCode(input: string): string {
  return input.trim().replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06f0));
}

export async function hashCode(code: string, salt: string, iterations: number): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('no WebCrypto');
  const key = await subtle.importKey('raw', new TextEncoder().encode(normaliseCode(code)), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(salt), iterations }, key, 256);
  return hex(bits);
}

type LockState = { fails: number; until: number };

function readLock(): LockState {
  try {
    const p = JSON.parse(localStorage.getItem(LOCK_KEY) ?? '') as Partial<LockState>;
    return { fails: typeof p.fails === 'number' ? p.fails : 0, until: typeof p.until === 'number' ? p.until : 0 };
  } catch { return { fails: 0, until: 0 }; }
}
function writeLock(s: LockState) {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/** Milliseconds left before another attempt is allowed (0 = may try now). */
export function lockRemaining(now = Date.now()): number {
  return Math.max(0, readLock().until - now);
}

export type CheckResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'locked' | 'wrong'; triesLeft?: number; waitMs?: number };

export async function checkTeacherCode(input: string, config: TeacherHash | null = builtInHash, now = Date.now()): Promise<CheckResult> {
  if (!config) return { ok: false, reason: 'not-configured' };
  const wait = lockRemaining(now);
  if (wait > 0) return { ok: false, reason: 'locked', waitMs: wait };
  let match = false;
  try { match = (await hashCode(input, config.salt, config.iterations)) === config.hash; } catch { match = false; }
  if (match) { writeLock({ fails: 0, until: 0 }); return { ok: true }; }
  const fails = readLock().fails + 1;
  if (fails >= MAX_TRIES) {
    writeLock({ fails: 0, until: now + LOCK_MS });
    return { ok: false, reason: 'locked', waitMs: LOCK_MS };
  }
  writeLock({ fails, until: 0 });
  return { ok: false, reason: 'wrong', triesLeft: MAX_TRIES - fails };
}
