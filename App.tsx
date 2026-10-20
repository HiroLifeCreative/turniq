import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
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
import { scheduleShiftReminders } from './src/services/notifications';
import { parseYmd, addDays, todayYmd } from './src/lib/dates';
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
    if (Platform.OS === 'web' || !ready) return;
    const from = todayYmd();
    const to = (() => {
      const d = parseYmd(from);
      const t2 = addDays(d, 14);
      return `${t2.getFullYear()}-${String(t2.getMonth() + 1).padStart(2, '0')}-${String(t2.getDate()).padStart(2, '0')}`;
    })();
    const upcoming = shifts.filter((s) => s.fecha >= from && s.fecha <= to);
    const strings = STR[idioma];
    void scheduleShiftReminders(upcoming, jobsById(jobs), settings.avisosMin, strings.notif);
  }, [shifts, jobs, settings.avisosMin, settings.idioma, idioma, ready]);

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

  return (
    <SafeAreaProvider>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
