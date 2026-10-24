/** Sincronización automática con Google Calendar.
 *
 * Refleja en el calendario los turnos que Nelson crea, edita o borra,
 * sin tocar ningún botón: observa el store y, si hay conexión con
 * Google, crea/actualiza/borra el evento de cada turno. Cubre TODAS
 * las vías: formulario, plantillas, duplicar, importar y borrar un
 * trabajo completo (sus turnos desaparecen y sus eventos también).
 */
import { useStore, jobsById } from '../store';
import type { Shift, Job } from '../store';
import { getAccessToken, syncShiftEvent, deleteShiftEvent } from './google';

/** Firma de los campos que se reflejan en el evento (gcalEventId no:
 * si contara, guardar el propio id relanzaría la sincronización). */
const sig = (s: Shift): string =>
  [s.fecha, s.fechaSalida ?? '', s.horaEntrada, s.horaSalida ?? '', s.jobId, s.notas ?? '', s.propinas ?? 0, s.bono ?? 0].join('|');

let started = false;

async function pushSync(shift: Shift, job: Job | undefined): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  const eventId = await syncShiftEvent(token, shift, job, shift.gcalEventId);
  if (eventId && eventId !== shift.gcalEventId) {
    useStore.getState().updateShift(shift.id, { gcalEventId: eventId });
  }
}

async function pushDelete(eventId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  await deleteShiftEvent(token, eventId);
}

export function initGoogleSync(): void {
  if (started) return;
  started = true;
  let prev = new Map(useStore.getState().shifts.map((s) => [s.id, s]));
  useStore.subscribe((state) => {
    const cur = new Map(state.shifts.map((s) => [s.id, s]));
    const byId = jobsById(state.jobs);
    for (const [id, old] of prev) {
      if (!cur.has(id) && old.gcalEventId) void pushDelete(old.gcalEventId);
    }
    for (const s of cur.values()) {
      const old = prev.get(s.id);
      if ((!old || sig(old) !== sig(s)) && s.horaSalida) void pushSync(s, byId[s.jobId]);
    }
    prev = cur;
  });
}

/** Sincroniza TODOS los turnos de una vez (primer uso / reparación). */
export async function syncAllShifts(): Promise<number> {
  const token = await getAccessToken();
  if (!token) return 0;
  const { shifts, jobs } = useStore.getState();
  const byId = jobsById(jobs);
  let n = 0;
  for (const s of shifts) {
    if (!s.horaSalida) continue;
    const eventId = await syncShiftEvent(token, s, byId[s.jobId], s.gcalEventId);
    if (eventId) {
      n++;
      if (eventId !== s.gcalEventId) useStore.getState().updateShift(s.id, { gcalEventId: eventId });
    }
  }
  return n;
}
