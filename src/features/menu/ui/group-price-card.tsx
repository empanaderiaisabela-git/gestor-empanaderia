'use client';

import { type JSX, type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { type GroupPricedGroup, GROUPS, priceFieldsOf, priceLabelOf, type PriceField } from '@/features/menu/domain/menu-groups';
import { type MenuGroupPriceDef, type MenuGroupPricesInput, menuGroupPricesSchema } from '@/features/menu/domain/menu-group-price.schema';
import { inputClass } from '@/components/ui/form-field';

type GroupPriceCardProps = {
  group: GroupPricedGroup;
  current: MenuGroupPriceDef | undefined;
  onSave: (input: MenuGroupPricesInput) => Promise<string | null>;
};

type Texts = Partial<Record<PriceField, string>>;

const textsOf = (current: MenuGroupPriceDef | undefined): Texts =>
  Object.fromEntries((['price1', 'price3', 'price6', 'price12'] as const).map((field) => [field, current?.[field] === null || current?.[field] === undefined ? '' : String(current[field])]));

const amount = (text: string | undefined): number | undefined => (text === undefined || text.trim() === '' ? undefined : Number(text.replace(',', '.')));

export function GroupPriceCard({ group, current, onSave }: GroupPriceCardProps): JSX.Element {
  const [texts, setTexts] = useState<Texts>(textsOf(current));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => setTexts(textsOf(current)), [current]);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const prices = { price1: amount(texts.price1) ?? Number.NaN, price3: amount(texts.price3), price6: amount(texts.price6), price12: amount(texts.price12) };
    const parsed = menuGroupPricesSchema.safeParse({ group, prices, version: current?.version ?? 0 });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Revisá los precios');
    setSaving(true);
    setError(await onSave(parsed.data));
    setSaving(false);
  };

  return (
    <form onSubmit={submit} aria-label={`Precios de venta de ${GROUPS[group].label}`} className='rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='font-bold text-zinc-900 dark:text-zinc-100'>Precios de venta de {GROUPS[group].label}</h3>
        {!current && <span className='text-xs font-semibold text-amber-700 dark:text-amber-400'>Sin precio: todavía no se puede vender</span>}
      </div>
      <p className='text-xs text-zinc-500'>Lo que paga el cliente. Valen para todos los gustos del grupo.</p>
      <div className='grid grid-cols-2 gap-3'>
        {priceFieldsOf(group).map((field) => (
          <label key={field} className='text-sm text-zinc-700 dark:text-zinc-300'>
            {priceLabelOf(group, field)}
            <input inputMode='decimal' value={texts[field] ?? ''} onChange={(event) => setTexts({ ...texts, [field]: event.target.value })} className={inputClass(false)} />
          </label>
        ))}
      </div>
      {error && <p className='text-red-500 text-xs'>{error}</p>}
      <Button type='submit' variant='primary' disabled={saving} className='w-full'>
        {saving ? 'Guardando...' : 'Guardar precios'}
      </Button>
    </form>
  );
}
