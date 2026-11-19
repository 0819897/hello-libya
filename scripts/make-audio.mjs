// Generates one natural-sounding MP3 per English word/sentence in public/content with the
// Kokoro-82M neural voice (Apache-2.0), fully offline after the first model download.
//
//   npm i --no-save kokoro-js@1.2.1 --onnxruntime-node-install-cuda=skip
//   node scripts/make-audio.mjs            # only missing files
//   node scripts/make-audio.mjs --force    # regenerate everything (e.g. after changing the voice)
//
// Options (env): VOICE (default af_heart; British: bf_emma), SPEED (default 0.85, a little slow for learners).
// Needs ffmpeg on PATH. Files no lesson uses any more are deleted.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MASS = new Set([
  'milk', 'water', 'tea', 'coffee', 'lemonade', 'cola', 'paper', 'pizza', 'snow', 'music', 'art',
  'maths', 'science', 'orange juice', 'mango juice', 'black hair', 'weather',
  'concrete', 'earth', 'stone', 'wood', 'marble', 'treasure', 'gunpowder', 'ice',
]);

function thisIs(en) {
  if ((/^[A-Z]/.test(en) && !/^[A-Z]-/.test(en)) || /^the\s+/i.test(en) || MASS.has(en)) return `This is ${en}.`;
  if (/[^s]s$/.test(en) || en === 'sweets') return `These are ${en}.`;
  return `This is ${/^[aeiou]/i.test(en) ? 'an' : 'a'} ${en}.`;
}

export function audioFileFor(en) {
  let h = 2166136261;
  const s = en.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const slug = s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'w';
  return `${slug}-${(h >>> 0).toString(36)}.mp3`;
}

const texts = new Set();
function walk(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.json')) {
      const j = JSON.parse(readFileSync(p, 'utf8'));
      const hasTF = j.games?.some(g => g.type === 'true-false') || j.challenge?.types?.includes('true-false');
      if (j.words) {
        for (const w of j.words) {
          texts.add(w.en);
          if (hasTF && !w.abstract) texts.add(thisIs(w.en));
        }
      }
      if (j.grammar?.examples) for (const s of j.grammar.examples) texts.add(s);
      if (j.sentences) for (const s of j.sentences) texts.add(s);
      if (Array.isArray(j)) {
        for (const st of j) {
          if (st.steps) for (const step of st.steps) if (step.en) texts.add(step.en);
        }
      }
    }
  }
}

walk(join(process.cwd(), 'public', 'content'));

const VOICE = process.env.VOICE || 'af_heart';
const SPEED = Number(process.env.SPEED || 0.85);
const force = process.argv.includes('--force');
const outDir = join(process.cwd(), 'public', 'content', 'audio');
mkdirSync(outDir, { recursive: true });

const wanted = new Map([...texts].map(t => [audioFileFor(t), t]));
const todo = [...wanted].filter(([f]) => force || !existsSync(join(outDir, f)));
console.log(`Spoken items: ${wanted.size}, to generate: ${todo.length} (voice ${VOICE}, speed ${SPEED})`);

if (todo.length > 0) {
  const { KokoroTTS } = await import('kokoro-js');
  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'fp32', device: 'cpu' });
  const tmp = join(tmpdir(), `hello-libya-tts-${process.pid}.wav`);
  let n = 0;
  for (const [file, text] of todo) {
    const audio = await tts.generate(text, { voice: VOICE, speed: SPEED });
    audio.save(tmp);
    // Trim leading/trailing silence, keep a short natural pad, normalise loudness, mono 24 kHz 48 kbps MP3.
    execFileSync('ffmpeg', ['-nostdin', '-loglevel', 'error', '-y', '-i', tmp, '-af',
      'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,adelay=60,apad=pad_dur=0.12,loudnorm=I=-16:TP=-1.5:LRA=11',
      '-ac', '1', '-ar', '24000', '-b:a', '48k', join(outDir, file)]);
    if (++n % 25 === 0 || n === todo.length) console.log(`  ${n}/${todo.length}`);
  }
  rmSync(tmp, { force: true });
  writeFileSync(join(outDir, '..', 'audio-voice.json'), JSON.stringify({ engine: 'Kokoro-82M v1.0', voice: VOICE, speed: SPEED }, null, 2) + '\n');
}

for (const f of readdirSync(outDir)) {
  if (!wanted.has(f)) { rmSync(join(outDir, f)); console.log(`removed unused ${f}`); }
}
console.log('Audio generation complete.');
