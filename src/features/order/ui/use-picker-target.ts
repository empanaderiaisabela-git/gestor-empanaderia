import { GROUPS } from '@/features/menu/domain/menu-groups';
import { type AddMode, type OrderLine, presentationOf } from '@/features/order/domain/order-line';
import { promoUsageLines } from '@/features/order/domain/promo-line';
import { useOrderStore } from '@/features/order/store/order.store';

export type PickerTarget = { line: OrderLine; title: string; usage: OrderLine[]; inPromo: boolean; add: (menuItemId: string, mode: AddMode) => boolean };

const labelOf = (line: OrderLine): string => `${GROUPS[line.group].label} · ${presentationOf(line)?.label ?? ''}`;

export function usePickerTarget(): PickerTarget | null {
  const { lines, openLineId, add, promos, openPromo, addToOpenPromo } = useOrderStore();
  const usage = [...lines, ...promoUsageLines(promos)];
  const line = lines.find((candidate) => candidate.id === openLineId);
  if (line) return { line, title: labelOf(line), usage, inPromo: false, add };
  const promo = openPromo && promos.find((candidate) => candidate.id === openPromo.promoId);
  const part = openPromo && promo?.parts[openPromo.part];
  if (!promo || !part || !openPromo) return null;
  const title = `${promo.name} · ${labelOf(part)} (${openPromo.part + 1} de ${promo.parts.length})`;
  return { line: part, title, usage, inPromo: true, add: addToOpenPromo };
}
