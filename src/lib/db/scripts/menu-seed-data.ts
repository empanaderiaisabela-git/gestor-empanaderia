type Group = 'empanadas' | 'pizzas' | 'sanguches' | 'ciabattas' | 'coca_cola' | 'pepsi';
type Prices = { price1: string; price3?: string; price6?: string; price12?: string };

export type SeedMenuItem = { group: Group; name: string; unitCost: string; stock: string; prices?: Prices };

const unitOnly = (price1: number): Prices => ({ price1: price1.toFixed(2) });
const packs = (prices: [number, number, number, number]): Prices => {
  const [price1, price3, price6, price12] = prices.map((value) => value.toFixed(2));
  return { price1, price3, price6, price12 };
};

const flavors = (group: Group, names: string[], extra: Omit<SeedMenuItem, 'group' | 'name'>): SeedMenuItem[] => names.map((name) => ({ group, name, ...extra }));

const EMPANADAS = ['Carne suave', 'Carne', 'Carne picante', 'Carne cheddar', 'Pollo', 'Pollo a mostaza', 'Bondiola mostaza y miel', 'Bondiola barbacoa', 'Jamón y muzza', 'Capresse', 'Muzza y cebolla', 'Muzza y pepperoni', 'Muzza, cebolla y roquefort', 'Verdura', 'Humita'];
const CIABATTAS = ['Carne', 'Capresse', 'Bondiola', 'Pollo'];

const PIZZAS: [string, number][] = [
  ['Muzza', 11000],
  ['Muzza y jamón', 12500],
  ['Napolitana', 12000],
  ['Napolitana con jamón', 13000],
  ['Pepperoni', 13500],
  ['Roquefort', 14000],
];

const DRINKS: [Group, string, number][] = [
  ['coca_cola', 'Coca-Cola 500 ml', 1800],
  ['coca_cola', 'Coca-Cola 1,5 L', 3500],
  ['coca_cola', 'Sprite 1,5 L', 3200],
  ['coca_cola', 'Fanta 1,5 L', 3200],
  ['pepsi', 'Quilmes 500 ml', 1600],
  ['pepsi', 'Quilmes 1,5 L', 3200],
  ['pepsi', '7up 1,5 L', 3000],
  ['pepsi', 'Mirinda 1,5 L', 3000],
];

export const SEED_MENU_ITEMS: SeedMenuItem[] = [
  ...flavors('empanadas', EMPANADAS, { unitCost: '450.00', stock: '48', prices: packs([1200, 3400, 6500, 12000]) }),
  ...PIZZAS.map(([name, price]): SeedMenuItem => ({ group: 'pizzas', name, unitCost: (price * 0.4).toFixed(2), stock: '0', prices: unitOnly(price) })),
  { group: 'sanguches', name: 'Primavera', unitCost: '650.00', stock: '24', prices: packs([1600, 4500, 8600, 16500]) },
  { group: 'sanguches', name: 'Jamón y queso', unitCost: '550.00', stock: '24', prices: packs([1400, 4000, 7600, 14500]) },
  ...flavors('ciabattas', CIABATTAS, { unitCost: '2500.00', stock: '0', prices: unitOnly(6000) }),
  ...DRINKS.map(([group, name, price]): SeedMenuItem => ({ group, name, unitCost: (price * 0.6).toFixed(2), stock: '12', prices: unitOnly(price) })),
];

export const SEED_BASES = [
  { group: 'pizzas', name: 'Prepizza', isBase: true },
  { group: 'ciabattas', name: 'Pan de ciabatta', isBase: true },
] as const;
