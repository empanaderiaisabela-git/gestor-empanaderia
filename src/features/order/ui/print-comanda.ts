import { BRAND } from '@/config/brand';
import { buildComanda } from '@/features/order/domain/comanda';
import type { SaleDef } from '@/features/order/domain/sale-history.schema';

const STYLE = '@page { margin: 0; } body { margin: 0; } pre { width: 48mm; margin: 0; padding: 2mm 0 6mm; font: 900 2.5mm/1.3 "Courier New", monospace; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; white-space: pre; }';

export function printComanda(sale: SaleDef): void {
  const popup = window.open('', '_blank', 'width=360,height=640');
  if (!popup) return;
  const page = popup.document;
  page.title = `Comanda #${String(sale.orderNumber).padStart(6, '0')}`;
  const style = page.createElement('style');
  style.textContent = STYLE;
  const ticket = page.createElement('pre');
  ticket.textContent = buildComanda(sale, BRAND.name).join('\n');
  page.head.appendChild(style);
  page.body.appendChild(ticket);
  popup.addEventListener('afterprint', () => popup.close());
  popup.focus();
  popup.print();
}
