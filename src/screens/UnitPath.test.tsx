import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UnitPathView } from './UnitPath';
import { ProgressProvider } from '../state/ProgressContext';
import { defaultProgress, saveProgress } from '../state/progress';
import type { GradeIndex, Progress } from '../types';

const ref = (id: string, title: string) => ({ id, file: '', title, titleAr: title + '-ar' });
const grade: GradeIndex = { id: 'grade4', titleAr: 'الصف الرابع', levelTitleAr: 'المستوى 1', units: [
  { id: 'u1', title: 'Our School', titleAr: 'مدرستنا', status: 'open', kind: 'unit', lessons: [ref('a', 'Hello'), ref('b', 'Playground')] },
  { id: 'u5', title: 'Places to See', titleAr: 'أماكن للزيارة', status: 'soon', kind: 'unit', lessons: [] }] };

const show = (p: Partial<Progress>) => {
  saveProgress({ ...defaultProgress(), name: 'Reem', avatar: '🦁', ...p });
  return render(<MemoryRouter><ProgressProvider><UnitPathView grade={grade} /></ProgressProvider></MemoryRouter>);
};
beforeEach(() => localStorage.clear());

test('locked lessons are not clickable, open ones are links', () => {
  show({});
  expect(screen.getByRole('link', { name: /Hello/ })).toHaveAttribute('href', '/lesson/grade4/a');
  expect(screen.queryByRole('link', { name: /Playground/ })).toBeNull();
  expect(screen.getByText('Playground').closest('[aria-disabled="true"]')).not.toBeNull();
});
test('a star on the previous lesson unlocks the next', () => {
  show({ lessons: { a: { stars: 1, bestPct: 60 } } });
  expect(screen.getByRole('link', { name: /Playground/ })).toBeInTheDocument();
});
test('self mode shows the level title and never the word الصف', () => {
  const { container } = show({ mode: 'self' });
  expect(screen.getByText('المستوى 1')).toBeInTheDocument();
  expect(container.textContent).not.toContain('الصف');
});
test('student mode shows the grade title', () => {
  show({ mode: 'student' });
  expect(screen.getByText('الصف الرابع')).toBeInTheDocument();
});
test('soon units say قريباً', () => {
  show({});
  expect(screen.getByText(/أماكن للزيارة/).closest('section')).toHaveTextContent('قريباً');
});
test('review node appears with 4 or more mistakes', () => {
  show({ mistakes: ['a', 'b', 'c'] });
  expect(screen.queryByRole('link', { name: /راجع أخطاءك/ })).toBeNull();
  localStorage.clear();
});
test('review node links to the review lesson', () => {
  show({ mistakes: ['a', 'b', 'c', 'd'] });
  expect(screen.getByRole('link', { name: /راجع أخطاءك/ })).toHaveAttribute('href', '/lesson/grade4/review');
});
