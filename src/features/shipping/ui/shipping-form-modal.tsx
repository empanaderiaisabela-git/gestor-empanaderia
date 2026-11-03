'use client';

import { Truck } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ShippingFields } from './shipping-form-fields';
import { initialValues, parseCreate, parseUpdate, type ShippingFormErrors, type ShippingFormValues } from './shipping-form';
import type { ShippingsPanelModel } from './use-shippings-panel';

export function ShippingFormModal({ model }: { model: ShippingsPanelModel }): JSX.Element {
  const { manager, actions } = model;
  const { editingItem, isModalOpen } = manager;
  const [values, setValues] = useState<ShippingFormValues>(initialValues(null));
  const [errors, setErrors] = useState<ShippingFormErrors>({});

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
    <ResponsiveModal isOpen={isModalOpen} onClose={manager.closeFormModal} title={editingItem ? 'Editar envío' : 'Nuevo envío'} icon={<Truck className='w-5 h-5 text-brand-500' />} width='md' onSubmit={submit} submitLabel={editingItem ? 'Guardar cambios' : 'Guardar envío'} isPending={actions.isPending}>
      <ErrorAlert error={manager.serverError} />
      <ShippingFields values={values} errors={errors} onChange={setValues} />
    </ResponsiveModal>
  );
}
