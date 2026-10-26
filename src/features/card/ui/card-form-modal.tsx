'use client';

import { CreditCard } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { FormField, inputClass } from '@/components/ui/form-field';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { type CardFormErrors, type CardFormValues, initialValues, parseCreate, parseUpdate } from './card-form';
import { CardPlanFields } from './card-plan-fields';
import type { CardsPanelModel } from './use-cards-panel';

export function CardFormModal({ model }: { model: CardsPanelModel }): JSX.Element {
  const { manager, actions } = model;
  const { editingItem, isModalOpen } = manager;
  const [values, setValues] = useState<CardFormValues>(initialValues(null));
  const [errors, setErrors] = useState<CardFormErrors>({});

  useEffect(() => {
    if (!isModalOpen) return;
    setValues(initialValues(editingItem));
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
    <ResponsiveModal isOpen={isModalOpen} onClose={manager.closeFormModal} title={editingItem ? 'Editar tarjeta' : 'Nueva tarjeta'} icon={<CreditCard className='w-5 h-5 text-brand-500' />} width='md' onSubmit={submit} submitLabel={editingItem ? 'Guardar cambios' : 'Crear tarjeta'} isPending={actions.isPending}>
      <ErrorAlert error={manager.serverError} />
      <div className='space-y-4'>
        <FormField label='Nombre de la tarjeta' error={errors.name}>
          <input value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder='Ej: Visa' className={inputClass(Boolean(errors.name))} />
        </FormField>
        <CardPlanFields plans={values.plans} error={errors.plans} onChange={(plans) => setValues({ ...values, plans })} />
      </div>
    </ResponsiveModal>
  );
}
