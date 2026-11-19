import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { StoryRun, type Story } from './Stories';
import { ProgressProvider } from '../state/ProgressContext';
import { defaultProgress, loadProgress, saveProgress } from '../state/progress';
import { loadDuo } from '../state/quests';

const sample: Story = {
  id: 'g5-s1',
  unitAr: 'الوحدة 1',
  title: 'The Secret Invention',
  titleAr: 'الاختراع السري',
  emoji: '💡',
  steps: [
    { kind: 'line', speaker: 'Kareem', avatar: '👦', en: 'Hello Grandad! What happened to your ankle?', ar: 'مرحباً يا جدي! ماذا حدث لكاحلك؟' },
    { kind: 'quiz', promptAr: 'عمَّ سأل كريم جدّه؟', options: ['عن كاحله', 'عن الطقس', 'عن الغداء'], answer: 'عن كاحله' },
    { kind: 'line', speaker: 'Grandad', avatar: '👴', en: 'Look at my newest invention!', ar: 'انظر إلى أحدث اختراعاتي!' },
  ],
};

beforeEach(() => {
  localStorage.clear();
  saveProgress({ ...defaultProgress(), name: 'كريم', avatar: '👦' });
});

test('story player reveals lines step by step, gates on quiz checkpoint, and awards gems', async () => {
  render(<MemoryRouter><ProgressProvider><StoryRun story={sample} gradeId="grade5" /></ProgressProvider></MemoryRouter>);
  expect(screen.getByText(/Hello Grandad/)).toBeInTheDocument();
  expect(screen.queryByText(/newest invention/)).toBeNull();

  await userEvent.click(screen.getByRole('button', { name: 'تابع' }));
  expect(screen.getByText(/عمَّ سأل كريم جدّه؟/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'تابع' })).toBeNull();

  await userEvent.click(screen.getByRole('button', { name: 'عن كاحله' }));
  await userEvent.click(screen.getByRole('button', { name: 'تابع' }));
  expect(screen.getByText(/newest invention/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'أنهِ القصة' }));
  expect(screen.getByText(/أكملت القصة/)).toBeInTheDocument();
  expect(loadDuo().storiesDone).toContain('g5-s1');
  expect(loadProgress().points).toBeGreaterThanOrEqual(25);
});

test('all 4 Grade 5 stories in public/content/grade5/stories.json are valid', () => {
  const path = join(process.cwd(), 'public', 'content', 'grade5', 'stories.json');
  const stories: Story[] = JSON.parse(readFileSync(path, 'utf8'));
  expect(stories).toHaveLength(4);
  for (const s of stories) {
    expect(s.steps.length).toBeGreaterThanOrEqual(5);
    const quizzes = s.steps.filter(st => st.kind === 'quiz');
    expect(quizzes.length).toBeGreaterThanOrEqual(2);
    for (const q of quizzes) {
      if (q.kind === 'quiz') expect(q.options).toContain(q.answer);
    }
  }
});

test('replaying a finished story gives no extra points', async () => {
  const play = async () => {
    const view = render(<MemoryRouter><ProgressProvider><StoryRun story={sample} gradeId="grade5" /></ProgressProvider></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'تابع' }));
    await userEvent.click(screen.getByRole('button', { name: 'عن كاحله' }));
    await userEvent.click(screen.getByRole('button', { name: 'تابع' }));
    await userEvent.click(screen.getByRole('button', { name: 'أنهِ القصة' }));
    view.unmount();
  };
  await play();
  const afterFirst = loadProgress().points;
  expect(afterFirst).toBeGreaterThanOrEqual(25);
  await play();
  expect(loadProgress().points).toBe(afterFirst);
  expect(loadDuo().dailyXp).toBe(25);
});
