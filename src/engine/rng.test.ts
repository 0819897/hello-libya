import { makeRng, shuffle } from './rng';

test('rng deterministic and in [0,1)', () => {
  const a = makeRng(5), b = makeRng(5);
  for (let i = 0; i < 50; i++) {
    const x = a(); expect(x).toBe(b()); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1);
  }
});
test('shuffle keeps items and does not mutate', () => {
  const xs = [1, 2, 3, 4, 5]; const s = shuffle(xs, makeRng(1));
  expect([...s].sort()).toEqual(xs); expect(xs).toEqual([1, 2, 3, 4, 5]);
});
