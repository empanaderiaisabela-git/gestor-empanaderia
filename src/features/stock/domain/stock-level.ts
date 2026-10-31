export type StockLevel = 'empty' | 'low' | 'ok';

export function stockLevel({ stock, minStock }: { stock: number; minStock: number | null }): StockLevel {
  if (stock <= 0) return 'empty';
  return minStock !== null && stock < minStock ? 'low' : 'ok';
}
