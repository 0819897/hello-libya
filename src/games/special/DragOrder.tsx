import { useMemo, useRef, useState } from 'react';
import type { GameProps } from '../../types';
import { makeRng, shuffle } from '../../engine/rng';
import { Button } from '../../ui/Button';
import { Pic, WordChip } from '../../ui/WordChip';
import { ChoiceButton, WrongNote, useTries } from '../common';

type Item = { id: string; label: string; emoji?: string; scale?: number };
type Round = { instruction: string; itemId: string; slot: string };
type Config = { mode: 'sequence'; promptAr: string; items: Item[]; round?: number }
  | { mode: 'place'; slots: string[]; rounds: Round[]; items: Item[]; round?: number };

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 11);

/** Pointer drag that works for mouse and touch: returns the [data-id] under the pointer on release. */
function usePointerDrop(onDrop: (from: string, to: string) => void) {
  const from = useRef<string | null>(null);
  const dragged = useRef(false);
  return {
    dragged,
    onPointerDown: (e: React.PointerEvent) => {
      from.current = (e.target as HTMLElement).closest<HTMLElement>('[data-id]')?.dataset.id ?? null;
      dragged.current = false;
    },
    onPointerUp: (e: React.PointerEvent) => {
      const under = document.elementFromPoint?.(e.clientX, e.clientY) ?? (e.target as Element);
      const to = (under?.closest?.('[data-id]') as HTMLElement | null)?.dataset.id
        ?? (e.target as HTMLElement).closest<HTMLElement>('[data-id]')?.dataset.id;
      if (from.current && to && to !== from.current) { dragged.current = true; onDrop(from.current, to); }
      from.current = null;
    },
  };
}

function Sequence({ id, cfg, onDone }: { id: string; cfg: Extract<Config, { mode: 'sequence' }>; onDone: GameProps['onDone'] }) {
  const right = cfg.items.map(i => i.id);
  const [order, setOrder] = useState(() => {
    let s = shuffle(right, makeRng(hash(id)));
    if (s.join() === right.join()) s = [...s.slice(1), s[0]];
    return s;
  });
  const [sel, setSel] = useState<string | null>(null);
  const t = useTries(onDone);
  const swap = (a: string, b: string) => setOrder(o => o.map(x => (x === a ? b : x === b ? a : x)));
  const drag = usePointerDrop(swap);
  const tap = (itemId: string) => {
    if (drag.dragged.current) { drag.dragged.current = false; return; }
    if (!sel) return setSel(itemId);
    if (sel !== itemId) swap(sel, itemId);
    setSel(null);
  };
  const check = () => (order.join() === right.join() ? t.hit() : t.miss());
  const byId = (x: string) => cfg.items.find(i => i.id === x)!;
  return (
    <div>
      <p className="mb-1 text-lg font-bold">{cfg.promptAr}</p>
      <p className="mb-3 text-sm text-gray-600">اسحب عنصراً فوق آخر لتبديلهما، أو اضغط عنصراً ثم اضغط مكانه الجديد.</p>
      <div dir="ltr" className="mb-4 flex flex-wrap items-end justify-center gap-2 touch-none select-none"
        onPointerDown={drag.onPointerDown} onPointerUp={drag.onPointerUp}>
        {order.map((x, i) => {
          const it = byId(x);
          return (
            <button key={x} type="button" data-id={x} aria-label={`${it.label}، المكان ${i + 1}`} aria-pressed={sel === x}
              onClick={() => tap(x)}
              className={`flex min-h-16 min-w-16 flex-col items-center justify-end rounded-2xl border-4 bg-white p-2 ${sel === x ? 'border-amber-500 ring-4 ring-amber-300' : 'border-teal-200'}`}>
              {it.emoji && <span aria-hidden style={{ fontSize: `${2.4 * (it.scale ?? 1)}rem`, lineHeight: 1 }}>{it.emoji}</span>}
              <span className="en text-lg font-bold">{it.label}</span>
            </button>
          );
        })}
      </div>
      <div className="text-center"><Button onClick={check}>تحقّق</Button></div>
      <WrongNote show={t.wrong} />
      {t.wrong && <p data-testid="right-order" dir="ltr" className="en mt-2 text-center text-xl font-bold text-green-800">
        <span aria-hidden>✓ </span>{right.map(x => byId(x).label).join(' → ')}</p>}
    </div>
  );
}

function Place({ cfg, onDone }: { cfg: Extract<Config, { mode: 'place' }>; onDone: GameProps['onDone'] }) {
  const round = cfg.rounds[cfg.round ?? 0] ?? cfg.rounds[0];
  const item = cfg.items.find(i => i.id === round.itemId);
  const t = useTries(onDone);
  const [bad, setBad] = useState<string[]>([]);
  const drop = (slot: string) => {
    if (slot === round.slot) return t.hit();
    setBad(b => [...b, slot]); t.miss();
  };
  const drag = usePointerDrop((from, to) => { if (from === round.itemId) drop(to.replace(/^slot:/, '')); });
  return (
    <div onPointerDown={drag.onPointerDown} onPointerUp={drag.onPointerUp} className="touch-none select-none">
      <p className="mb-2 text-lg">استمع وضع العنصر في مكانه:</p>
      <div className="mb-3 text-center text-2xl font-bold"><WordChip en={round.instruction} /></div>
      <div className="mb-4 flex justify-center">
        <button type="button" data-id={round.itemId} aria-label={item?.label ?? round.itemId}
          className="flex min-h-16 min-w-20 cursor-grab flex-col items-center rounded-2xl border-4 border-amber-300 bg-amber-50 p-2">
          <Pic emoji={item?.emoji} text={item?.label} className="text-5xl" />
          <span className="en font-bold">{item?.label}</span>
        </button>
      </div>
      <div dir="ltr" className="flex flex-col gap-2 rounded-2xl bg-amber-900/10 p-2">
        {cfg.slots.map(s => (
          <div key={s} data-id={`slot:${s}`}>
            <ChoiceButton label={s} onClick={() => drop(s)} className="w-full border-b-8"
              state={bad.includes(s) ? 'wrong' : t.wrong && s === round.slot ? 'reveal' : 'idle'}>
              <span className="en text-xl">{s}</span>
            </ChoiceButton>
          </div>
        ))}
      </div>
      <WrongNote show={t.wrong} />
    </div>
  );
}

export default function DragOrder({ question: q, onDone }: GameProps) {
  const cfg = useMemo(() => q.config as Config | undefined, [q.config]);
  if (!cfg || !Array.isArray(cfg.items)) return null;
  return cfg.mode === 'place' ? <Place cfg={cfg} onDone={onDone} /> : <Sequence id={q.id} cfg={cfg} onDone={onDone} />;
}
