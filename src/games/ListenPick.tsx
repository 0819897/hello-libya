import { useEffect } from 'react';
import type { GameProps } from '../types';
import { speak } from '../audio/speak';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Choices, OptionPic } from './common';

export default function ListenPick({ question: q, onDone }: GameProps) {
  const { progress } = useProgress();
  const play = () => q.promptWord && speak(q.promptWord, progress.sound);
  useEffect(() => { play(); }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <p className="mb-2 text-lg">استمع واختر الكلمة:</p>
      <div className="mb-4 text-center"><Button onClick={play} className="text-3xl" aria-label="استمع مرة أخرى">🔊</Button></div>
      <Choices options={q.options ?? []} answer={q.answer as string} onDone={onDone} explainAr={q.explainAr}
        render={o => (o.text ? <span className="en text-2xl">{o.text}</span> : OptionPic(o))} />
    </div>
  );
}
