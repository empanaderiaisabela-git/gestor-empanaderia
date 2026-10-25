'use client';

import { UtensilsCrossed } from 'lucide-react';
import { type FormEvent, type JSX, useEffect, useState } from 'react';
import { ErrorAlert } from '@/components/ui/alert';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { MenuItemFields } from './menu-item-fields';
import { initialValues, type MenuItemFormErrors, type MenuItemFormValues, parseCreate, parseUpdate } from './menu-item-form';
import type { MenuPanelModel } from './use-menu-panel';

export function MenuItemFormModal({ model }: { model: MenuPanelModel }): JSX.Element {
  const { manager, actions } = model;
  const { editingItem, isModalOpen } = manager;
  const [values, setValues] = useState<MenuItemFormValues>(initialValues(null));
  const [errors, setErrors] = useState<MenuItemFormErrors>({});

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
      title={editingItem ? 'Editar producto' : 'Nuevo gusto o bebida'}
      icon={<UtensilsCrossed className='w-5 h-5 text-brand-500' />}
      width='md'
      onSubmit={submit}
      submitLabel={editingItem ? 'Guardar cambios' : 'Dar de alta'}
      isPending={actions.isPending}
    >
      <ErrorAlert error={manager.serverError} />
      <MenuItemFields values={values} errors={errors} isEditing={Boolean(editingItem)} onChange={setValues} />
    </ResponsiveModal>
  );
}
