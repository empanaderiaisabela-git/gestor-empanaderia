'use client';

import { Tags } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { FormField, inputClass } from '@/components/ui/form-field';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { SALE_PRICE_TERM } from '@/features/menu/domain/menu-terms';
import { PromotionComponentFields } from './promotion-component-fields';
import { initialValues, parseCreate, parseUpdate, type PromotionFormErrors, type PromotionFormValues } from './promotion-form';
import type { PromotionsPanelModel } from './use-promotions-panel';

type FieldsProps = { values: PromotionFormValues; errors: PromotionFormErrors; onChange: (values: PromotionFormValues) => void };

function PromotionFields({ values, errors, onChange }: FieldsProps): JSX.Element {
  return (
    <div className='space-y-4'>
      <FormField label='Nombre de la promo' error={errors.name}>
        <input value={values.name} onChange={(event) => onChange({ ...values, name: event.target.value })} placeholder='Ej: Docena + Coca 1,5 L' className={inputClass(Boolean(errors.name))} />
      </FormField>
      <PromotionComponentFields components={values.components} error={errors.components} onChange={(components) => onChange({ ...values, components })} />
      <FormField label={`${SALE_PRICE_TERM} de la promo`} error={errors.price}>
        <input inputMode='decimal' value={values.price} onChange={(event) => onChange({ ...values, price: event.target.value })} placeholder='Ej: 15000' className={inputClass(Boolean(errors.price))} />
      </FormField>
    </div>
  );
}

export function PromotionFormModal({ model }: { model: PromotionsPanelModel }): JSX.Element {
  const { manager, actions } = model;
  const { editingItem, isModalOpen } = manager;
  const [values, setValues] = useState<PromotionFormValues>(initialValues(null));
  const [errors, setErrors] = useState<PromotionFormErrors>({});

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
    <ResponsiveModal
      isOpen={isModalOpen}
      onClose={manager.closeFormModal}
      title={editingItem ? 'Editar promoción' : 'Nueva promoción'}
      icon={<Tags className='w-5 h-5 text-brand-500' />}
      width='md'
      onSubmit={submit}
      submitLabel={editingItem ? 'Guardar cambios' : 'Crear promoción'}
      isPending={actions.isPending}
    >
      <ErrorAlert error={manager.serverError} />
      <PromotionFields values={values} errors={errors} onChange={setValues} />
    </ResponsiveModal>
  );
}
