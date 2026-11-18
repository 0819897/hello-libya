import { bigChallengePassed, buildBigChallenge } from './bigChallenge';
import { makeRng } from './rng';
import type { Lesson } from '../types';

const lesson = (u: number, l: number): Lesson => ({
  id: `g4-u${u}-l${l}`, title: 'T', titleAr: 'ت',
  words: Array.from({ length: 6 }, (_, i) => ({ en: `u${u}l${l}w${i}`, ar: 'ع', emoji: String.fromCodePoint(0x1f400 + u * 20 + l * 6 + i) })),
  blanks: [{ text: `u${u} ___ blank`, answer: `u${u}l${l}w0`, distractors: [`u${u}l${l}w1`, `u${u}l${l}w2`] }],
  games: [], challenge: { count: 8, types: ['pick-image', 'listen-pick', 'fill-blank', 'drag-order'] },
});
const units = [1, 2, 3].map(u => [lesson(u, 1), lesson(u, 2)]);
const unitOf = (id: string) => Number(id.match(/^g4-u(\d+)/)![1]);

test('three rounds of 10, each from its own unit only', () => {
  const { rounds } = buildBigChallenge(units, makeRng(1));
  expect(rounds.map(r => r.length)).toEqual([10, 10, 10]);
  rounds.forEach((r, n) => r.forEach(q => {
    expect(unitOf(q.id)).toBe(n + 1);
    if (q.wordEn) expect(q.wordEn.startsWith(`u${n + 1}`)).toBe(true);
  }));
});
test('generic game types only', () => {
  const { rounds, final } = buildBigChallenge(units, makeRng(2));
  for (const q of [...rounds.flat(), ...final]) expect(['pick-image', 'listen-pick', 'fill-blank', 'spell', 'true-false']).toContain(q.type);
});
test('final has 12 with at least 3 from each unit', () => {
  const { final } = buildBigChallenge(units, makeRng(3));
  expect(final).toHaveLength(12);
  for (const u of [1, 2, 3]) expect(final.filter(q => unitOf(q.id) === u).length).toBeGreaterThanOrEqual(3);
});
test('question ids are unique across the whole challenge', () => {
  const { rounds, final } = buildBigChallenge(units, makeRng(4));
  const ids = [...rounds.flat(), ...final].map(q => q.id);
  expect(new Set(ids).size).toBe(ids.length);
});
test('pass mark is 70%', () => {
  expect(bigChallengePassed(30, 42)).toBe(true);
  expect(bigChallengePassed(29, 42)).toBe(false);
  expect(bigChallengePassed(0, 0)).toBe(false);
});

test('works on the real Unit 1–3 lessons', async () => {
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const root = join(process.cwd(), 'public', 'content', 'grade4');
  const index = JSON.parse(readFileSync(join(root, 'index.json'), 'utf8'));
  const byUnit: Lesson[][] = index.units.filter((u: { kind: string; status: string }) => u.kind === 'unit' && u.status === 'open')
    .map((u: { lessons: { file: string }[] }) => u.lessons.map(r => JSON.parse(readFileSync(join(root, r.file), 'utf8'))));
  expect(byUnit).toHaveLength(3);
  const { rounds, final } = buildBigChallenge(byUnit, makeRng(9));
  expect(rounds.map(r => r.length)).toEqual([10, 10, 10]);
  expect(final).toHaveLength(12);
});

test('works on the real Grade 5 Unit 1–4 lessons', async () => {
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const root = join(process.cwd(), 'public', 'content', 'grade5');
  const index = JSON.parse(readFileSync(join(root, 'index.json'), 'utf8'));
  const byUnit: Lesson[][] = index.units.filter((u: { kind: string; status: string }) => u.kind === 'unit' && u.status === 'open')
    .map((u: { lessons: { file: string }[] }) => u.lessons.map(r => JSON.parse(readFileSync(join(root, r.file), 'utf8'))));
  expect(byUnit).toHaveLength(4);
  const { rounds, final } = buildBigChallenge(byUnit, makeRng(11));
  expect(rounds.map(r => r.length)).toEqual([10, 10, 10, 10]);
  expect(final).toHaveLength(12);
  for (const u of [1, 2, 3, 4]) {
    expect(final.filter(q => q.id.startsWith(`g5-u${u}-`)).length).toBeGreaterThanOrEqual(3);
  }
});
