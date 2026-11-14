import { speak } from '../audio/speak';
import { useProgress } from '../state/ProgressContext';

/** An English word or sentence the learner can tap to hear. */
export function WordChip({ en, audio, className = '' }: { en: string; audio?: string; className?: string }) {
  const { progress } = useProgress();
  return (
    <button type="button" onClick={() => speak({ en, audio }, progress.sound)} aria-label={`استمع: ${en}`}
      className={`en inline-flex min-h-12 items-center gap-2 rounded-xl px-2 hover:bg-amber-50 ${className}`}>
      <span>{en}</span><span aria-hidden className="text-base">🔊</span>
    </button>
  );
}

/** Picture of a word: image file, then emoji, then the word as text. */
export function Pic({ emoji, image, text, className = 'text-6xl' }: { emoji?: string; image?: string; text?: string; className?: string }) {
  if (image) return <img src={`./content/images/${image}`} alt={text ?? ''} className="mx-auto h-24 w-24 object-contain" />;
  if (emoji) return <span className={className} aria-hidden>{emoji}</span>;
  return <span className="en text-2xl font-bold">{text}</span>;
}
