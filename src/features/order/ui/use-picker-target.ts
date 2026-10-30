import { GROUPS } from '@/features/menu/domain/menu-groups';
import { type AddMode, isComplete, type OrderLine, presentationOf } from '@/features/order/domain/order-line';
import { promoUsageLines } from '@/features/order/domain/promo-line';
import { useOrderStore } from '@/features/order/store/order.store';

export type PromoNext = { label: 'Siguiente' | 'Listo'; ready: boolean; go: () => void };
export type PickerTarget = { line: OrderLine; heading: string[]; usage: OrderLine[]; inPromo: boolean; add: (menuItemId: string, mode: AddMode) => boolean; remove: (menuItemId: string) => void; next: PromoNext | null };

const labelOf = (line: OrderLine): string => `${GROUPS[line.group].label} · ${presentationOf(line)?.label ?? ''}`;

export function usePickerTarget(): PickerTarget | null {
  const { lines, openLineId, add, promos, openPromo, addToOpenPromo, removeFromOpen, nextPromoPart } = useOrderStore();
  const usage = [...lines, ...promoUsageLines(promos)];
  const line = lines.find((candidate) => candidate.id === openLineId);
  if (line) return { line, heading: [labelOf(line)], usage, inPromo: false, add, remove: removeFromOpen, next: null };
  const promo = openPromo && promos.find((candidate) => candidate.id === openPromo.promoId);
  const part = openPromo && promo?.parts[openPromo.part];
  if (!promo || !part || !openPromo) return null;
  const heading = [promo.name, labelOf(part), `(${openPromo.part + 1} de ${promo.parts.length})`];
  const next: PromoNext = { label: openPromo.part + 1 < promo.parts.length ? 'Siguiente' : 'Listo', ready: isComplete(part), go: nextPromoPart };
  return { line: part, heading, usage, inPromo: true, add: addToOpenPromo, remove: removeFromOpen, next };
}
