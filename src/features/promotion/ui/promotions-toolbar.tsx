import { Plus, RefreshCcw } from 'lucide-react';
import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import { PanelToolbar } from '@/components/ui/panel-toolbar';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { TEST_IDS } from '@/constants/test-ids';
import type { PromotionsPanelModel } from './use-promotions-panel';

export function PromotionsToolbar({ model }: { model: PromotionsPanelModel }): JSX.Element {
  const { manager, actions } = model;
  return (
    <PanelToolbar
      search={manager.search}
      onSearchChange={manager.setSearch}
      searchPlaceholder='Buscar promoción por nombre...'
      searchPlaceholderMobile='Buscar promos...'
      data-testid={TEST_IDS.general.inputBusquedaTabla}
      filters={<ToggleFilter id='showInactive-promotion' checked={model.showInactive} onChange={model.setShowInactive} label='Ver Inactivas' data-testid={TEST_IDS.general.btnVerOcultos} />}
      sync={
        <Button variant='secondary' size='icon' onClick={() => actions.syncData(true)} disabled={actions.isPending} title='Sincronizar Datos' className='h-11 w-11 flex-none' data-testid={TEST_IDS.general.btnSincronizar}>
          <RefreshCcw className={`w-5 h-5 ${actions.isPending ? 'animate-spin' : ''}`} />
        </Button>
      }
      actions={
        <Button variant='primary' onClick={() => manager.openFormModal()} leftIcon={<Plus className='w-5 h-5' />} className='h-11 w-full sm:w-auto text-sm font-medium shrink-0 shadow-sm xl:text-base' data-testid={TEST_IDS.general.btnAgregar}>
          Nueva promoción
        </Button>
      }
    />
  );
}
