'use client';

import { PackageMinus } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { FormField, inputClass } from '@/components/ui/form-field';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { type FormErrors, type LossValues, parseLoss } from './stock-forms';
import type { StockPanelModel } from './use-stock-panel';

const BLANK: LossValues = { quantity: '', reason: '' };

export function StockLossModal({ model }: { model: StockPanelModel }): JSX.Element {
  const item = model.dialog?.kind === 'loss' ? model.dialog.item : null;
  const [values, setValues] = useState<LossValues>(BLANK);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setValues(BLANK);
    setErrors({});
    setServerError(null);
  }, [item]);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const parsed = parseLoss(item?.id ?? '', values);
    setErrors(parsed.ok ? {} : parsed.errors);
    if (parsed.ok) setServerError(await model.submitLoss(parsed.input));
  };

  return (
    <ResponsiveModal isOpen={Boolean(item)} onClose={() => model.setDialog(null)} title={`Registrar pérdida · ${item?.name ?? ''}`} icon={<PackageMinus className='w-5 h-5 text-amber-600' />} width='sm' onSubmit={submit} submitLabel='Registrar pérdida'>
      <ErrorAlert error={serverError} />
      <div className='space-y-4'>
        <p className='text-sm text-zinc-700 dark:text-zinc-200'>Stock actual: {item?.stock.toLocaleString('es-AR')}</p>
        <FormField label='Cantidad perdida' error={errors.quantity}>
          <input inputMode='decimal' value={values.quantity} onChange={(event) => setValues({ ...values, quantity: event.target.value })} placeholder='Ej: 1' className={inputClass(Boolean(errors.quantity))} />
        </FormField>
        <FormField label='Motivo' error={errors.reason}>
          <input value={values.reason} onChange={(event) => setValues({ ...values, reason: event.target.value })} placeholder='Ej: Se quemó en el horno' className={inputClass(Boolean(errors.reason))} />
        </FormField>
      </div>
    </ResponsiveModal>
  );
}
