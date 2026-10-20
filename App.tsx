import React, { useEffect, useState } from 'react';
import { View, Text, Platform, AppState } from 'react-native';
import * as Font from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore, jobsById } from './src/store';
import { STR } from './src/i18n';
import { RootNavigator } from './src/navigation/Root';
import { ToastProvider } from './src/components/Toast';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableFreeze } from 'react-native-screens';
import { PinLock } from './src/screens/PinLock';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { scheduleShiftReminders, getNotifications, presentWorkingNotification, dismissWorkingNotification, scheduleSnooze } from './src/services/notifications';
import { nativeGetPendingAlarm, nativeClearPendingAlarm } from './src/services/alarmNative';
import { parseYmd, addDays, todayYmd, hmTo12h } from './src/lib/dates';
import { AlarmScreen } from './src/screens/AlarmScreen';
import { FONT, light, dark } from './src/theme/tokens';

// Congela las pantallas inactivas: entrar a Ajustes/Calendario se
// siente fluido porque los tabs dejan de renderizar detrás.
enableFreeze(true);

/** Tiempo mínimo visible de la pantalla de carga (splash). */
const SPLASH_MIN_MS = 3500;

async function loadFonts(): Promise<void> {
  await Font.loadAsync({
    [FONT.head]: require('./assets/fonts/Roboto-Regular.ttf'),
    RobotoMedium: require('./assets/fonts/Roboto-Medium.ttf'),
    [FONT.headBold]: require('./assets/fonts/Roboto-Bold.ttf'),
  });
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [alarmShiftId, setAlarmShiftId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(true);
  const hydrated = useStore((s) => s.hydrated);
  const pin = useStore((s) => s.settings.pin);
  const onboardingDone = useStore((s) => s.settings.onboardingDone);
  const darkMode = useStore((s) => s.settings.dark);
  const idioma = useStore((s) => s.settings.idioma);
  const shifts = useStore((s) => s.shifts);
  const jobs = useStore((s) => s.jobs);
  const settings = useStore((s) => s.settings);

  useEffect(() => {
    loadFonts()
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  // Splash: visible al menos SPLASH_MIN_MS aunque todo cargue antes.
  useEffect(() => {
    const id = setTimeout(() => setSplashDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(id);
  }, []);

  // Programa avisos de turnos próximos (solo nativo)
  useEffect(() => {
    if (Platform.OS === 'web' || !ready) return;    const from = todayYmd();
    const to = (() => {
      const d = parseYmd(from);
      const t2 = addDays(d, 14);
      return `${t2.getFullYear()}-${String(t2.getMonth() + 1).padStart(2, '0')}-${String(t2.getDate()).padStart(2, '0')}`;
    })();
    const upcoming = shifts.filter((s) => s.fecha >= from && s.fecha <= to);
    const strings = STR[idioma];
    void scheduleShiftReminders(upcoming, jobsById(jobs), settings.avisosMin, settings.sonidoAlarma, strings.notif);
  }, [shifts, jobs, settings.avisosMin, settings.sonidoAlarma, settings.idioma, idioma, ready]);

  // Pantalla de Alarma: se abre al tocar un aviso o si llega con la
  // app en primer plano (el banner no se duplica en primer plano).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const N = getNotifications();
    if (!N) return;
    N.setNotificationHandler({
      handleNotification: async (notification) => {
        const type = (notification.request.content.data as { type?: string } | undefined)?.type;
        return {
          shouldShowAlert: type !== 'aviso',
          shouldPlaySound: type !== 'aviso',
          shouldSetBadge: false,
        };
      },
    });
    const openFromData = (data: unknown) => {
      const d = data as { type?: string; shiftId?: string } | undefined;
      if (d?.type === 'aviso' && d.shiftId) setAlarmShiftId(d.shiftId);
    };
    const subRecv = N.addNotificationReceivedListener((n) => openFromData(n.request.content.data));
    const subResp = N.addNotificationResponseReceivedListener((r) => openFromData(r.notification.request.content.data));
    void N.getLastNotificationResponseAsync().then((r) => {
      if (r) openFromData(r.notification.request.content.data);
    });
    return () => {
      subRecv.remove();
      subResp.remove();
    };
  }, []);

  // Alarma NATIVA (Android): si el receiver disparó una alarma del
  // sistema, dejó el shiftId guardado; al entrar/enfocar la app se
  // abre la pantalla de Alarma.
  useEffect(() => {
    if (Platform.OS !== 'android' || !ready) return;
    let alive = true;
    const check = async () => {
      const shiftId = await nativeGetPendingAlarm();
      if (alive && shiftId) {
        setAlarmShiftId(shiftId);
        void nativeClearPendingAlarm();
      }
    };
    void check();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void check();
    });
    const iv = setInterval(check, 15000);
    return () => {
      alive = false;
      sub.remove();
      clearInterval(iv);
    };
  }, [ready]);

  // Notificación fija "Estás trabajando" mientras haya turno abierto
  const openShift = shifts.find((s) => s.horaEntradaReal && !s.horaSalidaReal);
  const openShiftId = openShift?.id;
  const openShiftEntrada = openShift?.horaEntradaReal ?? undefined;
  useEffect(() => {
    if (Platform.OS === 'web' || !ready) return;
    if (openShiftId && openShiftEntrada) {
      const sh = shifts.find((s) => s.id === openShiftId);
      if (sh) {
        void presentWorkingNotification(sh, jobsById(jobs)[sh.jobId], hmTo12h(openShiftEntrada, idioma === 'es'), STR[idioma].alarma);
        return;
      }
    }
    void dismissWorkingNotification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openShiftId, openShiftEntrada, ready]);

  // Hook de verificación visual (solo web): 'turniq-test-alarma' = '1'
  useEffect(() => {
    if (Platform.OS !== 'web' || !hydrated) return;
    try {
      if (localStorage.getItem('turniq-test-alarma') === '1') {
        const nxt = shifts
          .filter((s) => s.fecha >= todayYmd())
          .sort((a, b) => (a.fecha + a.horaEntrada).localeCompare(b.fecha + b.horaEntrada))[0];
        if (nxt) setAlarmShiftId(nxt.id);
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!ready || !hydrated || !splashDone) {
    return (
      <View style={{ flex: 1, backgroundColor: '#14161A', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 38, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 }}>
          Turniq<Text style={{ color: '#0392FF' }}>.</Text>
        </Text>
      </View>
    );
  }

  if (pin && !unlocked) {
    return (
      <SafeAreaProvider>
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        <PinLock onUnlock={() => setUnlocked(true)} />
      </SafeAreaProvider>
    );
  }

  if (!onboardingDone && onboardingVisible) {
    return (
      <SafeAreaProvider>
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        <OnboardingScreen onDone={() => setOnboardingVisible(false)} />
      </SafeAreaProvider>
    );
  }

  const alarmShift = alarmShiftId ? shifts.find((s) => s.id === alarmShiftId) : undefined;

  return (
    <SafeAreaProvider>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
        {alarmShift && (
          <AlarmScreen
            shift={alarmShift}
            job={jobsById(jobs)[alarmShift.jobId]}
            onSnooze={() => {
              void scheduleSnooze(alarmShift, jobsById(jobs)[alarmShift.jobId], settings.posponerMin, settings.sonidoAlarma, STR[idioma].notif);
              setAlarmShiftId(null);
            }}
            onDismiss={() => setAlarmShiftId(null)}
          />
        )}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
