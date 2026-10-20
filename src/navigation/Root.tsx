/** Navegación: bottom tabs (Inicio/Semana/Trabajos/Ganancias) + stack modal "Más". */
import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
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

  /** Dock flotante de vidrio: grupo compacto centrado de pestañas.
   *  Inactivas = botón fijo de 52px solo con icono; la activa es una
   *  píldora azul (color primario) con icono + palabra cuyo ancho crece
   *  con spring. (La librería cupertino-tabs es solo iOS; el estilo se
   *  recrea aquí para Android.) */
  const DockBar = (props: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const activeIdx = props.state.index;
    const PAD = 6;
    const activeFg = '#C4E9FF';
    return (
      <>
        {/* Blur PROGRESIVO inferior — técnica de expo-progressive-blur:
            UN solo BlurView fuerte tapado por una MÁSCARA degradada
            (MaskedView + LinearGradient con paradas suavizadas): la
            máscara revela el blur de forma continua (transparente arriba
            → opaco abajo, con startOffset 0.1). Sin la capa de color que
            ensuciaba el efecto; según los docs de Expo, cada `tint` ya
            agrega su propia capa translúcida, por eso aquí basta el blur.
            (La otra librería, expo-ios-visual-blur, hace lo mismo con
            radio variable vía CAFilter, API privada solo iOS.) */}
        <MaskedView
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 }}
          maskElement={
            <LinearGradient
              colors={[
                'rgba(0,0,0,0)',
                'rgba(0,0,0,0.05)',
                'rgba(0,0,0,0.16)',
                'rgba(0,0,0,0.34)',
                'rgba(0,0,0,0.58)',
                'rgba(0,0,0,0.84)',
                'rgba(0,0,0,1)',
              ]}
              locations={[0.1, 0.28, 0.44, 0.6, 0.76, 0.9, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ flex: 1 }}
            />
          }
        >
          <BlurView
            intensity={55}
            tint={dark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView"
            style={{ flex: 1 }}
          />
        </MaskedView>
      <View
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
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
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: dark ? 'rgba(23,23,26,0.6)' : 'rgba(255,255,255,0.6)',
              paddingHorizontal: PAD,
              paddingVertical: PAD,
            }}
          >
            {props.state.routes.map((route, index) => {
              const focused = activeIdx === index;
              const fg = focused ? activeFg : p.text3;
              const label = labels[route.name as keyof TabsParamList];
              // Grupo COMPACTO centrado (corrección de Nelson, 19 oct):
              // inactivas fijas de 52px solo icono; la activa es píldora
              // con icono + palabra y su ancho crece con spring.
              const activeW = 20 + 25 + 10 + Math.ceil(label.length * 5.4) + 20;
              return (
                <MotiView
                  key={route.key}
                  animate={{ width: focused ? activeW : 52 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                  style={{
                    height: 54,
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
                  {focused && (
                    <LinearGradient
                      colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      pointerEvents="none"
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', zIndex: 1 }}
                    />
                  )}
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
                    <Icon name={TAB_ICONS[route.name as keyof TabsParamList]} size={25} color={fg} />
                    {focused && (
                      <Text style={{ color: fg, fontFamily: FONT.head, fontWeight: '700', fontSize: 9 }} numberOfLines={1}>
                        {label}
                      </Text>
                    )}
                  </TouchableOpacity>
                </MotiView>
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
