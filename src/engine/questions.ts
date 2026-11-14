import type { GameSpec, GameType, Lesson, Option, Question, Word } from '../types';
import { shuffle } from './rng';

type Rng = () => number;
const SPECIAL: GameType[] = ['drag-order', 'world-map', 'clock', 'stall'];
const MASS = new Set(['milk', 'water', 'tea', 'coffee', 'lemonade', 'cola', 'paper', 'pizza', 'snow', 'music', 'art',
  'maths', 'science', 'orange juice', 'mango juice', 'black hair', 'weather']);

const pictured = (w: Word) => !w.abstract && !!(w.emoji || w.image);
const picOpt = (w: Word): Option => ({ id: w.en, emoji: w.emoji, image: w.image });
const explain = (w: Word) => `${w.en} = ${w.ar}`;

/** "This is a pen." / "This is an apple." / "These are apples." / "This is milk." / "This is Libya." */
export function thisIs(en: string): string {
  if (/^[A-Z]/.test(en) || MASS.has(en)) return `This is ${en}.`;
  if (/[^s]s$/.test(en) || en === 'sweets') return `These are ${en}.`;
  return `This is ${/^[aeiou]/i.test(en) ? 'an' : 'a'} ${en}.`;
}

/** answer + up to (n-1) distractors drawn from pool, shuffled */
function withDistractors<T>(answer: T, pool: T[], n: number, rng: Rng): T[] {
  return shuffle([answer, ...shuffle(pool.filter(x => x !== answer), rng).slice(0, n - 1)], rng);
}

function take<T>(xs: T[], spec: GameSpec, fallback: number, rng: Rng): T[] {
  return shuffle(xs, rng).slice(0, Math.max(0, spec.count ?? fallback));
}

function specialRounds(spec: GameSpec): number {
  const c = spec.config;
  if (!c) return 0;
  const len = (k: string) => (Array.isArray(c[k]) ? (c[k] as unknown[]).length : 0);
  switch (spec.type) {
    case 'clock': return len('times');
    case 'world-map': return len('countries');
    case 'stall': return typeof c.rounds === 'number' ? c.rounds : 0;
    case 'drag-order': return c.mode === 'place' ? len('rounds') : 1;
    default: return 0;
  }
}

export function buildQuestions(lesson: Lesson, spec: GameSpec, rng: Rng): Question[] {
  const { type } = spec;
  const words = lesson.words;
  const qid = (i: number, key: string) => `${lesson.id}:${type}:${i}:${key}`;

  if (SPECIAL.includes(type)) {
    const n = Math.min(specialRounds(spec), spec.count ?? Infinity);
    return Array.from({ length: n }, (_, round) => ({ id: qid(round, 'r'), type, answer: '', config: { ...spec.config, round } }));
  }

  switch (type) {
    case 'pick-image': {
      const pool = words.filter(pictured);
      if (pool.length < 2) return [];
      return take(pool, spec, 6, rng).map((w, i) => ({
        id: qid(i, w.en), type, wordEn: w.en, promptText: w.en, promptWord: w, answer: w.en, explainAr: explain(w),
        options: withDistractors(w, pool, 4, rng).map(picOpt),
      }));
    }
    case 'listen-pick': {
      const pics = spec.config?.show === 'picture';
      const pool = pics ? words.filter(w => w.emoji || w.image) : words;
      if (pool.length < 2) return [];
      return take(pool, spec, 5, rng).map((w, i) => ({
        id: qid(i, w.en), type, wordEn: w.en, promptWord: w, listen: true, answer: w.en, explainAr: explain(w),
        options: withDistractors(w, pool, 4, rng).map(x => (pics ? picOpt(x) : { id: x.en, text: x.en })),
      }));
    }
    case 'match': {
      const size = Math.min(5, Math.max(4, spec.count ?? 5));
      const ws = shuffle(words, rng);
      const qs: Question[] = [];
      for (let s = 0; s + 4 <= ws.length; s += size) {
        const group = ws.slice(s, s + size);
        qs.push({
          id: qid(qs.length, 'g'), type, answer: group.map(w => w.en),
          pairs: group.map(w => ({ left: { id: w.en, text: w.en },
            right: pictured(w) ? picOpt(w) : { id: w.en, text: w.ar } })),
        });
      }
      return qs;
    }
    case 'order-sentence': {
      return take(lesson.sentences ?? [], spec, 4, rng).map((s, i) => {
        const answer = s.split(/\s+/).filter(Boolean);
        let tiles = shuffle(answer, rng);
        for (let k = 0; k < 5 && answer.length > 1 && tiles.join(' ') === answer.join(' '); k++) tiles = shuffle(answer, rng);
        return { id: qid(i, 's'), type, tiles, answer, explainAr: s };
      });
    }
    case 'fill-blank': {
      return take(lesson.blanks ?? [], spec, 6, rng).map((b, i) => ({
        id: qid(i, b.answer), type, promptText: b.text, answer: b.answer, explainAr: b.text.replace('___', b.answer),
        options: shuffle([b.answer, ...b.distractors], rng).map(t => ({ id: t, text: t })),
      }));
    }
    case 'spell': {
      const pool = words.filter(w => /^[A-Za-z]{2,10}$/.test(w.en));
      const abc = 'abcdefghijklmnopqrstuvwxyz';
      return take(pool, spec, 4, rng).map((w, i) => {
        const answer = w.en.split('');
        const extra = [0, 1].map(() => abc[Math.floor(rng() * abc.length)]);
        return { id: qid(i, w.en), type, wordEn: w.en, promptWord: w, answer, tiles: shuffle([...answer, ...extra], rng), explainAr: explain(w) };
      });
    }
    case 'true-false': {
      const pool = words.filter(pictured);
      if (pool.length < 2) return [];
      return take(pool, spec, 5, rng).map((w, i) => {
        const truth = rng() < 0.5;
        const named = truth ? w : shuffle(words.filter(x => x.en !== w.en && !x.abstract && x.emoji !== w.emoji), rng)[0] ?? w;
        return {
          id: qid(i, w.en), type, wordEn: w.en, promptWord: w, promptText: thisIs(named.en),
          answer: truth || named === w ? 'true' : 'false', explainAr: thisIs(w.en),
          options: [{ id: 'true', text: 'صح' }, { id: 'false', text: 'خطأ' }],
        };
      });
    }
    default:
      return [];
  }
}

/** Mix the challenge types round-robin, up to challenge.count questions. */
export function buildChallenge(lesson: Lesson, rng: Rng): Question[] {
  const lists = lesson.challenge.types.map(type => buildQuestions(lesson, { type, count: lesson.challenge.count }, rng));
  const out: Question[] = [];
  for (let i = 0; out.length < lesson.challenge.count && lists.some(l => i < l.length); i++)
    for (const l of lists) if (i < l.length && out.length < lesson.challenge.count) out.push(l[i]);
  return out;
}
