import type { GameType, Lesson, Question } from '../types';
import { buildQuestions } from './questions';
import { shuffle } from './rng';

const GENERIC: GameType[] = ['pick-image', 'listen-pick', 'fill-blank', 'spell', 'true-false'];

/** Every generic question a unit's lessons can make (each lesson's own challenge types), mixed lesson by lesson. */
function unitPool(lessons: Lesson[], rng: () => number): Question[] {
  const perLesson = lessons.map(l => shuffle(l.challenge.types.filter(t => GENERIC.includes(t))
    .flatMap(type => buildQuestions(l, { type, count: 20 }, rng)), rng));
  const out: Question[] = [];
  const seen = new Set<string>();
  for (let i = 0; perLesson.some(p => i < p.length); i++) {
    for (const p of perLesson) {
      const q = p[i];
      if (!q) continue;
      const key = q.wordEn ?? q.promptText ?? q.id; // one question per word so a round doesn't repeat itself
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
    }
  }
  return out;
}

export function buildBigChallenge(lessonsByUnit: Lesson[][], rng: () => number): { rounds: Question[][]; final: Question[] } {
  const pools = lessonsByUnit.map(ls => unitPool(ls, rng));
  const rounds = pools.map(p => p.slice(0, 10));
  const perUnit = Math.floor(12 / Math.max(1, pools.length));
  const final = shuffle(pools.flatMap(p => {
    const rest = p.slice(10);
    return (rest.length >= perUnit ? rest : [...rest, ...shuffle(p.slice(0, 10), rng)]).slice(0, perUnit);
  }), rng).map(q => ({ ...q, id: `${q.id}:final` }));
  return { rounds, final };
}

export const bigChallengePassed = (correct: number, total: number) => total > 0 && correct / total >= 0.7;
