/** Ajustes: idioma, cobro, avisos, extra, meta, PIN, biometría, tema, borrar. */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { Screen, Card, Label, Field, Seg, Btn, Confirm, TopBar, useTheme, useT } from '../components/ui';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { SP, FONT } from '../theme/tokens';
import type { Lang } from '../i18n';

export function SettingsScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const resetAll = useStore((s) => s.resetAll);

  const [pinInput, setPinInput] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);

  const savePin = () => {
    if (/^\d{4}$/.test(pinInput)) {
      setSettings({ pin: pinInput });
      setPinInput('');
      Alert.alert(t.settings.pinSet);
    }
  };

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: SP.lg }}>
      <Label>{label}</Label>
      {children}
    </View>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <TopBar title={t.settings.title} onBack={() => nav.goBack()} />

        <Card style={{ marginBottom: SP.md }}>
          <Row label={t.settings.nombre}>
            <Field label="" value={settings.nombreUsuario} onChange={(v) => setSettings({ nombreUsuario: v })} placeholder="Nelson" />
          </Row>

          <Row label={t.settings.language}>
            <Seg<Lang>
              options={[{ value: 'es', label: 'ES' }, { value: 'en', label: 'EN' }]}
              value={settings.idioma}
              onChange={(v) => setSettings({ idioma: v })}
            />
          </Row>

          <Row label={t.settings.payday}>
            <Seg<number>
              options={t.settings.weekdays.map((d, i) => ({ value: i, label: d.slice(0, 3) }))}
              value={settings.diaCobro}
              onChange={(v) => setSettings({ diaCobro: v })}
            />
            <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: SP.sm }}>{t.settings.paydayHint}</Text>
          </Row>

          <Row label={t.settings.notify}>
            <Seg<60 | 30 | 0>
              options={[60, 30, 0].map((m, i) => ({ value: m as 60 | 30 | 0, label: t.settings.notifyOpts[i] ?? '' }))}
              value={settings.avisoPrevioMin}
              onChange={(v) => setSettings({ avisoPrevioMin: v })}
            />
          </Row>

          <Row label={t.settings.overtime}>
            <View style={{ flexDirection: 'row', gap: SP.md }}>
              <View style={{ flex: 1 }}>
                <Field label={t.settings.overtimeAfter} value={String(settings.umbralExtraHrs)} onChange={(v) => setSettings({ umbralExtraHrs: Number(v) || 0 })} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t.settings.overtimeMult} value={String(settings.multExtra)} onChange={(v) => setSettings({ multExtra: Number(v) || 1 })} keyboardType="decimal-pad" />
              </View>
            </View>
          </Row>

          <Row label={t.settings.goal}>
            <Field label="" value={String(settings.metaSemanal)} onChange={(v) => setSettings({ metaSemanal: Number(v) || 0 })} keyboardType="numeric" />
          </Row>

          <Row label={t.settings.pin}>
            {settings.pin ? (
              <Btn title={t.settings.pinRemove} kind="ghost" onPress={() => setSettings({ pin: null, biometrico: false })} />
            ) : (
              <View style={{ flexDirection: 'row', gap: SP.sm }}>
                <View style={{ flex: 1 }}>
                  <Field label="" value={pinInput} onChange={setPinInput} keyboardType="numeric" maxLength={4} placeholder="••••" />
                </View>
                <TouchableOpacity
                  onPress={savePin}
                  style={{ backgroundColor: p.primary, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 26, height: 50 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t.common.save}</Text>
                </TouchableOpacity>
              </View>
            )}
          </Row>

          {settings.pin && Platform.OS !== 'web' && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.lg }}>
              <Text style={{ color: p.text, fontSize: 15 }}>{t.settings.biometric}</Text>
              <Switch value={settings.biometrico} onValueChange={(v) => setSettings({ biometrico: v })} trackColor={{ true: p.primary }} />
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: p.text, fontSize: 15, fontFamily: FONT.mono }}>{t.settings.theme}</Text>
            <Switch value={settings.dark} onValueChange={(v) => setSettings({ dark: v })} trackColor={{ true: p.primary }} />
          </View>
        </Card>

        <Btn title={t.settings.danger} kind="danger" onPress={() => setConfirmWipe(true)} />
      </ScrollView>

      <Confirm
        visible={confirmWipe}
        message={t.settings.dangerConfirm}
        yesLabel={t.common.delete}
        noLabel={t.common.cancel}
        onYes={() => { resetAll(); setConfirmWipe(false); }}
        onNo={() => setConfirmWipe(false)}
      />
    </Screen>
  );
}
