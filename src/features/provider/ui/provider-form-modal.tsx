import { zodResolver } from '@hookform/resolvers/zod';
import { Store } from 'lucide-react';
import { type JSX, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ErrorAlert } from '@/components/ui/alert';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { type ProviderDef, type ProviderInput, providerCreateSchema } from '@/features/provider/domain/provider.schema';
import { ProviderFormFields } from './provider-form-fields';
import type { ProvidersPanelModel } from './use-providers-panel';

const FIELDS = ['name', 'phone', 'email'] as const;

function valuesOf(provider: ProviderDef | null): ProviderInput {
  return { name: provider?.name ?? '', phone: provider?.phone ?? '', email: provider?.email ?? '' };
}

function changedFields(data: ProviderInput, dirty: Partial<Record<keyof ProviderInput, boolean>>): Partial<ProviderInput> {
  const changes: Partial<ProviderInput> = {};
  for (const field of FIELDS) if (dirty[field]) changes[field] = data[field];
  return changes;
}

export function ProviderFormModal({ model }: { model: ProvidersPanelModel }): JSX.Element {
  const { manager, actions } = model;
  const { editingItem, isModalOpen } = manager;
  const form = useForm<ProviderInput>({ resolver: zodResolver(providerCreateSchema) });
  const { reset } = form;

  useEffect(() => {
    if (isModalOpen) reset(valuesOf(editingItem));
  }, [isModalOpen, editingItem, reset]);

  const submit = form.handleSubmit((data) => {
    if (!editingItem) return actions.handleEditSubmit(data);
    const changes = changedFields(data, form.formState.dirtyFields);
    if (Object.keys(changes).length === 0) return manager.closeFormModal();
    return actions.handleEditSubmit({ ...changes, version: editingItem.version });
  });

  return (
    <ResponsiveModal
      isOpen={isModalOpen}
      onClose={manager.closeFormModal}
      title={editingItem ? 'Editar Proveedor' : 'Nuevo Proveedor Local'}
      icon={<Store className='w-5 h-5 text-brand-500' />}
      width='md'
      onSubmit={submit}
      submitLabel={editingItem ? 'Actualizar Firma' : 'Registrar Proveedor'}
      isPending={actions.isPending}
    >
      <ErrorAlert error={manager.serverError} />
      <ProviderFormFields register={form.register} errors={form.formState.errors} />
    </ResponsiveModal>
  );
}
