/** Utilidades de fecha. Semana lunes–domingo. */

export const pad = (n: number): string => String(n).padStart(2, '0');

/** YYYY-MM-DD en hora local. */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** YYYY-MM-DD + n días. */
export function addDaysYmd(ymdStr: string, n: number): string {
  return ymd(addDays(parseYmd(ymdStr), n));
}

/** Rango con fecha de salida explícita (sin '+1 día'):
 *  '10:00 p.m. – 2:00 a.m. · 25 Oct' cuando la salida cae otro día. */
export function rangeLabelWithDates(
  fechaIn: string,
  horaIn: string,
  fechaOut: string | undefined,
  horaOut: string | null,
  esFmt: boolean,
  months: string[],
): string {
  const base = `${hmTo12h(horaIn, esFmt)} – ${horaOut ? hmTo12h(horaOut, esFmt) : '…'}`;
  const fOut = fechaOut ?? fechaIn;
  if (fOut !== fechaIn) return `${base} · ${shortDate(fOut, months)}`;
  return base;
}
export function startOfWeek(d: Date): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (c.getDay() + 6) % 7; // lunes=0
  c.setDate(c.getDate() - dow);
  return c;
}

export function endOfWeek(d: Date): Date {
  return addDays(startOfWeek(d), 6);
}

/** Clave de semana "YYYY-MM-DD" del lunes. */
export function weekKey(d: Date): string {
  return ymd(startOfWeek(d));
}

export function todayYmd(): string {
  return ymd(new Date());
}

/** ¿La semana del lunes `weekMonday` está bloqueada? Bloqueo: pasado el lunes siguiente (1 día de gracia). */
export function isWeekLocked(weekMondayYmd: string, now = new Date()): boolean {
  const monday = parseYmd(weekMondayYmd);
  const lockDate = addDays(monday, 8); // lunes siguiente + 1 día = martes 00:00
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today >= lockDate;
}

/** Minutos "HH:MM" -> minutos desde medianoche. */
export function hmToMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Minutos desde medianoche -> "HH:MM". */
export function minToHm(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  return `${pad(h)}:${pad(m)}`;
}

export function nowHm(): string {
  const n = new Date();
  return `${pad(n.getHours())}:${pad(n.getMinutes())}`;
}

/** Formato corto de fecha "18 oct". */
export function shortDate(ymdStr: string, months: string[]): string {
  const d = parseYmd(ymdStr);
  return `${d.getDate()} ${months[d.getMonth()]?.slice(0, 3) ?? ''}`;
}

/** "17:00" -> "5:00 p.m." (es) / "5:00 PM" (en). */
export function hmTo12h(hm: string, esFmt = true): string {
  const [h, m] = hm.split(':').map(Number);
  const hh = h ?? 0;
  const mm = m ?? 0;
  const suffix = esFmt ? (hh < 12 ? 'a.m.' : 'p.m.') : hh < 12 ? 'AM' : 'PM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${pad(mm)} ${suffix}`;
}
