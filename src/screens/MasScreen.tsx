/** Menú "Más" (modal): filas simples con icono, SIN contenedores de
 * color ni letras (pedido de Nelson): "(icono) Reportes", etc. */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
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
  Permissions: 'key',
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
    { key: 'Permissions', label: t.more.permissions },
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
          {/* Pie: versión + Instagram + crédito, todo en el gris del
              pie original (p.text3). El texto del crédito lo dictó
              Nelson (24 oct 2026): desarrollo suyo, copyright de
              HiroLifeStudio. No se traduce: es texto de marca. */}
          <Text style={{ textAlign: 'center', fontFamily: FONT.mono, fontSize: 12, color: p.text3 }}>
            Turniq {APP_VERSION}
          </Text>
          <TouchableOpacity
            onPress={() => void Linking.openURL('https://www.instagram.com/SoyNelsonHerrera')}
            activeOpacity={0.6}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SP.sm, gap: 6 }}
          >
            <Icon name="instagram" size={16} color={p.text3} />
            <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3 }}>@SoyNelsonHerrera</Text>
          </TouchableOpacity>
          <Text style={{ textAlign: 'center', fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: SP.sm }}>
            Desarrollado por Nelson Herrera
          </Text>
          <Text style={{ textAlign: 'center', fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: 4 }}>
            © 2026 HiroLifeStudio · Todos los derechos reservados
          </Text>
        </ScrollView>
      </ContentSheet>
    </Screen>
  );
}
