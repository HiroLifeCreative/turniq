/** Ajustes — secciones estilo iOS: Apariencia, Trabajo, Seguridad, Datos. */
import React, { useState } from 'react';
import {  View, Text, ScrollView, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { ContentSheet,  Screen, Label, Field, Seg, Btn, Confirm, TopBar, Icon, IosSwitch, useTheme, useT } from '../components/ui';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '../store';
import { exportBackup, importBackup } from '../services/backup';
import { mergeBackupData } from '../services/backupConvert';
import { scheduleTestAlarm, notifPermissionGranted, type AlarmSoundKey } from '../services/notifications';
import { alarmNativeAvailable, nativeCanUseFullScreenIntent, nativeOpenFullScreenIntentSettings, nativeIsIgnoringBattery, nativeOpenBatterySettings } from '../services/alarmNative';
import { useToast } from '../components/Toast';
import { APP_VERSION_LABEL } from '../lib/version';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import type { Lang } from '../i18n';

/** Sección agrupada estilo premium (#5): tarjetas muy redondeadas. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const p = useTheme();
  return (
    <View style={{ marginBottom: SP.lg }}>
      <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: p.text3, marginBottom: SP.sm, paddingHorizontal: SP.md }}>
        {title.toUpperCase()}
      </Text>
      <View style={{ backgroundColor: p.card, borderRadius: 20, borderWidth: 0.5, borderColor: p.line, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

/** Colores de icono por sección, estilo iOS. */
const ROW_COLORS: Record<string, string> = {
  settings: '#8E8E93',
  clock: '#FF9F0A',
  wallet: '#30A46C',
  trash: '#E5484D',
  user: '#0064E0',
};

/** Fila dentro de una sección: icono redondeado de color + etiqueta. */
function SettingRow({ icon, label, children, last }: { icon: string; label: string; children: React.ReactNode; last?: boolean }) {
  const p = useTheme();
  return (
    <View style={{ paddingHorizontal: SP.lg, paddingVertical: SP.md, borderBottomWidth: last ? 0 : 1, borderBottomColor: p.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.sm }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: ROW_COLORS[icon] ?? p.primary, alignItems: 'center', justifyContent: 'center', marginRight: SP.sm }}>
          <Icon name={icon} size={16} color="#fff" />
        </View>
        <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.body, color: p.text }}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

