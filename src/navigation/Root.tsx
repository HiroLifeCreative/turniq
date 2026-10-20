/** Navegación: bottom tabs (Inicio/Semana/Trabajos/Ganancias) + stack modal "Más". */
import React, { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useT, Icon } from '../components/ui';
import { useStore } from '../store';
import { FONT, ICON } from '../theme/tokens';
import type { TabsParamList, MasStackParamList, RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { WeekScreen } from '../screens/WeekScreen';
import { JobsScreen } from '../screens/JobsScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { MasScreen } from '../screens/MasScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { TipsScreen } from '../screens/TipsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { GmailScreen } from '../screens/GmailScreen';
import { TermsScreen } from '../screens/TermsScreen';
import { MonthCalendarScreen } from '../screens/MonthCalendarScreen';

const Tab = createBottomTabNavigator<TabsParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const MasStack = createNativeStackNavigator<MasStackParamList>();

const TAB_ICONS: Record<keyof TabsParamList, string> = {
  Inicio: 'home',
  Semana: 'calendar',
  Trabajos: 'briefcase',
  Ganancias: 'chart',
};

function MasNavigator() {
  const p = useTheme();
  // Hook SOLO para verificación visual: localStorage 'turniq-test-screen'
  let initial: keyof MasStackParamList = 'MasHome';
  try {
    const v = localStorage.getItem('turniq-test-screen');
    if (v === 'Reports' || v === 'Settings' || v === 'CalendarSync' || v === 'Gmail') initial = v;
  } catch {
    /* no web */
  }
  return (
    <MasStack.Navigator
      initialRouteName={initial}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }}
    >
      <MasStack.Screen name="MasHome" component={MasScreen} />
      <MasStack.Screen name="Reports" component={ReportsScreen} />
      <MasStack.Screen name="Stats" component={StatsScreen} />
      <MasStack.Screen name="Tips" component={TipsScreen} />
      <MasStack.Screen name="Settings" component={SettingsScreen} />
      <MasStack.Screen name="CalendarSync" component={CalendarScreen} />
      <MasStack.Screen name="Gmail" component={GmailScreen} />
      <MasStack.Screen name="Terms" component={TermsScreen} />
    </MasStack.Navigator>
  );
}

function TabsNavigator() {
  const t = useT();
  const p = useTheme();
  const dark = useStore((s) => s.settings.dark);
  // Hook SOLO para verificación visual: localStorage 'turniq-test-tab'
  let initialTab: keyof TabsParamList = 'Inicio';
  try {
    const v = localStorage.getItem('turniq-test-tab');
    if (v === 'Semana' || v === 'Trabajos' || v === 'Ganancias') initialTab = v;
  } catch {
    /* no web */
  }
  const labels: Record<keyof TabsParamList, string> = {
    Inicio: t.tabs.inicio,
    Semana: t.tabs.week,
    Trabajos: t.tabs.jobs,
    Ganancias: t.tabs.earnings,
  };

  /** Dock flotante de vidrio con segmented control estilo Cupertino:
   *  pastilla blanca que se DESLIZA con spring entre pestañas (como
   *  UISegmentedControl), todas con icono + nombre. La librería original
   *  es solo iOS; esto recrea el estilo en Android también. */
  const DockBar = (props: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const [trackW, setTrackW] = useState(0);
    const n = props.state.routes.length;
    const activeIdx = props.state.index;
    const PAD = 6;
    const segW = trackW > 0 ? (trackW - PAD * 2) / n : 0;
    const activeFg = dark ? '#FFFFFF' : '#111318';
    return (
      <>
        {/* Blur PROGRESIVO inferior: el contenido se disuelve en niebla
            al acercarse al dock (efecto de expo-ios-visual-blur, recreado
            con BlurView + degradado al color de fondo; sirve en Android). */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 132 }}
        >
          <BlurView
            intensity={45}
            tint={dark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <LinearGradient
            colors={dark ? ['rgba(11,11,12,0)', 'rgba(11,11,12,0.96)'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0.96)']}
            locations={[0.1, 0.78]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </View>
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12 + insets.bottom,
          borderRadius: 32,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 14,
        }}
      >
        <BlurView
          intensity={70}
          tint={dark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={{ borderRadius: 32, overflow: 'hidden' }}
        >
          <View
            onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: dark ? 'rgba(23,23,26,0.6)' : 'rgba(255,255,255,0.6)',
              paddingHorizontal: PAD,
              paddingVertical: PAD,
            }}
          >
            {/* Pastilla deslizante */}
            {trackW > 0 && (
              <MotiView
                animate={{ translateX: activeIdx * segW }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                style={{
                  position: 'absolute',
                  top: PAD,
                  left: PAD + 3,
                  width: segW - 6,
                  height: 54,
                  borderRadius: 999,
                  backgroundColor: dark ? '#2E2E33' : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOpacity: 0.16,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 4,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  pointerEvents="none"
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%' }}
                />
              </MotiView>
            )}
            {props.state.routes.map((route, index) => {
              const focused = activeIdx === index;
              const fg = focused ? activeFg : p.text3;
              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: focused }}
                  activeOpacity={0.7}
                  onPress={() => {
                    const event = props.navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) {
                      void Haptics.selectionAsync();
                      props.navigation.navigate(route.name as never);
                    }
                  }}
                  style={{
                    flex: 1,
                    height: 54,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                    gap: 2,
                  }}
                >
                  <Icon name={TAB_ICONS[route.name as keyof TabsParamList]} size={20} color={fg} />
                  <Text style={{ color: fg, fontFamily: FONT.head, fontWeight: focused ? '700' : '500', fontSize: 10 }} numberOfLines={1}>
                    {labels[route.name as keyof TabsParamList]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
      </>
    );
  };

  return (
    <Tab.Navigator
      initialRouteName={initialTab}
      tabBar={(props) => <DockBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Semana" component={WeekScreen} />
      <Tab.Screen name="Trabajos" component={JobsScreen} />
      <Tab.Screen name="Ganancias" component={EarningsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const p = useTheme();
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }}>
        <RootStack.Screen name="Tabs" component={TabsNavigator} />
        <RootStack.Screen name="MonthCalendar" component={MonthCalendarScreen} />
        <RootStack.Screen
          name="Mas"
          component={MasNavigator}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
