/** Cálculos de horas y dinero. */
import { hmToMin, ymd } from './dates';

/** ¿El rango cruza medianoche? (salida definida y <= entrada) */
export function isOvernight(entrada: string, salida: string | null): boolean {
  return salida != null && hmToMin(salida) <= hmToMin(entrada);
}

export type WorkState = 'worked' | 'scheduled';

/**
 * ¿El turno ya cuenta como trabajado?
 * Pasados = sí. Hoy = solo si marcó entrada real o ya pasó su salida programada.
 * Futuros = no.
 */
export function workState(
  s: { fecha: string; horaEntrada: string; horaEntradaReal?: string | null; horaSalida: string | null },
  now: Date,
): WorkState {
  const today = ymd(now);
  if (s.fecha < today) return 'worked';
  if (s.fecha > today) return 'scheduled';
  if (s.horaEntradaReal) return 'worked';
  // Turno que cruza medianoche: hoy NO puede darse por trabajado solo
  // porque ya pasó la hora de salida — esa hora es de mañana.
  if (isOvernight(s.horaEntrada, s.horaSalida)) return 'scheduled';
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (s.horaSalida && nowMin >= hmToMin(s.horaSalida)) return 'worked';
  return 'scheduled';
}

/** Filtra una lista de turnos dejando SOLO los ya trabajados. */
export function onlyWorked<T extends { fecha: string; horaEntrada: string; horaEntradaReal?: string | null; horaSalida: string | null }>(
  shifts: T[],
  now: Date = new Date(),
): T[] {
  return shifts.filter((s) => workState(s, now) === 'worked');
}

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
  horaEntradaReal?: string | null;
  horaSalidaReal?: string | null;
  breakMin: number;
  propinas: number;
  bono: number;
}

/** Horas de un rango (descontando break). Sin salida = 0. */
function rangeHours(start: string, end: string | null, breakMin: number): number {
  if (!end) return 0;
  let mins = hmToMin(end) - hmToMin(start);
  if (mins < 0) mins += 24 * 60; // cruza medianoche
  return Math.max(0, mins - breakMin) / 60;
}

/** Horas programadas de un turno. */
export function scheduledHours(s: ShiftLike): number {
  return rangeHours(s.horaEntrada, s.horaSalida, s.breakMin);
}

/** Horas trabajadas reales (si marcó, usa las reales; si no, las programadas). */
export function workedHours(s: ShiftLike): number {
  if (s.horaEntradaReal) {
    return rangeHours(s.horaEntradaReal, s.horaSalidaReal ?? null, s.breakMin);
  }
  return rangeHours(s.horaEntrada, s.horaSalida, s.breakMin);
}

/** Horas trabajadas de un turno (descontando break). Turno abierto = 0. */
export function shiftHours(s: ShiftLike): number {
  return workedHours(s);
}

export interface WeekTotals {
  hours: number;
  regularHours: number;
  overtimeHours: number;
  gross: number;
  net: number;
}

/**
 * Totales de un conjunto de turnos con horas extra POR TRABAJO
 * (regla de Nelson): el umbral se aplica a las horas de CADA empleo
 * por separado, con SU sueldo y SU impuesto. Nunca a la suma de
 * todos los trabajos (con varios empleos siempre pasarías de 40 h)
 * ni con sueldos promediados entre trabajos.
 */
export function calcWeekTotals(
  shifts: ShiftLike[],
  jobsById: Record<string, JobLike>,
  umbralExtraHrs: number,
  multExtra: number,
): WeekTotals {
  const byJob = new Map<string, { hours: number; tipsBonus: number }>();
  for (const s of shifts) {
    if (s.esLibre) continue; // los días libres no cuentan como horas trabajadas
    const acc = byJob.get(s.jobId) ?? { hours: 0, tipsBonus: 0 };
    acc.hours += shiftHours(s);
    acc.tipsBonus += s.propinas + s.bono;
    byJob.set(s.jobId, acc);
  }

  let hours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let gross = 0;
  let net = 0;
  for (const [jobId, acc] of byJob) {
    const job = jobsById[jobId];
    const rate = job?.sueldoHora ?? 0;
    const taxRate = (job?.taxPct ?? 0) / 100;
    const reg = Math.min(acc.hours, umbralExtraHrs);
    const ot = Math.max(0, acc.hours - umbralExtraHrs);
    const g = reg * rate + ot * rate * multExtra + acc.tipsBonus;
    hours += acc.hours;
    regularHours += reg;
    overtimeHours += ot;
    gross += g;
    net += g * (1 - taxRate);
  }
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
