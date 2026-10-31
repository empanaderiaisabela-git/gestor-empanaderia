'use client';

import { PackagePlus } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { categoryOf, isPriceOnlyCategory } from '@/features/stock/domain/stock-categories';
import { StockEntryFields } from './stock-entry-fields';
import { type EntryValues, type FormErrors, type Parsed, parseEntry, parsePricing, textOf } from './stock-forms';
import type { StockPanelModel } from './use-stock-panel';

type Setters = { setErrors: (errors: FormErrors) => void; setServerError: (error: string | null) => void; setPending: (pending: boolean) => void };

const NO_FLAVOR: Parsed<never> = { ok: false, errors: { menuItemId: 'Elegí un gusto o bebida' } };

async function run<T>(parsed: Parsed<T>, send: (input: T) => Promise<string | null>, setters: Setters): Promise<void> {
  setters.setErrors(parsed.ok ? {} : parsed.errors);
  if (!parsed.ok) return;
  setters.setPending(true);
  setters.setServerError(await send(parsed.input));
  setters.setPending(false);
}

const blank = (category: string, menuItemId: string, minStock = ''): EntryValues => ({ category, menuItemId, quantity: '', unitCost: '', providerId: '', minStock, price1: '', price3: '', price6: '', price12: '' });

export function StockEntryModal({ model }: { model: StockPanelModel }): JSX.Element {
  const isOpen = model.dialog?.kind === 'entry';
  const preselectedItem = model.dialog?.item ?? null;
  const preselected = preselectedItem?.id ?? '';
  const preselectedMin = textOf(preselectedItem?.minStock);
  const preselectedCategory = preselectedItem ? categoryOf(preselectedItem) : '';
  const [values, setValues] = useState<EntryValues>(blank('', ''));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValues(blank(preselectedCategory, preselected, preselectedMin));
    setErrors({});
    setServerError(null);
  }, [isOpen, preselected, preselectedCategory, preselectedMin]);

  const priceOnly = isPriceOnlyCategory(values.category);
  const setters = { setErrors, setServerError, setPending };
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!priceOnly) return run(parseEntry(values), model.submitEntry, setters);
    const item = model.activeItems.find((candidate) => candidate.id === values.menuItemId);
    return run(item ? parsePricing(item, { ...values, applyToGroup: false }) : NO_FLAVOR, model.submitPricing, setters);
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={() => model.setDialog(null)} title='Ingresar stock' icon={<PackagePlus className='w-5 h-5 text-brand-500' />} width='md' onSubmit={submit} submitLabel={priceOnly ? 'Guardar' : 'Ingresar'} isPending={pending}>
      <ErrorAlert error={serverError} />
      <StockEntryFields values={values} errors={errors} items={model.activeItems} providers={model.providers} onChange={setValues} />
    </ResponsiveModal>
  );
}
