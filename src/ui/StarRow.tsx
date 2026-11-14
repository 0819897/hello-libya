export function StarRow({ stars, size = 'text-2xl' }: { stars: number; size?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${size}`} role="img" aria-label={`${stars} من 3 نجوم`}>
      {[1, 2, 3].map(i => <span key={i} className={i <= stars ? '' : 'opacity-25 grayscale'}>⭐</span>)}
    </span>
  );
}
