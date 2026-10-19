/** Ajustes — secciones estilo iOS: Apariencia, Trabajo, Seguridad, Datos. */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { Screen, Label, Field, Seg, Btn, Confirm, TopBar, Icon, useTheme, useT } from '../components/ui';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import type { Lang } from '../i18n';

/** Sección agrupada estilo iOS. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const p = useTheme();
  return (
    <View style={{ marginBottom: SP.lg }}>
      <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, letterSpacing: 1.2, color: p.text3, marginBottom: SP.sm, paddingHorizontal: SP.md }}>
        {title.toUpperCase()}
      </Text>
      <View style={{ backgroundColor: p.card, borderRadius: R.lg, borderWidth: 1, borderColor: p.line, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

/** Fila dentro de una sección. */
function SettingRow({ icon, label, children, last }: { icon: string; label: string; children: React.ReactNode; last?: boolean }) {
  const p = useTheme();
  return (
    <View style={{ paddingHorizontal: SP.lg, paddingVertical: SP.md, borderBottomWidth: last ? 0 : 1, borderBottomColor: p.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.sm }}>
        <Icon name={icon} size={ICON.md} color={p.text2} />
        <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.body, color: p.text, marginLeft: SP.sm }}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

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

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <TopBar title={t.settings.title} onBack={() => nav.goBack()} />

        {/* APARIENCIA */}
        <Section title={t.settings.apariencia}>
          <SettingRow icon="settings" label={t.settings.theme} last={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: p.text2, fontSize: TYPE.caption }}>{settings.dark ? t.settings.dark : t.settings.light}</Text>
              <Switch value={settings.dark} onValueChange={(v) => setSettings({ dark: v })} trackColor={{ true: p.primary }} />
            </View>
          </SettingRow>
          <SettingRow icon="settings" label={t.settings.language} last>
            <Seg<Lang>
              options={[{ value: 'es', label: 'ES' }, { value: 'en', label: 'EN' }]}
              value={settings.idioma}
              onChange={(v) => setSettings({ idioma: v })}
            />
          </SettingRow>
        </Section>

        {/* TRABAJO */}
        <Section title={t.settings.trabajo}>
          <SettingRow icon="wallet" label={t.settings.payday} last={false}>
            <Seg<number>
              options={t.settings.weekdays.map((d, i) => ({ value: i, label: d.slice(0, 3) }))}
              value={settings.diaCobro}
              onChange={(v) => setSettings({ diaCobro: v })}
            />
          </SettingRow>
          <SettingRow icon="clock" label={t.settings.notify} last={false}>
            <Seg<60 | 30 | 0>
              options={[60, 30, 0].map((m, i) => ({ value: m as 60 | 30 | 0, label: t.settings.notifyOpts[i] ?? '' }))}
              value={settings.avisoPrevioMin}
              onChange={(v) => setSettings({ avisoPrevioMin: v })}
            />
          </SettingRow>
          <SettingRow icon="clock" label={t.settings.overtime} last={false}>
            <View style={{ flexDirection: 'row', gap: SP.md }}>
              <View style={{ flex: 1 }}>
                <Field label={t.settings.overtimeAfter} value={String(settings.umbralExtraHrs)} onChange={(v) => setSettings({ umbralExtraHrs: Number(v) || 0 })} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t.settings.overtimeMult} value={String(settings.multExtra)} onChange={(v) => setSettings({ multExtra: Number(v) || 1 })} keyboardType="decimal-pad" />
              </View>
            </View>
          </SettingRow>
          <SettingRow icon="wallet" label={t.settings.goal} last>
            <Field label="" value={String(settings.metaSemanal)} onChange={(v) => setSettings({ metaSemanal: Number(v) || 0 })} keyboardType="numeric" />
          </SettingRow>
        </Section>

        {/* SEGURIDAD */}
        <Section title={t.settings.seguridad}>
          <SettingRow icon="settings" label={t.settings.pin} last={!settings.pin}>
            {settings.pin ? (
              <Btn title={t.settings.pinRemove} kind="ghost" onPress={() => setSettings({ pin: null, biometrico: false })} />
            ) : (
              <View style={{ flexDirection: 'row', gap: SP.sm, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Field label="" value={pinInput} onChange={setPinInput} keyboardType="numeric" maxLength={4} placeholder="••••" />
                </View>
                <TouchableOpacity
                  onPress={savePin}
                  style={{ backgroundColor: p.primary, borderRadius: R.md, paddingHorizontal: SP.lg, height: 50, justifyContent: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t.common.save}</Text>
                </TouchableOpacity>
              </View>
            )}
          </SettingRow>
          {settings.pin && Platform.OS !== 'web' && (
            <SettingRow icon="settings" label={t.settings.biometric} last>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Switch value={settings.biometrico} onValueChange={(v) => setSettings({ biometrico: v })} trackColor={{ true: p.primary }} />
              </View>
            </SettingRow>
          )}
        </Section>

        {/* ACERCA DE */}
        <Section title={t.settings.acerca}>
          <SettingRow icon="settings" label="Turniq" last>
            <Text style={{ color: p.text3, fontSize: TYPE.caption }}>v1.0.0 (2)</Text>
          </SettingRow>
        </Section>

        {/* DATOS */}
        <Section title={t.settings.datos}>
          <SettingRow icon="trash" label={t.settings.danger} last>
            <Btn title={t.settings.danger} kind="danger" onPress={() => setConfirmWipe(true)} />
          </SettingRow>
        </Section>
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
