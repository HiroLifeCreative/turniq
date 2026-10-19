/** Navegación: bottom tabs (Inicio/Semana/Trabajos/Ganancias) + stack modal "Más". */
import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useT, Icon } from '../components/ui';
import { FONT, ICON } from '../theme/tokens';
import type { TabsParamList, MasStackParamList, RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { WeekScreen } from '../screens/WeekScreen';
import { JobsScreen } from '../screens/JobsScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { MasScreen } from '../screens/MasScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { GmailScreen } from '../screens/GmailScreen';

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
      <MasStack.Screen name="Settings" component={SettingsScreen} />
      <MasStack.Screen name="CalendarSync" component={CalendarScreen} />
      <MasStack.Screen name="Gmail" component={GmailScreen} />
    </MasStack.Navigator>
  );
}

function TabsNavigator() {
  const t = useT();
  const p = useTheme();
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

  /** Dock flotante: píldora activa en azul, resto en gris. */
  const DockBar = (props: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    return (
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12 + insets.bottom,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: p.card,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: p.line,
          paddingVertical: 8,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 14,
        }}
      >
        {props.state.routes.map((route, index) => {
          const focused = props.state.index === index;
          const fg = focused ? '#FFFFFF' : p.text3;
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = props.navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  props.navigation.navigate(route.name as never);
                }
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? p.primary : 'transparent',
                borderRadius: 999,
                paddingVertical: 10,
                paddingHorizontal: focused ? 16 : 8,
                gap: 7,
              }}
            >
              <Icon name={TAB_ICONS[route.name as keyof TabsParamList]} size={ICON.lg} color={fg} />
              {focused && (
                <Text
                  style={{ color: fg, fontFamily: FONT.headBold, fontSize: 12 }}
                  numberOfLines={1}
                >
                  {labels[route.name as keyof TabsParamList]}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
        <RootStack.Screen
          name="Mas"
          component={MasNavigator}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
