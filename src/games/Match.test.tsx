import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Match from './Match';
import type { Question } from '../types';

const q: Question = { id: 'm', type: 'match', answer: ['mum', 'dad', 'sister', 'whose'], pairs: [
  { left: { id: 'mum', text: 'mum' }, right: { id: 'mum', emoji: '👩' } },
  { left: { id: 'dad', text: 'dad' }, right: { id: 'dad', emoji: '👨' } },
  { left: { id: 'sister', text: 'sister' }, right: { id: 'sister', emoji: '👧' } },
  { left: { id: 'whose', text: 'whose' }, right: { id: 'whose', text: 'لمن' } }] };
const pairUp = async (en: string, right: string) => {
  await userEvent.click(screen.getByRole('button', { name: en }));
  await userEvent.click(screen.getByRole('button', { name: right }));
};

test('all pairs right first time', async () => {
  const onDone = vi.fn();
  render(<Match question={q} onDone={onDone} />);
  await pairUp('mum', '👩'); await pairUp('dad', '👨'); await pairUp('sister', '👧');
  expect(onDone).not.toHaveBeenCalled();
  await pairUp('whose', 'لمن');
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
});
test('a wrong pair reveals the right partner and counts an attempt', async () => {
  const onDone = vi.fn();
  render(<Match question={q} onDone={onDone} />);
  await pairUp('mum', '👨');
  expect(screen.getByRole('button', { name: '👩' })).toHaveAttribute('data-state', 'reveal');
  await pairUp('mum', '👩'); await pairUp('dad', '👨'); await pairUp('sister', '👧'); await pairUp('whose', 'لمن');
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 2 });
});
