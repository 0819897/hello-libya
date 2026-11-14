import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TeacherMode from './TeacherMode';
import { UnitPathView } from './UnitPath';
import { ProgressProvider } from '../state/ProgressContext';
import { defaultProgress, loadProgress, saveProgress } from '../state/progress';
import type { GradeIndex } from '../types';

const lesson = (title: string) => ({ id: 'extra-colours', title, titleAr: 'الألوان',
  words: ['red', 'blue', 'green', 'yellow'].map(en => ({ en, ar: en })),
  games: [{ type: 'pick-image', count: 4 }], challenge: { count: 4, types: ['listen-pick'] } });
const file = (text: string, name = 'lesson.json') => new File([text], name, { type: 'application/json' });

const show = () => render(<MemoryRouter><ProgressProvider><TeacherMode /></ProgressProvider></MemoryRouter>);
const upload = (f: File) => userEvent.upload(screen.getByLabelText(/اختر ملف درس/), f);

beforeEach(() => { localStorage.clear(); saveProgress({ ...defaultProgress(), name: 'Teacher' }); });

test('a valid file is added to progress.imported and appears in the path under دروس إضافية', async () => {
  show();
  await upload(file(JSON.stringify(lesson('Colours'))));
  expect(await screen.findByText(/تمت إضافة الدرس/)).toBeInTheDocument();
  expect(loadProgress().imported.map(l => l.id)).toEqual(['extra-colours']);
  const grade: GradeIndex = { id: 'grade4', titleAr: 'الصف الرابع', levelTitleAr: 'المستوى 1', units: [] };
  render(<MemoryRouter><ProgressProvider><UnitPathView grade={grade} /></ProgressProvider></MemoryRouter>);
  expect(screen.getByText('دروس إضافية').closest('section')).toHaveTextContent('Colours');
});
test('importing the same id twice replaces it', async () => {
  show();
  await upload(file(JSON.stringify(lesson('Colours'))));
  await screen.findByText(/تمت إضافة الدرس/);
  await upload(file(JSON.stringify(lesson('Colours 2'))));
  await screen.findByText('تمت إضافة الدرس: Colours 2');
  expect(loadProgress().imported.map(l => l.title)).toEqual(['Colours 2']);
});
test('a non-JSON file shows the JSON error and imports nothing', async () => {
  show();
  await upload(file('this is not json'));
  expect(await screen.findByRole('alert')).toHaveTextContent('الملف ليس بصيغة JSON صحيحة');
  expect(loadProgress().imported).toEqual([]);
});
test('an invalid lesson shows validateLesson errorAr and imports nothing', async () => {
  show();
  const { words, ...noWords } = lesson('Bad'); void words;
  await upload(file(JSON.stringify(noWords)));
  expect(await screen.findByRole('alert')).toHaveTextContent('ينقص الدرس الحقل: words');
  expect(loadProgress().imported).toEqual([]);
});
test('a failed import leaves earlier imported lessons untouched', async () => {
  show();
  await upload(file(JSON.stringify(lesson('Colours'))));
  await screen.findByText(/تمت إضافة الدرس/);
  await upload(file(JSON.stringify({ ...lesson('X'), words: [] })));
  expect(await screen.findByRole('alert')).toHaveTextContent('الدرس يحتاج 4 كلمات على الأقل');
  expect(loadProgress().imported.map(l => l.title)).toEqual(['Colours']);
});
test('delete removes an imported lesson', async () => {
  show();
  await upload(file(JSON.stringify(lesson('Colours'))));
  await userEvent.click(await screen.findByRole('button', { name: /احذف Colours/ }));
  expect(loadProgress().imported).toEqual([]);
});
