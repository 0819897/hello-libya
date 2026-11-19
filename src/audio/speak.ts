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
  return `${slug}-${(h >>> 0).toString(36)}.wav`;
}

async function playWavViaWebAudio(url: string): Promise<boolean> {
  try {
    const ac = getCtx();
    if (!ac || typeof fetch !== 'function' || typeof ac.createBuffer !== 'function') return false;
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes.length <= 44 || bytes[0] !== 0x52 || bytes[1] !== 0x49 || bytes[8] !== 0x57) return false;
    const view = new DataView(buf);
    const channels = view.getUint16(22, true) || 1;
    const sampleRate = view.getUint32(24, true) || 11025;
    const bits = view.getUint16(34, true) || 8;
    const pcmOffset = 44;
    const frameCount = bits === 16
      ? Math.floor((bytes.length - pcmOffset) / (2 * channels))
      : Math.floor((bytes.length - pcmOffset) / channels);
    if (frameCount <= 0) return false;
    const audioBuf = ac.createBuffer(1, frameCount, sampleRate);
    const ch = audioBuf.getChannelData(0);
    if (bits === 16) {
      for (let i = 0; i < frameCount; i++) ch[i] = view.getInt16(pcmOffset + i * 2 * channels, true) / 32768;
    } else {
      for (let i = 0; i < frameCount; i++) ch[i] = (bytes[pcmOffset + i * channels] - 128) / 128;
    }
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
    if (await playWavViaWebAudio(url)) return;
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
