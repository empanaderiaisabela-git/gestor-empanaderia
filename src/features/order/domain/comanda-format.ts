export const WIDTH = 32;
export const EQ = '='.repeat(WIDTH);
export const DASH = '-'.repeat(WIDTH);
const INDENT = '   ';

export const upper = (text: string): string => text.toLocaleUpperCase('es-AR');

export const center = (text: string): string => text.padStart(Math.floor((WIDTH + text.length) / 2)).padEnd(WIDTH);

export function wrapWords(text: string, width: number): string[] {
  const words = text.split(/\s+/).flatMap((word) => word.match(new RegExp(`.{1,${width}}`, 'gu')) ?? []);
  const rows: string[] = [];
  for (const word of words) {
    const last = rows.at(-1);
    if (last !== undefined && last.length + 1 + word.length <= width) rows[rows.length - 1] = `${last} ${word}`;
    else rows.push(word);
  }
  return rows;
}

export function columns(left: string, right: string): string[] {
  const [first = '', ...rest] = wrapWords(left, right === '' ? WIDTH : WIDTH - right.length - 1);
  const more = rest.length === 0 ? [] : wrapWords(rest.join(' '), WIDTH - INDENT.length).map((row) => `${INDENT}${row}`);
  return [right === '' ? first : first.padEnd(WIDTH - right.length) + right, ...more];
}

export function formatUnits(units: number): string {
  const whole = Math.floor(units);
  if (units - whole < 0.5) return String(whole);
  return whole === 0 ? '1/2' : `${whole} 1/2`;
}
