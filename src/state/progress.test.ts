import { bigBadgeFor, bumpStreak, completeLesson, defaultProgress, getLastGrade, isUnlocked, loadProgress, saveProgress, setLastGrade } from './progress';
import type { GradeIndex } from '../types';

beforeEach(() => localStorage.clear());

test('streak', () => {
  expect(bumpStreak({ count: 0, lastDay: '' }, '2026-11-14')).toEqual({ count: 1, lastDay: '2026-11-14' });
  expect(bumpStreak({ count: 3, lastDay: '2026-11-13' }, '2026-11-14').count).toBe(4);
  expect(bumpStreak({ count: 3, lastDay: '2026-11-14' }, '2026-11-14').count).toBe(3);
  expect(bumpStreak({ count: 3, lastDay: '2026-11-10' }, '2026-11-14').count).toBe(1);
  expect(bumpStreak({ count: 3, lastDay: '2026-11-20' }, '2026-11-14').count).toBe(1); // date moved back
  expect(bumpStreak({ count: 3, lastDay: '2026-02-28' }, '2026-03-01').count).toBe(4);
  expect(bumpStreak({ count: NaN, lastDay: 'garbage' }, '2026-11-14')).toEqual({ count: 1, lastDay: '2026-11-14' });
});
test('corrupt or old-shape storage gives fresh progress', () => {
  localStorage.setItem('eq.progress.v1', '{not json'); expect(loadProgress()).toEqual(defaultProgress());
  localStorage.setItem('eq.progress.v1', JSON.stringify({ points: 'x' })); expect(loadProgress()).toEqual(defaultProgress());
  localStorage.setItem('eq.progress.v1', 'null'); expect(loadProgress()).toEqual(defaultProgress());
});
test('save then load round-trips', () => {
  const p = { ...defaultProgress(), name: 'Reem', points: 40 }; saveProgress(p); expect(loadProgress()).toEqual(p);
});
test('storage unavailable falls back to memory', () => {
  const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
  const p = { ...defaultProgress(), name: 'Ali' };
  expect(() => saveProgress(p)).not.toThrow(); expect(loadProgress()).toEqual(p);
  get.mockRestore(); set.mockRestore();
});
test('completeLesson keeps best, adds points, de-duplicates', () => {
  let p = completeLesson(defaultProgress(), { lessonId: 'a', correct: 7, total: 8, points: 60, learned: ['mum', 'dad'], missed: ['age'], today: '2026-11-14' });
  expect(p.lessons.a).toEqual({ stars: 2, bestPct: 88 }); expect(p.points).toBe(60); expect(p.mistakes).toEqual(['age']);
  expect(p.streak).toEqual({ count: 1, lastDay: '2026-11-14' });
  p = completeLesson(p, { lessonId: 'a', correct: 4, total: 8, points: 30, learned: ['mum'], missed: [], today: '2026-11-14' });
  expect(p.lessons.a.stars).toBe(2); expect(p.points).toBe(90); expect(p.learned).toEqual(['mum', 'dad']);
  p = completeLesson(p, { lessonId: 'b', correct: 8, total: 8, points: 80, learned: ['age'], missed: [], today: '2026-11-15' });
  expect(p.mistakes).toEqual([]); expect(p.streak.count).toBe(2);
});

const ref = (id: string) => ({ id, file: '', title: '', titleAr: '' });
const grade: GradeIndex = { id: 'grade4', titleAr: '', levelTitleAr: '', units: [
  { id: 'u1', title: '', titleAr: '', status: 'open', kind: 'unit', lessons: [ref('a'), ref('b')] },
  { id: 'u2', title: '', titleAr: '', status: 'open', kind: 'unit', lessons: [ref('c')] },
  { id: 'u5', title: '', titleAr: '', status: 'soon', kind: 'unit', lessons: [ref('z')] }] };
test('unlocks: first open, next needs a star, teacher opens all open units', () => {
  const p = defaultProgress();
  expect(isUnlocked(p, grade, 'a')).toBe(true); expect(isUnlocked(p, grade, 'b')).toBe(false);
  const p1 = { ...p, lessons: { a: { stars: 1 as const, bestPct: 60 } } };
  expect(isUnlocked(p1, grade, 'b')).toBe(true); expect(isUnlocked(p1, grade, 'c')).toBe(false);
  const p0 = { ...p, lessons: { a: { stars: 0 as const, bestPct: 50 } } };
  expect(isUnlocked(p0, grade, 'b')).toBe(false);
  expect(isUnlocked({ ...p, teacherMode: true }, grade, 'c')).toBe(true);
  expect(isUnlocked({ ...p, teacherMode: true }, grade, 'z')).toBe(false);
});

test('multi-grade helpers: bigBadgeFor and last active grade', () => {
  expect(bigBadgeFor('grade4')).toBe('big-challenge');
  expect(bigBadgeFor('grade5')).toBe('big-challenge-grade5');
  expect(getLastGrade(defaultProgress())).toBe('grade4');
  expect(getLastGrade({ ...defaultProgress(), lessons: { 'g5-u1-l1': { stars: 2, bestPct: 80 } } })).toBe('grade5');
  setLastGrade('grade5');
  expect(getLastGrade(defaultProgress())).toBe('grade5');
});
