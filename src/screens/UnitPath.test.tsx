import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UnitPathView } from './UnitPath';
import Certificate from './Certificate';
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

test('grade5 path keeps unit numbers across unnumbered revision, links المسار to grade5, and offers grade switch', () => {
  const g5: GradeIndex = { id: 'grade5', titleAr: 'الصف الخامس', levelTitleAr: 'المستوى 2', units: [
    { id: 'g5-u1', title: 'Adventure', titleAr: 'مغامرة', status: 'open', kind: 'unit', lessons: [ref('g5-u1-l1', 'Escape')] },
    { id: 'g5-u2', title: 'Mountains', titleAr: 'جبال', status: 'open', kind: 'unit', lessons: [ref('g5-u2-l1', 'Walk')] },
    { id: 'g5-u3', title: 'Bridges', titleAr: 'جسور', status: 'open', kind: 'unit', lessons: [ref('g5-u3-l1', 'Tunnel')] },
    { id: 'g5-u4', title: 'Structures', titleAr: 'منشآت', status: 'open', kind: 'unit', lessons: [ref('g5-u4-l1', 'Palace')] },
    { id: 'g5-rev', title: 'Revision', titleAr: 'التحدي الكبير', status: 'open', kind: 'big-challenge', lessons: [] },
    { id: 'g5-u5', title: 'Ancient', titleAr: 'القديم', status: 'soon', kind: 'unit', lessons: [] },
  ] };
  saveProgress({ ...defaultProgress(), name: 'Reem', avatar: '🦁', badges: ['big-challenge'] });
  render(<MemoryRouter><ProgressProvider><UnitPathView grade={g5} /></ProgressProvider></MemoryRouter>);
  expect(screen.getByText(/القديم/).closest('section')).toHaveTextContent('الوحدة 5');
  expect(screen.getByText(/1–4/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /المسار/ })).toHaveAttribute('href', '/grade/grade5');
  expect(screen.getByRole('link', { name: /تغيير الصف/ })).toHaveAttribute('href', '/grades');
});

test('grade5 certificate uses grade5 badge and title independently of grade4', () => {
  saveProgress({ ...defaultProgress(), name: 'Reem', avatar: '🦁', badges: ['big-challenge'] });
  const { unmount } = render(
    <MemoryRouter initialEntries={['/certificate/grade5']}>
      <ProgressProvider><Routes><Route path="/certificate/:gradeId" element={<Certificate />} /></Routes></ProgressProvider>
    </MemoryRouter>,
  );
  expect(screen.getByText(/أكمل التحدي الكبير/)).toBeInTheDocument();
  unmount();
  saveProgress({ ...defaultProgress(), name: 'Reem', avatar: '🦁', badges: ['big-challenge-grade5'] });
  render(
    <MemoryRouter initialEntries={['/certificate/grade5']}>
      <ProgressProvider><Routes><Route path="/certificate/:gradeId" element={<Certificate />} /></Routes></ProgressProvider>
    </MemoryRouter>,
  );
  expect(screen.getByText(/الصف الخامس/)).toBeInTheDocument();
});
