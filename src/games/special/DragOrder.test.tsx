import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DragOrder from './DragOrder';
import type { Question } from '../../types';

const items = [
  { id: 'reem', label: 'Reem', emoji: '🧒', scale: 0.6 },
  { id: 'ali', label: 'Ali', emoji: '🧒', scale: 0.8 },
  { id: 'nadia', label: 'Nadia', emoji: '🧒', scale: 1 },
  { id: 'kareem', label: 'Kareem', emoji: '🧒', scale: 1.2 },
];
const seq: Question = { id: 'd', type: 'drag-order', answer: '',
  config: { mode: 'sequence', promptAr: 'رتّب من الأقصر إلى الأطول', items, round: 0 } };
const order = () => screen.getAllByRole('button', { name: /^(Reem|Ali|Nadia|Kareem)/ }).map(b => b.dataset.id);

/** Arrange the row into the listed order using taps: select a slot's target item, then tap the item that belongs there. */
async function arrangeByTap() {
  for (let i = 0; i < items.length; i++) {
    const current = order();
    if (current[i] === items[i].id) continue;
    await userEvent.click(screen.getAllByRole('button', { name: /^(Reem|Ali|Nadia|Kareem)/ })[i]);
    await userEvent.click(screen.getByRole('button', { name: new RegExp('^' + items[i].label) }));
  }
}

test('sequence: shuffled at start', () => {
  render(<DragOrder question={seq} onDone={() => {}} />);
  expect(order()).not.toEqual(items.map(i => i.id));
  expect([...order()].sort()).toEqual(items.map(i => i.id).sort());
});
test('sequence: tap-to-select then tap-target arranges, تحقّق is correct', async () => {
  const onDone = vi.fn();
  render(<DragOrder question={seq} onDone={onDone} />);
  await arrangeByTap();
  expect(order()).toEqual(items.map(i => i.id));
  await userEvent.click(screen.getByRole('button', { name: 'تحقّق' }));
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
});
test('sequence: pointer drag swaps items', async () => {
  const onDone = vi.fn();
  render(<DragOrder question={seq} onDone={onDone} />);
  for (let i = 0; i < items.length; i++) {
    const btns = screen.getAllByRole('button', { name: /^(Reem|Ali|Nadia|Kareem)/ });
    if (btns[i].dataset.id === items[i].id) continue;
    const from = btns.find(b => b.dataset.id === items[i].id)!;
    fireEvent.pointerDown(from, { pointerId: 1 });
    fireEvent.pointerUp(btns[i], { pointerId: 1 });
  }
  expect(order()).toEqual(items.map(i => i.id));
  await userEvent.click(screen.getByRole('button', { name: 'تحقّق' }));
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
});
test('sequence: wrong order shows the right order and counts an attempt', async () => {
  const onDone = vi.fn();
  render(<DragOrder question={seq} onDone={onDone} />);
  await userEvent.click(screen.getByRole('button', { name: 'تحقّق' }));
  expect(onDone).not.toHaveBeenCalled();
  expect(screen.getByTestId('right-order')).toHaveTextContent('Reem → Ali → Nadia → Kareem');
  await arrangeByTap();
  await userEvent.click(screen.getByRole('button', { name: 'تحقّق' }));
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 2 });
});

const place: Question = { id: 'p', type: 'drag-order', answer: '', config: { mode: 'place', slots: ['top', 'middle', 'bottom'],
  items: [{ id: 'milk', label: 'milk', emoji: '🥛' }, { id: 'apples', label: 'apples', emoji: '🍎' }],
  rounds: [{ instruction: 'Put the milk on the top shelf.', itemId: 'milk', slot: 'top' },
    { instruction: 'Put the apples on the bottom shelf.', itemId: 'apples', slot: 'bottom' }], round: 1 } };

test('place: tapping the right slot for this round is correct', async () => {
  const onDone = vi.fn();
  render(<DragOrder question={place} onDone={onDone} />);
  expect(screen.getByText('Put the apples on the bottom shelf.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'bottom' }));
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
});
test('place: wrong slot reveals the right one, then attempt 2', async () => {
  const onDone = vi.fn();
  render(<DragOrder question={place} onDone={onDone} />);
  await userEvent.click(screen.getByRole('button', { name: 'top' }));
  expect(screen.getByRole('button', { name: 'bottom' })).toHaveAttribute('data-state', 'reveal');
  await userEvent.click(screen.getByRole('button', { name: 'bottom' }));
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 2 });
});
test('place: dragging the item onto a slot works', () => {
  const onDone = vi.fn();
  render(<DragOrder question={place} onDone={onDone} />);
  fireEvent.pointerDown(screen.getByRole('button', { name: 'apples' }), { pointerId: 1 });
  fireEvent.pointerUp(screen.getByRole('button', { name: 'bottom' }), { pointerId: 1 });
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
});
