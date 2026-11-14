import type { GameType, GradeEntry, GradeIndex, Lesson, LessonRef } from '../types';

export const GAME_TYPES: GameType[] = ['pick-image', 'listen-pick', 'match', 'order-sentence', 'fill-blank',
  'spell', 'true-false', 'drag-order', 'world-map', 'clock', 'stall'];
const REQUIRED = ['id', 'title', 'titleAr', 'words', 'games', 'challenge'] as const;
const NOT_LESSON = 'الملف ليس درساً صحيحاً';
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isStr = (x: unknown): x is string => typeof x === 'string' && x.trim() !== '';

export function validateLesson(input: unknown): { ok: true; lesson: Lesson } | { ok: false; errorAr: string } {
  const fail = (errorAr: string) => ({ ok: false as const, errorAr });
  if (!isObj(input)) return fail(NOT_LESSON);
  for (const f of REQUIRED) if (input[f] === undefined || input[f] === null) return fail(`ينقص الدرس الحقل: ${f}`);
  const { id, title, titleAr, words, games, challenge, blanks, sentences } = input;
  if (!isStr(id) || !isStr(title) || !isStr(titleAr) || !Array.isArray(words) || !Array.isArray(games) || !isObj(challenge))
    return fail(NOT_LESSON);
  if (words.length < 4) return fail('الدرس يحتاج 4 كلمات على الأقل');
  if (!words.every(w => isObj(w) && isStr(w.en) && isStr(w.ar))) return fail('كلمة ناقصة: كل كلمة تحتاج en و ar');
  const optStr = (x: unknown) => x === undefined || typeof x === 'string';
  if (!words.every(w => optStr(w.emoji) && optStr(w.image) && optStr(w.audio) && (w.abstract === undefined || typeof w.abstract === 'boolean')))
    return fail(NOT_LESSON);
  const { grammar } = input;
  if (grammar !== undefined && !(isObj(grammar) && typeof grammar.explainAr === 'string'
    && Array.isArray(grammar.examples) && grammar.examples.every(e => typeof e === 'string'))) return fail(NOT_LESSON);
  for (const g of games) {
    if (!isObj(g)) return fail(NOT_LESSON);
    if (!GAME_TYPES.includes(g.type as GameType)) return fail(`نوع لعبة غير معروف: ${String(g.type)}`);
    if ((g.count !== undefined && typeof g.count !== 'number') || (g.config !== undefined && !isObj(g.config))) return fail(NOT_LESSON);
  }
  if (typeof challenge.count !== 'number' || !Array.isArray(challenge.types)) return fail(NOT_LESSON);
  for (const t of challenge.types) if (!GAME_TYPES.includes(t as GameType)) return fail(`نوع لعبة غير معروف: ${String(t)}`);
  if (sentences !== undefined && !(Array.isArray(sentences) && sentences.every(isStr))) return fail(NOT_LESSON);
  if (blanks !== undefined && !(Array.isArray(blanks) && blanks.every(b => isObj(b) && isStr(b.text) && b.text.includes('___')
    && isStr(b.answer) && Array.isArray(b.distractors) && b.distractors.length === 2 && b.distractors.every(isStr))))
    return fail('جملة ناقصة غير صحيحة: كل جملة تحتاج ___ والإجابة وخيارين');
  return { ok: true, lesson: input as unknown as Lesson };
}

async function getJson(path: string): Promise<unknown> {
  const res = await fetch(`./content/${path}`);
  if (!res.ok) throw new Error('تعذّر تحميل المحتوى');
  return res.json();
}

export async function loadGrades(): Promise<GradeEntry[]> {
  return (await getJson('grades.json')) as GradeEntry[];
}

export async function loadGradeIndex(gradeId: string): Promise<GradeIndex> {
  return (await getJson(`${gradeId}/index.json`)) as GradeIndex;
}

export async function loadLesson(ref: LessonRef, gradeId: string): Promise<Lesson> {
  const r = validateLesson(await getJson(`${gradeId}/${ref.file}`));
  if (!r.ok) throw new Error(r.errorAr);
  return r.lesson;
}

/** Every loadable lesson of a grade, grouped by unit. Lessons that fail to load are skipped. */
export async function loadGradeLessons(grade: GradeIndex): Promise<{ unitId: string; lessons: Lesson[] }[]> {
  return Promise.all(grade.units.filter(u => u.status === 'open').map(async u => ({
    unitId: u.id,
    lessons: (await Promise.all(u.lessons.map(ref => loadLesson(ref, grade.id).catch(() => null))))
      .filter((l): l is Lesson => l !== null),
  })));
}
