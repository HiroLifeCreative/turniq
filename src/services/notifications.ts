/** Notificaciones locales: aviso previo al turno + recordatorio de salida olvidada. */
import { Platform } from 'react-native';
import { hmToMin, parseYmd } from '../lib/dates';
import type { Shift, Job } from '../store';

let Notifications: typeof import('expo-notifications') | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  } catch {
    Notifications = null;
  }
}

export async function ensureNotifPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

/** Programa avisos para los turnos futuros (id = shift.id). */
export async function scheduleShiftReminders(
  shifts: Shift[],
  jobsById: Record<string, Job>,
  avisoPrevioMin: 60 | 30 | 0,
  t: { before: string; missed: string },
): Promise<void> {
  if (!Notifications) return;
  const ok = await ensureNotifPermission();
  if (!ok) return;
  const now = Date.now();
  for (const sh of shifts) {
    const startMin = hmToMin(sh.horaEntrada) - avisoPrevioMin;
    if (startMin < 0) continue;
    const d = parseYmd(sh.fecha);
    d.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
    if (d.getTime() <= now) continue;
    const job = jobsById[sh.jobId];
    const when =
      avisoPrevioMin === 60 ? '1 h' : avisoPrevioMin === 30 ? '30 min' : 'ahora mismo';
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `turniq-${sh.id}`,
        content: {
          title: 'Turniq',
          body: t.before.replace('{job}', job?.nombre ?? '').replace('{when}', when),
        },
        trigger: { type: 'date', date: d } as never,
      });
    } catch {
      /* noop */
    }
    // Recordatorio de salida olvidada: 10 h después de la entrada, si sigue abierto
    if (!sh.horaSalida) {
      const d2 = parseYmd(sh.fecha);
      d2.setHours(Math.floor(hmToMin(sh.horaEntrada) / 60) + 10, hmToMin(sh.horaEntrada) % 60, 0, 0);
      if (d2.getTime() > now) {
        try {
          await Notifications.scheduleNotificationAsync({
            identifier: `turniq-missed-${sh.id}`,
            content: { title: 'Turniq', body: t.missed.replace('{job}', job?.nombre ?? '') },
            trigger: { type: 'date', date: d2 } as never,
          });
        } catch {
          /* noop */
        }
      }
    }
  }
}

export async function cancelShiftReminder(shiftId: string): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(`turniq-${shiftId}`);
    await Notifications.cancelScheduledNotificationAsync(`turniq-missed-${shiftId}`);
  } catch {
    /* noop */
  }
}
