/** Puente al módulo nativo TurniqAlarm (Android): alarmas del sistema
 *  con setAlarmClock + full-screen intent. En iOS/web no existe y
 *  todo devuelve false/null sin ruido. */
import { NativeModules, Platform } from 'react-native';

interface TurniqAlarmNative {
  scheduleAlarm(id: string, triggerAtMs: number, shiftId: string, title: string, body: string, sound: string): Promise<boolean>;
  cancelAlarm(id: string): Promise<boolean>;
  cancelAllAlarms(): Promise<boolean>;
  canUseFullScreenIntent(): Promise<boolean>;
  openFullScreenIntentSettings(): Promise<boolean>;
  isIgnoringBatteryOptimizations(): Promise<boolean>;
  openBatteryOptimizationSettings(): Promise<boolean>;
  getPendingAlarm(): Promise<string | null>;
  clearPendingAlarm(): Promise<boolean>;
}

const M: TurniqAlarmNative | undefined =
  Platform.OS === 'android' ? (NativeModules.TurniqAlarm as TurniqAlarmNative | undefined) : undefined;

export const alarmNativeAvailable = !!M;

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!M) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const nativeScheduleAlarm = (
  id: string,
  triggerAtMs: number,
  shiftId: string,
  title: string,
  body: string,
  sound: string,
): Promise<boolean> => safe(() => M!.scheduleAlarm(id, triggerAtMs, shiftId, title, body, sound), false);

export const nativeCancelAllAlarms = (): Promise<boolean> => safe(() => M!.cancelAllAlarms(), false);

export const nativeCanUseFullScreenIntent = (): Promise<boolean> =>
  safe(() => M!.canUseFullScreenIntent(), true);

export const nativeOpenFullScreenIntentSettings = (): Promise<boolean> =>
  safe(() => M!.openFullScreenIntentSettings(), false);

export const nativeIsIgnoringBattery = (): Promise<boolean> =>
  safe(() => M!.isIgnoringBatteryOptimizations(), true);

export const nativeOpenBatterySettings = (): Promise<boolean> =>
  safe(() => M!.openBatteryOptimizationSettings(), false);

export const nativeGetPendingAlarm = (): Promise<string | null> => safe(() => M!.getPendingAlarm(), null);

export const nativeClearPendingAlarm = (): Promise<boolean> => safe(() => M!.clearPendingAlarm(), false);
