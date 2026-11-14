import type { GameProps } from '../types';
import { Pic, WordChip } from '../ui/WordChip';
import { Choices } from './common';

export default function TrueFalse({ question: q, onDone }: GameProps) {
  const w = q.promptWord;
  return (
    <div>
      <p className="mb-2 text-lg">هل الجملة صحيحة؟</p>
      <div className="mb-3 text-center"><Pic emoji={w?.emoji} image={w?.image} text={w?.en} className="text-8xl" /></div>
      <div className="mb-4 text-center text-3xl font-bold"><WordChip en={q.promptText ?? ''} /></div>
      <Choices options={q.options ?? []} answer={q.answer as string} onDone={onDone} explainAr={q.explainAr}
        render={o => <span>{o.id === 'true' ? '👍 ' : '👎 '}{o.text}</span>} />
    </div>
  );
}
