import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SpeedRun } from './SpeedChallenge';
import { ProgressProvider } from '../state/ProgressContext';
import { defaultProgress, loadProgress, saveProgress } from '../state/progress';
import { loadDuo } from '../state/quests';
import { makeRng } from '../engine/rng';
import type { Word } from '../types';

const words: Word[] = [
  { en: 'inventor', ar: 'مخترع', emoji: '🧑‍🔬' },
  { en: 'glacier', ar: 'نهر جليدي', emoji: '🧊' },
  { en: 'tunnel', ar: 'نفق', emoji: '🚇' },
  { en: 'palace', ar: 'قصر', emoji: '🏛️' },
  { en: 'whale', ar: 'حوت', emoji: '🐋' },
  { en: 'anchor', ar: 'مرساة', emoji: '⚓' },
];

beforeEach(() => {
  localStorage.clear();
  saveProgress({ ...defaultProgress(), name: 'كريم', avatar: '👦' });
});

test('speed challenge scores rapid matches, builds combo, and saves personal best on timeout', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <MemoryRouter>
      <ProgressProvider><SpeedRun words={words} seconds={5} rng={makeRng(3)} /></ProgressProvider>
    </MemoryRouter>,
  );

  await user.click(screen.getByRole('button', { name: /ابدأ السباق/ }));

  // Answer 3 cards right in a row to trigger combo
  for (let i = 0; i < 3; i++) {
    const en = screen.getByTestId('speed-word').textContent!;
    const target = words.find(w => w.en === en)!;
    await user.click(screen.getByRole('button', { name: target.ar }));
  }
  expect(screen.getByText(/مضاعفة/)).toBeInTheDocument();

  // Advance timer past 5 seconds to finish round
  act(() => { vi.advanceTimersByTime(6000); });

  expect(await screen.findByText(/انتهى الوقت/)).toBeInTheDocument();
  expect(loadDuo().bestSpeedScore).toBe(3);
  expect(loadProgress().points).toBeGreaterThanOrEqual(20); // 5 + 5 + 10
  vi.useRealTimers();
});
