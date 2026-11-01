import { type JSX, useState } from 'react';
import { FormField, inputClass } from '@/components/ui/form-field';
import { sizeOf } from '@/features/menu/domain/drink';
import type { MenuItemDef } from '@/features/menu/domain/menu-item.schema';

type DrinkSelectsProps = { items: MenuItemDef[]; menuItemId: string; error?: string; onPick: (menuItemId: string) => void };

const LEGACY = 'legacy:';
const drinkKeyOf = (item: MenuItemDef): string => (item.drinkName ? item.drinkName : `${LEGACY}${item.id}`);
const sizeKeyOf = (item: MenuItemDef): string => sizeOf(item) ?? '';
const uniqueBy = <T,>(values: T[], key: (value: T) => string): T[] => values.filter((value, index) => values.findIndex((other) => key(other) === key(value)) === index);

function FlavorSelect({ flavors, menuItemId, error, onPick }: Omit<DrinkSelectsProps, 'items'> & { flavors: MenuItemDef[] }): JSX.Element {
  return (
    <FormField label='Sabor' error={error}>
      <select value={menuItemId} onChange={(event) => onPick(event.target.value)} className={inputClass(Boolean(error))}>
        <option value=''>Elegí un sabor</option>
        {flavors.map((item) => <option key={item.id} value={item.id}>{`${item.flavor ?? 'Sin sabor'} (stock ${item.stock.toLocaleString('es-AR')})`}</option>)}
      </select>
    </FormField>
  );
}

export function DrinkSelects({ items, menuItemId, error, onPick }: DrinkSelectsProps): JSX.Element {
  const current = items.find((item) => item.id === menuItemId);
  const [drink, setDrink] = useState(current ? drinkKeyOf(current) : '');
  const [size, setSize] = useState(current ? sizeKeyOf(current) : '');
  const ofDrink = items.filter((item) => drinkKeyOf(item) === drink);
  const flavors = ofDrink.filter((item) => sizeKeyOf(item) === size);
  const chooseDrink = (key: string): void => {
    setDrink(key);
    setSize('');
    onPick(key.startsWith(LEGACY) ? key.slice(LEGACY.length) : '');
  };
  const chooseSize = (value: string): void => {
    setSize(value);
    const options = ofDrink.filter((item) => sizeKeyOf(item) === value);
    onPick(options.length === 1 ? options[0].id : '');
  };
  return (
    <>
      <FormField label='Bebida' error={drink.startsWith(LEGACY) ? error : undefined}>
        <select value={drink} onChange={(event) => chooseDrink(event.target.value)} className={inputClass(false)}>
          <option value=''>Elegí una bebida</option>
          {uniqueBy(items, drinkKeyOf).map((item) => <option key={item.id} value={drinkKeyOf(item)}>{item.drinkName ?? `${item.name} (stock ${item.stock.toLocaleString('es-AR')})`}</option>)}
        </select>
      </FormField>
      {drink !== '' && !drink.startsWith(LEGACY) && (
        <FormField label='Litros o mililitros'>
          <select value={size} onChange={(event) => chooseSize(event.target.value)} className={inputClass(false)}>
            <option value=''>Elegí los litros</option>
            {uniqueBy(ofDrink, sizeKeyOf).filter((item) => sizeKeyOf(item) !== '').map((item) => <option key={item.id} value={sizeKeyOf(item)}>{sizeKeyOf(item)}</option>)}
          </select>
        </FormField>
      )}
      {size !== '' && <FlavorSelect flavors={flavors} menuItemId={menuItemId} error={error} onPick={onPick} />}
    </>
  );
}
