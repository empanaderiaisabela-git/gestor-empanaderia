import { GROUPS } from '@/features/menu/domain/menu-groups';
import { isHalfAndHalf, isComplete, type OrderLine, presentationOf, remaining } from './order-line';

export function describeFlavors(line: OrderLine, nameOf: (menuItemId: string) => string): string {
  const presentation = presentationOf(line);
  if (presentation && isHalfAndHalf(presentation)) return line.flavors.map((flavor) => nameOf(flavor.menuItemId)).join(' / ');
  if (line.flavors.length === 1 && isComplete(line)) return nameOf(line.flavors[0].menuItemId);
  return line.flavors.map((flavor) => `${flavor.units} ${nameOf(flavor.menuItemId)}`).join(' + ');
}

type PresentedLine = Pick<OrderLine, 'group' | 'presentationKey' | 'quantity'>;

export function describePresentation(line: PresentedLine): string {
  const label = `${GROUPS[line.group].label} · ${presentationOf(line)?.label ?? '?'}`;
  return line.quantity > 1 ? `${label} × ${line.quantity}` : label;
}

export function missingLabel(line: OrderLine): string | null {
  if (isComplete(line)) return null;
  const missing = remaining(line);
  const presentation = presentationOf(line);
  if (presentation && isHalfAndHalf(presentation)) return 'falta el segundo sabor';
  return `faltan ${missing}`;
}

export function describeSaleLine(line: PresentedLine & { description: string }): string {
  return `${describePresentation(line)}: ${line.description}`;
}
