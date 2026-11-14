/** Play a word: recorded mp3 first, then the browser voice. Never rejects. */
export async function speak(w: { en: string; audio?: string }, enabled: boolean): Promise<void> {
  if (!enabled) return;
  try {
    if (w.audio) {
      try { await new Audio(`./content/audio/${w.audio}`).play(); return; } catch { /* fall back to speech */ }
    }
    const synth = globalThis.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    await new Promise<void>(resolve => {
      const u = new SpeechSynthesisUtterance(w.en);
      u.lang = 'en-GB';
      u.rate = 0.85;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      synth.cancel();
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
