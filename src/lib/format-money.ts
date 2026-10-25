const formatter = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatMoney(value: number): string {
  return `$${formatter.format(value)}`;
}
