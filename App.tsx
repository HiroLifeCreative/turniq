import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import * as Font from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore, jobsById } from './src/store';
import { STR } from './src/i18n';
import { RootNavigator } from './src/navigation/Root';
import { PinLock } from './src/screens/PinLock';
import { scheduleShiftReminders } from './src/services/notifications';
import { parseYmd, addDays, todayYmd } from './src/lib/dates';
import { FONT, light, dark } from './src/theme/tokens';

async function loadFonts(): Promise<void> {
  await Font.loadAsync({
    [FONT.head]: require('./assets/fonts/switzer-500.ttf'),
    [FONT.headBold]: require('./assets/fonts/switzer-800.ttf'),
    [FONT.mono]: require('./assets/fonts/JetBrainsMono_400Regular.ttf'),
    [FONT.monoBold]: require('./assets/fonts/JetBrainsMono_700Bold.ttf'),
  });
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const hydrated = useStore((s) => s.hydrated);
  const pin = useStore((s) => s.settings.pin);
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
    void scheduleShiftReminders(upcoming, jobsById(jobs), settings.avisoPrevioMin, strings.notif);
  }, [shifts, jobs, settings.avisoPrevioMin, settings.idioma, idioma, ready]);

  if (!ready || !hydrated) {
    const p = darkMode ? dark : light;
    return (
      <View style={{ flex: 1, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 34, fontWeight: '800', color: p.primary }}>Turniq</Text>
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

  return (
    <SafeAreaProvider>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
