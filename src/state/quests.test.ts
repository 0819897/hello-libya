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

test('league contains only real learners: no invented classmates', () => {
  const me = { ...defaultProgress(), name: 'سالم', avatar: '🦁' };
  const table = leagueTable(me, { ...defaultDuo('2026-11-18'), weeklyXp: 10 });
  expect(table.rows).toHaveLength(1);
  expect(table.rows[0]).toMatchObject({ name: 'سالم', isMe: true, xp: 10 });
  expect(table.alone).toBe(true);
  expect(table.rows.some(r => /زميل/.test(r.name))).toBe(false);
});

test("last week's own score appears as a clearly-labelled past row", () => {
  const d0 = { ...defaultDuo('2026-11-18'), weeklyXp: 140 }; // Wednesday
  saveDuo(d0);
  const nextWeek = loadDuo('2026-11-24'); // the following Tuesday
  expect(nextWeek.weeklyXp).toBe(0);
  expect(nextWeek.lastWeekXp).toBe(140);
  const rows = leagueTable({ ...defaultProgress(), name: 'سالم' }, nextWeek).rows;
  expect(rows.find(r => r.isPast)).toMatchObject({ xp: 140, isMe: false });

  saveDuo(nextWeek);
  const skipped = loadDuo('2026-12-08'); // two weeks later: nothing earned last week
  expect(skipped.lastWeekXp).toBe(0);
});

test('each learner on the device keeps their own freezes, avatars, stories, records and quests', () => {
  const today = '2026-11-18';
  const reem = { ...defaultProgress(), name: 'ريم', avatar: '🦉', points: 30 };
  const reemDuo = { ...defaultDuo(today), freezes: 2, unlockedAvatars: ['🦉'], storiesDone: ['g5-s1'],
    bestSpeedScore: 17, dailyXp: 45, claimed: ['xp-40'], weeklyXp: 120 };

  const kareem = switchOrAddLearner(reem, reemDuo, { newName: 'كريم', avatar: '👦', mode: 'student' }, today);
  expect(kareem.duo).toMatchObject({ freezes: 0, unlockedAvatars: [], storiesDone: [], bestSpeedScore: 0,
    dailyXp: 0, claimed: [], weeklyXp: 0 });

  const kDuo = { ...kareem.duo, freezes: 1, weeklyXp: 30 };
  const reemId = kDuo.learners.find(l => l.name === 'ريم')!.id;
  const back = switchOrAddLearner(kareem.progress, kDuo, { id: reemId }, today);
  expect(back.progress.name).toBe('ريم');
  expect(back.duo).toMatchObject({ freezes: 2, unlockedAvatars: ['🦉'], storiesDone: ['g5-s1'], bestSpeedScore: 17,
    dailyXp: 45, claimed: ['xp-40'], weeklyXp: 120 });
  expect(back.duo.learners.find(l => l.name === 'كريم')).toMatchObject({ weeklyXp: 30 });

  const kareemId = back.duo.learners.find(l => l.name === 'كريم')!.id;
  const again = switchOrAddLearner(back.progress, back.duo, { id: kareemId }, today);
  expect(again.duo.freezes).toBe(1);
});
