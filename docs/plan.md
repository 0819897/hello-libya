# English Quest (مغامرة الإنجليزي) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan stage-by-stage. Steps use checkbox (`- [ ]`) syntax for tracking. Execute ONE stage per session, end to end, without asking questions: write tests, implement, fix errors, verify, commit, push.

**Goal:** A free, offline-capable web app that teaches Units 1–3 of *English for Libya, Primary 4* as short lessons and games, plus a "Big Challenge" (Unit 4), for a school programming competition on 8 Jan 2027.

**Architecture:** Static single-page app, no server and no database. Lessons are JSON files under `public/content/`; generic games generate their questions from each lesson's word list, so adding a lesson means adding a file. Learner progress lives in `localStorage` on the device.

**Tech Stack:** Vite, React 18, TypeScript (strict), Tailwind CSS, react-router (HashRouter), vite-plugin-pwa, Vitest + React Testing Library. Deployed to GitHub Pages by GitHub Actions.

**Spec:** this plan is self-contained (it carries every value from the approved requirements doc). Vocabulary source: `reference/curriculum-g4.md`.

## Global Constraints

- UI language is Arabic, `dir="rtl"`. English learning content renders `dir="ltr"` in a large clear font. No English error text is ever shown to the learner.
- British spelling as in the book: favourite, colour, maths, rubber.
- Content rule: use only the vocabulary and structures in `reference/curriculum-g4.md`. Write new sentences. Never copy book sentences, pages, or images. `reference/` is in `.gitignore` and is never deployed.
- Character names: Yousif, Khaled, Ali, Nadia, Lina, Sarah, Kareem, Reem. Prices in Libyan Dinars.
- Free and non-commercial: no ads, payments, analytics, accounts, or network calls other than loading the app's own files.
- No personal data leaves the device. Name and progress are stored only in `localStorage` key `eq.progress.v1`.
- Works fully offline after first load, including audio.
- Layout works from 360 px wide up to desktop and projector; touch and mouse. Tap targets at least 48 px. No keyboard typing except the learner's name.
- Correct/wrong is never signalled by colour alone: also an icon and a sound.
- Look: playful but age-neutral (children and adults). One consistent illustration style.
- Total deployed size under 25 MB.
- School name in the app: "مدرسة المعرفة مصراتة".
- Scoring: stars from challenge accuracy, 60% = 1, 80% = 2, 95% = 3. Points: 10 for a first-attempt correct answer, 5 for second attempt, 0 after. No hearts or lives.
- A lesson unlocks when the previous lesson has at least 1 star. Units 5–8 and all other grades show locked with "قريباً".

## Review Focus

1. `localStorage` holds corrupt JSON, an older shape, or is unavailable (private mode): the app starts with fresh progress and never shows a blank page. (Test in Stage 2.)
2. Teacher imports a bad lesson file (not JSON, missing fields, fewer than 4 words): a clear Arabic message, nothing is imported, existing lessons untouched. (Tests in Stages 1 and 9.)
3. A lesson has fewer words than a game asks for, or a word has no emoji/image: the game clamps its count or is skipped; the word shows as text. No crash. (Test in Stage 2.)
4. Audio file missing, `speechSynthesis` absent, or sound switched off: `speak()` resolves silently. (Test in Stage 3.)
5. Learner closes the tab mid-lesson, or the device date moves backwards: earlier progress is intact and the streak never becomes negative or NaN. (Tests in Stages 2 and 4.)

## File Structure

```
public/content/grades.json                 grades and their status
public/content/grade4/index.json           units + lessons in order
public/content/grade4/u1/l1.json ...       one file per lesson
public/content/images/  audio/             optional media (emoji + browser speech are the fallback)
src/types.ts                               all shared types
src/content/loader.ts                      fetch + validateLesson
src/engine/rng.ts questions.ts scoring.ts  pure logic, fully unit-tested
src/state/progress.ts                      load/save, completeLesson, streak, badges, unlocks
src/state/ProgressContext.tsx              React provider around progress.ts
src/audio/speak.ts                         mp3 first, speechSynthesis fallback
src/games/*.tsx                            7 generic games, one file each
src/games/special/*.tsx                    DragOrder, WorldMap, Clock, Stall
src/games/registry.ts                      GameType -> component
src/screens/*.tsx                          one file per screen
src/ui/*.tsx                               Button, Card, StarRow, ProgressBar, WordChip
reference/curriculum-g4.md                 vocabulary source (git-ignored)
docs/plan.md                               this file
```

