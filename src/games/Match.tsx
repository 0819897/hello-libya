import { useMemo, useState } from 'react';
import type { GameProps } from '../types';
import { makeRng, shuffle } from '../engine/rng';
import { ChoiceButton, OptionPic, WrongNote, useTries, type ChoiceState } from './common';

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export default function Match({ question: q, onDone }: GameProps) {
  const pairs = q.pairs ?? [];
  const rights = useMemo(() => shuffle(pairs.map(p => p.right), makeRng(hash(q.id))), [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = useTries(onDone);
  const [sel, setSel] = useState<{ side: 'L' | 'R'; id: string } | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [bad, setBad] = useState<{ wrong: string; reveal: string; side: 'L' | 'R' } | null>(null);

  const pick = (side: 'L' | 'R', id: string) => {
    if (done.includes(id)) return;
    setBad(null);
    if (!sel || sel.side === side) return setSel({ side, id });
    setSel(null);
    if (sel.id === id) {
      const next = [...done, id];
      setDone(next);
      if (next.length === pairs.length) t.hit();
    } else {
      setBad({ wrong: id, reveal: sel.id, side });
      t.miss();
    }
  };
  const state = (side: 'L' | 'R', id: string): ChoiceState =>
    done.includes(id) ? 'reveal' : bad?.side === side && bad.wrong === id ? 'wrong'
      : bad?.side === side && bad.reveal === id ? 'reveal' : 'idle';
  const selCls = (side: 'L' | 'R', id: string) => (sel?.side === side && sel.id === id ? 'ring-4 ring-amber-400 border-amber-500' : '');
  const doneCls = (id: string) => (done.includes(id) ? 'opacity-60' : '');

  return (
    <div>
      <p className="mb-3 text-lg">صِل كل كلمة بما يناسبها:</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3" dir="ltr">
          {pairs.map(({ left }) => (
            <ChoiceButton key={left.id} label={left.text ?? left.id} state={state('L', left.id)} onClick={() => pick('L', left.id)}
              className={`${selCls('L', left.id)} ${doneCls(left.id)}`}>
              <span className="en text-xl">{left.text}</span>
            </ChoiceButton>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {rights.map(r => (
            <ChoiceButton key={r.id} label={r.emoji ?? r.text ?? r.id} state={state('R', r.id)} onClick={() => pick('R', r.id)}
              className={`${selCls('R', r.id)} ${doneCls(r.id)}`}>
              {r.emoji || r.image ? OptionPic(r) : <span className="text-xl">{r.text}</span>}
            </ChoiceButton>
          ))}
        </div>
      </div>
      <WrongNote show={!!bad} />
    </div>
  );
}
