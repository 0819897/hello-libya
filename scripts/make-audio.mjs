import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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
  return `${slug}-${(h >>> 0).toString(36)}.wav`;
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

const outDir = join(process.cwd(), 'public', 'content', 'audio');
mkdirSync(outDir, { recursive: true });

const items = [];
for (const text of texts) {
  const file = join(outDir, audioFileFor(text));
  if (!existsSync(file)) items.push({ text, file });
}

console.log(`Total spoken items: ${texts.size}, to generate: ${items.length}`);

if (items.length > 0) {
  const manifestPath = join(outDir, '_manifest.json');
  writeFileSync(manifestPath, JSON.stringify(items), 'utf8');

  const psScript = `
    $ManifestPath = '${manifestPath.replace(/'/g, "''")}'
    Add-Type -AssemblyName System.Speech
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.SelectVoice("Microsoft Zira Desktop")
    $synth.Rate = -1
    $sampleRate = 11025
    $fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo($sampleRate, [System.Speech.AudioFormat.AudioBitsPerSample]::Eight, [System.Speech.AudioFormat.AudioChannel]::Mono)
    $items = Get-Content -Raw -Encoding UTF8 $ManifestPath | ConvertFrom-Json

    foreach ($item in $items) {
      $ms = New-Object System.IO.MemoryStream
      $synth.SetOutputToAudioStream($ms, $fmt)
      $synth.Speak([string]$item.text)
      $raw = $ms.ToArray()
      $ms.Dispose()

      $start = 0
      while ($start -lt $raw.Length -and [Math]::Abs($raw[$start] - 128) -le 2) { $start++ }
      $end = $raw.Length - 1
      while ($end -gt $start -and [Math]::Abs($raw[$end] - 128) -le 2) { $end-- }
      $pad = 400
      $start = [Math]::Max(0, $start - $pad)
      $end = [Math]::Min($raw.Length - 1, $end + $pad)
      $dataLen = [Math]::Max(1, $end - $start + 1)

      $fs = [System.IO.File]::Open($item.file, [System.IO.FileMode]::Create)
      $bw = New-Object System.IO.BinaryWriter($fs)
      $bw.Write([System.Text.Encoding]::ASCII.GetBytes("RIFF"))
      $bw.Write([int](36 + $dataLen))
      $bw.Write([System.Text.Encoding]::ASCII.GetBytes("WAVEfmt "))
      $bw.Write([int]16)
      $bw.Write([int16]1)
      $bw.Write([int16]1)
      $bw.Write([int]$sampleRate)
      $bw.Write([int]$sampleRate)
      $bw.Write([int16]1)
      $bw.Write([int16]8)
      $bw.Write([System.Text.Encoding]::ASCII.GetBytes("data"))
      $bw.Write([int]$dataLen)
      $bw.Write($raw, $start, $dataLen)
      $bw.Close()
      $fs.Close()
    }
    Remove-Item $ManifestPath -Force
  `;

  execFileSync('powershell.exe', ['-NoProfile', '-Command', psScript], { stdio: 'inherit' });
}
console.log('Audio generation complete.');
