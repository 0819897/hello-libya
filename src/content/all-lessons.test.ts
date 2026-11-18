import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { audioFileFor } from '../audio/speak';
import { validateLesson } from './loader';
import { buildChallenge } from '../engine/questions';
import { makeRng } from '../engine/rng';
import { registry } from '../games/registry';
import type { GradeEntry, GradeIndex, Lesson } from '../types';

const contentRoot = join(process.cwd(), 'public', 'content');
const grades: GradeEntry[] = JSON.parse(readFileSync(join(contentRoot, 'grades.json'), 'utf8'));
const openGrades = grades.filter(g => g.status === 'open');

test('both grade4 and grade5 are open in grades.json', () => {
  expect(openGrades.map(g => g.id)).toEqual(['grade4', 'grade5']);
});

describe.each(openGrades)('grade $id', gradeEntry => {
  const root = join(contentRoot, gradeEntry.id);
  const indexPath = join(contentRoot, gradeEntry.index ?? `${gradeEntry.id}/index.json`);

  test('grade index exists and matches id', () => {
    expect(existsSync(indexPath)).toBe(true);
    const idx: GradeIndex = JSON.parse(readFileSync(indexPath, 'utf8'));
    expect(idx.id).toBe(gradeEntry.id);
  });

  const index: GradeIndex | null = existsSync(indexPath)
    ? JSON.parse(readFileSync(indexPath, 'utf8'))
    : null;
  const refs = index ? index.units.filter(u => u.status === 'open').flatMap(u => u.lessons) : [];

  test('index lists lessons', () => expect(refs.length).toBeGreaterThan(0));

  if (refs.length > 0) {
    describe.each(refs)('$id', ref => {
      const path = join(root, ref.file);
      test('file exists', () => expect(existsSync(path)).toBe(true));
      const lesson = (): Lesson => JSON.parse(readFileSync(path, 'utf8'));
      test('passes validateLesson', () => {
        const r = validateLesson(lesson());
        expect(r.ok ? 'ok' : r.errorAr).toBe('ok');
      });
      test('id matches the index ref', () => expect(lesson().id).toBe(ref.id));
      test('uses only registered game types', () => {
        const l = lesson();
        for (const t of [...l.games.map(g => g.type), ...l.challenge.types]) expect(registry[t], t).toBeDefined();
      });
      test('every blank has ___ once and distinct distractors', () => {
        for (const b of lesson().blanks ?? []) {
          expect(b.text.split('___').length - 1, b.text).toBe(1);
          expect(new Set([b.answer, ...b.distractors]).size, b.text).toBe(3);
        }
      });
      test('word en values are unique', () => {
        const ens = lesson().words.map(w => w.en);
        expect(new Set(ens).size).toBe(ens.length);
      });
      test('challenge generates full question count', () => {
        const l = lesson();
        expect(buildChallenge(l, makeRng(7))).toHaveLength(l.challenge.count);
      });
      test('every word and grammar example has a generated local audio file', () => {
        const l = lesson();
        const audioDir = join(contentRoot, 'audio');
        for (const w of l.words) {
          expect(existsSync(join(audioDir, w.audio ?? audioFileFor(w.en))), w.en).toBe(true);
        }
        for (const ex of l.grammar?.examples ?? []) {
          expect(existsSync(join(audioDir, audioFileFor(ex))), ex).toBe(true);
        }
      });
    });
  }
});

test('the sample lesson for teachers is valid', () => {
  const sample = JSON.parse(readFileSync(join(contentRoot, 'sample-new-lesson.json'), 'utf8'));
  const r = validateLesson(sample);
  expect(r.ok ? 'ok' : r.errorAr).toBe('ok');
  expect(sample.words).toHaveLength(6);
});
