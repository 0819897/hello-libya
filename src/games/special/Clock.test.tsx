import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Clock, { timeToAngles } from './Clock';
import type { Question } from '../../types';

test('timeToAngles', () => {
  expect(timeToAngles('3.30')).toEqual({ hour: 105, minute: 180 });
  expect(timeToAngles('12.00')).toEqual({ hour: 0, minute: 0 });
  expect(timeToAngles('7.00')).toEqual({ hour: 210, minute: 0 });
});

const q: Question = { id: 'c', type: 'clock', answer: '', config: { times: ['12.30', '3.30'], round: 1 } };
const click = (name: string, n = 1) => (async () => { for (let i = 0; i < n; i++) await userEvent.click(screen.getByRole('button', { name })); })();

test('setting the hands to the target and pressing تحقّق is correct', async () => {
  const onDone = vi.fn();
  render(<Clock question={q} onDone={onDone} />);
  expect(screen.getByText("It's 3.30.")).toBeInTheDocument();
  // starts at 12.00
  await click('ساعة أكثر', 3);
  await click('دقائق أكثر');
  expect(screen.getByTestId('clock-value')).toHaveTextContent('3.30');
  await click('تحقّق');
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 1 });
});
test('wrong time is an attempt and shows the right time', async () => {
  const onDone = vi.fn();
  render(<Clock question={q} onDone={onDone} />);
  await click('تحقّق');
  expect(onDone).not.toHaveBeenCalled();
  expect(screen.getByTestId('right-time')).toHaveTextContent('3.30');
  await click('ساعة أقل', 9); // 12 -> 3 going backwards
  await click('دقائق أقل'); // 0 -> 30 (minutes snap between 0 and 30)
  await click('تحقّق');
  expect(onDone).toHaveBeenCalledWith({ correct: true, attempts: 2 });
});
