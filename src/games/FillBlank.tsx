import type { GameProps } from '../types';
import { Choices } from './common';

export default function FillBlank({ question: q, onDone }: GameProps) {
  const [before, after] = (q.promptText ?? '').split('___');
  return (
    <div>
      <p className="mb-2 text-lg">اختر الكلمة التي تكمل الجملة:</p>
      <p className="en mb-5 text-center text-3xl font-bold leading-relaxed">
        {before}<span className="mx-1 inline-block min-w-20 border-b-4 border-teal-500">&nbsp;</span>{after}
      </p>
      <Choices options={q.options ?? []} answer={q.answer as string} onDone={onDone} explainAr={q.explainAr}
        cols="grid-cols-1 sm:grid-cols-3" render={o => <span className="en text-2xl">{o.text}</span>} />
    </div>
  );
}
