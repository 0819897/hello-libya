import { useEffect, useState } from 'react';
import type { GameProps } from '../../types';
import { speak } from '../../audio/speak';
import { useProgress } from '../../state/ProgressContext';
import { WordChip } from '../../ui/WordChip';
import { WrongNote, useTries } from '../common';

// A simplified, original world drawing: pale continents plus six tappable countries.
const LAND = [
  'M20 40 L120 30 L135 55 L110 95 L80 105 L60 90 L30 70 Z', // North America
  'M95 110 L130 112 L145 135 L125 185 L110 185 L100 150 Z', // South America
  'M160 35 L210 30 L215 60 L180 70 L160 60 Z', // Europe
  'M165 75 L225 72 L240 110 L215 165 L195 165 L180 120 L160 100 Z', // Africa
  'M210 20 L340 25 L345 70 L310 110 L270 105 L240 80 L215 60 Z', // Asia
  'M290 140 L335 135 L340 165 L300 170 Z', // Australia
];
const COUNTRIES: { name: string; d: string; lx: number; ly: number; color: string }[] = [
  { name: 'America', d: 'M35 55 L115 50 L118 75 L95 90 L45 82 Z', lx: 75, ly: 70, color: '#60a5fa' },
  { name: 'Brazil', d: 'M102 118 L132 118 L140 137 L122 160 L106 148 Z', lx: 120, ly: 138, color: '#4ade80' },
  { name: 'England', d: 'M163 40 L172 36 L175 50 L166 54 Z', lx: 169, ly: 32, color: '#f472b6' },
  { name: 'Libya', d: 'M188 80 L210 80 L212 102 L190 102 Z', lx: 200, ly: 94, color: '#fbbf24' },
  { name: 'Russia', d: 'M212 25 L335 30 L338 52 L250 55 L215 48 Z', lx: 275, ly: 42, color: '#a78bfa' },
  { name: 'China', d: 'M258 65 L305 62 L312 88 L285 98 L262 88 Z', lx: 285, ly: 80, color: '#f87171' },
];

export default function WorldMap({ question: q, onDone }: GameProps) {
  const { progress } = useProgress();
  const countries = (q.config?.countries as string[] | undefined) ?? [];
  const target = countries[(q.config?.round as number | undefined) ?? 0] ?? countries[0];
  const sentence = `I'm from ${target}.`;
  const t = useTries(onDone);
  const [bad, setBad] = useState<string[]>([]);
  useEffect(() => { speak({ en: sentence }, progress.sound); }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const tap = (name: string) => {
    if (name === target) return t.hit();
    setBad(b => [...b, name]); t.miss();
  };
  const state = (name: string) => (bad.includes(name) ? 'wrong' : t.wrong && name === target ? 'reveal' : 'idle');
  return (
    <div>
      <p className="mb-2 text-lg">استمع واضغط على الدولة على الخريطة:</p>
      <div className="mb-3 text-center text-3xl font-bold"><WordChip en={sentence} /></div>
      <svg viewBox="0 0 360 200" className="w-full rounded-2xl bg-sky-100">
        {LAND.map((d, i) => <path key={i} d={d} fill="#f5e6c8" stroke="#d6c3a0" />)}
        {COUNTRIES.map(c => {
          const s = state(c.name);
          return (
            <g key={c.name} role="button" tabIndex={0} aria-label={c.name} data-state={s} className="cursor-pointer"
              onClick={() => tap(c.name)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && tap(c.name)}>
              <circle cx={c.lx} cy={c.ly - 4} r={c.name === 'England' ? 30 : 24} fill="transparent" />
              <path d={c.d} fill={c.color} stroke={s === 'reveal' ? '#15803d' : s === 'wrong' ? '#be123c' : '#334155'}
                strokeWidth={s === 'idle' ? 1 : 4} />
              <text x={c.lx} y={c.ly + (c.name === 'England' ? 0 : 14)} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1f2937">
                {s === 'wrong' ? '✗ ' : s === 'reveal' ? '✓ ' : ''}{c.name}
              </text>
            </g>
          );
        })}
      </svg>
      <WrongNote show={t.wrong} explainAr={t.wrong ? `${target} مُعلَّمة بـ ✓` : undefined} />
    </div>
  );
}
