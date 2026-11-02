import { describePresentation } from '@/features/order/domain/order-describe';
import type { PromotionComponent } from './promotion.schema';

type DescribedComponent = Pick<PromotionComponent, 'group' | 'presentationKey' | 'quantity'> & { menuItemName: string | null };

function describeComponent({ menuItemName, ...line }: DescribedComponent): string {
  if (menuItemName === null) return describePresentation(line);
  return line.quantity > 1 ? `${menuItemName} × ${line.quantity}` : menuItemName;
}

export function describeComponents(components: readonly DescribedComponent[]): string {
  return components.map(describeComponent).join(' + ');
}
