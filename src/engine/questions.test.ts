import { buildChallenge, buildQuestions, thisIs } from './questions';
import { makeRng } from './rng';
import { lesson10, lesson4, withAbstract, withSentences } from './fixtures';

test('pick-image builds 4 distinct options containing the answer', () => {
  const qs = buildQuestions(lesson10, { type: 'pick-image', count: 6 }, makeRng(1));
  expect(qs).toHaveLength(6);
  qs.forEach(q => {
    expect(q.options).toHaveLength(4);
    expect(q.options!.map(o => o.id)).toContain(q.answer);
    expect(new Set(q.options!.map(o => o.id)).size).toBe(4);
  });
});
test('clamps count', () => expect(buildQuestions(lesson4, { type: 'pick-image', count: 9 }, makeRng(1))).toHaveLength(4));
test('deterministic', () => expect(buildQuestions(lesson10, { type: 'pick-image', count: 6 }, makeRng(1)))
  .toEqual(buildQuestions(lesson10, { type: 'pick-image', count: 6 }, makeRng(1))));
test('abstract and picture-less words are never pick-image or true-false targets', () => {
  for (const type of ['pick-image', 'true-false'] as const) {
    const qs = buildQuestions(withAbstract, { type, count: 10 }, makeRng(2));
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.every(q => q.wordEn !== 'whose' && q.wordEn !== 'nopic')).toBe(true);
  }
});
test('order-sentence tiles are the sentence words shuffled', () => {
  const o = buildQuestions(withSentences, { type: 'order-sentence', count: 1 }, makeRng(3))[0];
  expect([...o.tiles!].sort()).toEqual([...(o.answer as string[])].sort());
  expect(o.tiles).not.toEqual(o.answer);
});
test('games with no source data return []', () => {
  expect(buildQuestions(lesson4, { type: 'fill-blank' }, makeRng(1))).toEqual([]);
  expect(buildQuestions(lesson4, { type: 'order-sentence' }, makeRng(1))).toEqual([]);
});
test('challenge does not exceed count', () =>
  expect(buildChallenge(lesson10, makeRng(1)).length).toBeLessThanOrEqual(lesson10.challenge.count));
test('challenge mixes types', () =>
  expect(new Set(buildChallenge(lesson10, makeRng(1)).map(q => q.type)).size).toBeGreaterThan(1));
test('listen-pick has listen flag and text options', () => {
  const q = buildQuestions(lesson10, { type: 'listen-pick', count: 1 }, makeRng(1))[0];
  expect(q.listen).toBe(true); expect(q.options!.every(o => o.text)).toBe(true);
});
test('match groups of 4-5, arabic for abstract or picture-less words', () => {
  const qs = buildQuestions(withAbstract, { type: 'match', count: 5 }, makeRng(1));
  expect(qs.length).toBeGreaterThan(0);
  qs.forEach(q => { expect(q.pairs!.length).toBeGreaterThanOrEqual(4); expect(q.pairs!.length).toBeLessThanOrEqual(5); });
  const whose = qs.flatMap(q => q.pairs!).find(p => p.left.id === 'whose');
  if (whose) expect(whose.right.text).toBe('whose-ar');
});
test('spell gives letters plus 2 extra, single words only', () => {
  const qs = buildQuestions(lesson10, { type: 'spell', count: 10 }, makeRng(1));
  expect(qs.length).toBeGreaterThan(0);
  qs.forEach(q => expect(q.tiles!.length).toBe((q.answer as string[]).length + 2));
  expect(qs.every(q => !q.wordEn!.includes(' '))).toBe(true);
});
test('fill-blank options include the answer and distractors', () => {
  const q = buildQuestions(withSentences, { type: 'fill-blank' }, makeRng(1))[0];
  expect(q.options!.map(o => o.text).sort()).toEqual(['Grade', 'age', 'mum'].sort()); expect(q.answer).toBe('Grade');
});
test('true-false roughly half true', () => {
  const qs = buildQuestions(lesson10, { type: 'true-false', count: 10 }, makeRng(4));
  const t = qs.filter(q => q.answer === 'true').length; expect(t).toBeGreaterThan(1); expect(t).toBeLessThan(9);
});
test('special games pass config through, one question per round', () => {
  const qs = buildQuestions(lesson4, { type: 'clock', config: { times: ['3.30', '12.00'] } }, makeRng(1));
  expect(qs).toHaveLength(2); expect(qs[1].config).toEqual({ times: ['3.30', '12.00'], round: 1 });
  expect(buildQuestions(lesson4, { type: 'drag-order', config: { mode: 'sequence', items: [] } }, makeRng(1))).toHaveLength(1);
  expect(buildQuestions(lesson4, { type: 'stall' }, makeRng(1))).toEqual([]);
});
test('listen-pick with config.show = picture uses the word pictures (e.g. numerals) as options', () => {
  const q = buildQuestions(lesson10, { type: 'listen-pick', count: 1, config: { show: 'picture' } }, makeRng(1))[0];
  expect(q.options!.every(o => o.emoji && !o.text)).toBe(true);
});
test('thisIs picks the right form', () => {
  expect(['pen', 'apple', 'apples', 'milk', 'Libya', 'PE', 'T-shirt', 'sports trousers', 'oil field'].map(thisIs)).toEqual([
    'This is a pen.', 'This is an apple.', 'These are apples.', 'This is milk.', 'This is Libya.', 'This is PE.',
    'This is a T-shirt.', 'These are sports trousers.', 'This is an oil field.']);
});
