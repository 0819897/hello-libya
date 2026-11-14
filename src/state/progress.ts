import type { GradeIndex, Progress } from '../types';
import { starsFor } from '../engine/scoring';

export const STORAGE_KEY = 'eq.progress.v1';

export function defaultProgress(): Progress {
  return { name: '', avatar: '', mode: 'student', points: 0, lessons: {}, streak: { count: 0, lastDay: '' },
    badges: [], mistakes: [], learned: [], imported: [], teacherMode: false, sound: true };
}

const strs = (x: unknown) => Array.isArray(x) && x.every(s => typeof s === 'string');
function isProgress(x: unknown): x is Progress {
  if (typeof x !== 'object' || x === null) return false;
  const p = x as Record<string, unknown>;
  const s = p.streak as Record<string, unknown> | null;
  return typeof p.name === 'string' && typeof p.avatar === 'string' && (p.mode === 'student' || p.mode === 'self')
    && typeof p.points === 'number' && Number.isFinite(p.points)
    && typeof p.lessons === 'object' && p.lessons !== null && !Array.isArray(p.lessons)
    && Object.values(p.lessons).every(l => typeof l === 'object' && l !== null
      && [0, 1, 2, 3].includes((l as { stars: number }).stars) && typeof (l as { bestPct: unknown }).bestPct === 'number')
    && typeof s === 'object' && s !== null && typeof s.count === 'number' && typeof s.lastDay === 'string'
    && strs(p.badges) && strs(p.mistakes) && strs(p.learned) && Array.isArray(p.imported)
    && typeof p.teacherMode === 'boolean' && typeof p.sound === 'boolean';
}

let memory: string | null = null; // used when localStorage is unavailable (private mode)

export function loadProgress(): Progress {
  let raw: string | null = memory;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch { /* storage unavailable: use memory */ }
  if (!raw) return defaultProgress();
  try {
    const p: unknown = JSON.parse(raw);
    return isProgress(p) ? p : defaultProgress();
  } catch { return defaultProgress(); }
}

export function saveProgress(p: Progress): void {
  memory = JSON.stringify(p);
  try { localStorage.setItem(STORAGE_KEY, memory); } catch { /* memory copy kept */ }
}

/** local date as YYYY-MM-DD */
export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const dayNum = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return NaN;
  return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000;
};

export function bumpStreak(s: Progress['streak'], today: string): Progress['streak'] {
  const count = Number.isFinite(s.count) && s.count > 0 ? Math.floor(s.count) : 0;
  const diff = dayNum(today) - dayNum(s.lastDay);
  if (diff === 0 && count > 0) return { count, lastDay: today };
  if (diff === 1) return { count: count + 1, lastDay: today };
  return { count: 1, lastDay: today }; // first day, a gap, or the clock moved backwards
}

const uniq = (xs: string[]) => [...new Set(xs)];

export function completeLesson(p: Progress, a: { lessonId: string; correct: number; total: number; points: number;
  learned: string[]; missed: string[]; today: string }): Progress {
  const pct = a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0;
  const prev = p.lessons[a.lessonId];
  const stars = starsFor(a.correct, a.total);
  return {
    ...p,
    points: p.points + Math.max(0, a.points),
    lessons: { ...p.lessons, [a.lessonId]: {
      stars: Math.max(stars, prev?.stars ?? 0) as 0 | 1 | 2 | 3, bestPct: Math.max(pct, prev?.bestPct ?? 0) } },
    learned: uniq([...p.learned, ...a.learned]),
    mistakes: uniq([...p.mistakes.filter(m => !a.learned.includes(m)), ...a.missed]),
    streak: bumpStreak(p.streak, a.today),
  };
}

/** lesson ids of open regular units, in order */
export function orderedLessonIds(grade: GradeIndex): string[] {
  return grade.units.filter(u => u.status === 'open' && u.kind === 'unit').flatMap(u => u.lessons.map(l => l.id));
}

export function isUnlocked(p: Progress, grade: GradeIndex, lessonId: string): boolean {
  const ids = orderedLessonIds(grade);
  const i = ids.indexOf(lessonId);
  if (i < 0) return false;
  if (i === 0 || p.teacherMode) return true;
  return (p.lessons[ids[i - 1]]?.stars ?? 0) >= 1;
}

export const BADGES: { id: string; emoji: string; titleAr: string }[] = [
  { id: 'first-lesson', emoji: '🌱', titleAr: 'أول درس' },
  { id: 'unit-done', emoji: '🏅', titleAr: 'أنهيت وحدة' },
  { id: 'unit-3stars', emoji: '🌟', titleAr: 'وحدة بثلاث نجوم' },
  { id: 'streak-7', emoji: '🔥', titleAr: '7 أيام متتالية' },
  { id: 'words-100', emoji: '📚', titleAr: '100 كلمة' },
  { id: 'big-challenge', emoji: '🏆', titleAr: 'التحدي الكبير' },
];

/** Full badge list: everything already earned plus anything newly earned. */
export function awardBadges(p: Progress, grade: GradeIndex): string[] {
  const stars = (id: string) => p.lessons[id]?.stars ?? 0;
  const units = grade.units.filter(u => u.kind === 'unit' && u.status === 'open' && u.lessons.length > 0);
  const earned = new Set(p.badges);
  if (Object.values(p.lessons).some(l => l.stars >= 1)) earned.add('first-lesson');
  if (units.some(u => u.lessons.every(l => stars(l.id) >= 1))) earned.add('unit-done');
  if (units.some(u => u.lessons.every(l => stars(l.id) === 3))) earned.add('unit-3stars');
  if (p.streak.count >= 7) earned.add('streak-7');
  if (p.learned.length >= 100) earned.add('words-100');
  return [...p.badges, ...BADGES.map(b => b.id).filter(id => earned.has(id) && !p.badges.includes(id))];
}
