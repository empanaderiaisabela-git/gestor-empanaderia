import type { JSX, ReactNode } from 'react';

export const inputClass = (hasError: boolean): string =>
  `mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-brand-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 transition-colors ${hasError ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'}`;

type MenuFieldProps = { label: string; error?: string; children: ReactNode };

export function MenuField({ label, error, children }: MenuFieldProps): JSX.Element {
  return (
    <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
      {label}
      {children}
      {error && <span className='block text-red-500 text-xs mt-1.5'>{error}</span>}
    </label>
  );
}