## Shared Types (`src/types.ts`) — every stage uses these exact names

```ts
export type Word = { en: string; ar: string; emoji?: string; image?: string; audio?: string; abstract?: boolean };
export type Blank = { text: string; answer: string; distractors: [string, string] }; // text contains "___"
export type GameType = 'pick-image' | 'listen-pick' | 'match' | 'order-sentence' | 'fill-blank'
  | 'spell' | 'true-false' | 'drag-order' | 'world-map' | 'clock' | 'stall';
export type GameSpec = { type: GameType; count?: number; config?: Record<string, unknown> };
export type Lesson = {
  id: string; title: string; titleAr: string; words: Word[];
  grammar?: { explainAr: string; examples: string[] };
  sentences?: string[]; blanks?: Blank[];
  games: GameSpec[]; challenge: { count: number; types: GameType[] };
};
export type LessonRef = { id: string; file: string; title: string; titleAr: string };
export type UnitIndex = { id: string; title: string; titleAr: string; status: 'open' | 'soon';
  kind: 'unit' | 'big-challenge'; lessons: LessonRef[] };
export type GradeIndex = { id: string; titleAr: string; levelTitleAr: string; units: UnitIndex[] };
export type GradeEntry = { id: string; titleAr: string; levelTitleAr: string; status: 'open' | 'soon'; index?: string };
export type Option = { id: string; text?: string; emoji?: string; image?: string };
export type Question = {
  id: string; type: GameType; wordEn?: string;
  promptText?: string; promptWord?: Word; listen?: boolean;
  options?: Option[]; pairs?: { left: Option; right: Option }[]; tiles?: string[];
  answer: string | string[]; explainAr?: string; config?: Record<string, unknown>;
};
export type GameResult = { correct: boolean; attempts: number };
export type GameProps = { question: Question; onDone: (r: GameResult) => void };
export type Progress = {
  name: string; avatar: string; mode: 'student' | 'self';
  points: number; lessons: Record<string, { stars: 0 | 1 | 2 | 3; bestPct: number }>;
  streak: { count: number; lastDay: string }; // lastDay = local YYYY-MM-DD, '' if none
  badges: string[]; mistakes: string[]; learned: string[]; // word.en values
  imported: Lesson[]; teacherMode: boolean; sound: boolean;
};
```

Badge ids: `first-lesson`, `unit-done`, `unit-3stars`, `streak-7`, `words-100`, `big-challenge`.

---

## Stage 1: Project, types, content loading, first lesson, deployment

**Files:** Create project scaffold; `src/types.ts`; `src/content/loader.ts`; `src/content/loader.test.ts`; `public/content/grades.json`; `public/content/grade4/index.json`; `public/content/grade4/u1/l1.json`; `.github/workflows/deploy.yml`; `.gitignore`.

**Produces:**
- `validateLesson(input: unknown): { ok: true; lesson: Lesson } | { ok: false; errorAr: string }`
- `loadGrades(): Promise<GradeEntry[]>`, `loadGradeIndex(gradeId: string): Promise<GradeIndex>`, `loadLesson(ref: LessonRef, gradeId: string): Promise<Lesson>`

- [ ] **Step 1:** Scaffold Vite React-TS app at repo root; add Tailwind, react-router, vite-plugin-pwa, Vitest, Testing Library. Set Vite `base: './'`, HashRouter, `<html lang="ar" dir="rtl">`. Add `reference/` and `node_modules/`, `dist/` to `.gitignore`. Scripts: `dev`, `build`, `test` (`vitest`).
- [ ] **Step 2:** Write `src/types.ts` exactly as in Shared Types.
- [ ] **Step 3: failing tests** in `src/content/loader.test.ts`:

