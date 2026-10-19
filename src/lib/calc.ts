/** Cálculos de horas y dinero. */
import { hmToMin } from './dates';

export interface JobLike {
  id: string;
  sueldoHora: number;
  taxPct: number;
}

export interface ShiftLike {
  id: string;
  jobId: string;
  esLibre?: boolean;
  horaEntrada: string;
  horaSalida: string | null; // null = turno abierto
  breakMin: number;
  propinas: number;
  bono: number;
}

/** Horas trabajadas de un turno (descontando break). Turno abierto = 0. */
export function shiftHours(s: ShiftLike): number {
  if (!s.horaSalida) return 0;
  let mins = hmToMin(s.horaSalida) - hmToMin(s.horaEntrada);
  if (mins < 0) mins += 24 * 60; // cruza medianoche
  return Math.max(0, mins - s.breakMin) / 60;
}

export interface WeekTotals {
  hours: number;
  regularHours: number;
  overtimeHours: number;
  gross: number;
  net: number;
}

/**
 * Totales de un conjunto de turnos con horas extra:
 * si las horas semanales > umbral, el excedente va al multiplicador.
 * El extra se prorratea al sueldo promedio ponderado de la semana.
 */
export function calcWeekTotals(
  shifts: ShiftLike[],
  jobsById: Record<string, JobLike>,
  umbralExtraHrs: number,
  multExtra: number,
): WeekTotals {
  let hours = 0;
  let weightedPay = 0; // suma horas*sueldo para promedio
  let tipsBonus = 0;
  let weightedTax = 0;

  for (const s of shifts) {
    if (s.esLibre) continue; // los días libres no cuentan como horas trabajadas
    const h = shiftHours(s);
    const job = jobsById[s.jobId];
    const rate = job?.sueldoHora ?? 0;
    const tax = job?.taxPct ?? 0;
    hours += h;
    weightedPay += h * rate;
    tipsBonus += s.propinas + s.bono;
    weightedTax += h * rate * (tax / 100);
  }

  const regularHours = Math.min(hours, umbralExtraHrs);
  const overtimeHours = Math.max(0, hours - umbralExtraHrs);
  const avgRate = hours > 0 ? weightedPay / hours : 0;
  const avgTaxRate = weightedPay > 0 ? weightedTax / weightedPay : 0;

  const gross = regularHours * avgRate + overtimeHours * avgRate * multExtra + tipsBonus;
  const net = gross * (1 - avgTaxRate);
  return { hours, regularHours, overtimeHours, gross, net };
}

export const fmtMoney = (n: number): string =>
  `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

export const fmtHours = (h: number): string => {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins === 0 ? `${whole}h` : `${whole}h ${mins}m`;
};

export const uid = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** "6 h 30 min" / "6 h" / "45 min". */
export const fmtHoursLong = (h: number): string => {
  const whole = Math.floor(h + 1e-9);
  const mins = Math.round((h - whole) * 60);
  if (whole === 0) return `${mins} min`;
  return mins === 0 ? `${whole} h` : `${whole} h ${mins} min`;
};

/** "6 h 30 min · 6.50 h" (doble formato como la referencia). */
export const fmtHoursDual = (h: number): string => `${fmtHoursLong(h)} · ${h.toFixed(2)} h`;
