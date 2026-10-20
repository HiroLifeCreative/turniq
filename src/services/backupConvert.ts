/**
 * Compatibilidad de respaldos:
 * - Detecta respaldos de la app anterior (Mis Horarios) y los convierte al formato Turniq.
 * - Fusiona un respaldo con los datos actuales SIN borrar nada (dedupe por id,
 *   trabajos emparejados por nombre, estaciones por nombre).
 */
import type { Job, Shift, ShiftTemplate } from '../store';

export interface BackupLike {
  version?: number;
  exportedAt?: string;
  jobs: unknown[];
  shifts: unknown[];
  templates?: unknown[];
  settings?: unknown;
}

export interface NormalizedBackup {
  jobs: Job[];
  shifts: Shift[];
  templates: ShiftTemplate[];
  settings: Record<string, unknown>;
  fromOldApp: boolean;
}

// Misma paleta que JOB_COLORS en store.ts (copia local para mantener este módulo puro).
const FALLBACK_COLORS = [
  '#0064E0', '#7C3AED', '#0E7C3E', '#D97706',
  '#D13438', '#0E9BD8', '#DB2777', '#4B5563',
];

/* ---------------- Detección ---------------- */

interface MHJob {
  id: string; name: string; rate: number; tax?: number; stations?: string;
}
interface MHShift {
  id: string; job: string; start: number; end: number; zone?: string;
  break?: number; note?: string; in?: number; out?: number;
  station?: string; cancelled?: boolean;
}

export function isMisHorariosBackup(raw: BackupLike): boolean {
  const j = raw.jobs?.[0] as MHJob | undefined;
  return !!j && typeof j.name === 'string' && typeof j.rate === 'number';
}

/* ---------------- Conversión de fechas con zona horaria ---------------- */

function tzParts(ms: number, tz: string): { fecha: string; hm: string } {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    const p: Record<string, string> = {};
    for (const part of fmt.formatToParts(new Date(ms))) p[part.type] = part.value;
    const hour = p.hour === '24' ? '00' : p.hour;
    return { fecha: `${p.year}-${p.month}-${p.day}`, hm: `${hour}:${p.minute}` };
  } catch {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      hm: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  }
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
}

/* ---------------- Conversión Mis Horarios → Turniq ---------------- */

export function convertMisHorarios(raw: BackupLike): NormalizedBackup {
  const mhJobs = raw.jobs as MHJob[];
  const mhShifts = (raw.shifts as MHShift[]).filter((s) => !s.cancelled);

  // Estaciones por trabajo: primero las del trabajo, luego las usadas en sus turnos.
  const stationNames = new Map<string, string[]>();
  for (const j of mhJobs) {
    const names: string[] = [];
    if (j.stations) {
      for (const ln of j.stations.split('\n')) {
        const n = ln.trim();
        if (n && !names.includes(n)) names.push(n);
      }
    }
    stationNames.set(j.id, names);
  }
  for (const s of mhShifts) {
    const names = stationNames.get(s.job);
    if (names && s.station && !names.includes(s.station)) names.push(s.station);
  }

  const stationId = new Map<string, string>(); // `${jobId}|${name}` -> id
  const jobs: Job[] = mhJobs.map((j, i) => {
    const estaciones = (stationNames.get(j.id) ?? []).map((n) => {
      const id = `st-${j.id.slice(0, 8)}-${slug(n)}`;
      stationId.set(`${j.id}|${n}`, id);
      return { id, nombre: n };
    });
    return {
      id: j.id,
      nombre: j.name,
      color: FALLBACK_COLORS[i % FALLBACK_COLORS.length]!,
      sueldoHora: j.rate / 100,
      taxPct: j.tax ?? 0,
      estaciones,
    };
  });

  const shifts: Shift[] = mhShifts.map((s) => {
    const tz = s.zone || 'America/New_York';
    const start = tzParts(s.start, tz);
    const end = tzParts(s.end, tz);
    const out: Shift = {
      id: s.id,
      jobId: s.job,
      fecha: start.fecha,
      horaEntrada: start.hm,
      horaSalida: end.hm,
      breakMin: s.break ?? 0,
      propinas: 0,
      bono: 0,
      notas: s.note ?? '',
    };
    if (s.in) out.horaEntradaReal = tzParts(s.in, tz).hm;
    if (s.out) out.horaSalidaReal = tzParts(s.out, tz).hm;
    if (s.station) {
      const sid = stationId.get(`${s.job}|${s.station}`);
      if (sid) out.estacionIds = [sid];
    }
    return out;
  });

  return { jobs, shifts, templates: [], settings: {}, fromOldApp: true };
}