```ts
const good = { id: 'g4-u1-l1', title: 'Hello!', titleAr: 'مرحباً',
  words: [{en:'mum',ar:'أمي'},{en:'dad',ar:'أبي'},{en:'sister',ar:'أخت'},{en:'age',ar:'عمر'}],
  games: [{ type: 'pick-image', count: 4 }], challenge: { count: 8, types: ['listen-pick'] } };
test('accepts a valid lesson', () => expect(validateLesson(good).ok).toBe(true));
test('rejects non-object', () => expect(validateLesson('x')).toEqual({ ok: false, errorAr: 'الملف ليس درساً صحيحاً' }));
test('names the missing field', () => { const { title, ...bad } = good;
  expect(validateLesson(bad)).toEqual({ ok: false, errorAr: 'ينقص الدرس الحقل: title' }); });
test('needs 4 words', () => expect(validateLesson({ ...good, words: good.words.slice(0, 3) }))
  .toEqual({ ok: false, errorAr: 'الدرس يحتاج 4 كلمات على الأقل' }));
test('rejects unknown game type', () => expect(validateLesson({ ...good, games: [{ type: 'zzz' }] }))
  .toEqual({ ok: false, errorAr: 'نوع لعبة غير معروف: zzz' }));
test('word needs en and ar', () => expect(validateLesson({ ...good, words: [...good.words, { en: 'x' }] }))
  .toEqual({ ok: false, errorAr: 'كلمة ناقصة: كل كلمة تحتاج en و ar' }));
```

- [ ] **Step 4:** Run `npm test -- --run`; expect FAIL (validateLesson not defined). Implement `loader.ts`. Required fields checked in this order: `id, title, titleAr, words, games, challenge`. Loaders `fetch` relative to `./content/` and pass lessons through `validateLesson` (throw `Error(errorAr)` on failure). Run tests; expect PASS.
- [ ] **Step 5:** Write `grades.json` (grade 4 `open`, grades 1–3 and 5–12 `soon`; `levelTitleAr` "المستوى 1" for grade 4), `grade4/index.json` (Units 1–3 `open` with the 17 lesson refs and ids from `reference/curriculum-g4.md`; Unit 4 `kind: 'big-challenge'`; Units 5–8 `soon` with titles Places to See, In the Past, The Challenge, Revision 2), and `u1/l1.json` in full: all words from the reference with a fitting `emoji` each (set `abstract: true` where no picture fits), a 2-line Arabic `grammar.explainAr`, 6 new `sentences`, 6 `blanks`, games `[pick-image 6, match 5, order-sentence 4, listen-pick 5]`, `challenge { count: 8, types: ['fill-blank','listen-pick','spell'] }`.
- [ ] **Step 6:** Add a test that fetches nothing but imports `l1.json` from disk and asserts `validateLesson(l1).ok === true`.
- [ ] **Step 7:** Placeholder home screen that lists unit and lesson titles from the index (proves loading works).
- [ ] **Step 8:** `.github/workflows/deploy.yml`: on push to `main`, `npm ci`, `npm test -- --run`, `npm run build`, deploy `dist/` to GitHub Pages. If no git remote exists: run `gh repo create english-quest --public --source=. --push` and enable Pages (source: GitHub Actions); if `gh` is not available, stop and print the exact manual steps in Arabic.
- [ ] **Step 9:** Verify `npm test -- --run` and `npm run build` pass. Commit `feat: scaffold, content loader, first lesson` and push. Report the live URL.

## Stage 2: Engine and progress (pure logic)

**Files:** Create `src/engine/rng.ts`, `questions.ts`, `scoring.ts`, `src/state/progress.ts`, and a `.test.ts` beside each.

