import { Plus, Trash2 } from 'lucide-react';
import type { JSX } from 'react';
import { inputClass } from '@/components/ui/form-field';
import { isDrinkGroup } from '@/features/menu/domain/drink';
import { GROUPS, MENU_GROUPS, type MenuGroup } from '@/features/menu/domain/menu-groups';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';
import { MAX_COMPONENTS } from '@/features/promotion/domain/promotion.schema';
import { blankComponent, type ComponentValues } from './promotion-form';

export type DrinkOption = Pick<MenuItemDef, 'id' | 'group' | 'name' | 'isActive'>;
type Props = { components: ComponentValues[]; error?: string; drinks?: readonly DrinkOption[]; onChange: (components: ComponentValues[]) => void };
type RowProps = { component: ComponentValues; index: number; drinks: readonly DrinkOption[]; onChange: (component: ComponentValues) => void; onRemove: () => void };
type SelectProps = Pick<RowProps, 'component' | 'drinks' | 'onChange'> & { number: number };

const isMenuGroup = (value: string): value is MenuGroup => MENU_GROUPS.some((group) => group === value);
const selectClass = `${inputClass(false)} mt-0`;

function DrinkSelect({ component, number, drinks, onChange }: SelectProps): JSX.Element {
  const options = drinks.filter((drink) => drink.group === component.group && (drink.isActive || drink.id === component.menuItemId));
  return (
    <select aria-label={`Bebida del producto ${number}`} value={component.menuItemId} onChange={(event) => onChange({ ...component, menuItemId: event.target.value })} className={selectClass}>
      <option value=''>Cualquiera</option>
      {options.map((drink) => (
        <option key={drink.id} value={drink.id}>
          {drink.name}
        </option>
      ))}
    </select>
  );
}

function PresentationSelect({ component, number, onChange }: Omit<SelectProps, 'drinks'>): JSX.Element {
  return (
    <select aria-label={`Presentación del producto ${number}`} value={component.presentationKey} onChange={(event) => onChange({ ...component, presentationKey: event.target.value })} className={selectClass}>
      {GROUPS[component.group].presentations.map((presentation) => (
        <option key={presentation.key} value={presentation.key}>
          {presentation.label}
        </option>
      ))}
    </select>
  );
}

function ComponentRow({ component, index, drinks, onChange, onRemove }: RowProps): JSX.Element {
  const number = index + 1;
  return (
    <li className='grid grid-cols-[1fr_1fr_4.5rem_auto] gap-2 items-center'>
      <select aria-label={`Grupo del producto ${number}`} value={component.group} onChange={(event) => isMenuGroup(event.target.value) && onChange(blankComponent(event.target.value))} className={selectClass}>
        {MENU_GROUPS.map((group) => (
          <option key={group} value={group}>
            {GROUPS[group].label}
          </option>
        ))}
      </select>
      {isDrinkGroup(component.group) ? <DrinkSelect component={component} number={number} drinks={drinks} onChange={onChange} /> : <PresentationSelect component={component} number={number} onChange={onChange} />}
      <input aria-label={`Cantidad del producto ${number}`} inputMode='numeric' value={component.quantity} onChange={(event) => onChange({ ...component, quantity: event.target.value })} className={selectClass} />
      <button type='button' onClick={onRemove} title='Quitar producto' className='p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg'>
        <Trash2 className='w-4 h-4' />
      </button>
    </li>
  );
}

export function PromotionComponentFields({ components, error, drinks = [], onChange }: Props): JSX.Element {
  const replace = (index: number, component: ComponentValues): void => onChange(components.map((current, position) => (position === index ? component : current)));
  return (
    <fieldset className='space-y-2'>
      <legend className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>Productos de la promo</legend>
      <ul className='space-y-2'>
        {components.map((component, index) => (
          <ComponentRow key={index} component={component} index={index} drinks={drinks} onChange={(next) => replace(index, next)} onRemove={() => onChange(components.filter((_, position) => position !== index))} />
        ))}
      </ul>
      {error && <span className='block text-red-500 text-xs'>{error}</span>}
      <button type='button' onClick={() => onChange([...components, blankComponent()])} disabled={components.length >= MAX_COMPONENTS} className='flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400 disabled:opacity-50'>
        <Plus className='w-4 h-4' /> Agregar producto
      </button>
    </fieldset>
  );
}
