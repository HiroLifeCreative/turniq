/** Notificaciones locales: avisos previos al turno + recordatorio de salida olvidada. */
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

export function avisoLabel(min: number, t: { day: string; hour: string; min: string; now: string }): string {
  if (min >= 1440) {
    const d = Math.round(min / 1440);
    return d === 1 ? `1 ${t.day}` : `${d} ${t.day}s`;
  }
  if (min >= 60) {
    const h = Math.round(min / 60);
    return h === 1 ? `1 ${t.hour}` : `${h} ${t.hour}s`;
  }
  if (min > 0) return `${min} ${t.min}`;
  return t.now;
}

/** Programa avisos para los turnos futuros (uno por cada minuto configurado). */
export async function scheduleShiftReminders(
  shifts: Shift[],
  jobsById: Record<string, Job>,
  avisosMin: number[],
  t: { before: string; missed: string; day: string; hour: string; min: string; now: string },
): Promise<void> {
  if (!Notifications) return;
  const ok = await ensureNotifPermission();
  if (!ok) return;
  const now = Date.now();
  for (const sh of shifts) {
    const job = jobsById[sh.jobId];
    for (const avisoMin of avisosMin) {
      const startMin = hmToMin(sh.horaEntrada) - avisoMin;
      // Para avisos de 1+ día, restar días completos
      const d = parseYmd(sh.fecha);
      if (avisoMin >= 1440) {
        const days = Math.floor(avisoMin / 1440);
        const remMin = avisoMin % 1440;
        d.setDate(d.getDate() - days);
        const sm = hmToMin(sh.horaEntrada) - remMin;
        d.setHours(Math.floor(sm / 60), sm % 60, 0, 0);
      } else {
        if (startMin < 0) continue;
        d.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
      }
      if (d.getTime() <= now) continue;
      const when = avisoLabel(avisoMin, t);
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `turniq-${sh.id}-${avisoMin}`,
          content: {
            title: 'Turniq',
            body: t.before.replace('{job}', job?.nombre ?? '').replace('{when}', when),
          },
          trigger: { type: 'date', date: d } as never,
        });
      } catch {
        /* noop */
      }
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
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith(`turniq-${shiftId}`)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {
    /* noop */
  }
}
