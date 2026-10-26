import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { SHIFT_LABELS, shiftOf } from './shift';

describe('turno mañana o tarde, en hora de Argentina (US-13 CA-1 y CA-3)', () => {
  it.each([
    { hora: '06:59', moment: '2026-10-25T06:59:59-03:00', shift: 'afternoon' },
    { hora: '07:00', moment: '2026-10-25T07:00:00-03:00', shift: 'morning' },
    { hora: '11:30', moment: '2026-10-25T11:30:00-03:00', shift: 'morning' },
    { hora: '16:59', moment: '2026-10-25T16:59:59-03:00', shift: 'morning' },
    { hora: '17:00', moment: '2026-10-25T17:00:00-03:00', shift: 'afternoon' },
    { hora: '23:00', moment: '2026-10-25T23:00:00-03:00', shift: 'afternoon' },
    { hora: '00:30 (tarde de la jornada anterior)', moment: '2026-10-26T00:30:00-03:00', shift: 'afternoon' },
  ])('$hora → $shift', ({ moment, shift }) => {
    expect(shiftOf(new Date(moment))).toBe(shift);
  });

  it('se muestran como Mañana y Tarde', () => {
    expect(SHIFT_LABELS).toEqual({ morning: 'Mañana', afternoon: 'Tarde' });
  });

  it('fuzz: todo momento cae en uno de los dos turnos', () => {
    fc.assert(fc.property(fc.date({ noInvalidDate: true }), (moment) => ['morning', 'afternoon'].includes(shiftOf(moment))));
  });
});
