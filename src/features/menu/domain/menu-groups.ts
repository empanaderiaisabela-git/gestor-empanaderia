export const MENU_GROUPS = ['empanadas', 'pizzas', 'sanguches', 'ciabattas', 'coca_cola', 'pepsi'] as const;
export type MenuGroup = (typeof MENU_GROUPS)[number];

export const PRICE_FIELDS = ['price1', 'price3', 'price6', 'price12'] as const;
export type PriceField = (typeof PRICE_FIELDS)[number];

export type Presentation = { key: string; label: string; units: number; priceField: PriceField; flavors: 1 | 2 };
export type GroupInfo = { label: string; kind: 'comida' | 'bebida'; presentations: readonly Presentation[] };

const single = (label: string): Presentation => ({ key: 'u1', label, units: 1, priceField: 'price1', flavors: 1 });
const pack = (units: 3 | 6 | 12, label: string): Presentation => ({ key: `u${units}`, label, units, priceField: `price${units}` as const, flavors: 1 });

export const GROUPS: Readonly<Record<MenuGroup, GroupInfo>> = {
  empanadas: { label: 'Empanadas', kind: 'comida', presentations: [single('1 unidad'), pack(3, '3 unidades'), pack(6, '½ docena'), pack(12, '1 docena')] },
  pizzas: {
    label: 'Pizzas',
    kind: 'comida',
    presentations: [
      { key: 'pizza_1', label: '1 sabor', units: 1, priceField: 'price1', flavors: 1 },
      { key: 'pizza_2', label: '2 sabores', units: 1, priceField: 'price1', flavors: 2 },
    ],
  },
  sanguches: { label: 'Sándwich de miga', kind: 'comida', presentations: [single('1 unidad'), pack(3, '3 unidades'), pack(6, '6 unidades'), pack(12, '12 unidades')] },
  ciabattas: { label: 'Ciabattas', kind: 'comida', presentations: [single('1 unidad')] },
  coca_cola: { label: 'Coca-Cola', kind: 'bebida', presentations: [single('1 unidad')] },
  pepsi: { label: 'Quilmes', kind: 'bebida', presentations: [single('1 unidad')] },
};

export function priceFieldsOf(group: MenuGroup): PriceField[] {
  return PRICE_FIELDS.filter((field) => GROUPS[group].presentations.some((presentation) => presentation.priceField === field));
}

export function priceLabelOf(group: MenuGroup, field: PriceField): string {
  if (group === 'pizzas') return 'pizza entera';
  return GROUPS[group].presentations.find((presentation) => presentation.priceField === field)?.label ?? field;
}

export const BASE_GROUPS = ['pizzas', 'ciabattas'] as const satisfies readonly MenuGroup[];

export function hasBase(group: MenuGroup): boolean {
  return BASE_GROUPS.some((baseGroup) => baseGroup === group);
}
