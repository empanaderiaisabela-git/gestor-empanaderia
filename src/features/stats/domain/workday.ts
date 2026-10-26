import { z } from 'zod';
import { argentinaDay } from '@/lib/format-date-time';

export const WORKDAY_START_HOUR = 7;
export type WorkdayRange = { start: Date; end: Date };

const HOUR = 3_600_000;
const ARGENTINA_OFFSET = '-03:00';
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function workdayRange(day: string): WorkdayRange {
  const start = new Date(`${day}T${String(WORKDAY_START_HOUR).padStart(2, '0')}:00:00${ARGENTINA_OFFSET}`);
  return { start, end: new Date(start.getTime() + 24 * HOUR - 1) };
}

export function workdayOf(moment: Date): string {
  return argentinaDay(new Date(moment.getTime() - WORKDAY_START_HOUR * HOUR));
}

const isRealDay = (day: string): boolean => {
  const { start } = workdayRange(day);
  return !Number.isNaN(start.getTime()) && workdayOf(start) === day;
};

export const workdaySchema = z.string().regex(DAY_PATTERN, 'Elegí una jornada válida').refine(isRealDay, 'Elegí una jornada válida');
