import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './services/storage';
import { uid } from './lib/calc';
import type { Lang } from './i18n';

export interface Station {
  id: string;
  nombre: string;
}

export interface Job {
  id: string;
  nombre: string;
  color: string;
  sueldoHora: number;
  taxPct: number;
  estaciones: Station[];
}

export interface Shift {
  id: string;
  jobId: string;
  esLibre?: boolean; // turno libre (no atado a trabajo)
  estacionIds?: string[]; // múltiples estaciones
  fecha: string; // YYYY-MM-DD
  horaEntrada: string; // HH:MM
  horaSalida: string | null;
  breakMin: number;
  propinas: number;
  bono: number;
  notas: string;
  gcalEventId?: string;
}

export const DATA_VERSION = 1;

export interface Settings {
  idioma: Lang;
  nombreUsuario: string;
  diaCobro: number; // 0=lunes..6=domingo (default 4=viernes)
  avisosMin: number[]; // minutos antes: 1440=1 día, 60, 30, 15, 0=al momento
  umbralExtraHrs: number;
  multExtra: number;
  metaSemanal: number;
  mostrarMeta: boolean;
  dineroOculto: boolean;
  pin: string | null;
  biometrico: boolean;
  dark: boolean;
  formatoHora: '12h' | '24h';
}

export interface ShiftTemplate {
  id: string;
  nombre: string;
  jobId: string;
  estacionIds?: string[];
  horaEntrada: string;
  horaSalida: string;
  breakMin: number;
}

interface State {
  jobs: Job[];
  shifts: Shift[];
  templates: ShiftTemplate[];
  settings: Settings;
  hydrated: boolean;
  // jobs
  addJob: (j: Omit<Job, 'id'>) => string;
  updateJob: (id: string, patch: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  // shifts
  addShift: (s: Omit<Shift, 'id'>) => string;
  updateShift: (id: string, patch: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  duplicateShift: (id: string) => void;
  duplicateWeek: (weekMondayYmd: string) => number;
  // templates
  addTemplate: (t: Omit<ShiftTemplate, 'id'>) => string;
  updateTemplate: (id: string, patch: Partial<ShiftTemplate>) => void;
  deleteTemplate: (id: string) => void;
  // settings
  setSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
  setHydrated: () => void;
}

export const JOB_COLORS = [
  '#0064E0', '#7C3AED', '#0E7C3E', '#D97706',
  '#D13438', '#0E9BD8', '#DB2777', '#4B5563',
];

const defaultSettings: Settings = {
  idioma: 'es',
  nombreUsuario: '',
  diaCobro: 4,
  avisosMin: [30],
  umbralExtraHrs: 40,
  multExtra: 1.5,
  metaSemanal: 600,
  mostrarMeta: true,
  dineroOculto: false,
  pin: null,
  biometrico: false,
  dark: false,
  formatoHora: '12h',
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      jobs: [],
      shifts: [],
      templates: [],
      settings: defaultSettings,
      hydrated: false,

      addJob: (j) => {
        const id = uid();
        set((s) => ({ jobs: [...s.jobs, { ...j, id }] }));
        return id;
      },
      updateJob: (id, patch) =>
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
      deleteJob: (id) =>
        set((s) => ({
          jobs: s.jobs.filter((j) => j.id !== id),
          shifts: s.shifts.filter((sh) => sh.jobId !== id),
        })),

      addShift: (sh) => {
        const id = uid();
        set((s) => ({ shifts: [...s.shifts, { ...sh, id }] }));
        return id;
      },
      updateShift: (id, patch) =>
        set((s) => ({ shifts: s.shifts.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)) })),
      deleteShift: (id) => set((s) => ({ shifts: s.shifts.filter((sh) => sh.id !== id) })),
      duplicateShift: (id) =>
        set((s) => {
          const orig = s.shifts.find((sh) => sh.id === id);
          if (!orig) return s;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _oid, gcalEventId: _gid, ...rest } = orig;
          return { shifts: [...s.shifts, { ...rest, id: uid(), gcalEventId: undefined }] };
        }),

      duplicateWeek: (weekMondayYmd) => {
        const { shifts } = get();
        const [y, m, d] = weekMondayYmd.split('-').map(Number);
        const monday = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
        const inWeek = shifts.filter((sh) => {
          const [sy, sm, sd] = sh.fecha.split('-').map(Number);
          const dt = new Date(sy ?? 1970, (sm ?? 1) - 1, sd ?? 1);
          const diff = Math.round((dt.getTime() - monday.getTime()) / 86400000);
          return diff >= 0 && diff < 7;
        });
        const copies = inWeek.map((sh) => {
          const [sy, sm, sd] = sh.fecha.split('-').map(Number);
          const dt = new Date(sy ?? 1970, (sm ?? 1) - 1, sd ?? 1);
          dt.setDate(dt.getDate() + 7);
          const nf = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, gcalEventId, ...rest } = sh;
          return { ...rest, id: uid(), fecha: nf, horaSalida: sh.horaSalida, gcalEventId: undefined };
        });
        set((s) => ({ shifts: [...s.shifts, ...copies] }));
        return copies.length;
      },

      // templates
      addTemplate: (t) => {
        const id = uid();
        set((s) => ({ templates: [...s.templates, { ...t, id }] }));
        return id;
      },
      updateTemplate: (id, patch) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      resetAll: () => set({ jobs: [], shifts: [], templates: [], settings: defaultSettings }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'turniq-v1',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        // Migración: avisoPrevioMin (número) → avisosMin (array)
        if (state && (state.settings as unknown as { avisoPrevioMin?: number }).avisoPrevioMin !== undefined) {
          const old = (state.settings as unknown as { avisoPrevioMin: number }).avisoPrevioMin;
          state.settings.avisosMin = [old];
          delete (state.settings as unknown as { avisoPrevioMin?: number }).avisoPrevioMin;
        }
        if (state && !Array.isArray(state.templates)) state.templates = [];
        // Migración: estacionId (string) → estacionIds (array)
        if (state) {
          for (const s of state.shifts as unknown as Array<{ estacionId?: string; estacionIds?: string[] }>) {
            if (s.estacionId !== undefined && !Array.isArray(s.estacionIds)) {
              s.estacionIds = s.estacionId ? [s.estacionId] : [];
              delete s.estacionId;
            }
          }
          for (const tp of state.templates as unknown as Array<{ estacionId?: string; estacionIds?: string[] }>) {
            if (tp.estacionId !== undefined && !Array.isArray(tp.estacionIds)) {
              tp.estacionIds = tp.estacionId ? [tp.estacionId] : [];
              delete tp.estacionId;
            }
          }
        }
        state?.setHydrated();
      },
    },
  ),
);

/** Helpers de selección */
export const jobsById = (jobs: Job[]): Record<string, Job> =>
  Object.fromEntries(jobs.map((j) => [j.id, j]));
