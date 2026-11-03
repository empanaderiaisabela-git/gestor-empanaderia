import { fixedDrinkLabel } from '@/features/menu/domain/drink';
import { describePresentation } from '@/features/order/domain/order-describe';
import type { PromotionComponent } from './promotion.schema';

type DescribedComponent = Pick<PromotionComponent, 'group' | 'presentationKey' | 'quantity'> & { menuItemName: string | null; drinkName: string | null; drinkSize: string | null };

function describeComponent({ menuItemName, drinkName, drinkSize, ...line }: DescribedComponent): string {
  if (menuItemName === null) return describePresentation(line);
  const label = fixedDrinkLabel({ menuItemName, drinkName, drinkSize });
  return line.quantity > 1 ? `${label} × ${line.quantity}` : label;
}

export function describeComponents(components: readonly DescribedComponent[]): string {
  return components.map(describeComponent).join(' + ');
}