**Produces:**
- `makeRng(seed: number): () => number`; `shuffle<T>(xs: T[], rng): T[]`
- `buildQuestions(lesson: Lesson, spec: GameSpec, rng: () => number): Question[]`
- `buildChallenge(lesson: Lesson, rng: () => number): Question[]`
- `starsFor(correct: number, total: number): 0 | 1 | 2 | 3`; `pointsFor(attempt: number): number`
- `defaultProgress(): Progress`; `loadProgress(): Progress`; `saveProgress(p: Progress): void`
- `bumpStreak(s: Progress['streak'], today: string): Progress['streak']`
- `completeLesson(p: Progress, a: { lessonId: string; correct: number; total: number; points: number; learned: string[]; missed: string[]; today: string }): Progress`
- `isUnlocked(p: Progress, grade: GradeIndex, lessonId: string): boolean`
- `awardBadges(p: Progress, grade: GradeIndex): string[]` (returns the full badge list)

- [ ] **Step 1: failing tests** (write all, then implement):

```ts
// scoring
expect([starsFor(4,8), starsFor(5,8), starsFor(7,8), starsFor(8,8), starsFor(0,0)]).toEqual([0,1,2,3,0]); // 50, 62.5, 87.5, 100
expect([pointsFor(1), pointsFor(2), pointsFor(3)]).toEqual([10,5,0]);
// questions — lesson4 = 4 words, lesson10 = 10 words with emoji
const qs = buildQuestions(lesson10, { type: 'pick-image', count: 6 }, makeRng(1));
expect(qs).toHaveLength(6);
qs.forEach(q => { expect(q.options).toHaveLength(4);
  expect(q.options!.map(o => o.id)).toContain(q.answer);
  expect(new Set(q.options!.map(o => o.id)).size).toBe(4); });
expect(buildQuestions(lesson4, { type: 'pick-image', count: 9 }, makeRng(1))).toHaveLength(4); // clamps
expect(buildQuestions(lesson10, { type: 'pick-image', count: 6 }, makeRng(1)))
  .toEqual(buildQuestions(lesson10, { type: 'pick-image', count: 6 }, makeRng(1))); // deterministic
// abstract words are never the target of pick-image or true-false
expect(buildQuestions(withAbstract, { type: 'pick-image', count: 10 }, makeRng(2))
  .every(q => q.wordEn !== 'whose')).toBe(true);
// order-sentence: tiles are the sentence's words shuffled; answer is the original order
const o = buildQuestions(withSentences, { type: 'order-sentence', count: 1 }, makeRng(3))[0];
expect([...o.tiles!].sort()).toEqual([...(o.answer as string[])].sort());
// games with no source data return []
expect(buildQuestions(lesson4, { type: 'fill-blank' }, makeRng(1))).toEqual([]);
expect(buildChallenge(lesson10, makeRng(1)).length).toBeLessThanOrEqual(lesson10.challenge.count);
// streak
expect(bumpStreak({ count: 0, lastDay: '' }, '2026-11-14')).toEqual({ count: 1, lastDay: '2026-11-14' });
expect(bumpStreak({ count: 3, lastDay: '2026-11-13' }, '2026-11-14').count).toBe(4);
expect(bumpStreak({ count: 3, lastDay: '2026-11-14' }, '2026-11-14').count).toBe(3);
expect(bumpStreak({ count: 3, lastDay: '2026-11-10' }, '2026-11-14').count).toBe(1);
expect(bumpStreak({ count: 3, lastDay: '2026-11-20' }, '2026-11-14').count).toBe(1); // date moved back
// progress storage
localStorage.setItem('eq.progress.v1', '{not json'); expect(loadProgress()).toEqual(defaultProgress());
localStorage.setItem('eq.progress.v1', JSON.stringify({ points: 'x' })); expect(loadProgress()).toEqual(defaultProgress());
// completeLesson keeps the best result, adds points, de-duplicates learned
let p = completeLesson(defaultProgress(), { lessonId: 'a', correct: 7, total: 8, points: 60, learned: ['mum','dad'], missed: ['age'], today: '2026-11-14' });
expect(p.lessons.a).toEqual({ stars: 2, bestPct: 88 }); expect(p.points).toBe(60); expect(p.mistakes).toEqual(['age']);
p = completeLesson(p, { lessonId: 'a', correct: 4, total: 8, points: 30, learned: ['mum'], missed: [], today: '2026-11-14' });
expect(p.lessons.a.stars).toBe(2); expect(p.points).toBe(90); expect(p.learned).toEqual(['mum','dad']);
// unlocks: first lesson open; next needs >=1 star on previous; teacherMode opens all
```

