import type { Word } from '../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { StarRow } from '../ui/StarRow';
import { Pic, WordChip } from '../ui/WordChip';

export default function Result({ stars, points, correct, total, missed, onRetry, onNext }: {
  stars: number; points: number; correct: number; total: number; missed: Word[]; onRetry: () => void; onNext?: () => void;
}) {
  const msg = ['حاول مرة أخرى، أنت قادر!', 'جيد! واصل التدريب', 'رائع جداً!', 'ممتاز! أداء كامل'][stars];
  return (
    <Card className="text-center">
      <h2 className="text-3xl font-black text-teal-700">انتهى الدرس!</h2>
      <div className="my-3"><StarRow stars={stars} size="text-5xl" /></div>
      <p className="text-xl font-bold">{msg}</p>
      <p className="mt-2 text-lg">أجبت صحيحاً من المحاولة الأولى: {correct} من {total}</p>
      <p className="mt-1 text-2xl font-black text-amber-600">+{points} نقطة</p>
      {stars === 0 && <p className="mt-2">تحتاج نجمة واحدة على الأقل (60٪) لفتح الدرس التالي.</p>}
      {missed.length > 0 && (
        <div className="mt-5 text-start">
          <h3 className="mb-2 text-lg font-bold">كلمات تحتاج مراجعة:</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {missed.map(w => (
              <li key={w.en} className="flex items-center gap-3 rounded-2xl bg-amber-50 p-2">
                <Pic emoji={w.emoji} image={w.image} text="" className="text-3xl" />
                <WordChip en={w.en} audio={w.audio} className="text-xl font-bold" />
                <span>{w.ar}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="soft" onClick={onRetry}>أعد المحاولة</Button>
        {onNext && <Button onClick={onNext} disabled={stars === 0}>الدرس التالي</Button>}
      </div>
    </Card>
  );
}
