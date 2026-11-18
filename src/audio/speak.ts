let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeAudio: HTMLAudioElement | null = null;

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

function pickEnglishVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const voices = synth.getVoices?.() ?? [];
  return (
    voices.find(v => /^en[-_](GB|UK)/i.test(v.lang)) ??
    voices.find(v => /^en/i.test(v.lang)) ??
    voices.find(v => /english|zira|david|mark|george|hazel|susan/i.test(v.name))
  );
}

/** Play a word: recorded audio first, then the browser voice. Never rejects. */
export async function speak(w: { en: string; audio?: string }, enabled: boolean): Promise<void> {
  if (!enabled) return;
  try {
    const file = w.audio ?? audioFileFor(w.en);
    try {
      activeAudio?.pause?.();
      const a = new Audio(`./content/audio/${file}`);
      activeAudio = a;
      await a.play();
      return;
    } catch { /* fall back to speech */ }
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

let ctx: AudioContext | null = null;
function tone(freqs: number[], type: OscillatorType, dur: number) {
  try {
    const AC = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain();
      const t = ctx!.currentTime + i * dur;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ctx!.destination); o.start(t); o.stop(t + dur);
    });
  } catch { /* no sound */ }
}

export const chime = (enabled: boolean) => enabled && tone([660, 880, 1320], 'sine', 0.12);
export const buzz = (enabled: boolean) => enabled && tone([180, 140], 'triangle', 0.16);