- [ ] **Step 2:** Implement. Notes the tests do not fix: `pick-image` shows the English word and options are emoji/image; `listen-pick` sets `listen: true` and options are English text; `match` returns one question per 4–5 word group with `pairs` (en ↔ emoji, or en ↔ ar for abstract words); `spell` gives `tiles` = letters of the word plus 2 random letters, single words only; `true-false` shows one word's picture with "This is a/an X." and is true about half the time; `fill-blank` comes from `lesson.blanks`; special game types pass `spec.config` through unchanged as one question per round. A word answered correctly is removed from `mistakes`. `saveProgress` and `loadProgress` swallow storage exceptions and fall back to an in-memory copy.
- [ ] **Step 3:** `npm test -- --run` passes. Commit `feat: question engine, scoring, progress store`. Push.

## Stage 3: Generic games, audio, lesson player

**Files:** Create `src/audio/speak.ts` (+test); `src/games/PickImage.tsx`, `ListenPick.tsx`, `Match.tsx`, `OrderSentence.tsx`, `FillBlank.tsx`, `Spell.tsx`, `TrueFalse.tsx`, `registry.ts`; `src/ui/*`; `src/state/ProgressContext.tsx`; `src/screens/LessonPlayer.tsx`, `Result.tsx`; one test per game.

**Consumes:** `buildQuestions`, `buildChallenge`, `starsFor`, `pointsFor`, `completeLesson`, `GameProps`.
**Produces:** `speak(w: { en: string; audio?: string }, enabled: boolean): Promise<void>` (never rejects); `registry: Partial<Record<GameType, React.FC<GameProps>>>`; routes `#/lesson/:gradeId/:lessonId`.

- [ ] **Step 1: failing tests.** `speak`: resolves when `Audio` play rejects, when `speechSynthesis` is undefined, and does nothing when `enabled` is false. Each game: render with a fixed `Question`; choosing the right answer calls `onDone({ correct: true, attempts: 1 })`; a wrong then right choice calls `onDone({ correct: true, attempts: 2 })`; after a wrong choice the correct answer and `explainAr` are visible. `LessonPlayer`: a question answered wrong on first attempt is asked again at the end of the round; finishing the challenge calls `completeLesson` once and shows `Result`.
- [ ] **Step 2:** Implement. `LessonPlayer` runs three phases with a progress bar: **تعلّم** (word cards: emoji/image, English word, speaker button, Arabic meaning; then the grammar card), **العب** (each `lesson.games` entry; skip a game whose question list is empty), **تحدَّ** (`buildChallenge`; no hints, no Arabic meanings shown). Every English word on screen is tappable to hear it. Correct: green + check icon + chime + speak the word. Wrong: red + cross icon + soft buzz. `Result` shows stars, points earned, the missed words with audio, and buttons "أعد المحاولة" / "الدرس التالي".
- [ ] **Step 3:** Manual check with `npm run dev`: play lesson g4-u1-l1 start to finish at 360 px width. Tests and build pass. Commit `feat: generic games and lesson player`. Push.

## Stage 4: Screens, navigation, motivation

**Files:** Create `src/screens/Welcome.tsx`, `GradeMap.tsx`, `UnitPath.tsx`, `Profile.tsx`, `Dictionary.tsx`, `Settings.tsx`, `About.tsx`; `src/App.tsx` routes; tests for `awardBadges` and for `UnitPath`.

**Consumes:** `loadGrades`, `loadGradeIndex`, `isUnlocked`, `awardBadges`, `ProgressContext`.

