'use client';

import { Tags } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { FormField, inputClass } from '@/components/ui/form-field';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { GROUPS } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { costLabelOf } from '@/features/menu/domain/menu-terms';
import { type FormErrors, parsePricing, type PricingValues, pricingValuesOf } from './stock-forms';
import { StockPriceFields } from './stock-price-fields';
import type { StockPanelModel } from './use-stock-panel';

type PricingFieldsProps = { item: MenuItemDef; values: PricingValues; errors: FormErrors; onChange: (values: PricingValues) => void };

function PricingFields({ item, values, errors, onChange }: PricingFieldsProps): JSX.Element {
  return (
    <div className='space-y-4'>
      <FormField label={costLabelOf(item.group)} error={errors.unitCost}>
        <input inputMode='decimal' value={values.unitCost} onChange={(event) => onChange({ ...values, unitCost: event.target.value })} className={inputClass(Boolean(errors.unitCost))} />
      </FormField>
      <StockPriceFields item={item} values={values} errors={errors} onChange={onChange} />
      <label className='flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer'>
        <input type='checkbox' checked={values.applyToGroup} onChange={(event) => onChange({ ...values, applyToGroup: event.target.checked })} className='w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-zinc-300 dark:border-zinc-700' />
        Aplicar este precio a todos los gustos de {GROUPS[item.group].label}
      </label>
    </div>
  );
}

export function StockPricingModal({ model }: { model: StockPanelModel }): JSX.Element {
  const item = model.dialog?.kind === 'pricing' ? model.dialog.item : null;
  const [values, setValues] = useState<PricingValues>(pricingValuesOf(null));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setValues(pricingValuesOf(item));
    setErrors({});
    setServerError(null);
  }, [item]);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const parsed = item ? parsePricing(item, values) : null;
    setErrors(parsed && !parsed.ok ? parsed.errors : {});
    if (!parsed?.ok) return;
    setPending(true);
    setServerError(await model.submitPricing(parsed.input));
    setPending(false);
  };

  return (
    <ResponsiveModal isOpen={Boolean(item)} onClose={() => model.setDialog(null)} title={`Costo y precio · ${item?.name ?? ''}`} icon={<Tags className='w-5 h-5 text-brand-500' />} width='md' onSubmit={submit} submitLabel='Guardar' isPending={pending}>
      <ErrorAlert error={serverError} />
      {item && <PricingFields item={item} values={values} errors={errors} onChange={setValues} />}
    </ResponsiveModal>
  );
}
