import type { JSX } from 'react';
import { HAM_LABEL } from '@/features/menu/domain/pizza-extra.schema';

type HamSwitchProps = { checked: boolean; price: number | null; onToggle: () => void; name?: string };

export function HamSwitch({ checked, price, onToggle, name = HAM_LABEL }: HamSwitchProps): JSX.Element {
  const disabled = price === null;
  return (
    <button type='button' role='switch' aria-checked={checked} aria-label={name} disabled={disabled} onClick={onToggle} title={disabled ? 'Falta el precio' : undefined} className='mt-1 inline-flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed'>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
      {HAM_LABEL}
    </button>
  );
}
