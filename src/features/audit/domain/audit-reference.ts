import { formatMoney } from '@/lib/format-money';
import type { AuditLogDef } from './audit-log.schema';

export const ENTITY_LABELS: Readonly<Record<string, string>> = {
  USER: 'USUARIO',
  PROVIDER: 'PROVEEDOR',
  CUSTOMER: 'CLIENTE',
  MENU_ITEM: 'PRODUCTO',
  MENU_GROUP_PRICES: 'PRECIOS',
  STOCK_ENTRY: 'STOCK',
  STOCK_LOSS: 'MERMA',
  SALE: 'VENTA',
};

function detailName(detail: unknown): string | null {
  const name = typeof detail === 'object' && detail !== null ? Reflect.get(detail, 'name') : undefined;
  return typeof name === 'string' && name.length > 0 ? name : null;
}

export function auditReference(log: Pick<AuditLogDef, 'customer' | 'provider' | 'targetUser' | 'sale' | 'detail'>): string | null {
  const sale = log.sale ? formatMoney(Number(log.sale.total)) : null;
  return log.customer?.name || log.provider?.name || log.targetUser?.username || sale || detailName(log.detail);
}

export const entityLabel = (entity: string): string => ENTITY_LABELS[entity] ?? entity;
