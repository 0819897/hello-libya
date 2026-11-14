import { useEffect } from 'react';
import type { GameProps } from '../types';
import { speak } from '../audio/speak';
import { useProgress } from '../state/ProgressContext';
import { Button } from '../ui/Button';
import { Pic } from '../ui/WordChip';
import { TileBuilder } from './TileBuilder';

export default function Spell({ question: q, onDone }: GameProps) {
  const { progress } = useProgress();
  const w = q.promptWord;
  const play = () => w && speak(w, progress.sound);
  useEffect(() => { play(); }, [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <p className="mb-3 text-lg">استمع ثم اكتب الكلمة بالحروف:</p>
      <div className="mb-3 flex items-center justify-center gap-4">
        {(w?.emoji || w?.image) && !w.abstract && <Pic emoji={w.emoji} image={w.image} text={w.en} className="text-7xl" />}
        <Button onClick={play} className="text-3xl" aria-label="استمع مرة أخرى">🔊</Button>
      </div>
      <TileBuilder tiles={q.tiles ?? []} answer={q.answer as string[]} explainAr={q.explainAr} onDone={onDone} gap="gap-1" />
    </div>
  );
}
