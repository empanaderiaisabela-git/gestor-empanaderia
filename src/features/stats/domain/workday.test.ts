import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { periodRange, workdayOf, workdayPeriodSchema, workdayRange, workdaySchema } from './workday';

const at = (iso: string): Date => new Date(iso);

describe('la jornada del local, de 7:00 a 6:59 en hora de Argentina (US-12 CA-1)', () => {
  it('va de las 7:00 de su fecha a las 6:59:59,999 del día siguiente, en UTC', () => {
    expect(workdayRange('2026-10-25')).toEqual({ start: at('2026-10-25T10:00:00.000Z'), end: at('2026-10-26T09:59:59.999Z') });
  });

  it.each([
    { caso: 'a las 7:00 empieza la jornada', moment: '2026-10-25T07:00:00-03:00', day: '2026-10-25' },
    { caso: 'a las 6:59:59 sigue la del día anterior', moment: '2026-10-25T06:59:59-03:00', day: '2026-10-24' },
    { caso: 'una venta de la 0:30 cuenta para la jornada que empezó a las 7', moment: '2026-10-26T00:30:00-03:00', day: '2026-10-25' },
    { caso: 'el cierre de la 1 de la mañana también', moment: '2026-10-26T01:00:00-03:00', day: '2026-10-25' },
    { caso: 'a las 23:59 es la jornada de esa fecha', moment: '2026-10-25T23:59:00-03:00', day: '2026-10-25' },
  ])('$caso', ({ moment, day }) => {
    expect(workdayOf(at(moment))).toBe(day);
  });

  it('fuzz: todo momento cae dentro de la jornada que le corresponde', () => {
    fc.assert(
      fc.property(fc.date({ min: at('2020-01-01T00:00:00Z'), max: at('2035-01-01T00:00:00Z'), noInvalidDate: true }), (moment) => {
        const { start, end } = workdayRange(workdayOf(moment));
        return start.getTime() <= moment.getTime() && moment.getTime() <= end.getTime();
      })
    );
  });

  it('acepta una fecha AAAA-MM-DD válida y rechaza lo demás', () => {
    expect(workdaySchema.safeParse('2026-10-25').success).toBe(true);
    expect(['2026-13-01', '25/10/2026', '2026-10-25T07:00', ''].map((value) => workdaySchema.safeParse(value).success)).toEqual([false, false, false, false]);
  });
});

describe('un rango de jornadas (US-32)', () => {
  it('va de las 7:00 de "Desde" a las 6:59:59,999 del día siguiente a "Hasta"', () => {
    expect(periodRange({ from: '2026-10-01', to: '2026-10-31' })).toEqual({ start: at('2026-10-01T10:00:00.000Z'), end: at('2026-11-01T09:59:59.999Z') });
  });

  it.each([
    { caso: 'un solo día', from: '2026-10-25', to: '2026-10-25', ok: true },
    { caso: '366 días', from: '2025-01-01', to: '2026-01-01', ok: true },
    { caso: '367 días', from: '2025-01-01', to: '2026-01-02', ok: false },
    { caso: '"Hasta" anterior a "Desde"', from: '2026-10-25', to: '2026-10-24', ok: false },
    { caso: 'una fecha inválida', from: '2026-02-30', to: '2026-03-01', ok: false },
  ])('$caso: válido = $ok', ({ from, to, ok }) => {
    expect(workdayPeriodSchema.safeParse({ from, to }).success).toBe(ok);
  });

  it('rechaza campos de más', () => {
    expect(workdayPeriodSchema.safeParse({ from: '2026-10-25', to: '2026-10-25', day: '2026-10-25' }).success).toBe(false);
  });

  it('fuzz: todo rango válido empieza antes de terminar y cubre sus dos jornadas', () => {
    const day = fc.date({ min: at('2020-01-01T12:00:00Z'), max: at('2034-01-01T12:00:00Z'), noInvalidDate: true }).map(workdayOf);
    fc.assert(
      fc.property(day, day, (a, b) => {
        const period = { from: a < b ? a : b, to: a < b ? b : a };
        const { start, end } = periodRange(period);
        return start < end && start.getTime() === workdayRange(period.from).start.getTime() && end.getTime() === workdayRange(period.to).end.getTime();
      })
    );
  });
});
