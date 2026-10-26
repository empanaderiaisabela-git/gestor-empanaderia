'use client';

import { Receipt } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { FormField, inputClass } from '@/components/ui/form-field';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { argentinaDay } from '@/lib/format-date-time';
import { type ExpenseFormErrors, type ExpenseFormValues, initialValues, parseCreate, parseUpdate } from './expense-form';
import type { ExpensesPanelModel } from './use-expenses-panel';

type FieldsProps = { values: ExpenseFormValues; errors: ExpenseFormErrors; onChange: (values: ExpenseFormValues) => void };

function ExpenseFields({ values, errors, onChange }: FieldsProps): JSX.Element {
  const set = (field: keyof ExpenseFormValues, value: string): void => onChange({ ...values, [field]: value });
  return (
    <div className='space-y-4'>
      <FormField label='Número de factura' error={errors.invoiceNumber}>
        <input value={values.invoiceNumber} onChange={(event) => set('invoiceNumber', event.target.value)} placeholder='Ej: A-0001-00001234' className={inputClass(Boolean(errors.invoiceNumber))} />
      </FormField>
      <FormField label='Título' error={errors.title}>
        <input value={values.title} onChange={(event) => set('title', event.target.value)} placeholder='Ej: Harina 25 kg' className={inputClass(Boolean(errors.title))} />
      </FormField>
      <div className='grid grid-cols-2 gap-3'>
        <FormField label='Monto' error={errors.amount}>
          <input inputMode='decimal' value={values.amount} onChange={(event) => set('amount', event.target.value)} placeholder='Ej: 18500' className={inputClass(Boolean(errors.amount))} />
        </FormField>
        <FormField label='Fecha de la factura' error={errors.invoiceDate}>
          <input type='date' value={values.invoiceDate} onChange={(event) => set('invoiceDate', event.target.value)} className={inputClass(Boolean(errors.invoiceDate))} />
        </FormField>
      </div>
    </div>
  );
}

export function ExpenseFormModal({ model }: { model: ExpensesPanelModel }): JSX.Element {
  const { manager, actions } = model;
  const { editingItem, isModalOpen } = manager;
  const [values, setValues] = useState<ExpenseFormValues>(initialValues(null, argentinaDay(new Date())));
  const [errors, setErrors] = useState<ExpenseFormErrors>({});

  useEffect(() => {
    if (!isModalOpen) return;
    setValues(initialValues(editingItem, argentinaDay(new Date())));
    setErrors({});
  }, [isModalOpen, editingItem]);

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    const result = editingItem ? parseUpdate(values, editingItem.version) : parseCreate(values);
    if (!result.ok) return setErrors(result.errors);
    setErrors({});
    actions.handleEditSubmit(result.input);
  };

  return (
    <ResponsiveModal isOpen={isModalOpen} onClose={manager.closeFormModal} title={editingItem ? 'Editar gasto' : 'Nuevo gasto'} icon={<Receipt className='w-5 h-5 text-brand-500' />} width='md' onSubmit={submit} submitLabel={editingItem ? 'Guardar cambios' : 'Anotar gasto'} isPending={actions.isPending}>
      <ErrorAlert error={manager.serverError} />
      <ExpenseFields values={values} errors={errors} onChange={setValues} />
    </ResponsiveModal>
  );
}
