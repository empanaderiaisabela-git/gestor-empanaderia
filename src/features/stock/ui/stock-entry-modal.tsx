'use client';

import { PackagePlus } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { StockEntryFields } from './stock-entry-fields';
import { type EntryValues, type FormErrors, parseEntry } from './stock-forms';
import type { StockPanelModel } from './use-stock-panel';

const blank = (menuItemId: string): EntryValues => ({ menuItemId, quantity: '', unitCost: '', providerId: '' });

export function StockEntryModal({ model }: { model: StockPanelModel }): JSX.Element {
  const isOpen = model.dialog?.kind === 'entry';
  const preselected = model.dialog?.item?.id ?? '';
  const [values, setValues] = useState<EntryValues>(blank(''));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValues(blank(preselected));
    setErrors({});
    setServerError(null);
  }, [isOpen, preselected]);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const parsed = parseEntry(values);
    setErrors(parsed.ok ? {} : parsed.errors);
    if (!parsed.ok) return;
    setPending(true);
    setServerError(await model.submitEntry(parsed.input));
    setPending(false);
  };

  return (
    <ResponsiveModal isOpen={isOpen} onClose={() => model.setDialog(null)} title='Ingresar stock' icon={<PackagePlus className='w-5 h-5 text-brand-500' />} width='md' onSubmit={submit} submitLabel='Ingresar' isPending={pending}>
      <ErrorAlert error={serverError} />
      <StockEntryFields values={values} errors={errors} items={model.activeItems} providers={model.providers} onChange={setValues} />
    </ResponsiveModal>
  );
}
