import type { GameProps } from '../types';
import { WordChip } from '../ui/WordChip';
import { Choices, OptionPic } from './common';

export default function PickImage({ question: q, onDone }: GameProps) {
  return (
    <div>
      <p className="mb-2 text-lg">اختر الصورة المناسبة:</p>
      <div className="mb-4 text-center text-4xl font-bold"><WordChip en={q.promptText ?? ''} audio={q.promptWord?.audio} /></div>
      <Choices options={q.options ?? []} answer={q.answer as string} onDone={onDone} explainAr={q.explainAr} render={OptionPic} />
    </div>
  );
}
