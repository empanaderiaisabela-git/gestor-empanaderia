import { Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { inputClass } from '@/components/ui/form-field';
import { INSTALLMENTS } from '@/features/card/domain/card.schema';
import { nextPlan, type PlanValues } from './card-form';

type Props = { plans: PlanValues[]; error?: string; onChange: (plans: PlanValues[]) => void };
type RowProps = { plan: PlanValues; index: number; onChange: (plan: PlanValues) => void; onRemove: () => void };

const fieldClass = `${inputClass(false)} mt-0`;

function PlanRow({ plan, index, onChange, onRemove }: RowProps): JSX.Element {
  const number = index + 1;
  return (
    <li className='grid grid-cols-[1fr_1fr_auto] gap-2 items-center'>
      <select aria-label={`Cuotas del plan ${number}`} value={plan.installments} onChange={(event) => onChange({ ...plan, installments: event.target.value })} className={fieldClass}>
        {INSTALLMENTS.map((installments) => (
          <option key={installments} value={String(installments)}>
            {installments === 1 ? '1 cuota' : `${installments} cuotas`}
          </option>
        ))}
      </select>
      <input aria-label={`Recargo % del plan ${number}`} inputMode='decimal' value={plan.surchargePct} onChange={(event) => onChange({ ...plan, surchargePct: event.target.value })} className={fieldClass} />
      <button type='button' onClick={onRemove} title='Quitar plan' className='p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg'>
        <Trash2 className='w-4 h-4' />
      </button>
    </li>
  );
}

export function CardPlanFields({ plans, error, onChange }: Props): JSX.Element {
  const replace = (index: number, plan: PlanValues): void => onChange(plans.map((current, position) => (position === index ? plan : current)));
  return (
    <fieldset className='space-y-2'>
      <legend className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>Planes de cuotas y su recargo (%), que se suma al cobrar con crédito</legend>
      <ul className='space-y-2'>
        {plans.map((plan, index) => (
          <PlanRow key={index} plan={plan} index={index} onChange={(next) => replace(index, next)} onRemove={() => onChange(plans.filter((_, position) => position !== index))} />
        ))}
      </ul>
      {error && <span className='block text-red-500 text-xs'>{error}</span>}
      <button type='button' onClick={() => onChange([...plans, nextPlan(plans)])} disabled={plans.length >= INSTALLMENTS.length} className='flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400 disabled:opacity-50'>
        <Plus className='w-4 h-4' /> Agregar plan
      </button>
    </fieldset>
  );
}
