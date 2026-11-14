import { speak } from './speak';

afterEach(() => vi.unstubAllGlobals());

test('does nothing when sound is off', async () => {
  const play = vi.fn();
  vi.stubGlobal('Audio', vi.fn(function () { return { play }; }));
  await expect(speak({ en: 'mum', audio: 'mum.mp3' }, false)).resolves.toBeUndefined();
  expect(play).not.toHaveBeenCalled();
});
test('resolves when audio play rejects and speechSynthesis is missing', async () => {
  vi.stubGlobal('Audio', vi.fn(function () { return { play: () => Promise.reject(new Error('404')) }; }));
  vi.stubGlobal('speechSynthesis', undefined);
  await expect(speak({ en: 'mum', audio: 'missing.mp3' }, true)).resolves.toBeUndefined();
});
test('resolves when speechSynthesis is undefined', async () => {
  vi.stubGlobal('speechSynthesis', undefined);
  await expect(speak({ en: 'dad' }, true)).resolves.toBeUndefined();
});
test('falls back to speech when there is no audio file', async () => {
  const spoken: string[] = [];
  vi.stubGlobal('SpeechSynthesisUtterance', function (this: { text: string }, t: string) { this.text = t; });
  vi.stubGlobal('speechSynthesis', { cancel() {}, speak(u: { text: string; onend?: () => void }) { spoken.push(u.text); u.onend?.(); } });
  await speak({ en: 'sister' }, true);
  expect(spoken).toEqual(['sister']);
});
