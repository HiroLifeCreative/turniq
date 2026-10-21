/** Notificaciones locales:
 *  - Avisos de turno tipo ALARMA: canal Android por sonido elegido,
 *    prioridad máxima y datos para abrir la pantalla de Alarma.
 *  - Notificación fija "Estás trabajando" mientras hay turno abierto.
 *  - Recordatorio de salida olvidada y prueba de sonido. */
import { Platform } from 'react-native';
import { hmToMin, parseYmd } from '../lib/dates';
import type { Shift, Job } from '../store';
import { alarmNativeAvailable, nativeScheduleAlarm, nativeCancelAllAlarms } from './alarmNative';

export type AlarmSoundKey = 'clasica' | 'suave' | 'fuerte';

export const ALARM_FILES: Record<AlarmSoundKey, string> = {
  clasica: 'alarma_clasica.wav',
  suave: 'alarma_suave.wav',
  fuerte: 'alarma_fuerte.wav',
};

export const alarmChannelId = (s: AlarmSoundKey): string => `turniq-alarma-${s}`;
export const STATUS_CHANNEL = 'turniq-estado';
export const WORKING_ID = 'turniq-trabajando';

let Notifications: typeof import('expo-notifications') | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  } catch {
    Notifications = null;
  }
}

export function getNotifications(): typeof import('expo-notifications') | null {
  return Notifications;
}

export async function ensureNotifPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

/** Crea los canales Android: uno por sonido de alarma (MAX, con
 *  vibración y visible en pantalla de bloqueo) + el de estado (silencioso). */
export async function ensureChannels(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;
  try {
    const { AndroidImportance, AndroidNotificationVisibility } = Notifications;
    for (const key of Object.keys(ALARM_FILES) as AlarmSoundKey[]) {
      await Notifications.setNotificationChannelAsync(alarmChannelId(key), {
        name: `Alarma Turniq · ${key}`,
        importance: AndroidImportance.MAX,
        sound: ALARM_FILES[key],
        enableVibrate: true,
        vibrationPattern: [0, 250, 200, 250],
        lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
      });
    }
    await Notifications.setNotificationChannelAsync(STATUS_CHANNEL, {
      name: 'Estado de Turniq',
      importance: AndroidImportance.LOW,
      sound: null,
      enableVibrate: false,
      lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    });
  } catch {
    /* noop */
  }
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

type NotifStrings = { before: string; missed: string; day: string; hour: string; min: string; now: string };

/** Programa los avisos de los turnos futuros como alarmas (uno por
 *  cada minuto configurado) + el recordatorio de salida olvidada. */
export async function scheduleShiftReminders(
  shifts: Shift[],
  jobsById: Record<string, Job>,
  avisosMin: number[],
  sound: AlarmSoundKey,
  t: NotifStrings,
): Promise<void> {
  if (!Notifications) return;
  const ok = await ensureNotifPermission();
  if (!ok) return;
  await ensureChannels();
  // En Android los avisos van por la ALARMA NATIVA (setAlarmClock +
  // pantalla completa); expo-notifications queda para iOS y para el
  // resto (salida olvidada, estado). Se limpia el set anterior y se
  // reprograma fresco (las pospuestas se conservan).
  const useNative = Platform.OS === 'android' && alarmNativeAvailable;
  if (useNative) await nativeCancelAllAlarms();
  const now = Date.now();
  for (const sh of shifts) {
    const job = jobsById[sh.jobId];
    for (const avisoMin of avisosMin) {
      const d = parseYmd(sh.fecha);
      if (avisoMin >= 1440) {
        const days = Math.floor(avisoMin / 1440);
        const remMin = avisoMin % 1440;
        d.setDate(d.getDate() - days);
        const sm = hmToMin(sh.horaEntrada) - remMin;
        d.setHours(Math.floor(sm / 60), sm % 60, 0, 0);
      } else {
        const startMin = hmToMin(sh.horaEntrada) - avisoMin;
        if (startMin < 0) continue;
        d.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
      }
      if (d.getTime() <= now) continue;
      const when = avisoLabel(avisoMin, t);
      const body = t.before.replace('{job}', job?.nombre ?? '').replace('{when}', when);
      if (useNative) {
        await nativeScheduleAlarm(`aviso-${sh.id}-${avisoMin}`, d.getTime(), sh.id, 'Turniq', body, sound);
        continue;
      }
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `turniq-${sh.id}-${avisoMin}`,
          content: {
            title: 'Turniq',
            body,
            data: { type: 'aviso', shiftId: sh.id, avisoMin },
            sound: ALARM_FILES[sound],
          },
          trigger: { type: 'date', date: d, channelId: alarmChannelId(sound) } as never,
        });
      } catch {
        /* noop */
      }
    }
    // Salida olvidada: 15 min tras la salida programada (o 10 h tras
    // la entrada si no hay salida). Si ya marcó salida, se cancela.
    const missedId = `turniq-missed-${sh.id}`;
    if (sh.horaSalidaReal) {
      try {
        await Notifications.cancelScheduledNotificationAsync(missedId);
      } catch {
        /* noop */
      }
    } else {
      const d2 = parseYmd(sh.fecha);
      if (sh.horaSalida) {
        // Turno overnight (salida <= entrada): la salida cae al día siguiente.
        if (hmToMin(sh.horaSalida) <= hmToMin(sh.horaEntrada)) d2.setDate(d2.getDate() + 1);
        const endMin = hmToMin(sh.horaSalida) + 15;
        d2.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
      } else {
        d2.setHours(Math.floor(hmToMin(sh.horaEntrada) / 60) + 10, hmToMin(sh.horaEntrada) % 60, 0, 0);
      }
      if (d2.getTime() > now) {
        try {
          await Notifications.scheduleNotificationAsync({
            identifier: missedId,
            content: {
              title: 'Turniq',
              body: t.missed.replace('{job}', job?.nombre ?? ''),
              data: { type: 'olvido', shiftId: sh.id },
            },
            trigger: { type: 'date', date: d2, channelId: STATUS_CHANNEL } as never,
          });
        } catch {
          /* noop */
        }
      }
    }
  }
}

