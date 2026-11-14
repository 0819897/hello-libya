import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderSentence from './OrderSentence';
import type { Question } from '../types';

const q: Question = { id: 'o', type: 'order-sentence', tiles: ['Ali.', 'Hello,', 'I\'m'], answer: ['Hello,', 'I\'m', 'Ali.'],
  explainAr: 'Hello, I\'m Ali.' };
const tap = (t: string) => userEvent.click(screen.getByRole('button', { name: t }));

test('right order first time', async () => {
  const onDone = vi.fn();
  render(<OrderSentence question={q} onDone={onDone} />);
  await tap('Hello,'); await tap('I\'m'); await tap('Ali.'); await tap('تحقّق');
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
});
test('wrong order shows the sentence, then right order is attempt 2', async () => {
  const onDone = vi.fn();
  render(<OrderSentence question={q} onDone={onDone} />);
  await tap('Ali.'); await tap('Hello,'); await tap('I\'m'); await tap('تحقّق');
  expect(onDone).not.toHaveBeenCalled();
  expect(screen.getByText(q.explainAr!)).toBeInTheDocument();
  await tap('Hello,'); await tap('I\'m'); await tap('Ali.'); await tap('تحقّق');
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 2 });
});
test('a placed tile can be taken back', async () => {
  render(<OrderSentence question={q} onDone={() => {}} />);
  await tap('Ali.'); await tap('أزل Ali.');
  expect(screen.getByRole('button', { name: 'Ali.' })).toBeInTheDocument();
});
