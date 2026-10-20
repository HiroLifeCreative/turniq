/** Novedades: historial de versiones por build (changelog dentro de la app). */
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, TopBar, ContentSheet, Card, useTheme, useT } from '../components/ui';
import { useStore } from '../store';
import { SP, R, FONT, TYPE } from '../theme/tokens';
import { shortDate } from '../lib/dates';
import { CHANGELOG } from '../lib/changelog';

export function ChangelogScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const lang = useStore((s) => s.settings.idioma);

  return (
    <Screen banded>
      <TopBar onDark title={t.novedades.title} onBack={() => nav.goBack()} />
      <ContentSheet>
        <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
          {CHANGELOG.map((e, i) => (
            <Card key={e.build} style={{ marginBottom: SP.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: p.text }}>
                  v{e.version} · Build {e.build}
                </Text>
                {i === 0 && (
                  <View style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ color: '#fff', fontFamily: FONT.mono, fontSize: 11, fontWeight: '700' }}>
                      {t.novedades.latest.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: 2 }}>
                {shortDate(e.fecha, t.months)}
              </Text>
              <View style={{ marginTop: SP.md, gap: SP.sm }}>
                {e.notas[lang].map((n) => (
                  <View key={n} style={{ flexDirection: 'row' }}>
                    <Text style={{ color: p.primary, fontSize: 15, marginRight: 8 }}>•</Text>
                    <Text style={{ flex: 1, fontSize: TYPE.body, lineHeight: 21, color: p.text }}>{n}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </ScrollView>
      </ContentSheet>
    </Screen>
  );
}
