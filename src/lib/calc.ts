/** Cálculos de horas y dinero. */
import { hmToMin, ymd, parseYmd, weekKey } from './dates';

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
  s: { fecha: string; fechaSalida?: string; horaEntrada: string; horaEntradaReal?: string | null; horaSalida: string | null },
  now: Date,
): WorkState {
  const today = ymd(now);
  if (s.fecha < today) return 'worked';
  if (s.fecha > today) return 'scheduled';
  if (s.horaEntradaReal) return 'worked';
  // Turno que termina otro día: hoy NO puede darse por trabajado solo
  // porque ya pasó la hora de salida — esa hora es de otro día.
  const overnight = s.fechaSalida ? s.fechaSalida > s.fecha : isOvernight(s.horaEntrada, s.horaSalida);
  if (overnight) return 'scheduled';
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (s.horaSalida && nowMin >= hmToMin(s.horaSalida)) return 'worked';
  return 'scheduled';
}

/** Filtra una lista de turnos dejando SOLO los ya trabajados. */
export function onlyWorked<T extends { fecha: string; fechaSalida?: string; horaEntrada: string; horaEntradaReal?: string | null; horaSalida: string | null }>(
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
  fecha?: string; // YYYY-MM-DD (opcional: las plantillas no tienen fecha)
  fechaSalida?: string; // YYYY-MM-DD explícita (sin '+1 día' implícito)
  fechaSalidaReal?: string; // YYYY-MM-DD real explícita
  esLibre?: boolean;
  horaEntrada: string;
  horaSalida: string | null; // null = turno abierto
  horaEntradaReal?: string | null;
  horaSalidaReal?: string | null;
  breakMin: number;
  propinas: number;
  bono: number;
}

/** Horas de un rango con fechas explícitas (descontando break).
 *  Sin salida = 0. Sin fechaSalida (datos viejos) se mantiene la regla
 *  anterior: salida <= entrada cuenta como día siguiente. */
export function rangeHoursBetween(
  startDate: string,
  start: string,
  endDate: string | undefined,
  end: string | null,
  breakMin: number,
): number {
  if (!end) return 0;
  let days: number;
  if (endDate) {
    days = Math.round((parseYmd(endDate).getTime() - parseYmd(startDate).getTime()) / 86400000);
  } else {
    days = hmToMin(end) <= hmToMin(start) ? 1 : 0;
  }
  const mins = days * 1440 + hmToMin(end) - hmToMin(start);
  return Math.max(0, mins - breakMin) / 60;
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
  if (!s.fecha) return rangeHours(s.horaEntrada, s.horaSalida, s.breakMin);
  return rangeHoursBetween(s.fecha, s.horaEntrada, s.fechaSalida, s.horaSalida, s.breakMin);
}

/** Horas trabajadas reales (si marcó, usa las reales; si no, las programadas). */
export function workedHours(s: ShiftLike): number {
  if (s.horaEntradaReal) {
    if (!s.fecha) return rangeHours(s.horaEntradaReal, s.horaSalidaReal ?? null, s.breakMin);
    return rangeHoursBetween(
      s.fecha,
      s.horaEntradaReal,
      s.fechaSalidaReal ?? s.fechaSalida,
      s.horaSalidaReal ?? null,
      s.breakMin,
    );
  }
  return scheduledHours(s);
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

/** Agrupa turnos por (trabajo, semana lun–dom). */
function groupByJobWeek(shifts: ShiftLike[]): Map<string, ShiftLike[]> {
  const groups = new Map<string, ShiftLike[]>();
  for (const s of shifts) {
    if (s.esLibre) continue;
    const key = `${s.jobId}|${weekKey(parseYmd(s.fecha ?? '1970-01-05'))}`;
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }
  return groups;
}

/**
 * Totales de un rango de VARIAS semanas con la regla de Nelson:
 * la hora extra se aplica POR TRABAJO y POR SEMANA (cada grupo
 * trabajo×semana lleva su propio umbral de 40 h). Usar esto en
 * Estadísticas y en cualquier total que abarque más de una semana;
 * calcWeekTotals solo es correcto si el conjunto es UNA semana.
 */
export function calcRangeTotals(
  shifts: ShiftLike[],
  jobsById: Record<string, JobLike>,
  umbralExtraHrs: number,
  multExtra: number,
): WeekTotals {
  const total: WeekTotals = { hours: 0, regularHours: 0, overtimeHours: 0, gross: 0, net: 0 };
  for (const list of groupByJobWeek(shifts).values()) {
    const g = calcWeekTotals(list, jobsById, umbralExtraHrs, multExtra);
    total.hours += g.hours;
    total.regularHours += g.regularHours;
    total.overtimeHours += g.overtimeHours;
    total.gross += g.gross;
    total.net += g.net;
  }
  return total;
}

export interface ShiftPay {
  hours: number;
  gross: number;
  net: number;
}

/**
 * Valor de CADA turno con la misma regla por trabajo × semana: el
 * recargo de las horas extra del grupo se reparte entre sus turnos
 * en proporción a las horas de cada uno. Así los desgloses de
 * Estadísticas (por día, por trabajo, por mes) cuadran con los
 * totales semanales en vez de ignorar la hora extra.
 */
export function calcRangeShiftPay(
  shifts: ShiftLike[],
  jobsById: Record<string, JobLike>,
  umbralExtraHrs: number,
  multExtra: number,
): Map<string, ShiftPay> {
  const out = new Map<string, ShiftPay>();
  for (const list of groupByJobWeek(shifts).values()) {
    const job = jobsById[list[0]!.jobId];
    const rate = job?.sueldoHora ?? 0;
    const taxRate = (job?.taxPct ?? 0) / 100;
    const totH = list.reduce((a, s) => a + shiftHours(s), 0);
    const otH = Math.max(0, totH - umbralExtraHrs);
    const premiumPerHour = totH > 0 ? (otH * rate * (multExtra - 1)) / totH : 0;
    for (const s of list) {
      const h = shiftHours(s);
      const gross = h * rate + h * premiumPerHour + s.propinas + s.bono;
      out.set(s.id, { hours: h, gross, net: gross * (1 - taxRate) });
    }
  }
  return out;
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
