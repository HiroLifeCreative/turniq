/** Menú "Más" (modal): Reportes, Ajustes, Calendario, Gmail. */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Screen, Card, TopBar, useTheme, useT } from '../components/ui';
import { SP, FONT } from '../theme/tokens';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MasStackParamList } from '../navigation/types';

const BADGE: Record<string, string> = {
  Reports: '#7C3AED',
  Stats: '#0E9BD8',
  Tips: '#D97706',
  Settings: '#4B5563',
  CalendarSync: '#0E7C3E',
  Gmail: '#D13438',
};

export function MasScreen({ navigation }: { navigation: NativeStackNavigationProp<MasStackParamList, 'MasHome'> }) {
  const t = useT();
  const p = useTheme();
  const items: { key: keyof MasStackParamList; label: string }[] = [
    { key: 'Reports', label: t.more.reports },
    { key: 'Stats', label: t.more.stats },
    { key: 'Tips', label: t.more.tips },
    { key: 'Settings', label: t.more.settings },
    { key: 'CalendarSync', label: t.more.calendar },
    { key: 'Gmail', label: t.more.gmail },
    { key: 'Terms', label: t.more.terms },
  ];
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <TopBar title={t.mas.title} onBack={() => navigation.goBack()} />
        {items.map((it) => (
          <TouchableOpacity key={it.key} onPress={() => navigation.navigate(it.key as never)} activeOpacity={0.7}>
            <Card style={{ marginBottom: SP.sm, flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40, height: 40, borderRadius: 12, backgroundColor: BADGE[it.key],
                  alignItems: 'center', justifyContent: 'center', marginRight: SP.md,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                  {it.label.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <Text style={{ flex: 1, fontFamily: FONT.headBold, fontSize: 17, color: p.text }}>{it.label}</Text>
              <Text style={{ fontSize: 18, color: p.text3 }}>›</Text>
            </Card>
          </TouchableOpacity>
        ))}
        <View style={{ height: SP.xxl }} />
        <Text style={{ textAlign: 'center', fontFamily: FONT.mono, fontSize: 12, color: p.text3 }}>
          Turniq 1.0.0
        </Text>
      </ScrollView>
    </Screen>
  );
}
