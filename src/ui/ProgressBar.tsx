export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-4 w-full overflow-hidden rounded-full bg-amber-100" role="progressbar"
      aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
