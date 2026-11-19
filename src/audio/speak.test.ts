import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { audioFileFor, speak } from './speak';

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

test('selects an installed en-US voice when no en-GB voice exists (Arabic Windows setup)', async () => {
  const arVoice = { name: 'Microsoft Hoda', lang: 'ar-EG', default: true } as SpeechSynthesisVoice;
  const usVoice = { name: 'Microsoft Zira Desktop', lang: 'en-US', default: false } as SpeechSynthesisVoice;
  let captured: { text?: string; lang?: string; voice?: SpeechSynthesisVoice } = {};
  vi.stubGlobal('SpeechSynthesisUtterance', function (this: { text: string }, t: string) { this.text = t; });
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [arVoice, usVoice],
    cancel() {},
    resume() {},
    speak(u: { text: string; lang?: string; voice?: SpeechSynthesisVoice; onend?: () => void }) {
      captured = u;
      u.onend?.();
    },
  });
  await speak({ en: 'adventure' }, true);
  expect(captured.voice).toBe(usVoice);
  expect(captured.lang).toBe('en-US');
});

test('reuses a single HTMLAudioElement across multiple words (prevents iOS Safari media limit)', async () => {
  const played: string[] = [];
  let instances = 0;
  vi.stubGlobal('Audio', function (this: { src: string; play: () => Promise<void>; pause: () => void; load: () => void }) {
    instances++;
    this.src = '';
    this.pause = () => {};
    this.load = () => {};
    this.play = () => { played.push(this.src); return Promise.resolve(); };
  });
  await speak({ en: 'inventor' }, true);
  await speak({ en: 'invention' }, true);
  await speak({ en: 'study' }, true);
  await speak({ en: 'armchair' }, true);
  expect(instances).toBe(1);
  expect(played).toEqual([
    `./content/audio/${audioFileFor('inventor')}`,
    `./content/audio/${audioFileFor('invention')}`,
    `./content/audio/${audioFileFor('study')}`,
    `./content/audio/${audioFileFor('armchair')}`,
  ]);
  expect(existsSync(join(process.cwd(), 'public', 'content', 'audio', audioFileFor('inventor')))).toBe(true);
  expect(existsSync(join(process.cwd(), 'public', 'content', 'audio', audioFileFor('While I was packing my bag, the telephone rang noisily.')))).toBe(true);
});

test('falls back to WebAudio decoding of the local mp3 when HTMLAudio is blocked', async () => {
  let started = false;
  let fetched = '';
  vi.stubGlobal('Audio', vi.fn(function () { return { play: () => Promise.reject(new Error('blocked')) }; }));
  vi.stubGlobal('fetch', vi.fn((u: string) => { fetched = u; return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }); }));
  vi.stubGlobal('AudioContext', function (this: unknown) {
    return {
      state: 'running',
      destination: {},
      decodeAudioData: (_b: ArrayBuffer) => Promise.resolve({ duration: 1 }),
      createBufferSource() {
        return { buffer: null, connect() {}, start() { started = true; }, stop() {} };
      },
    };
  });
  await speak({ en: 'inventor' }, true);
  expect(fetched).toBe(`./content/audio/${audioFileFor('inventor')}`);
  expect(started).toBe(true);
});

test('every audio file is a real mp3', () => {
  const head = readFileSync(join(process.cwd(), 'public', 'content', 'audio', audioFileFor('inventor')));
  const isId3 = head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33;
  const isFrame = head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
  expect(isId3 || isFrame).toBe(true);
});
