/** Menú "Más" (modal): filas simples con icono, SIN contenedores de
 * color ni letras (pedido de Nelson): "(icono) Reportes", etc. */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ContentSheet, Screen, TopBar, Icon, useTheme, useT } from '../components/ui';
import { SP, FONT } from '../theme/tokens';
import { APP_VERSION } from '../lib/version';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MasStackParamList } from '../navigation/types';

const ICONS: Record<string, string> = {
  Reports: 'fileText',
  Stats: 'chart',
  Templates: 'copy',
  Tips: 'coffee',
  Settings: 'settings',
  CalendarSync: 'calendar',
  Gmail: 'mail',
  Terms: 'scale',
};

export function MasScreen({ navigation }: { navigation: NativeStackNavigationProp<MasStackParamList, 'MasHome'> }) {
  const t = useT();
  const p = useTheme();
  const items: { key: keyof MasStackParamList; label: string }[] = [
    { key: 'Reports', label: t.more.reports },
    { key: 'Stats', label: t.more.stats },
    { key: 'Templates', label: t.more.templates },
    { key: 'Tips', label: t.more.tips },
    { key: 'Settings', label: t.more.settings },
    { key: 'CalendarSync', label: t.more.calendar },
    { key: 'Gmail', label: t.more.gmail },
    { key: 'Terms', label: t.more.terms },
  ];
  return (
    <Screen banded>
      <TopBar onDark title={t.mas.title} onBack={() => navigation.goBack()} />
      <ContentSheet>
        <ScrollView contentContainerStyle={{ paddingHorizontal: SP.lg, paddingTop: SP.sm, paddingBottom: 124 }}>
          {items.map((it, i) => (
            <TouchableOpacity
              key={it.key}
              onPress={() => navigation.navigate(it.key as never)}
              activeOpacity={0.6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                borderBottomWidth: i < items.length - 1 ? 0.5 : 0,
                borderBottomColor: p.line,
              }}
            >
              <Icon name={ICONS[it.key] ?? 'settings'} size={22} color={p.text2} />
              <Text style={{ flex: 1, fontFamily: FONT.head, fontSize: 17, color: p.text, marginLeft: SP.md }}>{it.label}</Text>
              <Icon name="chevronRight" size={18} color={p.text3} />
            </TouchableOpacity>
          ))}
          <View style={{ height: SP.xxl }} />
          <Text style={{ textAlign: 'center', fontFamily: FONT.mono, fontSize: 12, color: p.text3 }}>
            Turniq {APP_VERSION}
          </Text>
        </ScrollView>
      </ContentSheet>
    </Screen>
  );
}
