import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LessonRun } from './LessonPlayer';
import { ProgressProvider } from '../state/ProgressContext';
import * as progressMod from '../state/progress';
import { makeRng } from '../engine/rng';
import type { Lesson } from '../types';

vi.mock('../state/progress', async orig => {
  const m = await orig<typeof import('../state/progress')>();
  return { ...m, completeLesson: vi.fn(m.completeLesson) };
});

const emoji: Record<string, string> = { mum: '👩', dad: '👨', sister: '👧', book: '📘' };
const lesson: Lesson = { id: 'g4-test', title: 'T', titleAr: 'ت',
  words: Object.entries(emoji).map(([en, e]) => ({ en, ar: en + '-ar', emoji: e })),
  games: [{ type: 'pick-image', count: 2 }], challenge: { count: 2, types: ['pick-image'] } };

const promptWord = () => screen.getByRole('button', { name: /^استمع: / }).getAttribute('aria-label')!.replace('استمع: ', '');
const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));
const answer = async (right = true) => {
  const w = promptWord();
  await click(right ? emoji[w] : Object.entries(emoji).find(([en]) => en !== w)![1]);
  if (!right) await click(emoji[w]);
  await click('التالي');
  return w;
};

beforeEach(() => localStorage.clear());

test('wrong first attempt is asked again at the end of the round; finishing saves once and shows the result', async () => {
  render(<MemoryRouter><ProgressProvider><LessonRun lesson={lesson} rng={makeRng(1)} /></ProgressProvider></MemoryRouter>);
  for (let i = 0; i < 3; i++) await click('الكلمة التالية');
  await click('هيا نلعب!');
  const first = await answer(false);
  await answer(true);
  expect(promptWord()).toBe(first); // re-asked
  await answer(true);
  await click('ابدأ التحدّي');
  await answer(true);
  await answer(true);
  expect(screen.getByText('انتهى الدرس!')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'أعد المحاولة' })).toBeInTheDocument();
  expect(progressMod.completeLesson).toHaveBeenCalledTimes(1);
  const saved = JSON.parse(localStorage.getItem('eq.progress.v1')!);
  expect(saved.lessons['g4-test']).toEqual({ stars: 3, bestPct: 100 });
  expect(saved.points).toBe(4 * 10 + 5); // 4 first-attempt answers + 1 second-attempt
});
