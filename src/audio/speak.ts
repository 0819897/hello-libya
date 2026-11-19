let activeUtterance: SpeechSynthesisUtterance | null = null;
let sharedAudio: HTMLAudioElement | null = null;
let sharedAudioCtor: unknown = null;
let activeSource: { stop?: () => void } | null = null;
let ctx: AudioContext | null = null;

function getSharedAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  if (!sharedAudio || sharedAudioCtor !== Audio) {
    sharedAudioCtor = Audio;
    sharedAudio = new Audio();
    sharedAudio.setAttribute?.('playsinline', '');
  }
  return sharedAudio;
}

function setPlaybackSession() {
  try {
    const nav = globalThis.navigator as { audioSession?: { type: string } } | undefined;
    if (nav?.audioSession) nav.audioSession.type = 'playback';
  } catch { /* ignore */ }
}

function getCtx(): AudioContext | null {
  const AC = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) { ctx = null; return null; }
  setPlaybackSession();
  ctx ??= new AC();
  if (ctx.state === 'suspended') ctx.resume?.().catch(() => {});
  return ctx;
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const unlock = () => {
    const ac = getCtx();
    if (ac && ac.state === 'suspended') ac.resume?.().catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('touchend', unlock, { passive: true });
  window.addEventListener('click', unlock, { passive: true });
}

/** Deterministic filename in ./content/audio/ for any English word or sentence. */
export function audioFileFor(en: string): string {
  let h = 2166136261;
  const s = en.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const slug = s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'w';
  return `${slug}-${(h >>> 0).toString(36)}.mp3`;
}

function decode(ac: AudioContext, buf: ArrayBuffer): Promise<AudioBuffer> {
  // Older Safari only supports the callback form of decodeAudioData.
  return new Promise((resolve, reject) => {
    const r = ac.decodeAudioData(buf, resolve, reject);
    if (r && typeof (r as Promise<AudioBuffer>).then === 'function') (r as Promise<AudioBuffer>).then(resolve, reject);
  });
}

async function playViaWebAudio(url: string): Promise<boolean> {
  try {
    const ac = getCtx();
    if (!ac || typeof fetch !== 'function' || typeof ac.decodeAudioData !== 'function') return false;
    const res = await fetch(url);
    if (!res.ok) return false;
    const audioBuf = await decode(ac, await res.arrayBuffer());
    if (ac.state === 'suspended') await ac.resume?.();
    if (ac.state && ac.state !== 'running') return false;
    try { activeSource?.stop?.(); } catch { /* already stopped */ }
    const src = ac.createBufferSource();
    src.buffer = audioBuf;
    src.connect(ac.destination);
    activeSource = src;
    src.start(0);
    return true;
  } catch {
    return false;
  }
}

function pickEnglishVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const voices = synth.getVoices?.() ?? [];
  return (
    voices.find(v => /^en[-_](GB|UK)/i.test(v.lang)) ??
    voices.find(v => /^en/i.test(v.lang)) ??
    voices.find(v => /english|zira|david|mark|george|hazel|susan/i.test(v.name))
  );
}

/** Play a word: HTMLAudio first (ignores iOS silent switch on tap), then WebAudio, then browser voice. Never rejects. */
export async function speak(w: { en: string; audio?: string }, enabled: boolean): Promise<void> {
  if (!enabled) return;
  try {
    setPlaybackSession();
    const file = w.audio ?? audioFileFor(w.en);
    const url = `./content/audio/${file}`;
    const a = getSharedAudio();
    if (a) {
      try {
        a.pause?.();
        a.src = url;
        a.load?.();
        await a.play();
        return;
      } catch { /* blocked by autoplay or unsupported -> try WebAudio */ }
    }
    if (await playViaWebAudio(url)) return;
    const synth = globalThis.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    let voice = pickEnglishVoice(synth);
    if (!voice && (synth.getVoices?.()?.length ?? -1) === 0 && typeof synth.addEventListener === 'function') {
      await new Promise<void>(r => {
        const done = () => r();
        synth.addEventListener('voiceschanged', done, { once: true });
        setTimeout(done, 250);
      });
      voice = pickEnglishVoice(synth);
    }
    await new Promise<void>(resolve => {
      const u = new SpeechSynthesisUtterance(w.en);
      activeUtterance = u;
      if (voice) u.voice = voice;
      u.lang = voice?.lang || 'en-US';
      u.rate = 0.85;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      synth.cancel();
      synth.resume?.();
      synth.speak(u);
      setTimeout(resolve, 4000); // some browsers never fire onend
    });
  } catch { /* silent */ }
}

function tone(freqs: number[], type: OscillatorType, dur: number) {
  try {
    const ac = getCtx();
    if (!ac) return;
    freqs.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      const t = ac.currentTime + i * dur;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur);
    });
  } catch { /* no sound */ }
}

export const chime = (enabled: boolean) => enabled && tone([660, 880, 1320], 'sine', 0.12);
export const buzz = (enabled: boolean) => enabled && tone([180, 140], 'triangle', 0.16);
