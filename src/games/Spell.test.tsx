import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Spell from './Spell';
import type { Question } from '../types';

const q: Question = { id: 's', type: 'spell', wordEn: 'mum', promptWord: { en: 'mum', ar: 'أمي', emoji: '👩' },
  tiles: ['u', 'x', 'm', 'q', 'm'], answer: ['m', 'u', 'm'], explainAr: 'mum = أمي' };
const tap = (t: string) => userEvent.click(screen.getAllByRole('button', { name: t })[0]);

test('right spelling first time', async () => {
  const onDone = vi.fn();
  render(<Spell question={q} onDone={onDone} />);
  await tap('m'); await tap('u'); await tap('m'); await tap('تحقّق');
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
});
test('wrong spelling reveals the word, then right is attempt 2', async () => {
  const onDone = vi.fn();
  render(<Spell question={q} onDone={onDone} />);
  await tap('m'); await tap('x'); await tap('m'); await tap('تحقّق');
  expect(onDone).not.toHaveBeenCalled();
  expect(screen.getByText(q.explainAr!)).toBeInTheDocument();
  await tap('m'); await tap('u'); await tap('m'); await tap('تحقّق');
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 2 });
});
test('without explainAr (challenge) the right spelling is still shown after a wrong try', async () => {
  render(<Spell question={{ ...q, explainAr: undefined }} onDone={() => {}} />);
  await tap('m'); await tap('x'); await tap('m'); await tap('تحقّق');
  expect(screen.getByTestId('answer')).toHaveTextContent('mum');
});
