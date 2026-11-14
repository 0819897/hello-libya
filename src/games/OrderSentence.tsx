import type { GameProps } from '../types';
import { TileBuilder } from './TileBuilder';

export default function OrderSentence({ question: q, onDone }: GameProps) {
  return (
    <div>
      <p className="mb-3 text-lg">رتّب الكلمات لتكوّن جملة:</p>
      <TileBuilder tiles={q.tiles ?? []} answer={q.answer as string[]} explainAr={q.explainAr} onDone={onDone} gap="gap-2" />
    </div>
  );
}
