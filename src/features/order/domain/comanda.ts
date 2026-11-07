import { formatDateTime } from '@/lib/format-date-time';
import { formatMoney } from '@/lib/format-money';
import { detailRows } from './comanda-detail';
import { center, columns, DASH, EQ, upper, WIDTH, wrapWords } from './comanda-format';
import { round2 } from './order-pricing';
import { describePayment } from './payment-describe';
import { buyerLabel, type SaleDef } from './sale-history.schema';

function header(sale: SaleDef, brand: string): string[] {
  const [date, time] = formatDateTime(sale.createdAt).split(', ');
  const kind = sale.shippingTitle === null ? 'RETIRA EN LOCAL' : 'ENVIO A DOMICILIO';
  return [EQ, center(upper(brand)), EQ, `NRO PEDIDO: #${String(sale.orderNumber).padStart(6, '0')}`, `FECHA: ${date}   HORA: ${time}`, `TIPO: ${kind}`, DASH];
}

const labeled = (label: string, value: string | null): string[] => (value ? wrapWords(`${label} ${value}`, WIDTH) : []);

function customer(sale: SaleDef): string[] {
  const title = sale.shippingTitle === null ? '[ DATOS DEL CLIENTE ]' : '[ DATOS DEL CLIENTE / ENVIO ]';
  return [title, ...labeled('Cliente:', buyerLabel(sale.buyerName)), ...labeled('Direcc:', sale.buyerAddress), ...labeled('Tel:', sale.buyerPhone), DASH];
}

function totals(sale: SaleDef): string[] {
  const subtotal = round2(sale.lines.reduce((sum, line) => sum + line.subtotal, 0));
  const discount = round2(subtotal + sale.shippingAmount - sale.total);
  return [
    ...columns('SUBTOTAL:', formatMoney(subtotal)),
    ...(discount > 0 ? columns('DESCUENTO:', `-${formatMoney(discount)}`) : []),
    ...(sale.shippingTitle === null ? [] : columns('ENVIO:', formatMoney(sale.shippingAmount))),
    EQ,
    ...columns('TOTAL GENERAL:', formatMoney(sale.total)),
    EQ,
  ];
}

function payment(sale: SaleDef): string[] {
  const [only, ...others] = sale.payments;
  if (!only) return ['METODO PAGO: PENDIENTE'];
  if (others.length === 0) return wrapWords(`METODO PAGO: ${describePayment(only)}`, WIDTH);
  return ['METODO PAGO:', ...sale.payments.flatMap((paid) => columns(describePayment(paid), formatMoney(paid.amount)))];
}

export function buildComanda(sale: SaleDef, brand: string): string[] {
  const detail = [...detailRows(sale.lines), DASH];
  return [...header(sale, brand), ...customer(sale), ...detail, ...totals(sale), ...payment(sale), DASH, center('¡GRACIAS POR SU COMPRA!'), EQ];
}
