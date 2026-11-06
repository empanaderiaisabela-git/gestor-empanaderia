import { GROUPS } from '@/features/menu/domain/menu-groups';
import { formatMoney } from '@/lib/format-money';
import { columns, formatUnits, upper } from './comanda-format';
import type { SaleLineDef } from './sale-history.schema';

type Row = { name: string; units: number; amount: number | null };
type Block = { title: string; rows: (Row | string)[] };

const HAM = 'Jamón extra';
const HAM_ROW = `   + ${upper(HAM)}`;

function titleOf(line: SaleLineDef): string {
  if (line.promotionId === null && line.group !== null) return upper(GROUPS[line.group].label);
  return `${line.quantity > 1 ? `${line.quantity}x ` : ''}PROMO ${upper(line.promotionName ?? '')}`;
}

const rowsOf = (line: SaleLineDef): Row[] => line.items.map((item, index) => ({ name: upper(item.name), units: item.units, amount: index === 0 ? line.subtotal : null }));

function blockFor(blocks: Block[], line: SaleLineDef): Block {
  const last = blocks.at(-1);
  if (last && line.promotionId === null && last.title === titleOf(line)) return last;
  const block: Block = { title: titleOf(line), rows: [] };
  blocks.push(block);
  return block;
}

function detailBlocks(lines: SaleLineDef[]): Block[] {
  const blocks: Block[] = [];
  const singles = new Map<string, Row>();
  for (const line of lines) {
    const ham = line.description.includes(HAM);
    const single = line.promotionId === null && line.items.length === 1 && !ham;
    const key = `${titleOf(line)}|${line.items[0]?.name ?? ''}`;
    const twin = single ? singles.get(key) : undefined;
    if (twin) {
      twin.units += line.items[0].units;
      twin.amount = (twin.amount ?? 0) + line.subtotal;
      continue;
    }
    const rows = rowsOf(line);
    if (single) singles.set(key, rows[0]);
    blockFor(blocks, line).rows.push(...rows, ...(ham ? [HAM_ROW] : []));
  }
  return blocks;
}

const renderRow = (row: Row | string): string[] => (typeof row === 'string' ? [row] : columns(`${formatUnits(row.units)}x ${row.name}`, row.amount === null ? '' : formatMoney(row.amount)));

export function detailRows(lines: SaleLineDef[]): string[] {
  return detailBlocks(lines).flatMap((block) => [block.title, ...block.rows.flatMap(renderRow)]);
}
