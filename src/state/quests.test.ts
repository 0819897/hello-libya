import { defaultProgress } from './progress';
import {
  applyStreakFreeze,
  buyAvatar,
  buyFreeze,
  defaultDuo,
  leagueTable,
  loadDuo,
  recordActivity,
  saveDuo,
  switchOrAddLearner,
} from './quests';

beforeEach(() => localStorage.clear());

test('daily quests award bonus gems once per quest and reset on a new day', () => {
  const d0 = defaultDuo('2026-11-18');
  const r1 = recordActivity(d0, { xp: 45, perfect: true, maxCombo: 6, today: '2026-11-18' });
  expect(r1.bonusGems).toBe(15 + 15 + 20);
  expect(r1.justCompleted).toHaveLength(3);
  // Repeating on the same day does not double-award
  const r2 = recordActivity(r1.duo, { xp: 50, perfect: true, maxCombo: 8, today: '2026-11-18' });
  expect(r2.bonusGems).toBe(0);
  expect(r2.duo.weeklyXp).toBe(95);

  saveDuo(r2.duo);
  // Next day resets daily progress while keeping weeklyXp and freezes
  const nextDay = loadDuo('2026-11-19');
  expect(nextDay.dailyXp).toBe(0);
  expect(nextDay.claimed).toEqual([]);
  expect(nextDay.weeklyXp).toBe(95);
});

test('streak freeze protects a 1-day gap and consumes one shield', () => {
  const prev = { count: 5, lastDay: '2026-11-16' };
  const afterComplete = { count: 1, lastDay: '2026-11-18' }; // 2-day diff (1 missed day)
  const res = applyStreakFreeze(prev, afterComplete, 2, '2026-11-18');
  expect(res).toEqual({ streak: { count: 6, lastDay: '2026-11-18' }, freezes: 1, usedFreeze: true });

  // A 3-day gap is NOT protected by a single freeze
  const longGap = applyStreakFreeze({ count: 5, lastDay: '2026-11-14' }, afterComplete, 2, '2026-11-18');
  expect(longGap.usedFreeze).toBe(false);
  expect(longGap.streak.count).toBe(1);
});

test('gem shop buys freeze (up to 2) and unlocks/equips special avatars', () => {
  const p0 = { ...defaultProgress(), name: 'Reem', points: 120 };
  const d0 = defaultDuo('2026-11-18');
  const b1 = buyFreeze(p0, d0);
  expect(b1.ok).toBe(true);
  expect(b1.progress.points).toBe(70);
  expect(b1.duo.freezes).toBe(1);

  const a1 = buyAvatar(b1.progress, b1.duo, '🦉');
  expect(a1.ok).toBe(true);
  expect(a1.progress.points).toBe(30);
  expect(a1.progress.avatar).toBe('🦉');
  expect(a1.duo.unlockedAvatars).toContain('🦉');

  // Re-selecting an already unlocked avatar costs 0 gems
  const a2 = buyAvatar({ ...a1.progress, avatar: '🦁' }, a1.duo, '🦉');
  expect(a2.ok).toBe(true);
  expect(a2.progress.points).toBe(30);
  expect(a2.progress.avatar).toBe('🦉');
});

test('league table ranks learner by weekly XP and supports multi-learner switching on same device', () => {
  const reem = { ...defaultProgress(), name: 'ريم', avatar: '👧', points: 80 };
  const d0 = { ...defaultDuo('2026-11-18'), weeklyXp: 130 };
  const table1 = leagueTable(reem, d0);
  expect(table1.tierAr).toContain('الفضي');
  expect(table1.rows.some(r => r.isMe && r.name === 'ريم' && r.xp === 130)).toBe(true);

  // Add second learner on the same device
  const added = switchOrAddLearner(reem, d0, { newName: 'كريم', avatar: '👦', mode: 'student' });
  expect(added.progress.name).toBe('كريم');
  expect(added.duo.weeklyXp).toBe(0);
  const table2 = leagueTable(added.progress, added.duo);
  expect(table2.rows.some(r => r.name === 'ريم' && r.xp === 130)).toBe(true);
  expect(table2.rows.some(r => r.isMe && r.name === 'كريم')).toBe(true);

  // Switch back to Reem and restore her progress and weekly XP
  const reemEntry = added.duo.learners.find(l => l.name === 'ريم')!;
  const back = switchOrAddLearner(added.progress, added.duo, { id: reemEntry.id });
  expect(back.progress.name).toBe('ريم');
  expect(back.progress.points).toBe(80);
  expect(back.duo.weeklyXp).toBe(130);
});