- [ ] **Step 1: failing tests.** `awardBadges`: `first-lesson` after any lesson with ≥1 star; `unit-done` when every lesson of one unit has ≥1 star; `unit-3stars` when every lesson of one unit has 3; `streak-7` at `streak.count >= 7`; `words-100` at `learned.length >= 100`; badges are never removed. `UnitPath`: locked lessons are not clickable; in `mode: 'self'` the header shows `levelTitleAr` and never the word "الصف"; `soon` units render with "قريباً".
- [ ] **Step 2:** Implement. First run goes to `Welcome` (name up to 20 characters, required; 8 emoji avatars; "أنا طالب" / "أتعلّم لنفسي"). `GradeMap`: grade 4 open, the rest locked "قريباً". `UnitPath`: winding path of lesson nodes with stars, header with points and streak, bottom tabs المسار / قاموسي / ملفّي. A "راجع أخطاءك" node appears when `mistakes.length >= 4` and plays a generated lesson from those words. `Dictionary`: learned words grouped by unit, with picture, Arabic, audio. `Settings`: sound on/off, change name, reset progress (with confirm), teacher mode switch. `About`: school name, student names placeholder list, "المحتوى مبني على منهج English for Libya للصف الرابع"، "تطبيق مجاني غير ربحي".
- [ ] **Step 3:** Tests and build pass; manual walk-through from first run to finishing lesson 1 and seeing lesson 2 unlock. Commit `feat: screens, navigation, streak and badges`. Push.

## Stage 5: Unit 1 content and the drag game

**Files:** Create `public/content/grade4/u1/l2.json` … `l6.json`; `src/games/special/DragOrder.tsx` (+test); modify `registry.ts`; add `src/content/all-lessons.test.ts`.

**DragOrder config:** `{ mode: 'sequence'; promptAr: string; items: { id: string; label: string; emoji?: string; scale?: number }[] }` (items listed in the correct order; the game shuffles them) or `{ mode: 'place'; slots: string[]; rounds: { instruction: string; itemId: string; slot: string }[]; items: {...}[] }`.

- [ ] **Step 1: failing tests.** `all-lessons.test.ts`: every lesson file listed in `grade4/index.json` exists, passes `validateLesson`, has an id equal to its index ref, uses only game types present in `registry`, and every `blank.text` contains `___` exactly once. `DragOrder` sequence mode: arranging items in listed order then pressing "تحقّق" calls `onDone` correct; works with pointer and with tap-to-select-then-tap-target (no drag required on touch).
- [ ] **Step 2:** Write lessons 2–6 from the reference, same richness as `l1.json`. l4 includes a `drag-order` sequence round (four children of different `scale`, prompt "رتّب من الأقصر إلى الأطول") and blanks on `-er than`. l6 includes a `drag-order` place round with slots `top, middle, bottom` and instructions like "Put the milk on the top shelf."
- [ ] **Step 3:** Tests and build pass; play all six lessons once. Commit `feat: unit 1 complete`. Push.

## Stage 6: Unit 2 content, world map, clock

**Files:** Create `u2/l1.json` … `l6.json`; `src/games/special/WorldMap.tsx`, `Clock.tsx` (+tests).

**Configs:** WorldMap `{ countries: string[] }` — a simplified original SVG world with six tappable regions (Libya, England, America, Russia, Brazil, China); each round plays and shows "I'm from X." Clock `{ times: string[] }` with values like `"3.30"`; hour and minute hands are set with +/− buttons or drag, minute hand snaps to 0 or 30.

- [ ] **Step 1: failing tests.** WorldMap: tapping the named region is correct, another region is wrong then shows the right one. Clock: `timeToAngles('3.30')` returns `{ hour: 105, minute: 180 }`, `'12.00'` returns `{ hour: 0, minute: 0 }`; setting the hands to the target and pressing "تحقّق" is correct.
- [ ] **Step 2:** Write the six lessons. l2 (capitals and languages): the book teaches capital, language and weather for Libya and England only, so use exactly the two-country table in the reference and do not add other capitals; build variety from "I live in …" with the Libyan cities listed there. l4 uses listen-pick with numerals as options.
- [ ] **Step 3:** `all-lessons.test.ts` still passes; build passes. Commit `feat: unit 2 complete`. Push.

## Stage 7: Unit 3 content and the stall game

**Files:** Create `u3/l1.json` … `l5.json`; `src/games/special/Stall.tsx` (+test).

