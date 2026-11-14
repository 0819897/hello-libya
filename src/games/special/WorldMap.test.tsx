import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorldMap from './WorldMap';
import type { Question } from '../../types';

const q: Question = { id: 'w', type: 'world-map', answer: '', config: { countries: ['Libya', 'China'], round: 1 } };

test('shows the sentence for this round', () => {
  render(<WorldMap question={q} onDone={() => {}} />);
  expect(screen.getByText("I'm from China.")).toBeInTheDocument();
});
test('has six tappable regions', () => {
  render(<WorldMap question={q} onDone={() => {}} />);
  for (const c of ['Libya', 'England', 'America', 'Russia', 'Brazil', 'China'])
    expect(screen.getByRole('button', { name: c })).toBeInTheDocument();
});
test('tapping the named region is correct', async () => {
  const onDone = vi.fn();
  render(<WorldMap question={q} onDone={onDone} />);
  await userEvent.click(screen.getByRole('button', { name: 'China' }));
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
});
test('another region is wrong, then shows the right one', async () => {
  const onDone = vi.fn();
  render(<WorldMap question={q} onDone={onDone} />);
  await userEvent.click(screen.getByRole('button', { name: 'Brazil' }));
  expect(onDone).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Brazil' })).toHaveAttribute('data-state', 'wrong');
  expect(screen.getByRole('button', { name: 'China' })).toHaveAttribute('data-state', 'reveal');
  await userEvent.click(screen.getByRole('button', { name: 'China' }));
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 2 });
});
