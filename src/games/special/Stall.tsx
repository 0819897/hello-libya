import { useEffect, useMemo, useState } from 'react';
import type { GameProps } from '../../types';
import { makeRng, shuffle } from '../../engine/rng';
import { speak } from '../../audio/speak';
import { useProgress } from '../../state/ProgressContext';
import { Button } from '../../ui/Button';
import { WordChip } from '../../ui/WordChip';
import { Choices, useTries } from '../common';

type MenuItem = { en: string; emoji: string; price: number };

/** Sum of prices, kept on the 0.5 grid so 2.5 + 1 is exactly 3.5. */
export const orderTotal = (items: { price: number }[]) => Math.round(items.reduce((s, i) => s + i.price, 0) * 2) / 2;

/** The right total plus two different, positive wrong totals, shuffled. */
export function totalOptions(total: number, rng: () => number): number[] {
  const near = shuffle([0.5, 1, 1.5, 2, -0.5, -1, -1.5, -2].map(d => total + d).filter(x => x > 0), rng);
  return shuffle([total, ...near.slice(0, 2)], rng);
}

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 13);
const article = (en: string) => (/^[aeiou]/i.test(en) ? 'an' : 'a');
const money = (n: number) => `${n} دينار`;

export default function Stall({ question: q, onDone }: GameProps) {
  const { progress } = useProgress();
  const menu = (q.config?.menu as MenuItem[] | undefined) ?? [];
  const round = (q.config?.round as number | undefined) ?? 0;
  const { order, line, options } = useMemo(() => {
    const rng = makeRng(hash(q.id) + round * 7919);
    const order = shuffle(menu, rng).slice(0, rng() < 0.5 ? 1 : 2);
    const line = `Can I have ${order.map(m => `${article(m.en)} ${m.en}`).join(' and ')}, please?`;
    return { order, line, options: totalOptions(orderTotal(order), rng) };
  }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [tray, setTray] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [paying, setPaying] = useState(false);
  const t = useTries(onDone);
  useEffect(() => { speak({ en: line }, progress.sound); }, [line]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = () => {
    const want = order.map(m => m.en).sort().join('|');
    if (tray.slice().sort().join('|') === want) { setHint(false); setPaying(true); return; }
    setHint(true); t.miss();
  };
  const total = orderTotal(order);

  return (
    <div>
      <p className="mb-2 text-lg">زبون عند الطاولة! ضع طلبه على الصينية:</p>
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-amber-50 p-3">
        <span className="text-4xl" aria-hidden>🧑</span>
        <span data-testid="customer" className="text-2xl font-bold"><WordChip en={line} /></span>
      </div>
      {!paying ? (<>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {menu.map(m => (
            <button key={m.en} type="button" aria-label={`${m.en} ${money(m.price)}`} onClick={() => { setTray(x => [...x, m.en]); setHint(false); }}
              className="flex min-h-16 flex-col items-center rounded-2xl border-4 border-amber-200 bg-white p-2">
              <span className="text-4xl" aria-hidden>{m.emoji}</span>
              <span className="en text-lg font-bold">{m.en}</span>
              <span className="text-sm">{money(m.price)}</span>
            </button>
          ))}
        </div>
        <div className="mb-3 min-h-20 rounded-2xl border-4 border-dashed border-teal-300 bg-teal-50 p-2">
          <p className="mb-1 text-sm font-bold">الصينية (اضغط عنصراً لإزالته):</p>
          <div className="flex flex-wrap gap-2">
            {tray.map((en, i) => (
              <button key={i} type="button" aria-label={`أزل ${en}`} onClick={() => setTray(x => x.filter((_, k) => k !== i))}
                className="min-h-12 min-w-12 rounded-xl bg-white px-2 text-3xl shadow">{menu.find(m => m.en === en)?.emoji}</button>
            ))}
          </div>
        </div>
        <div className="text-center"><Button onClick={check} disabled={tray.length === 0}>تحقّق</Button></div>
        {hint && <p role="status" className="mt-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-lg">
          <span aria-hidden className="font-black text-rose-600">✗ </span>الصينية لا تطابق الطلب. استمع مرة أخرى وضع ما طلبه الزبون فقط.</p>}
      </>) : (<>
        <p className="mb-2 text-xl font-bold">كم المجموع؟</p>
        <Choices options={options.map(o => ({ id: String(o), text: money(o) }))} answer={String(total)} cols="grid-cols-3"
          explainAr={`${order.map(m => `${m.en} ${m.price}`).join(' + ')} = ${total}`}
          onDone={r => onDone({ correct: true, attempts: r.attempts + (t.wrong ? 1 : 0) })} render={o => <span>{o.text}</span>} />
      </>)}
    </div>
  );
}
