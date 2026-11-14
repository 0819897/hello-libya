import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Stall, { orderTotal, totalOptions } from './Stall';
import { makeRng } from '../../engine/rng';
import type { Question } from '../../types';

const menu = [
  { en: 'tea', emoji: '🍵', price: 1 }, { en: 'cake', emoji: '🍰', price: 2.5 },
  { en: 'sandwich', emoji: '🥪', price: 2 }, { en: 'orange juice', emoji: '🍊', price: 1.5 },
];
const q: Question = { id: 's', type: 'stall', answer: '', config: { menu, rounds: 2, round: 0 } };

test('orderTotal', () => {
  expect(orderTotal([{ price: 2.5 }, { price: 1 }])).toBe(3.5);
  expect(orderTotal([])).toBe(0);
});
test('total options are three, distinct, positive, and include the right total', () => {
  for (let s = 1; s < 30; s++) {
    const opts = totalOptions(0.5 + (s % 7) * 0.5, makeRng(s));
    expect(opts).toHaveLength(3);
    expect(new Set(opts).size).toBe(3);
    expect(opts).toContain(0.5 + (s % 7) * 0.5);
    expect(opts.every(o => o > 0)).toBe(true);
  }
});

const ordered = () => {
  const line = screen.getByTestId('customer').textContent!;
  return menu.filter(m => new RegExp(`\\b(a|an) ${m.en}\\b`).test(line));
};

test('wrong items on the tray block تحقّق with an Arabic hint', async () => {
  const onDone = vi.fn();
  render(<Stall question={q} onDone={onDone} />);
  const wrong = menu.find(m => !ordered().includes(m))!;
  await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${wrong.en}`) }));
  await userEvent.click(screen.getByRole('button', { name: 'تحقّق' }));
  expect(screen.getByRole('status')).toHaveTextContent('الصينية لا تطابق الطلب');
  expect(screen.queryByText('كم المجموع؟')).toBeNull();
  expect(onDone).not.toHaveBeenCalled();
});
test('correct tray and total call onDone correct', async () => {
  const onDone = vi.fn();
  render(<Stall question={q} onDone={onDone} />);
  const items = ordered();
  expect(items.length).toBeGreaterThan(0);
  for (const m of items) await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${m.en}`) }));
  await userEvent.click(screen.getByRole('button', { name: 'تحقّق' }));
  expect(screen.getByText('كم المجموع؟')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: `${orderTotal(items)} دينار` }));
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
});