export function SettingsScreen() {
  const t = useT();
  const toast = useToast();
  const p = useTheme();
  const nav = useNavigation();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const resetAll = useStore((s) => s.resetAll);

  const [pinInput, setPinInput] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [fsiOk, setFsiOk] = useState<boolean | null>(null);
  const [notifOk, setNotifOk] = useState<boolean | null>(null);
  const [battOk, setBattOk] = useState<boolean | null>(null);

  // Estados que la alarma necesita (pantalla completa, notificaciones
  // y batería sin restricción): se revisan al entrar a la pantalla.
  useFocusEffect(
    React.useCallback(() => {
      void notifPermissionGranted().then(setNotifOk);
      if (Platform.OS === 'android' && alarmNativeAvailable) {
        void nativeCanUseFullScreenIntent().then(setFsiOk);
        void nativeIsIgnoringBattery().then(setBattOk);
      }
    }, []),
  );

  const savePin = () => {
    if (/^\d{4}$/.test(pinInput)) {
      setSettings({ pin: pinInput });
      setPinInput('');
      Alert.alert(t.settings.pinSet);
    }
  };

  return (
    <Screen banded>
      <TopBar onDark title={t.settings.title} onBack={() => nav.goBack()} />
      <ContentSheet>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>

        {/* PERFIL */}
        <Section title={t.settings.perfil}>
          <SettingRow icon="user" label={t.settings.nombre} last>
            <Field label="" value={settings.nombreUsuario} onChange={(v) => setSettings({ nombreUsuario: v })} placeholder={t.settings.nombrePh} />
          </SettingRow>
        </Section>

        {/* APARIENCIA */}
        <Section title={t.settings.apariencia}>
          <SettingRow icon="settings" label={t.settings.theme} last={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: p.text2, fontSize: TYPE.caption }}>{settings.dark ? t.settings.dark : t.settings.light}</Text>
              <IosSwitch value={settings.dark} onValueChange={(v) => setSettings({ dark: v })} />
            </View>
          </SettingRow>
          <SettingRow icon="clock" label={t.settings.language} last={false}>
            <Seg<Lang>
              options={[{ value: 'es', label: 'ES' }, { value: 'en', label: 'EN' }]}
              value={settings.idioma}
              onChange={(v) => setSettings({ idioma: v })}
            />
          </SettingRow>
          <SettingRow icon="clock" label={t.settings.hora} last>
            <Seg<'12h' | '24h'>
              options={[{ value: '12h', label: '12h' }, { value: '24h', label: '24h' }]}
              value={settings.formatoHora}
              onChange={(v) => setSettings({ formatoHora: v })}
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm }}>
              {[
                { v: 1440, label: `1 ${t.notif.day}` },
                { v: 60, label: `1 ${t.notif.hour}` },
                { v: 30, label: `30 ${t.notif.min}` },
                { v: 15, label: `15 ${t.notif.min}` },
                { v: 0, label: t.notif.now },
              ].map((o) => {
                const active = settings.avisosMin.includes(o.v);
                return (
                  <TouchableOpacity
                    key={o.v}
                    onPress={() => {
                      const next = active
                        ? settings.avisosMin.filter((m) => m !== o.v)
                        : [...settings.avisosMin, o.v].sort((a, b) => b - a);
                      setSettings({ avisosMin: next.length > 0 ? next : [0] });
                    }}
                    activeOpacity={0.7}
                    style={{
                      borderRadius: R.pill,
                      paddingHorizontal: SP.lg,
                      paddingVertical: SP.sm,
                      backgroundColor: active ? '#0392FF' : p.surface,
                      borderWidth: 1,
                      borderColor: active ? '#0392FF' : p.line,
                    }}
                  >
                    <Text style={{ color: active ? '#fff' : p.text2, fontWeight: active ? '700' : '400', fontSize: 13 }}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3, marginTop: SP.sm }}>
              {t.settings.notifyHint}
            </Text>
          </SettingRow>
          <SettingRow icon="clock" label={t.settings.overtime} last={false}>
            <View style={{ flexDirection: 'row', gap: SP.md, alignItems: 'flex-end' }}>
              <View style={{ flex: 1 }}>
                <Field label={t.settings.overtimeAfter} value={String(settings.umbralExtraHrs)} onChange={(v) => setSettings({ umbralExtraHrs: Number(v) || 0 })} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t.settings.overtimeMult} value={String(settings.multExtra)} onChange={(v) => setSettings({ multExtra: Number(v) || 1 })} keyboardType="decimal-pad" />
              </View>
              <IosSwitch value={settings.mostrarHoraExtra} onValueChange={(v) => setSettings({ mostrarHoraExtra: v })} />
            </View>
          </SettingRow>
          <SettingRow icon="wallet" label={t.settings.goal} last={!settings.mostrarMeta}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SP.md }}>
              <View style={{ flex: 1 }}>
                <Field label="" value={String(settings.metaSemanal)} onChange={(v) => setSettings({ metaSemanal: Number(v) || 0 })} keyboardType="numeric" />
              </View>
              <IosSwitch value={settings.mostrarMeta} onValueChange={(v) => setSettings({ mostrarMeta: v })} />
            </View>
          </SettingRow>
        </Section>

        {/* ALARMA */}
        <Section title={t.alarma.title}>
          <SettingRow icon="bell" label={t.alarma.sound} last={false}>
            <Seg<AlarmSoundKey>
              options={[
                { value: 'clasica', label: t.alarma.clasica },
                { value: 'suave', label: t.alarma.suave },
                { value: 'fuerte', label: t.alarma.fuerte },
              ]}
              value={settings.sonidoAlarma}
              onChange={(v) => setSettings({ sonidoAlarma: v })}
            />
          </SettingRow>
          <SettingRow icon="clock" label={t.alarma.snoozeFor} last={false}>
            <Seg<number>
              options={[
                { value: 5, label: `5 ${t.alarma.min}` },
                { value: 10, label: `10 ${t.alarma.min}` },
                { value: 15, label: `15 ${t.alarma.min}` },
              ]}
              value={settings.posponerMin}
              onChange={(v) => setSettings({ posponerMin: v })}
            />
          </SettingRow>
          {Platform.OS === 'android' && alarmNativeAvailable && (
            <SettingRow icon="bell" label={t.alarma.fullScreen} last={false}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3, marginBottom: SP.sm }}>{t.alarma.fullScreenHint}</Text>
              {fsiOk ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SP.sm }}>
                  <Icon name="check" size={ICON.md} color="#30A46C" />
                  <Text style={{ color: '#30A46C', fontWeight: '700', fontSize: 14 }}>{t.alarma.active}</Text>
                </View>
              ) : (
                <Btn title={t.alarma.allow} kind="ghost" onPress={() => void nativeOpenFullScreenIntentSettings()} />
              )}
            </SettingRow>
          )}
          <SettingRow icon="bell" label={t.alarma.notifPerm} last={false}>
            {notifOk ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SP.sm }}>
                <Icon name="check" size={ICON.md} color="#30A46C" />
                <Text style={{ color: '#30A46C', fontWeight: '700', fontSize: 14 }}>{t.alarma.active}</Text>
              </View>
            ) : (
              <Btn title={t.alarma.allow} kind="ghost" onPress={() => void Linking.openSettings()} />
            )}
          </SettingRow>
          {Platform.OS === 'android' && alarmNativeAvailable && (
            <SettingRow icon="bell" label={t.alarma.battery} last={false}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3, marginBottom: SP.sm }}>{t.alarma.batteryHint}</Text>
              {battOk ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SP.sm }}>
                  <Icon name="check" size={ICON.md} color="#30A46C" />
                  <Text style={{ color: '#30A46C', fontWeight: '700', fontSize: 14 }}>{t.alarma.active}</Text>
                </View>
              ) : (
                <Btn title={t.alarma.allow} kind="ghost" onPress={() => void nativeOpenBatterySettings()} />
              )}
            </SettingRow>
          )}
          <SettingRow icon="bell" label={t.alarma.test} last>
            <Btn
              title={t.alarma.test}
              kind="ghost"
              onPress={() => {
                void scheduleTestAlarm(settings.sonidoAlarma, t.alarma).then((ok) => {
                  if (ok) toast.info(t.alarma.testHint);
                  else toast.error(t.alarma.testFail);
                });
              }}
            />
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
                  style={{ backgroundColor: '#0392FF', borderRadius: R.pill, paddingHorizontal: SP.lg, height: 50, justifyContent: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{t.common.save}</Text>
                </TouchableOpacity>
              </View>
            )}
          </SettingRow>
          {settings.pin && Platform.OS !== 'web' && (
            <SettingRow icon="settings" label={t.settings.biometric} last>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                <IosSwitch value={settings.biometrico} onValueChange={(v) => setSettings({ biometrico: v })} />
              </View>
            </SettingRow>
          )}
        </Section>

        {/* ACERCA DE — sin duplicar lo que ya vive en el menú Más
            (Google, Términos y Café están allá; aquí solo la versión
            y las Novedades, que no tienen otro acceso). */}
        <Section title={t.settings.acerca}>
          <SettingRow icon="settings" label="Turniq" last={false}>
            <Text style={{ color: p.text3, fontSize: TYPE.caption }}>{APP_VERSION_LABEL}</Text>
          </SettingRow>
          <SettingRow icon="bell" label={t.novedades.title} last>
            <Btn title={t.novedades.title} onPress={() => (nav.navigate as any)('Changelog')} kind="ghost" />
          </SettingRow>
        </Section>

        {/* DATOS */}
        <Section title={t.settings.datos}>
          <SettingRow icon="wallet" label={t.settings.backup} last={false}>
            <View style={{ flexDirection: 'row', gap: SP.sm }}>
              <Btn
                title={t.settings.export}
                onPress={async () => {
                  const s = useStore.getState();
                  await exportBackup({
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    jobs: s.jobs,
                    shifts: s.shifts,
                    templates: s.templates,
                    settings: s.settings,
                  });
                  toast.success(t.toast.backupExported);
                }}
              />
              <Btn
                title={t.settings.import}
                kind="ghost"
                onPress={async () => {
                  try {
                    const data = await importBackup();
                    if (!data) return;
                    Alert.alert(t.settings.importTitle, t.settings.importConfirm, [
                      { text: t.common.cancel, style: 'cancel' },
                      {
                        text: t.settings.import,
                        onPress: () => {
                          const s = useStore.getState();
                          const merged = mergeBackupData(
                            { jobs: s.jobs, shifts: s.shifts, templates: s.templates },
                            { jobs: data.jobs, shifts: data.shifts, templates: data.templates },
                          );
                          useStore.setState({
                            jobs: merged.jobs,
                            shifts: merged.shifts,
                            templates: merged.templates,
                            settings: { ...s.settings, ...data.settings },
                          });
                          Alert.alert(
                            t.settings.importTitle,
                            t.settings.importResult
                              .replace('{s}', String(merged.stats.shiftsAdded))
                              .replace('{j}', String(merged.stats.jobsAdded)),
                          );
                        },
                      },
                    ]);
                  } catch {
                    Alert.alert(t.settings.importTitle, t.settings.importError);
                  }
                }}
              />
            </View>
          </SettingRow>
          <SettingRow icon="trash" label={t.settings.danger} last>
            <Btn title={t.settings.danger} kind="danger" onPress={() => setConfirmWipe(true)} />
          </SettingRow>
        </Section>
      </ScrollView>
      </ContentSheet>

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
