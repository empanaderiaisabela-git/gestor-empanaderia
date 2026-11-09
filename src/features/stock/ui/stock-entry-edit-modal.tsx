'use client';

import { Pencil } from 'lucide-react';
import { type FormEvent, type JSX, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { run } from './stock-entry-modal';
import { StockEntryFields } from './stock-entry-fields';
import { entryValuesOf, type EntryValues, type FormErrors, type Overwritten, parseOverwrite } from './stock-forms';
import type { StockPanelModel } from './use-stock-panel';

type EditProps = Overwritten & { model: StockPanelModel };

export function StockEntryEditModal({ model, item, entry }: EditProps): JSX.Element {
  const [values, setValues] = useState<EntryValues>(() => entryValuesOf({ item, entry }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    await run(parseOverwrite(values, { item, entry }), model.submitOverwrite, { setErrors, setServerError, setPending });
  };
  return (
    <ResponsiveModal isOpen onClose={() => model.setDialog(null)} title='Editar stock' icon={<Pencil className='w-5 h-5 text-brand-500' />} width='md' onSubmit={submit} submitLabel='Guardar' isPending={pending}>
      <ErrorAlert error={serverError} />
      <StockEntryFields values={values} errors={errors} items={model.activeItems} providers={model.providers} onChange={setValues} editing={{ withProvider: entry !== null }} />
    </ResponsiveModal>
  );
}
