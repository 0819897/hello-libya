import { pbkdf2Sync } from 'node:crypto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { checkTeacherCode, LOCK_MS, MAX_TRIES, normaliseCode, type TeacherHash } from './teacherCode';
import { TeacherGate } from '../ui/TeacherGate';
import { defaultProgress, loadProgress, migrateTeacherModeOnce, saveProgress } from './progress';

const salt = '00112233445566778899aabbccddeeff';
const make = (code: string, iterations = 1000): TeacherHash =>
  ({ salt, iterations, hash: pbkdf2Sync(code, Buffer.from(salt, 'hex'), iterations, 32, 'sha256').toString('hex') });

beforeEach(() => localStorage.clear());

test('accepts the right code (also typed with Arabic digits) and rejects a wrong one', async () => {
  const cfg = make('482915');
  expect(await checkTeacherCode('482915', cfg)).toEqual({ ok: true });
  expect(await checkTeacherCode(' ٤٨٢٩١٥ ', cfg)).toEqual({ ok: true });
  expect(await checkTeacherCode('111111', cfg)).toMatchObject({ ok: false, reason: 'wrong', triesLeft: MAX_TRIES - 1 });
  expect(normaliseCode('۴۸۲')).toBe('482');
});

test('locks for 5 minutes after 5 wrong tries, even for the right code', async () => {
  const cfg = make('482915');
  const t0 = 1_800_000_000_000;
  for (let i = 0; i < MAX_TRIES - 1; i++) expect((await checkTeacherCode('000000', cfg, t0)).ok).toBe(false);
  expect(await checkTeacherCode('000000', cfg, t0)).toMatchObject({ reason: 'locked' });
  expect(await checkTeacherCode('482915', cfg, t0 + 60_000)).toMatchObject({ reason: 'locked' });
  expect(await checkTeacherCode('482915', cfg, t0 + LOCK_MS + 1)).toEqual({ ok: true });
});

test('without a configured code teacher mode cannot be unlocked', async () => {
  expect(await checkTeacherCode('482915', null)).toMatchObject({ ok: false, reason: 'not-configured' });
  render(createElement(TeacherGate, { onUnlock: () => {}, config: null }));
  expect(screen.getByRole('alert')).toHaveTextContent('لم يُضبط كود المعلّم');
});

test('the gate unlocks only with the right code', async () => {
  const onUnlock = vi.fn();
  render(createElement(TeacherGate, { onUnlock, config: make('2468') }));
  await userEvent.type(screen.getByLabelText(/كود المعلّم/), '1357');
  await userEvent.click(screen.getByRole('button', { name: 'تفعيل' }));
  expect(await screen.findByText(/الكود غير صحيح/)).toBeInTheDocument();
  expect(onUnlock).not.toHaveBeenCalled();
  await userEvent.type(screen.getByLabelText(/كود المعلّم/), '2468');
  await userEvent.click(screen.getByRole('button', { name: 'تفعيل' }));
  await vi.waitFor(() => expect(onUnlock).toHaveBeenCalledTimes(1));
});

test('teacher mode turned on before the code existed is switched off once at startup', () => {
  saveProgress({ ...defaultProgress(), name: 'Sami', teacherMode: true });
  migrateTeacherModeOnce();
  expect(loadProgress().teacherMode).toBe(false);
  saveProgress({ ...loadProgress(), teacherMode: true }); // a teacher enables it again with the code
  migrateTeacherModeOnce();
  expect(loadProgress().teacherMode).toBe(true);
});
