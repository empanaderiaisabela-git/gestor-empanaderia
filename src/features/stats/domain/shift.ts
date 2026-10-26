import { argentinaHour } from '@/lib/format-date-time';

export const SHIFTS = ['morning', 'afternoon'] as const;
export type Shift = (typeof SHIFTS)[number];
export const SHIFT_LABELS: Readonly<Record<Shift, string>> = { morning: 'Mañana', afternoon: 'Tarde' };

export const MORNING_START_HOUR = 7;
export const AFTERNOON_START_HOUR = 17;

export function shiftOf(moment: Date): Shift {
  const hour = argentinaHour(moment);
  return hour >= MORNING_START_HOUR && hour < AFTERNOON_START_HOUR ? 'morning' : 'afternoon';
}
