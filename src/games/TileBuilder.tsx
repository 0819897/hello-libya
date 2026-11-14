import { useState } from 'react';
import type { GameResult } from '../types';
import { Button } from '../ui/Button';
import { WrongNote, useTries } from './common';

/** Tap tiles to build an answer (words of a sentence, or letters of a word). Tap a placed tile to take it back. */
export function TileBuilder({ tiles, answer, explainAr, onDone, gap }: {
  tiles: string[]; answer: string[]; explainAr?: string; onDone: (r: GameResult) => void; gap: string;
}) {
  const t = useTries(onDone);
  const [placed, setPlaced] = useState<number[]>([]);
  const check = () => {
    if (placed.map(i => tiles[i]).join('\u0000') === answer.join('\u0000')) return t.hit();
    setPlaced([]);
    t.miss();
  };
  const tileCls = 'en min-h-12 min-w-12 rounded-xl border-2 border-b-4 border-teal-300 bg-white px-3 text-2xl font-bold';
  return (
    <div>
      <div dir="ltr" className={`mb-4 flex min-h-20 flex-wrap items-center justify-center rounded-2xl border-4 border-dashed border-amber-300 bg-amber-50 p-3 ${gap}`}>
        {placed.map((i, k) => (
          <button key={k} type="button" aria-label={`أزل ${tiles[i]}`} className={tileCls}
            onClick={() => setPlaced(p => p.filter(x => x !== i))}>{tiles[i]}</button>
        ))}
      </div>
      <div dir="ltr" className="mb-4 flex flex-wrap justify-center gap-2">
        {tiles.map((tile, i) => placed.includes(i) ? null : (
          <button key={i} type="button" aria-label={tile} className={tileCls} onClick={() => setPlaced(p => [...p, i])}>{tile}</button>
        ))}
      </div>
      <div className="text-center"><Button onClick={check} disabled={placed.length === 0}>تحقّق</Button></div>
      <WrongNote show={t.wrong} explainAr={explainAr} />
      {t.wrong && !explainAr && <p className="en mt-2 text-center text-2xl font-bold text-green-800" data-testid="answer">
        <span aria-hidden>✓ </span>{answer.join(gap === 'gap-1' ? '' : ' ')}</p>}
    </div>
  );
}
