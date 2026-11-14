import { validateLesson } from './loader';
import l1 from '../../public/content/grade4/u1/l1.json';

const good = { id: 'g4-u1-l1', title: 'Hello!', titleAr: 'مرحباً',
  words: [{en:'mum',ar:'أمي'},{en:'dad',ar:'أبي'},{en:'sister',ar:'أخت'},{en:'age',ar:'عمر'}],
  games: [{ type: 'pick-image', count: 4 }], challenge: { count: 8, types: ['listen-pick'] } };
test('accepts a valid lesson', () => expect(validateLesson(good).ok).toBe(true));
test('rejects non-object', () => expect(validateLesson('x')).toEqual({ ok: false, errorAr: 'الملف ليس درساً صحيحاً' }));
test('names the missing field', () => { const { title, ...bad } = good; void title;
  expect(validateLesson(bad)).toEqual({ ok: false, errorAr: 'ينقص الدرس الحقل: title' }); });
test('needs 4 words', () => expect(validateLesson({ ...good, words: good.words.slice(0, 3) }))
  .toEqual({ ok: false, errorAr: 'الدرس يحتاج 4 كلمات على الأقل' }));
test('rejects unknown game type', () => expect(validateLesson({ ...good, games: [{ type: 'zzz' }] }))
  .toEqual({ ok: false, errorAr: 'نوع لعبة غير معروف: zzz' }));
test('word needs en and ar', () => expect(validateLesson({ ...good, words: [...good.words, { en: 'x' }] }))
  .toEqual({ ok: false, errorAr: 'كلمة ناقصة: كل كلمة تحتاج en و ar' }));
test('lesson 1 file is valid', () => expect(validateLesson(l1).ok).toBe(true));
test('rejects malformed optional fields that would crash the player', () => {
  const bad = [
    { ...good, words: [...good.words, { en: 'x', ar: 'س', emoji: {} }] },
    { ...good, words: [...good.words, { en: 'x', ar: 'س', abstract: 'yes' }] },
    { ...good, grammar: { explainAr: 'ش', examples: 'not a list' } },
    { ...good, games: [{ type: 'pick-image', count: 'six' }] },
    { ...good, challenge: { count: 8, types: 'listen-pick' } },
  ];
  for (const b of bad) expect(validateLesson(b).ok).toBe(false);
});
