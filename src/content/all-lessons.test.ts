import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateLesson } from './loader';
import { registry } from '../games/registry';
import type { GradeIndex, Lesson } from '../types';

const root = join(process.cwd(), 'public', 'content', 'grade4');
const index: GradeIndex = JSON.parse(readFileSync(join(root, 'index.json'), 'utf8'));
const refs = index.units.filter(u => u.status === 'open').flatMap(u => u.lessons);

test('index lists lessons', () => expect(refs.length).toBeGreaterThan(0));

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
  test('every blank has ___ exactly once', () => {
    for (const b of lesson().blanks ?? []) expect(b.text.split('___').length - 1, b.text).toBe(1);
  });
  test('word en values are unique', () => {
    const ens = lesson().words.map(w => w.en);
    expect(new Set(ens).size).toBe(ens.length);
  });
});

test('the sample lesson for teachers is valid', () => {
  const sample = JSON.parse(readFileSync(join(process.cwd(), 'public', 'content', 'sample-new-lesson.json'), 'utf8'));
  const r = validateLesson(sample);
  expect(r.ok ? 'ok' : r.errorAr).toBe('ok');
  expect(sample.words).toHaveLength(6);
});