/* ---------------- Normalización general ---------------- */

export function normalizeBackup(raw: BackupLike): NormalizedBackup | null {
  if (!raw || !Array.isArray(raw.jobs) || !Array.isArray(raw.shifts)) return null;
  if (isMisHorariosBackup(raw)) return convertMisHorarios(raw);
  // Formato Turniq nativo.
  const jobs = raw.jobs as Job[];
  if (jobs.length && typeof (jobs[0] as Job).nombre !== 'string') return null;
  return {
    jobs,
    shifts: raw.shifts as Shift[],
    templates: (raw.templates ?? []) as ShiftTemplate[],
    settings: (raw.settings ?? {}) as Record<string, unknown>,
    fromOldApp: false,
  };
}

/* ---------------- Fusión sin borrar ---------------- */

export interface MergeStats {
  jobsAdded: number;
  shiftsAdded: number;
  shiftsSkipped: number;
}

const norm = (s: string) => s.trim().toLowerCase();

export function mergeBackupData(
  current: { jobs: Job[]; shifts: Shift[]; templates: ShiftTemplate[] },
  incoming: { jobs: Job[]; shifts: Shift[]; templates: ShiftTemplate[] },
): { jobs: Job[]; shifts: Shift[]; templates: ShiftTemplate[]; stats: MergeStats } {
  const jobs: Job[] = current.jobs.map((j) => ({ ...j, estaciones: j.estaciones.map((e) => ({ ...e })) }));
  const jobMap = new Map<string, string>(); // id entrante -> id destino
  const stationMap = new Map<string, string>(); // id estación entrante -> id destino
  let jobsAdded = 0;

  for (const inc of incoming.jobs) {
    let target =
      jobs.find((j) => j.id === inc.id) ??
      jobs.find((j) => norm(j.nombre) === norm(inc.nombre));
    if (!target) {
      target = { ...inc, estaciones: inc.estaciones.map((e) => ({ ...e })) };
      jobs.push(target);
      jobsAdded++;
    }
    jobMap.set(inc.id, target.id);
    // Fusionar estaciones por nombre (solo agrega las que falten).
    for (const st of inc.estaciones) {
      let dest = target.estaciones.find((e) => norm(e.nombre) === norm(st.nombre));
      if (!dest) {
        let id = st.id;
        if (target.estaciones.some((e) => e.id === id)) id = `${st.id}-${target.id.slice(0, 4)}`;
        dest = { id, nombre: st.nombre };
        target.estaciones.push(dest);
      }
      stationMap.set(st.id, dest.id);
    }
  }

  const shifts: Shift[] = [...current.shifts];
  const seen = new Set(current.shifts.map((s) => s.id));
  let shiftsAdded = 0;
  let shiftsSkipped = 0;
  for (const inc of incoming.shifts) {
    if (seen.has(inc.id)) { shiftsSkipped++; continue; }
    const jobId = jobMap.get(inc.jobId);
    if (!jobId) { shiftsSkipped++; continue; }
    const estacionIds = (inc.estacionIds ?? [])
      .map((id) => stationMap.get(id))
      .filter((x): x is string => !!x);
    shifts.push({ ...inc, jobId, estacionIds: estacionIds.length ? estacionIds : undefined });
    seen.add(inc.id);
    shiftsAdded++;
  }

  const templates: ShiftTemplate[] = [...current.templates];
  const seenT = new Set(current.templates.map((t) => t.id));
  for (const inc of incoming.templates) {
    if (seenT.has(inc.id)) continue;
    const jobId = jobMap.get(inc.jobId);
    if (!jobId && !jobs.some((j) => j.id === inc.jobId)) continue;
    templates.push({ ...inc, jobId: jobId ?? inc.jobId });
    seenT.add(inc.id);
  }

  return { jobs, shifts, templates, stats: { jobsAdded, shiftsAdded, shiftsSkipped } };
}