**Stall config:** `{ menu: { en: string; emoji: string; price: number }[]; rounds: number }`, prices in steps of 0.5 LYD. Each round: a customer line ("Can I have a tea and a cake, please?"), the learner taps the ordered items onto a tray, then picks the total from three options.

- [ ] **Step 1: failing tests.** `orderTotal([{price:2.5},{price:1}])` is `3.5`; the three total options are distinct and include the correct one; wrong items on the tray block "تحقّق" with an Arabic hint; correct tray and total call `onDone` correct.
- [ ] **Step 2:** Write the five lessons. l1 uses `drag-order` sequence for the months (two rounds of six). l5 uses `drag-order` place with slots `first, second, third, fourth` as a winners' podium.
- [ ] **Step 3:** Tests and build pass. Commit `feat: unit 3 complete`. Push.

## Stage 8: Big Challenge and certificate

**Files:** Create `src/screens/BigChallenge.tsx`, `Certificate.tsx`; `src/engine/bigChallenge.ts` (+test).

**Produces:** `buildBigChallenge(lessonsByUnit: Lesson[][], rng): { rounds: Question[][]; final: Question[] }` — three rounds of 10 questions (one per unit, drawn across that unit's lessons, generic types only) and a final mixed round of 12. `bigChallengePassed(correct: number, total: number): boolean` — true at 70% or more.

- [ ] **Step 1: failing tests.** Three rounds of 10; round *n* uses only words from unit *n*; final has 12 with at least 3 from each unit; `bigChallengePassed(30,42)` is true (71.4%), `bigChallengePassed(29,42)` is false (69.05%), `bigChallengePassed(0,0)` is false.
- [ ] **Step 2:** Implement. Unlocks when every lesson of Units 1–3 has ≥1 star (or teacher mode). Final round has a 10-second timer per question. Passing awards badge `big-challenge` and opens `Certificate`: learner name, "أتمّ النصف الأول من الصف الرابع"، date, "مدرسة المعرفة مصراتة", a print button, and a print stylesheet that fits one A4 landscape page. A 20-character Arabic name must not overflow.
- [ ] **Step 3:** Tests and build pass. Commit `feat: big challenge and certificate`. Push.

## Stage 9: Teacher mode, offline, polish

**Files:** Create `src/screens/TeacherMode.tsx` (+test); `public/content/sample-new-lesson.json`; modify `vite.config.ts` (PWA), `UnitPath.tsx`.

- [ ] **Step 1: failing tests.** Importing a valid file adds it to `progress.imported` and it appears in the path under "دروس إضافية"; importing the same id twice replaces it; a non-JSON file shows "الملف ليس بصيغة JSON صحيحة"; an invalid lesson shows `validateLesson`'s `errorAr`; in both failure cases `imported` is unchanged.
- [ ] **Step 2:** Implement `TeacherMode` (file picker, list of imported lessons with delete, "افتح كل الدروس" switch). Write `sample-new-lesson.json` (a small "Colours" lesson, 6 words) and add a download link to it — this is the file used in the live demo.
- [ ] **Step 3:** PWA: manifest (name "مغامرة الإنجليزي", `dir: rtl`, `lang: ar`, icons), precache the app shell and everything under `content/`. Verify offline: `npm run build && npm run preview`, load once, switch the browser to offline, reload, play a lesson with sound.
- [ ] **Step 4:** Polish pass at 360 px, 768 px, 1280 px: no horizontal scroll, tap targets ≥ 48 px, visible focus rings, an error boundary that shows "حدث خطأ، اضغط للعودة" instead of a blank page. Check `dist/` is under 25 MB.
- [ ] **Step 5:** Tests and build pass. Commit `feat: teacher mode, offline, polish`. Push. Report the live URL and the offline check result.

## Outside the code (people, not the coding agent)

- English teacher reviews every lesson JSON and the Arabic meanings.
- Students replace emoji with their own illustrations (`public/content/images/<word>.svg`, set `image` in the lesson) and record or generate audio (`public/content/audio/<word>.mp3`, set `audio`). The app works without them.
- Trial with Grade 4 pupils in week 6; collect results for the slides.
