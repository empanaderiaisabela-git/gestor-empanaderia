import { describePresentation } from '@/features/order/domain/order-describe';
import type { PromotionComponent } from './promotion.schema';

export function describeComponents(components: readonly PromotionComponent[]): string {
  return components.map(describePresentation).join(' + ');
}
