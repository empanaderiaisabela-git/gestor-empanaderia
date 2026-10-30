import { GROUPS, type MenuGroup, type Presentation } from '@/features/menu/domain/menu-groups';

export type LineFlavor = { menuItemId: string; units: number };
export type OrderLine = { id: string; group: MenuGroup; presentationKey: string; flavors: LineFlavor[]; quantity: number };
export type AddMode = 'one' | 'rest';

export function presentationOf(line: Pick<OrderLine, 'group' | 'presentationKey'>): Presentation | null {
  return GROUPS[line.group].presentations.find((presentation) => presentation.key === line.presentationKey) ?? null;
}

export const isHalfAndHalf = (presentation: Presentation): boolean => presentation.flavors === 2;

export function unitsIn(line: Pick<OrderLine, 'flavors'>): number {
  return line.flavors.reduce((sum, flavor) => sum + flavor.units, 0);
}

export function remaining(line: OrderLine): number {
  const presentation = presentationOf(line);
  return presentation ? presentation.units - unitsIn(line) : 0;
}

export function isComplete(line: OrderLine): boolean {
  return presentationOf(line) !== null && line.flavors.length > 0 && remaining(line) === 0;
}

function amountToAdd(presentation: Presentation, free: number, mode: AddMode): number {
  if (isHalfAndHalf(presentation)) return 0.5;
  return mode === 'rest' ? free : 1;
}

export function addFlavor(line: OrderLine, menuItemId: string, mode: AddMode): OrderLine | null {
  const presentation = presentationOf(line);
  if (!presentation) return null;
  const free = remaining(line);
  const amount = amountToAdd(presentation, free, mode);
  const repeated = line.flavors.some((flavor) => flavor.menuItemId === menuItemId);
  if (amount > free || (isHalfAndHalf(presentation) && repeated)) return null;
  const flavors = repeated
    ? line.flavors.map((flavor) => (flavor.menuItemId === menuItemId ? { ...flavor, units: flavor.units + amount } : flavor))
    : [...line.flavors, { menuItemId, units: amount }];
  return { ...line, flavors };
}

export function removeFlavor(line: OrderLine, menuItemId: string): OrderLine | null {
  const presentation = presentationOf(line);
  const current = line.flavors.find((flavor) => flavor.menuItemId === menuItemId);
  if (!presentation || !current) return null;
  const units = current.units - (isHalfAndHalf(presentation) ? 0.5 : 1);
  const flavors = units > 0 ? line.flavors.map((flavor) => (flavor === current ? { ...flavor, units } : flavor)) : line.flavors.filter((flavor) => flavor !== current);
  return { ...line, flavors };
}

const signature = (line: OrderLine): string =>
  [line.group, line.presentationKey, ...[...line.flavors].sort((a, b) => a.menuItemId.localeCompare(b.menuItemId)).map((flavor) => `${flavor.menuItemId}:${flavor.units}`)].join('|');

export function mergeLine(lines: OrderLine[], line: OrderLine): OrderLine[] {
  const twin = lines.find((existing) => existing.id !== line.id && isComplete(existing) && signature(existing) === signature(line));
  if (!twin || !isComplete(line)) return lines.map((existing) => (existing.id === line.id ? line : existing));
  return lines.filter((existing) => existing.id !== line.id).map((existing) => (existing === twin ? { ...twin, quantity: twin.quantity + line.quantity } : existing));
}
