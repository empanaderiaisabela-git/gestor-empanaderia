'use client';

import { TrendingUp } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { FormField, inputClass } from '@/components/ui/form-field';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { CATEGORY_LABELS, categoryOf, isBaseCategory, STOCK_CATEGORIES } from '@/features/stock/domain/stock-categories';
import { type IncreaseRow, increaseRowsOf, type PriceIncreaseInput } from '@/features/stock/domain/stock-increase';
import { run } from './stock-entry-modal';
import { type FormErrors, parseIncrease } from './stock-forms';
import type { StockPanelModel } from './use-stock-panel';

type IncreaseModalProps = { model: StockPanelModel; isOpen: boolean; onClose: () => void };

const CATEGORIES = STOCK_CATEGORIES.filter((category) => !isBaseCategory(category));

function ProductChecks({ rows, unchecked, onToggle }: { rows: IncreaseRow[]; unchecked: Set<string>; onToggle: (key: string) => void }): JSX.Element {
  return (
    <fieldset className='space-y-2'>
      <legend className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>Productos</legend>
      {rows.map((row) => (
        <label key={row.key} className='flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-100 cursor-pointer'>
          <input type='checkbox' checked={!unchecked.has(row.key)} onChange={() => onToggle(row.key)} className='w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-zinc-300 dark:border-zinc-700' />
          {row.label}
        </label>
      ))}
    </fieldset>
  );
}

function useIncreaseForm(isOpen: boolean) {
  const [category, setCategory] = useState('');
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  useEffect(() => {
    if (!isOpen) return;
    setCategory('');
    setCost('');
    setPrice('');
  }, [isOpen]);
  useEffect(() => setUnchecked(new Set()), [category, isOpen]);
  const toggle = (key: string): void => setUnchecked((current) => new Set(current.has(key) ? [...current].filter((other) => other !== key) : [...current, key]));
  return { category, setCategory, unchecked, toggle, cost, setCost, price, setPrice };
}

export function StockIncreaseModal({ model, isOpen, onClose }: IncreaseModalProps): JSX.Element {
  const form = useIncreaseForm(isOpen);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const rows = increaseRowsOf(model.activeItems.filter((item) => !item.isBase && categoryOf(item) === form.category));
  const send = async (input: PriceIncreaseInput): Promise<string | null> => {
    const error = await model.submitIncrease(input);
    if (!error) onClose();
    return error;
  };
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const ids = rows.filter((row) => !form.unchecked.has(row.key)).flatMap((row) => row.ids);
    await run(parseIncrease({ ids, cost: form.cost, price: form.price }), send, { setErrors, setServerError, setPending });
  };
  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title='Registrar aumento' icon={<TrendingUp className='w-5 h-5 text-brand-500' />} width='md' onSubmit={submit} submitLabel='Aplicar aumento' isPending={pending}>
      <ErrorAlert error={serverError} />
      <div className='space-y-4'>
        <FormField label='Categoría' error={errors.menuItemIds}>
          <select value={form.category} onChange={(event) => form.setCategory(event.target.value)} className={inputClass(Boolean(errors.menuItemIds))}>
            <option value=''>Elegí una categoría</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
          </select>
        </FormField>
        {rows.length > 0 && <ProductChecks rows={rows} unchecked={form.unchecked} onToggle={form.toggle} />}
        <FormField label='Aumento del costo (%)' error={errors.costPercent}>
          <input inputMode='decimal' value={form.cost} onChange={(event) => form.setCost(event.target.value)} placeholder='Ej: 10' className={inputClass(Boolean(errors.costPercent))} />
        </FormField>
        <FormField label='Aumento del precio de venta (%)' error={errors.pricePercent}>
          <input inputMode='decimal' value={form.price} onChange={(event) => form.setPrice(event.target.value)} placeholder='Ej: 10' className={inputClass(Boolean(errors.pricePercent))} />
        </FormField>
      </div>
    </ResponsiveModal>
  );
}
