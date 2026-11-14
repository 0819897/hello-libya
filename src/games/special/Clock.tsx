import { useState } from 'react';
import type { GameProps } from '../../types';
import { Button } from '../../ui/Button';
import { WordChip } from '../../ui/WordChip';
import { WrongNote, useTries } from '../common';

const parse = (t: string) => { const [h, m] = t.split('.').map(Number); return { h: ((h - 1 + 12) % 12) + 1, m: m >= 30 ? 30 : 0 }; };
const fmt = (h: number, m: number) => `${h}.${m === 0 ? '00' : '30'}`;
const say = (h: number, m: number) => `It's ${h} ${m === 0 ? "o'clock" : 'thirty'}.`;

/** Clock-hand angles in degrees, clockwise from 12. */
export function timeToAngles(t: string): { hour: number; minute: number } {
  const { h, m } = parse(t);
  return { hour: (h % 12) * 30 + m / 2, minute: m * 6 };
}

export default function Clock({ question: q, onDone }: GameProps) {
  const times = (q.config?.times as string[] | undefined) ?? ['12.00'];
  const target = parse(times[(q.config?.round as number | undefined) ?? 0] ?? times[0]);
  const [h, setH] = useState(target.h === 12 && target.m === 0 ? 6 : 12);
  const [m, setM] = useState(0);
  const t = useTries(onDone);
  const a = timeToAngles(fmt(h, m));
  const check = () => (h === target.h && m === target.m ? t.hit() : t.miss());
  const hand = (deg: number, len: number, w: number, color: string) =>
    <line x1="50" y1="50" x2={50 + len * Math.sin((deg * Math.PI) / 180)} y2={50 - len * Math.cos((deg * Math.PI) / 180)}
      stroke={color} strokeWidth={w} strokeLinecap="round" />;
  return (
    <div>
      <p className="mb-2 text-lg">اضبط الساعة على الوقت:</p>
      <div className="mb-2 text-center text-3xl font-bold">
        <WordChip en={`It's ${fmt(target.h, target.m)}.`} say={say(target.h, target.m)} />
      </div>
      <svg viewBox="0 0 100 100" className="mx-auto h-48 w-48" role="img" aria-label={`الساعة الآن ${fmt(h, m)}`}>
        <circle cx="50" cy="50" r="46" fill="#fff" stroke="#0f766e" strokeWidth="4" />
        {Array.from({ length: 12 }, (_, i) => {
          const r = (i + 1) * 30 * Math.PI / 180;
          return <text key={i} x={50 + 36 * Math.sin(r)} y={54 - 36 * Math.cos(r)} textAnchor="middle" fontSize="9" fontWeight="bold">{i + 1}</text>;
        })}
        {hand(a.hour, 22, 5, '#1f2937')}
        {hand(a.minute, 32, 3, '#0d9488')}
        <circle cx="50" cy="50" r="3" fill="#1f2937" />
      </svg>
      <p className="en my-2 text-center text-2xl font-bold" data-testid="clock-value">{fmt(h, m)}</p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-amber-50 p-2">
          <Button variant="soft" aria-label="ساعة أقل" onClick={() => setH(x => ((x + 10) % 12) + 1)}>−</Button>
          <span className="font-bold">الساعة</span>
          <Button variant="soft" aria-label="ساعة أكثر" onClick={() => setH(x => (x % 12) + 1)}>+</Button>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-amber-50 p-2">
          <Button variant="soft" aria-label="دقائق أقل" onClick={() => setM(x => (x === 0 ? 30 : 0))}>−</Button>
          <span className="font-bold">الدقائق</span>
          <Button variant="soft" aria-label="دقائق أكثر" onClick={() => setM(x => (x === 0 ? 30 : 0))}>+</Button>
        </div>
      </div>
      <div className="text-center"><Button onClick={check}>تحقّق</Button></div>
      <WrongNote show={t.wrong} />
      {t.wrong && <p data-testid="right-time" className="en mt-2 text-center text-xl font-bold text-green-800">
        <span aria-hidden>✓ </span>{fmt(target.h, target.m)} — {say(target.h, target.m)}</p>}
    </div>
  );
}
