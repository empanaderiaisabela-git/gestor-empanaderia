const DISPLAY_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const INVALID_DATE = '—';

const formatter = new Intl.DateTimeFormat('es-AR', {
  timeZone: DISPLAY_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatDateTime(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? INVALID_DATE : formatter.format(date);
}

const dayFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: DISPLAY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

export function argentinaDay(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '' : dayFormatter.format(date);
}

const timeFormatter = new Intl.DateTimeFormat('es-AR', { timeZone: DISPLAY_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export function argentinaTime(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? INVALID_DATE : timeFormatter.format(date);
}

export function argentinaHour(value: Date): number {
  return Number(argentinaTime(value).slice(0, 2));
}

export function argentinaMonth(value: Date): { start: string; end: string } {
  const month = argentinaDay(value).slice(0, 8);
  const lastDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  return { start: `${month}01`, end: `${month}${lastDay}` };
}
