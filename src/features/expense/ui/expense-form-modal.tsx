'use client';

import { Receipt } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { argentinaDay } from '@/lib/format-date-time';
import { ExpenseFields } from './expense-form-fields';
import { type ExpenseFormErrors, type ExpenseFormValues, initialValues, parseCreate, parseUpdate } from './expense-form';
import type { ExpensesPanelModel } from './use-expenses-panel';

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
      <ExpenseFields values={values} errors={errors} providers={model.providers} currentProviderId={editingItem?.providerId ?? null} onChange={setValues} />
    </ResponsiveModal>
  );
}