/** Pospone un aviso: lo vuelve a programar en `minutes` minutos. */
export async function scheduleSnooze(
  shift: Shift,
  job: Job | undefined,
  minutes: number,
  sound: AlarmSoundKey,
  t: NotifStrings,
): Promise<void> {
  if (!Notifications) return;
  await ensureChannels();
  const when = avisoLabel(0, t);
  const body = t.before.replace('{job}', job?.nombre ?? '').replace('{when}', when);
  if (Platform.OS === 'android' && alarmNativeAvailable) {
    await nativeScheduleAlarm(`snooze-${shift.id}`, Date.now() + minutes * 60000, shift.id, 'Turniq', body, sound);
    return;
  }
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `turniq-snooze-${shift.id}`,
      content: {
        title: 'Turniq',
        body: t.before.replace('{job}', job?.nombre ?? '').replace('{when}', when),
        data: { type: 'aviso', shiftId: shift.id, avisoMin: 0, snoozed: true },
        sound: ALARM_FILES[sound],
      },
      trigger: { type: 'date', date: new Date(Date.now() + minutes * 60000), channelId: alarmChannelId(sound) } as never,
    });
  } catch {
    /* noop */
  }
}

/** Prueba de sonido: dispara una alarma de ejemplo en 3 segundos. */
export async function scheduleTestAlarm(
  sound: AlarmSoundKey,
  t: { testTitle: string; testBody: string },
): Promise<boolean> {
  if (!Notifications) return false;
  const ok = await ensureNotifPermission();
  if (!ok) return false;
  await ensureChannels();
  // La prueba va por la misma vía real de la alarma (nativa en Android)
  if (Platform.OS === 'android' && alarmNativeAvailable) {
    return nativeScheduleAlarm('prueba', Date.now() + 6000, '', t.testTitle, t.testBody, sound);
  }
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: 'turniq-test',
      content: { title: t.testTitle, body: t.testBody, data: { type: 'test' }, sound: ALARM_FILES[sound] },
      trigger: { type: 'date', date: new Date(Date.now() + 6000), channelId: alarmChannelId(sound) } as never,
    });
    return true;
  } catch {
    return false;
  }
}

/** Notificación fija "Estás trabajando" (sticky en Android). */
export async function presentWorkingNotification(
  shift: Shift,
  job: Job | undefined,
  timeStr: string,
  t: { working: string; workingBody: string },
): Promise<void> {
  if (!Notifications) return;
  await ensureChannels();
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: WORKING_ID,
      content: {
        title: t.working,
        body: t.workingBody.replace('{job}', job?.nombre ?? '').replace('{time}', timeStr),
        data: { type: 'trabajando', shiftId: shift.id },
        sticky: true,
      },
      trigger: (Platform.OS === 'android' ? { channelId: STATUS_CHANNEL } : null) as never,
    });
  } catch {
    /* noop */
  }
}

export async function dismissWorkingNotification(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.dismissNotificationAsync(WORKING_ID);
  } catch {
    /* noop */
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(WORKING_ID);
  } catch {
    /* noop */
  }
}

export async function cancelShiftReminder(shiftId: string): Promise<void> {
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (
        n.identifier.startsWith(`turniq-${shiftId}`) ||
        n.identifier.startsWith(`turniq-snooze-${shiftId}`) ||
        n.identifier === `turniq-missed-${shiftId}`
      ) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {
    /* noop */
  }
}

/** ¿Están concedidas las notificaciones? (para el estado en Ajustes). */
export async function notifPermissionGranted(): Promise<boolean> {
  if (!Notifications) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/** Pide el permiso de notificaciones al momento (diálogo del sistema
 * si Android aún lo permite). Devuelve si quedó concedido. Sin este
 * permiso la alarma del sistema no puede sonar ni mostrarse. */
export async function requestNotifPermission(): Promise<boolean> {
  if (!Notifications) return false;
  return ensureNotifPermission();
}
