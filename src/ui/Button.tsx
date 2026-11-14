import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'soft' | 'ghost' | 'danger' };
const styles = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-[0_4px_0_#115e59] active:translate-y-0.5 active:shadow-none',
  soft: 'bg-white text-teal-800 border-2 border-teal-200 hover:border-teal-400',
  ghost: 'bg-transparent text-teal-800 hover:bg-teal-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
};

export function Button({ variant = 'primary', className = '', type = 'button', ...rest }: Props) {
  return (
    <button type={type} {...rest}
      className={`min-h-12 min-w-12 rounded-2xl px-5 py-2 text-lg font-bold transition disabled:opacity-40 ${styles[variant]} ${className}`} />
  );
}
