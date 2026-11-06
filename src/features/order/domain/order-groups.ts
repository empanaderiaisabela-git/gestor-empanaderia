import { GROUPS, type MenuGroup, type Presentation } from '@/features/menu/domain/menu-groups';
import { isComplete, isHalfAndHalf, type OrderLine, presentationOf } from './order-line';

export type CartRow = { key: string; lines: OrderLine[] };

const isSingleFlavor = (line: OrderLine): boolean => {
  const presentation = presentationOf(line);
  return presentation !== null && !isHalfAndHalf(presentation) && line.flavors.length === 1 && isComplete(line);
};

const keyOf = (line: OrderLine): string => (isSingleFlavor(line) ? `${line.group}|${line.flavors[0].menuItemId}|${line.ham ? 'ham' : ''}` : line.id);

export function groupLines(lines: OrderLine[]): CartRow[] {
  const rows = new Map<string, OrderLine[]>();
  for (const line of lines) rows.set(keyOf(line), [...(rows.get(keyOf(line)) ?? []), line]);
  return [...rows].map(([key, grouped]) => ({ key, lines: grouped }));
}

export function unitPresentationOf(group: MenuGroup): Presentation | null {
  return GROUPS[group].presentations.find((presentation) => presentation.units === 1 && !isHalfAndHalf(presentation)) ?? null;
}

export function lastToRemove(lines: OrderLine[]): OrderLine {
  const size = (line: OrderLine): number => presentationOf(line)?.units ?? 0;
  return lines.reduce((smallest, line) => (size(line) < size(smallest) ? line : smallest));
}
