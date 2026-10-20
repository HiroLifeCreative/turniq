/** Navegación: bottom tabs (Inicio/Semana/Trabajos/Ganancias) + stack modal "Más". */
import React from 'react';
import { Text, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useT, Icon, bandColor } from '../components/ui';
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
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { ChangelogScreen } from '../screens/ChangelogScreen';
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
    if (v === 'Reports' || v === 'Settings' || v === 'CalendarSync' || v === 'Gmail' || v === 'Templates' || v === 'Changelog') initial = v;
  } catch {
    /* no web */
  }
  return (
    <MasStack.Navigator
      initialRouteName={initial}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: bandColor(p.bg === '#0B0B0C') },
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <MasStack.Screen name="MasHome" component={MasScreen} />
      <MasStack.Screen name="Reports" component={ReportsScreen} />
      <MasStack.Screen name="Stats" component={StatsScreen} />
      <MasStack.Screen name="Templates" component={TemplatesScreen} />
      <MasStack.Screen name="Changelog" component={ChangelogScreen} />
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
  /** Dock flotante de vidrio: grupo compacto centrado de pestañas,
   *  SOLO iconos (sin texto). Inactivas = botón fijo de 50px; la activa
   *  es una píldora azul (color primario) un poco más ancha que crece
   *  con spring. El contenedor de vidrio se ajusta al ancho exacto del
   *  grupo (sin aire sobrante en los extremos). (La librería
   *  cupertino-tabs es solo iOS; el estilo se recrea aquí.) */
  const DockBar = (props: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const activeIdx = props.state.index;
    // Responsive: el dock escala con el ancho del teléfono (base 412dp)
    // y parte de un tamaño más compacto que antes (Nelson: en su
    // teléfono se veía muy grande).
    const { width: winW } = useWindowDimensions();
    const s = Math.min(1, Math.max(0.8, winW / 412));
    const BTN_H = Math.round(48 * s);
    const W_ON = Math.round(58 * s);
    const W_OFF = Math.round(48 * s);
    const GAP = Math.round(12 * s);
    const PADX = Math.round(12 * s);
    const PAD = 5;
    const GLASS_R = Math.round(30 * s);
    const ICON_SZ = Math.round(23 * s);
    const activeFg = '#C4E9FF';
    return (
      <>
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 12 + insets.bottom,
          alignItems: 'center',
        }}
      >
      <View
        style={{
          borderRadius: GLASS_R,
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
          style={{ borderRadius: GLASS_R, overflow: 'hidden' }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: GAP,
              backgroundColor: dark ? 'rgba(23,23,26,0.6)' : 'rgba(255,255,255,0.6)',
              paddingHorizontal: PADX,
              paddingVertical: PAD,
            }}
          >
            {props.state.routes.map((route, index) => {
              const focused = activeIdx === index;
              const fg = focused ? activeFg : p.text3;
              // SIN texto en ningún tab (Nelson): solo iconos. La activa es
              // píldora azul un poco más ancha; inactivas compactas de 50px.
              return (
                <MotiView
                  key={route.key}
                  animate={{ width: focused ? W_ON : W_OFF }}
                  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                  style={{
                    height: BTN_H,
                    borderRadius: 999,
                    overflow: 'hidden',
                    backgroundColor: focused ? '#0392FF' : 'transparent',
                    shadowColor: '#0392FF',
                    shadowOpacity: focused ? 0.38 : 0,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: focused ? 4 : 0,
                  }}
                >
                  <TouchableOpacity
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
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      borderRadius: 999,
                    }}
                  >
                    <Icon name={TAB_ICONS[route.name as keyof TabsParamList]} size={ICON_SZ} color={fg} />
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>
        </BlurView>
      </View>
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
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: bandColor(p.bg === '#0B0B0C') },
          animation: 'slide_from_right',
          animationDuration: 250,
        }}
      >
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
