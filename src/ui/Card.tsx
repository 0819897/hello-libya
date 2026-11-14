import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`rounded-3xl border-2 border-amber-100 bg-white p-5 shadow-sm ${className}`} />;
}
