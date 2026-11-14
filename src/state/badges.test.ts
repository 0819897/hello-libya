import { awardBadges, defaultProgress } from './progress';
import type { GradeIndex, Progress } from '../types';

const ref = (id: string) => ({ id, file: '', title: '', titleAr: '' });
const grade: GradeIndex = { id: 'grade4', titleAr: '', levelTitleAr: '', units: [
  { id: 'u1', title: '', titleAr: '', status: 'open', kind: 'unit', lessons: [ref('a'), ref('b')] },
  { id: 'u2', title: '', titleAr: '', status: 'open', kind: 'unit', lessons: [ref('c')] },
  { id: 'u4', title: '', titleAr: '', status: 'open', kind: 'big-challenge', lessons: [] }] };
const s = (stars: 0 | 1 | 2 | 3) => ({ stars, bestPct: 0 });
const with_ = (x: Partial<Progress>) => ({ ...defaultProgress(), ...x });

test('no badges for a new learner', () => expect(awardBadges(defaultProgress(), grade)).toEqual([]));
test('first-lesson after any lesson with a star', () => {
  expect(awardBadges(with_({ lessons: { a: s(0) } }), grade)).toEqual([]);
  expect(awardBadges(with_({ lessons: { b: s(1) } }), grade)).toEqual(['first-lesson']);
});
test('unit-done when every lesson of one unit has a star; unit-3stars when all have 3', () => {
  expect(awardBadges(with_({ lessons: { a: s(1), b: s(2) } }), grade)).toEqual(['first-lesson', 'unit-done']);
  expect(awardBadges(with_({ lessons: { c: s(3) } }), grade)).toEqual(['first-lesson', 'unit-done', 'unit-3stars']);
  expect(awardBadges(with_({ lessons: { a: s(3), b: s(2) } }), grade)).not.toContain('unit-3stars');
});
test('streak-7 and words-100', () => {
  expect(awardBadges(with_({ streak: { count: 6, lastDay: '' } }), grade)).toEqual([]);
  expect(awardBadges(with_({ streak: { count: 7, lastDay: '' } }), grade)).toEqual(['streak-7']);
  const words = Array.from({ length: 100 }, (_, i) => 'w' + i);
  expect(awardBadges(with_({ learned: words.slice(1) }), grade)).toEqual([]);
  expect(awardBadges(with_({ learned: words }), grade)).toEqual(['words-100']);
});
test('badges are never removed', () =>
  expect(awardBadges(with_({ badges: ['streak-7', 'big-challenge'] }), grade)).toEqual(['streak-7', 'big-challenge']));
