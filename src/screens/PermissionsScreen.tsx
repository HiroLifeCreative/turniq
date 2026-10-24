/** Pantalla "Permisos": todos los permisos que Turniq necesita, con su
 *  estado real y un botón para activar cada uno.
 *
 *  Por qué existe (pregunta de Nelson, 24 oct 2026: "¿por qué no tengo
 *  el permiso de Alarma?"): Android NO concede estos permisos solo por
 *  instalar la app. Las notificaciones piden diálogo en tiempo de
 *  ejecución (y si se negó antes, Android ya no lo muestra: hay que ir
 *  a Ajustes de la app). La pantalla completa y la batería sin
 *  restricción son permisos ESPECIALES que vienen apagados por defecto
 *  y solo el usuario los enciende en Ajustes del sistema, aunque la app
 *  los declare en el manifiesto. Los tres interruptores ya existían
 *  enterrados en Ajustes → Alarma; aquí quedan juntos, con estado y
 *  con la prueba de 6 s al final para verificar que todo suena. */
import React, { useState } from 'react';
import { View, Text, ScrollView, Platform, Linking } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ContentSheet, Screen, Card, Label, Btn, TopBar, Icon, useTheme, useT } from '../components/ui';
import { useToast } from '../components/Toast';
import { useStore } from '../store';
import { scheduleTestAlarm, notifPermissionGranted, requestNotifPermission } from '../services/notifications';
import {
  alarmNativeAvailable,
  nativeCanUseFullScreenIntent,
  nativeOpenFullScreenIntentSettings,
  nativeIsIgnoringBattery,
  nativeOpenBatterySettings,
} from '../services/alarmNative';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';

type PermItem = {
  key: string;
  icon: string;
  title: string;
  hint: string;
  ok: boolean | null;
  onAllow: () => void;
};

export function PermissionsScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const toast = useToast();
  const settings = useStore((s) => s.settings);

  const [notifOk, setNotifOk] = useState<boolean | null>(null);
  const [fsiOk, setFsiOk] = useState<boolean | null>(null);
  const [battOk, setBattOk] = useState<boolean | null>(null);

  const isAndroidNative = Platform.OS === 'android' && alarmNativeAvailable;

  const refresh = React.useCallback(() => {
    void notifPermissionGranted().then(setNotifOk);
    if (isAndroidNative) {
      void nativeCanUseFullScreenIntent().then(setFsiOk);
      void nativeIsIgnoringBattery().then(setBattOk);
    }
  }, [isAndroidNative]);

  useFocusEffect(refresh);

  const items: PermItem[] = [
    {
      key: 'notif',
      icon: 'bell',
      title: t.alarma.notifPerm,
      hint: t.permisos.notifHint,
      ok: notifOk,
      onAllow: () => {
        void requestNotifPermission().then((ok) => {
          setNotifOk(ok);
          // Si Android ya no muestra el diálogo (negado antes), a Ajustes.
          if (!ok) void Linking.openSettings();
        });
      },
    },
  ];
  if (isAndroidNative) {
    items.push(
      {
        key: 'fsi',
        icon: 'clock',
        title: t.alarma.fullScreen,
        hint: t.alarma.fullScreenHint,
        ok: fsiOk,
        onAllow: () => void nativeOpenFullScreenIntentSettings(),
      },
      {
        key: 'batt',
        icon: 'settings',
        title: t.alarma.battery,
        hint: t.alarma.batteryHint,
        ok: battOk,
        onAllow: () => void nativeOpenBatterySettings(),
      },
    );
  }

  const ready = items.filter((i) => i.ok === true).length;
  const total = items.length;
  const allReady = total > 0 && ready === total;

  return (
    <Screen banded>
      <TopBar onDark title={t.permisos.title} onBack={() => nav.goBack()} />
      <ContentSheet>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text2, lineHeight: 19, marginBottom: SP.lg }}>
          {t.permisos.subtitle}
        </Text>

        {/* Resumen */}
        <Card style={{ marginBottom: SP.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Label style={{ marginBottom: 2 }}>{allReady ? t.permisos.ready : t.permisos.missing}</Label>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 28, color: allReady ? '#30A46C' : p.text }}>
                {ready}/{total}
              </Text>
            </View>
            {allReady ? (
              <Icon name="check" size={32} color="#30A46C" />
            ) : (
              <Btn title={t.permisos.refresh} kind="ghost" onPress={refresh} />
            )}
          </View>
        </Card>

        {/* Un permiso por tarjeta */}
        {items.map((it) => (
          <Card key={it.key} style={{ marginBottom: SP.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Icon name={it.icon} size={ICON.lg} color={p.text2} />
                <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: p.text, marginLeft: SP.md, flex: 1 }}>
                  {it.title}
                </Text>
              </View>
              {it.ok === true ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="check" size={ICON.md} color="#30A46C" />
                  <Text style={{ color: '#30A46C', fontWeight: '700', fontSize: 14 }}>{t.alarma.active}</Text>
                </View>
              ) : (
                <Text style={{ color: '#D13438', fontWeight: '700', fontSize: 14 }}>{t.permisos.falta}</Text>
              )}
            </View>
            <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2, lineHeight: 17, marginBottom: SP.md }}>
              {it.hint}
            </Text>
            {it.ok !== true && (
              <Btn title={t.alarma.allow} onPress={it.onAllow} />
            )}
          </Card>
        ))}

        {/* Prueba de alarma (6 s): verifica que todo suena de verdad */}
        <View style={{ height: SP.md }} />
        <Btn
          title={t.alarma.test}
          onPress={() => {
            void scheduleTestAlarm(settings.sonidoAlarma, t.alarma).then((ok) => {
              if (ok) toast.info(t.alarma.testHint);
              else toast.error(t.alarma.testFail);
            });
          }}
        />
        <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, lineHeight: 17, marginTop: SP.sm, textAlign: 'center' }}>
          {t.alarma.testHint}
        </Text>
      </ScrollView>
      </ContentSheet>
    </Screen>
  );
}
