import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GameProps, Question } from '../types';

/** The three behaviours every single-answer game shares. */
export function choiceSuite(name: string, Game: React.FC<GameProps>, q: Question, right: string, wrong: string) {
  test(`${name}: right answer first time`, async () => {
    const onDone = vi.fn();
    render(<Game question={q} onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: right }));
    expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
  });
  test(`${name}: wrong then right, answer revealed after the wrong choice`, async () => {
    const onDone = vi.fn();
    render(<Game question={q} onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: wrong }));
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: right })).toHaveAttribute('data-state', 'reveal');
    expect(screen.getByRole('button', { name: wrong })).toHaveAttribute('data-state', 'wrong');
    if (q.explainAr) expect(screen.getByText(q.explainAr)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: right }));
    expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 2 });
  });
}
