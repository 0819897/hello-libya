import { useState } from 'react';
import type { GameResult, Option } from '../types';
import { buzz } from '../audio/speak';
import { useProgress } from '../state/ProgressContext';
import { Pic } from '../ui/WordChip';

/** Counts tries; `miss` signals a wrong answer, `hit` finishes the question. */
export function useTries(onDone: (r: GameResult) => void) {
  const { progress } = useProgress();
  const [misses, setMisses] = useState(0);
  return {
    wrong: misses > 0,
    miss: () => { setMisses(m => m + 1); buzz(progress.sound); },
    hit: () => onDone({ correct: true, attempts: misses + 1 }),
  };
}

export type ChoiceState = 'idle' | 'wrong' | 'reveal';
const stateCls: Record<ChoiceState, string> = {
  idle: 'border-amber-200 bg-white hover:border-teal-400',
  wrong: 'border-rose-500 bg-rose-50',
  reveal: 'border-green-600 bg-green-50 ring-4 ring-green-200',
};

export function StateIcon({ state }: { state: ChoiceState }) {
  if (state === 'idle') return null;
  return <span aria-hidden className={`absolute top-1 left-1 text-xl font-black ${state === 'wrong' ? 'text-rose-600' : 'text-green-700'}`}>
    {state === 'wrong' ? '✗' : '✓'}</span>;
}

export function ChoiceButton({ state, label, onClick, children, className = '' }:
  { state: ChoiceState; label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" aria-label={label} data-state={state} onClick={onClick}
      className={`relative flex min-h-16 items-center justify-center rounded-2xl border-4 p-3 text-xl font-bold transition ${stateCls[state]} ${className}`}>
      <StateIcon state={state} />{children}
    </button>
  );
}

export function WrongNote({ show, explainAr }: { show: boolean; explainAr?: string }) {
  if (!show) return null;
  return (
    <p role="status" className="mt-4 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 text-lg">
      <span aria-hidden className="font-black text-rose-600">✗ </span>ليست صحيحة. انظر إلى الإجابة الصحيحة المُعلَّمة بـ ✓ وحاول مرة أخرى.
      {explainAr && <span className="mt-1 block font-bold" dir="auto">{explainAr}</span>}
    </p>
  );
}

/** Shared grid for single-answer games. */
export function Choices({ options, answer, onDone, explainAr, render, cols = 'grid-cols-2' }: {
  options: Option[]; answer: string; onDone: (r: GameResult) => void; explainAr?: string;
  render: (o: Option) => React.ReactNode; cols?: string;
}) {
  const t = useTries(onDone);
  const [picked, setPicked] = useState<string[]>([]);
  const choose = (id: string) => {
    if (id === answer) return t.hit();
    setPicked(p => [...p, id]);
    t.miss();
  };
  return (
    <>
      <div className={`grid gap-3 ${cols}`}>
        {options.map(o => (
          <ChoiceButton key={o.id} label={o.emoji ?? o.text ?? o.id} onClick={() => choose(o.id)}
            state={picked.includes(o.id) ? 'wrong' : t.wrong && o.id === answer ? 'reveal' : 'idle'}>
            {render(o)}
          </ChoiceButton>
        ))}
      </div>
      <WrongNote show={t.wrong} explainAr={explainAr} />
    </>
  );
}

export const OptionPic = (o: Option) => <Pic emoji={o.emoji} image={o.image} text={o.text ?? o.id} className="text-5xl" />;
