import type { Progress } from '../types';
import { defaultProgress, todayStr } from './progress';

export const DUO_KEY = 'eq.duo.v1';
export const FREEZE_COST = 50;
export const MAX_FREEZES = 2;

export type SavedLearner = { id: string; name: string; avatar: string; progress: Progress; weeklyXp: number };

export type DuoState = {
  day: string;
  dailyXp: number;
  dailyPerfect: number;
  bestComboToday: number;
  claimed: string[];
  freezes: number;
  unlockedAvatars: string[];
  bestSpeedScore: number;
  storiesDone: string[];
  weekKey: string;
  weeklyXp: number;
  learners: SavedLearner[];
  activeLearnerId: string;
};

export const DAILY_QUESTS = [
  { id: 'xp-40', icon: '🎯', titleAr: 'اجمع 40 نقطة اليوم', target: 40, reward: 15, get: (d: DuoState) => d.dailyXp },
  { id: 'perfect-1', icon: '⭐', titleAr: 'أنهِ درساً بـ 3 نجوم اليوم', target: 1, reward: 15, get: (d: DuoState) => d.dailyPerfect },
  { id: 'combo-5', icon: '🔥', titleAr: '5 إجابات متتالية بلا خطأ', target: 5, reward: 20, get: (d: DuoState) => d.bestComboToday },
] as const;

export const SHOP_AVATARS = [
  { emoji: '🦉', titleAr: 'البومة الحكيمة', cost: 40 },
  { emoji: '🦅', titleAr: 'صقر الجبل', cost: 40 },
  { emoji: '🚀', titleAr: 'رائد المغامرة', cost: 50 },
  { emoji: '👑', titleAr: 'بطل التحدي', cost: 60 },
] as const;

const dayNum = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return NaN;
  return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000;
};

/** Monday-anchored week number so the weekly league resets each week cleanly. */
export const weekOf = (day: string) => {
  const n = dayNum(day);
  return Number.isFinite(n) ? `w${Math.floor((n + 3) / 7)}` : 'w0';
};

export function defaultDuo(today = todayStr()): DuoState {
  return {
    day: today, dailyXp: 0, dailyPerfect: 0, bestComboToday: 0, claimed: [],
    freezes: 0, unlockedAvatars: [], bestSpeedScore: 0, storiesDone: [],
    weekKey: weekOf(today), weeklyXp: 0, learners: [], activeLearnerId: 'me',
  };
}

let memDuo: string | null = null;

function rollOver(d: DuoState, today: string): DuoState {
  const wk = weekOf(today);
  const sameDay = d.day === today;
  const sameWeek = d.weekKey === wk;
  if (sameDay && sameWeek) return d;
  return {
    ...d,
    day: today,
    dailyXp: sameDay ? d.dailyXp : 0,
    dailyPerfect: sameDay ? d.dailyPerfect : 0,
    bestComboToday: sameDay ? d.bestComboToday : 0,
    claimed: sameDay ? d.claimed : [],
    weekKey: wk,
    weeklyXp: sameWeek ? d.weeklyXp : 0,
    learners: sameWeek ? d.learners : d.learners.map(l => ({ ...l, weeklyXp: 0 })),
  };
}

export function loadDuo(today = todayStr()): DuoState {
  let raw: string | null = memDuo;
  try { raw = localStorage.getItem(DUO_KEY); } catch { /* fallback */ }
  if (!raw) return defaultDuo(today);
  try {
    const p = JSON.parse(raw) as Partial<DuoState> | null;
    if (!p || typeof p !== 'object' || typeof p.day !== 'string') return defaultDuo(today);
    const base = defaultDuo(today);
    return rollOver({
      day: p.day,
      dailyXp: typeof p.dailyXp === 'number' ? p.dailyXp : 0,
      dailyPerfect: typeof p.dailyPerfect === 'number' ? p.dailyPerfect : 0,
      bestComboToday: typeof p.bestComboToday === 'number' ? p.bestComboToday : 0,
      claimed: Array.isArray(p.claimed) ? p.claimed : [],
      freezes: typeof p.freezes === 'number' ? p.freezes : 0,
      unlockedAvatars: Array.isArray(p.unlockedAvatars) ? p.unlockedAvatars : [],
      bestSpeedScore: typeof p.bestSpeedScore === 'number' ? p.bestSpeedScore : 0,
      storiesDone: Array.isArray(p.storiesDone) ? p.storiesDone : [],
      weekKey: typeof p.weekKey === 'string' ? p.weekKey : base.weekKey,
      weeklyXp: typeof p.weeklyXp === 'number' ? p.weeklyXp : 0,
      learners: Array.isArray(p.learners) ? p.learners : [],
      activeLearnerId: typeof p.activeLearnerId === 'string' ? p.activeLearnerId : 'me',
    }, today);
  } catch { return defaultDuo(today); }
}

export function saveDuo(d: DuoState): void {
  memDuo = JSON.stringify(d);
  try { localStorage.setItem(DUO_KEY, memDuo); } catch { /* keep memDuo */ }
}

export function clearDuo(): void {
  memDuo = null;
  try { localStorage.removeItem(DUO_KEY); } catch { /* ignore */ }
}

