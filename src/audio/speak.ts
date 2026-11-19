let activeUtterance: SpeechSynthesisUtterance | null = null;
let sharedAudio: HTMLAudioElement | null = null;
let sharedAudioCtor: unknown = null;
let activeSource: { stop?: () => void } | null = null;
let ctx: AudioContext | null = null;
let ctxCtor: unknown = null;

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
  try {
    if (!ctx || ctxCtor !== AC) { ctxCtor = AC; ctx = new AC(); }
  } catch { return null; }
  // iOS reports 'interrupted' after a call, Siri or backgrounding the PWA; resume() brings it back.
  if (ctx.state !== 'running') ctx.resume?.().catch(() => {});
  return ctx;
}

/** iOS only unlocks WebAudio when something is played inside a user gesture: play one silent sample. */
function unlockInGesture() {
  const ac = getCtx();
  if (!ac) return;
  try {
    const b = ac.createBuffer(1, 1, 22050);
    const src = ac.createBufferSource();
    src.buffer = b;
    src.connect(ac.destination);
    src.start(0);
  } catch { /* ignore */ }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('pointerdown', unlockInGesture, { passive: true });
  window.addEventListener('touchend', unlockInGesture, { passive: true });
  window.addEventListener('click', unlockInGesture, { passive: true });
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

/** Resolves false instead of hanging: on iOS resume() can stay pending forever outside a gesture. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>(r => setTimeout(() => r(fallback), ms))]);
}

const buffers = new Map<string, AudioBuffer>();
let playToken = 0;

/**
 * Primary path everywhere. fetch() reads the mp3 straight from the service-worker cache; an <audio>
 * element would instead send HTTP Range requests, which cached responses cannot answer, so on an
 * installed iPhone PWA it plays one or two words and then stays silent.
 */
async function playViaWebAudio(url: string, token: number): Promise<boolean> {
  try {
    const ac = getCtx();
    if (!ac || typeof fetch !== 'function' || typeof ac.decodeAudioData !== 'function') return false;
    let audioBuf = buffers.get(url);
    if (!audioBuf) {
      const res = await fetch(url);
      if (!res.ok) return false;
      audioBuf = await decode(ac, await res.arrayBuffer());
      if (buffers.size > 60) buffers.delete(buffers.keys().next().value as string);
      buffers.set(url, audioBuf);
    }
    if (ac.state !== 'running') await withTimeout(Promise.resolve(ac.resume?.()).catch(() => {}), 300, undefined);
    if (ac.state && ac.state !== 'running') return false;
    if (token !== playToken) return true; // a newer word was requested meanwhile: stay quiet
    try { activeSource?.stop?.(); } catch { /* already stopped */ }
    try { sharedAudio?.pause?.(); } catch { /* ignore */ }
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

/** Play a word: WebAudio (works from the offline cache), then an <audio> element, then the browser voice. Never rejects. */
export async function speak(w: { en: string; audio?: string }, enabled: boolean): Promise<void> {
  if (!enabled) return;
  try {
    setPlaybackSession();
    const token = ++playToken;
    const file = w.audio ?? audioFileFor(w.en);
    const url = `./content/audio/${file}`;
    if (await playViaWebAudio(url, token)) return;
    if (token !== playToken) return;
    const a = getSharedAudio();
    if (a) {
      try {
        a.pause?.();
        a.src = url;
        a.load?.();
        await a.play();
        return;
      } catch { /* blocked or unsupported -> browser voice */ }
    }
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
