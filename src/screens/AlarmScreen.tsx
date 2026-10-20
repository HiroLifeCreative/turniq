/** Pantalla de ALARMA a pantalla completa: detalle del próximo turno
 *  con Posponer y Detener. Se abre al tocar un aviso o si el aviso
 *  llega con la app en primer plano. Diseño oscuro de marca. */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, useT } from '../components/ui';
import { FONT, SP, TYPE } from '../theme/tokens';
import { hmTo12h, hmToMin, parseYmd, todayYmd, ymd } from '../lib/dates';
import type { Job, Shift } from '../store';
import { useStore } from '../store';

function fmtCountdown(ms: number, minWord: string): string {
  if (ms <= 0) return '';
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin} ${minWord}`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} h ${m} ${minWord}` : `${h} h`;
}

export function AlarmScreen({
  shift,
  job,
  onSnooze,
  onDismiss,
}: {
  shift: Shift;
  job?: Job;
  onSnooze: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const posponerMin = useStore((s) => s.settings.posponerMin);
  const idioma = useStore((s) => s.settings.idioma);
  const esFmt = idioma === 'es';
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 20000);
    return () => clearInterval(id);
  }, []);

  const start = parseYmd(shift.fecha);
  const sm = hmToMin(shift.horaEntrada);
  start.setHours(Math.floor(sm / 60), sm % 60, 0, 0);
  const diff = start.getTime() - nowMs;

  const today = todayYmd();
  const tomorrow = ymd(new Date(Date.now() + 86400000));
  const dayLabel =
    shift.fecha === today
      ? t.inicio.hoy
      : shift.fecha === tomorrow
        ? t.inicio.manana
        : parseYmd(shift.fecha).toLocaleDateString(esFmt ? 'es' : 'en', { weekday: 'long', day: 'numeric', month: 'long' });

  const stations = job?.estaciones.filter((e) => (shift.estacionIds ?? []).includes(e.id)).map((e) => e.nombre) ?? [];
  const durH = shift.horaSalida
    ? Math.max(0, (hmToMin(shift.horaSalida) - sm + 1440) % 1440) / 60
    : 0;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#14161A',
        zIndex: 999,
        paddingTop: insets.top + SP.xxl,
        paddingBottom: insets.bottom + SP.xxl,
        paddingHorizontal: SP.xl,
      }}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Campana con anillo pulsante */}
        <View style={{ width: 108, height: 108, alignItems: 'center', justifyContent: 'center', marginBottom: SP.xxl }}>
          <MotiView
            from={{ scale: 0.85, opacity: 0.55 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'timing', duration: 1400, loop: true }}
            style={{
              position: 'absolute',
              width: 108,
              height: 108,
              borderRadius: 54,
              borderWidth: 2,
              borderColor: '#0392FF',
            }}
          />
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: 'rgba(3,146,255,0.16)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="bell" size={42} color="#0392FF" />
          </View>
        </View>

        <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: 'rgba(255,255,255,0.55)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: SP.sm }}>
          {t.alarma.heading}
        </Text>
        <Text style={{ fontFamily: FONT.headBold, fontSize: 44, color: '#FFFFFF', letterSpacing: -1 }}>
          {hmTo12h(shift.horaEntrada, esFmt)}
        </Text>
        <Text style={{ fontSize: TYPE.body, color: '#C4E9FF', marginTop: SP.xs, fontWeight: '600' }}>
          {diff > 0 ? t.alarma.startsIn.replace('{x}', fmtCountdown(diff, t.alarma.min)) : t.alarma.startsNow}
        </Text>

        {/* Detalle del turno */}
        <View
          style={{
            alignSelf: 'stretch',
            backgroundColor: '#1E2128',
            borderRadius: 20,
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.09)',
            padding: SP.lg,
            marginTop: SP.xxxl,
          }}
        >
          <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.h2, color: '#FFFFFF' }} numberOfLines={1}>
            {job?.nombre ?? ''}
          </Text>
          <Text style={{ fontSize: TYPE.caption, color: 'rgba(255,255,255,0.65)', marginTop: SP.xs, textTransform: 'capitalize' }}>
            {dayLabel}
          </Text>
          <Text style={{ fontSize: TYPE.caption, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
            {hmTo12h(shift.horaEntrada, esFmt)}
            {shift.horaSalida ? ` – ${hmTo12h(shift.horaSalida, esFmt)}` : ''}
            {durH > 0 ? ` · ${durH.toFixed(1)} h` : ''}
            {stations.length ? ` · ${stations.join(', ')}` : ''}
          </Text>
        </View>
      </View>

      {/* Acciones */}
      <View style={{ flexDirection: 'row', gap: SP.md }}>
        <TouchableOpacity
          onPress={onSnooze}
          activeOpacity={0.85}
          style={{
            flex: 1,
            height: 56,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: FONT.head, fontWeight: '700', fontSize: 16, color: '#FFFFFF' }}>
            {t.alarma.snooze} · {posponerMin} {t.alarma.min}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.85}
          style={{
            flex: 1,
            height: 56,
            borderRadius: 999,
            backgroundColor: '#0392FF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: FONT.head, fontWeight: '700', fontSize: 16, color: '#C4E9FF' }}>{t.alarma.dismiss}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
