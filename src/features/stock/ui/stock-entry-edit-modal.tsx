'use client';

import { Pencil } from 'lucide-react';
import { type FormEvent, type JSX, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { STOCKED_CATEGORIES } from '@/features/stock/domain/stock-categories';
import type { StockEntryDef, StockEntryInput } from '@/features/stock/domain/stock.schema';
import { run } from './stock-entry-modal';
import { StockEntryFields } from './stock-entry-fields';
import { entryValuesOf, type EntryValues, type FormErrors, parseEntry } from './stock-forms';
import type { StockPanelModel } from './use-stock-panel';

type EditProps = { model: StockPanelModel; item: MenuItemDef; entry: StockEntryDef };

export function StockEntryEditModal({ model, item, entry }: EditProps): JSX.Element {
  const [values, setValues] = useState<EntryValues>(() => entryValuesOf(item, entry));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const send = (input: StockEntryInput): Promise<string | null> => model.submitEntryUpdate({ ...input, id: entry.id, version: entry.version });
    await run(parseEntry(values), send, { setErrors, setServerError, setPending });
  };
  return (
    <ResponsiveModal isOpen onClose={() => model.setDialog(null)} title='Editar ingreso' icon={<Pencil className='w-5 h-5 text-brand-500' />} width='md' onSubmit={submit} submitLabel='Guardar' isPending={pending}>
      <ErrorAlert error={serverError} />
      <StockEntryFields values={values} errors={errors} items={model.activeItems} providers={model.providers} onChange={setValues} categories={STOCKED_CATEGORIES} />
    </ResponsiveModal>
  );
}