export function recordActivity(
  input: DuoState,
  a: { xp: number; perfect?: boolean; maxCombo?: number; today?: string },
): { duo: DuoState; bonusGems: number; justCompleted: string[] } {
  const d = rollOver(input, a.today ?? todayStr());
  const gain = Math.max(0, a.xp);
  const next: DuoState = {
    ...d,
    dailyXp: d.dailyXp + gain,
    dailyPerfect: d.dailyPerfect + (a.perfect ? 1 : 0),
    bestComboToday: Math.max(d.bestComboToday, a.maxCombo ?? 0),
    weeklyXp: d.weeklyXp + gain,
  };
  let bonusGems = 0;
  const justCompleted: string[] = [];
  const claimed = [...next.claimed];
  for (const q of DAILY_QUESTS) {
    if (!claimed.includes(q.id) && q.get(next) >= q.target) {
      claimed.push(q.id);
      bonusGems += q.reward;
      justCompleted.push(q.titleAr);
    }
  }
  return { duo: { ...next, claimed }, bonusGems, justCompleted };
}

/** Protects a streak across a 1-day miss (day diff === 2) if the learner owns at least 1 freeze. */
export function applyStreakFreeze(
  prev: Progress['streak'],
  afterComplete: Progress['streak'],
  freezes: number,
  today: string,
): { streak: Progress['streak']; freezes: number; usedFreeze: boolean } {
  const diff = dayNum(today) - dayNum(prev.lastDay);
  if (prev.count > 0 && diff === 2 && freezes > 0) {
    return { streak: { count: prev.count + 1, lastDay: today }, freezes: freezes - 1, usedFreeze: true };
  }
  return { streak: afterComplete, freezes, usedFreeze: false };
}

export function buyFreeze(p: Progress, d: DuoState): { ok: boolean; progress: Progress; duo: DuoState; errorAr?: string } {
  if (d.freezes >= MAX_FREEZES) return { ok: false, progress: p, duo: d, errorAr: 'لديك الحد الأقصى من تجميد السلسلة (2)' };
  if (p.points < FREEZE_COST) return { ok: false, progress: p, duo: d, errorAr: `تحتاج ${FREEZE_COST} نقطة جواهر لشراء التجميد` };
  return { ok: true, progress: { ...p, points: p.points - FREEZE_COST }, duo: { ...d, freezes: d.freezes + 1 } };
}

export function buyAvatar(p: Progress, d: DuoState, emoji: string): { ok: boolean; progress: Progress; duo: DuoState; errorAr?: string } {
  const item = SHOP_AVATARS.find(x => x.emoji === emoji);
  if (!item) return { ok: false, progress: p, duo: d, errorAr: 'عنصر غير معروف' };
  if (d.unlockedAvatars.includes(emoji)) {
    return { ok: true, progress: { ...p, avatar: emoji }, duo: d };
  }
  if (p.points < item.cost) return { ok: false, progress: p, duo: d, errorAr: `تحتاج ${item.cost} نقطة لفتح هذه الشخصية` };
  return {
    ok: true,
    progress: { ...p, points: p.points - item.cost, avatar: emoji },
    duo: { ...d, unlockedAvatars: [...d.unlockedAvatars, emoji] },
  };
}

const RIVALS = [
  { name: 'نادية (زميلة)', avatar: '👩‍🎓', xp: 260 },
  { name: 'يوسف (زميل)', avatar: '🧑‍🚀', xp: 185 },
  { name: 'سارة (زميلة)', avatar: '👧', xp: 115 },
  { name: 'علي (زميل)', avatar: '👦', xp: 65 },
];

export function leagueTable(p: Progress, d: DuoState) {
  const tier = d.weeklyXp >= 250
    ? { tierAr: 'الدوري الذهبي', tierIcon: '🥇' }
    : d.weeklyXp >= 100
      ? { tierAr: 'الدوري الفضي', tierIcon: '🥈' }
      : { tierAr: 'الدوري البرونزي', tierIcon: '🥉' };

  const others = d.learners
    .filter(l => l.id !== d.activeLearnerId)
    .map(l => ({ name: l.name, avatar: l.avatar || '🙂', xp: l.weeklyXp, isMe: false, learnerId: l.id }));

  const me = { name: p.name || 'أنت', avatar: p.avatar || '🙂', xp: d.weeklyXp, isMe: true, learnerId: d.activeLearnerId };
  const rivals = RIVALS.map(r => ({ ...r, isMe: false, learnerId: undefined as string | undefined }));
  const rows = [me, ...others, ...rivals].sort((a, b) => b.xp - a.xp);
  return { ...tier, rows };
}

export function switchOrAddLearner(
  currentProgress: Progress,
  d: DuoState,
  target: { id: string } | { newName: string; avatar: string; mode: 'student' | 'self' },
): { progress: Progress; duo: DuoState } {
  const savedCurrent: SavedLearner = {
    id: d.activeLearnerId,
    name: currentProgress.name || 'متعلّم',
    avatar: currentProgress.avatar || '🙂',
    progress: currentProgress,
    weeklyXp: d.weeklyXp,
  };
  const pool = [...d.learners.filter(l => l.id !== d.activeLearnerId), ...(currentProgress.name ? [savedCurrent] : [])];

  if ('id' in target) {
    const found = pool.find(l => l.id === target.id);
    if (!found) return { progress: currentProgress, duo: d };
    return {
      progress: found.progress,
      duo: { ...d, learners: pool, activeLearnerId: found.id, weeklyXp: found.weeklyXp },
    };
  }
  const newId = `l-${Date.now()}-${pool.length + 1}`;
  const fresh: Progress = { ...defaultProgress(), name: target.newName.trim().slice(0, 20), avatar: target.avatar, mode: target.mode };
  const nextPool = [...pool, { id: newId, name: fresh.name, avatar: fresh.avatar, progress: fresh, weeklyXp: 0 }];
  return {
    progress: fresh,
    duo: { ...d, learners: nextPool, activeLearnerId: newId, dailyXp: 0, dailyPerfect: 0, bestComboToday: 0, claimed: [], weeklyXp: 0 },
  };
}
