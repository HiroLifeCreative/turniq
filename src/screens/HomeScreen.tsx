/** Pestaña Inicio — héroe oscuro con reloj en vivo, estados por color, todo redondeado + blur. */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedRollingNumbers from 'react-native-animated-rolling-numbers';
import { Screen, Label, Confirm, Header, Icon, useTheme, useT } from '../components/ui';
import { ShiftForm } from '../components/ShiftForm';
import { ShiftDetailSheet } from '../components/ShiftDetailSheet';
import { useStore, jobsById, type Shift } from '../store';
import type { TabsParamList } from '../navigation/types';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import { todayYmd, nowHm, hmToMin, hmTo12h, weekKey, parseYmd, startOfWeek, ymd } from '../lib/dates';
import { fmtHours, fmtMoney, calcWeekTotals } from '../lib/calc';
import { MotiView } from 'moti';

const DARK_CARD = '#16181D';
const DARK_CARD_2 = '#1E2128';

type HeroState = 'working' | 'missed' | 'upcoming' | 'idle';

export function HomeScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation<BottomTabNavigationProp<TabsParamList>>();
  const goWeek = () => nav.navigate('Semana' as never);
  const goJobs = () => nav.navigate('Trabajos' as never);
  const jobs = useStore((s) => s.jobs);
  const shifts = useStore((s) => s.shifts);
  const settings = useStore((s) => s.settings);
  const addShift = useStore((s) => s.addShift);
  const updateShift = useStore((s) => s.updateShift);
  const deleteShift = useStore((s) => s.deleteShift);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [detailShift, setDetailShift] = useState<Shift | null>(null);
  const [clockJobId, setClockJobId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const setSettings = useStore((s) => s.setSettings);

  // Modo privado: ocultar dinero (requiere PIN/biometría para mostrar)
  const togglePrivacy = async () => {
    const hidden = settings.dineroOculto;
    if (hidden) {
      // Mostrar: requiere autenticación si hay PIN o biometría
      const pin = settings.pin;
      const bio = settings.biometrico;
      if (!pin && !bio) {
        setSettings({ dineroOculto: false });
        return;
      }
      if (bio && Platform.OS !== 'web') {
        try {
          const LA = require('expo-local-authentication') as typeof import('expo-local-authentication');
          const has = await LA.hasHardwareAsync();
          const enrolled = await LA.isEnrolledAsync();
          if (has && enrolled) {
            const res = await LA.authenticateAsync({ promptMessage: t.pin.title });
            if (res.success) {
              setSettings({ dineroOculto: false });
              return;
            }
            return; // cancelado
          }
        } catch { /* fallback a PIN */ }
      }
      if (pin) {
        Alert.prompt(
          t.pin.title,
          t.pin.enterPin,
          [
            { text: t.common.cancel, style: 'cancel' },
            {
              text: t.common.confirm,
              onPress: (input) => {
                if (input === pin) setSettings({ dineroOculto: false });
                else Alert.alert(t.pin.wrong);
              },
            },
          ],
          'secure-text',
        );
      } else {
        setSettings({ dineroOculto: false });
      }
    } else {
      // Ocultar: sin autenticación
      setSettings({ dineroOculto: true });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  const hidden = settings.dineroOculto;
  const MoneyHidden = () => (
    <Text style={{ fontFamily: FONT.headBold, fontSize: 44, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>••••••</Text>
  );

  const today = todayYmd();
  const byId = jobsById(jobs);
  const esFmt = settings.idioma === 'es';
  const darkMode = p.bg === '#000000' || settings.dark;

  const dayShifts = shifts
    .filter((s) => s.fecha === today)
    .sort((a, b) => hmToMin(a.horaEntrada) - hmToMin(b.horaEntrada));
  const openShift = dayShifts.find((s) => !s.horaSalida);
  const openJob = openShift ? byId[openShift.jobId] : undefined;

  // Tick cada segundo para el reloj en vivo
  useEffect(() => {
    if (!openShift) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [openShift?.id]);

  const nowMin = hmToMin(nowHm());

  // Estado del héroe
  let heroState: HeroState = 'idle';
  if (openShift) heroState = 'working';
  else {
    const missedToday = dayShifts.some((s) => s.horaSalida && hmToMin(s.horaSalida) < nowMin);
    const upcomingToday = dayShifts.some((s) => hmToMin(s.horaEntrada) > nowMin);
    if (missedToday && dayShifts.some((s) => !s.horaSalida && hmToMin(s.horaEntrada) < nowMin)) heroState = 'missed';
    else if (upcomingToday) heroState = 'upcoming';
  }

  const stateColor = heroState === 'working' ? '#E8830C' : heroState === 'missed' ? '#E5484D' : heroState === 'upcoming' ? '#30A46C' : '#8B8D98';
  const stateLabel = heroState === 'working' ? t.inicio.trabajando : heroState === 'missed' ? t.semana.noMarcado : heroState === 'upcoming' ? t.semana.proximo : '';

  // Tiempo en vivo del turno abierto
  const liveSecs = openShift ? Math.max(0, Math.floor(Date.now() / 1000) - (() => {
    const d = parseYmd(openShift.fecha);
    d.setHours(Math.floor(hmToMin(openShift.horaEntrada) / 60), hmToMin(openShift.horaEntrada) % 60, 0, 0);
    return Math.floor(d.getTime() / 1000);
  })()) : 0;
  const liveHH = String(Math.floor(liveSecs / 3600)).padStart(2, '0');
  const liveMM = String(Math.floor((liveSecs % 3600) / 60)).padStart(2, '0');
  const liveSS = String(liveSecs % 60).padStart(2, '0');

  const liveNet = (() => {
    if (!openShift || !openJob) return 0;
    const mins = liveSecs / 60;
    const rate = openJob.sueldoHora ?? 0;
    const tax = (openJob.taxPct ?? 0) / 100;
    return ((rate * mins) / 60) * (1 - tax);
  })();

  const upcoming = shifts
    .filter((s) => s.fecha > today || (s.fecha === today && hmToMin(s.horaEntrada) >= nowMin && s.id !== openShift?.id))
    .sort((a, b) => (a.fecha + a.horaEntrada).localeCompare(b.fecha + b.horaEntrada))
    .slice(0, 3);

  const monday = startOfWeek(new Date());
  const inWeek = shifts.filter((s) => weekKey(parseYmd(s.fecha)) === weekKey(monday));
  const totals = calcWeekTotals(inWeek, byId, settings.umbralExtraHrs, settings.multExtra);

  const clockIn = () => {
    const jobId = clockJobId ?? jobs[0]?.id;
    if (!jobId) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addShift({ jobId, fecha: today, horaEntrada: nowHm(), horaSalida: null, breakMin: 0, propinas: 0, bono: 0, notas: '' });
  };
  const clockOut = () => {
    if (openShift) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateShift(openShift.id, { horaSalida: nowHm() });
    }
  };

  const cardBg = darkMode ? DARK_CARD : DARK_CARD;

  return (
    <Screen>
      <Header
        title={`${t.inicio.greeting}${settings.nombreUsuario ? `, ${settings.nombreUsuario.split(' ')[0]}` : ''}`}
        onSettings={() => (nav.navigate as any)('Mas', { screen: 'Settings' })}
      />
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 140 }}>

        {/* HÉROE OSCURO */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={{ borderRadius: 28, marginBottom: SP.md, overflow: 'hidden' }}
        >
        <LinearGradient
          colors={[DARK_CARD_2, DARK_CARD]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 28, padding: SP.xl, overflow: 'hidden', shadowColor: '#8A94A6', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}
        >

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                {t.inicio.netoEstimado} · {t.inicio.estaSemana}
              </Text>
              <TouchableOpacity onPress={togglePrivacy} hitSlop={12} style={{ marginLeft: 8, padding: 4 }}>
                <Icon name={hidden ? 'eyeOff' : 'eye'} size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            {stateLabel !== '' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
                <MotiView
                  from={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 800, loop: true }}
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stateColor, marginRight: 6 }}
                />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{stateLabel}</Text>
              </View>
            )}
          </View>

          {hidden ? (
            <MoneyHidden />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 28, color: 'rgba(255,255,255,0.7)', marginRight: 2 }}>$</Text>
              <AnimatedRollingNumbers
                value={totals.net}
                toFixed={2}
                useGrouping
                textStyle={{ fontFamily: FONT.headBold, fontSize: 44, letterSpacing: -1.5, color: '#fff' }}
              />
            </View>
          )}

          {/* Reloj en vivo */}
          {openShift && (
            <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden', marginTop: SP.md, padding: SP.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                    {openJob?.nombre}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, fontSize: 34, color: '#fff', fontVariant: ['tabular-nums'] }}>
                    {liveHH}:{liveMM}<Text style={{ color: stateColor }}>:{liveSS}</Text>
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                    {t.inicio.netoEstimado}
                  </Text>
                  {hidden ? (
                    <Text style={{ fontFamily: FONT.headBold, fontSize: 22, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>••••</Text>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text style={{ fontFamily: FONT.headBold, fontSize: 14, color: stateColor, marginRight: 1 }}>$</Text>
                      <AnimatedRollingNumbers
                        value={liveNet}
                        toFixed={2}
                        useGrouping
                        textStyle={{ fontFamily: FONT.headBold, fontSize: 22, color: stateColor }}
                      />
                    </View>
                  )}
                </View>
              </View>
            </BlurView>
          )}

          {/* Chips */}
          <View style={{ flexDirection: 'row', gap: SP.sm, marginTop: SP.md }}>
            {[
              { v: `${totals.hours.toFixed(1)}h`, l: t.week.hours, money: false },
              { v: fmtMoney(totals.gross), l: t.inicio.bruto, money: true },
              { v: fmtMoney(totals.gross - totals.net), l: t.inicio.taxes, money: true },
            ].map((c, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: SP.md, alignItems: 'center' }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: '#fff' }} numberOfLines={1} adjustsFontSizeToFit>{c.money && hidden ? '••••' : c.v}</Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{c.l}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
        </MotiView>

        {/* CLOCK */}
        {openShift ? (
          <MotiView from={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ marginBottom: SP.md }}>
            <TouchableOpacity onPress={clockOut} activeOpacity={0.85} style={{ backgroundColor: stateColor, borderRadius: 24, paddingVertical: 18, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: '#fff' }}>{t.today.clockOut}</Text>
            </TouchableOpacity>
          </MotiView>
        ) : (
          <View style={{ marginBottom: SP.md }}>
            {jobs.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SP.sm, marginBottom: SP.sm }}>
                {jobs.map((j) => {
                  const active = (clockJobId ?? jobs[0]?.id) === j.id;
                  return (
                    <TouchableOpacity
                      key={j.id}
                      onPress={() => setClockJobId(j.id)}
                      style={{
                        borderRadius: R.pill, paddingHorizontal: SP.lg, paddingVertical: SP.sm,
                        backgroundColor: active ? j.color : p.surface,
                        borderWidth: 1, borderColor: active ? j.color : p.line,
                      }}
                    >
                      <Text style={{ color: active ? '#fff' : p.text, fontWeight: '700', fontSize: 13 }}>{j.nombre}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <TouchableOpacity
              onPress={clockIn}
              disabled={jobs.length === 0}
              activeOpacity={0.85}
              style={{ backgroundColor: p.primary, borderRadius: 24, paddingVertical: 18, alignItems: 'center', opacity: jobs.length === 0 ? 0.5 : 1 }}
            >
              <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: '#fff' }}>{t.today.clockIn}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Añadir turno */}
        <TouchableOpacity
          onPress={() => { setEditing(null); setFormOpen(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SP.md, marginBottom: SP.sm }}
        >
          <Text style={{ color: p.text2, fontWeight: '700', fontSize: 15 }}>+ {t.today.addShift}</Text>
        </TouchableOpacity>

        {/* Próximos turnos */}
        <Text style={{ fontFamily: FONT.headBold, fontSize: 19, letterSpacing: -0.3, color: p.text, marginBottom: SP.sm }}>
          {t.inicio.proximos}
        </Text>
        {upcoming.length === 0 ? (
          <View style={{ backgroundColor: p.card, borderRadius: 24, borderWidth: 1, borderColor: p.line, padding: SP.xl, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: p.text, marginBottom: 6 }}>{t.inicio.tuSemanaEmpieza}</Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text3, textAlign: 'center', marginBottom: SP.md }}>
              {t.inicio.agregaTrabajos}
            </Text>
            <TouchableOpacity onPress={goJobs} style={{ backgroundColor: p.surface, borderRadius: R.pill, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderWidth: 1, borderColor: p.line }}>
              <Text style={{ fontWeight: '700', color: p.text }}>+ {t.tabs.jobs}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcoming.map((s, idx) => {
            const job = byId[s.jobId];
            const estNames = (s.estacionIds ?? []).map((id) => job?.estaciones.find((e) => e.id === id)?.nombre).filter(Boolean);
            const d = parseYmd(s.fecha);
            const isToday = s.fecha === today;
            return (
              <MotiView key={s.id} from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: idx * 80 }}>
                <TouchableOpacity onPress={goWeek} activeOpacity={0.7}>
                  <View style={{ backgroundColor: p.card, borderRadius: 20, borderWidth: 1, borderColor: p.line, padding: SP.lg, marginBottom: SP.sm, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ alignItems: 'center', marginRight: SP.lg, minWidth: 52 }}>
                      <Text style={{ fontFamily: FONT.headBold, fontSize: 28, color: isToday ? p.primary : p.text }}>{d.getDate()}</Text>
                      <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3 }}>{t.week.days[(d.getDay() + 6) % 7]}</Text>
                    </View>
                    <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: p.line, marginRight: SP.lg }} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: job?.color ?? p.primary, marginRight: 6 }} />
                        <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.text }} numberOfLines={1}>{job?.nombre}</Text>
                      </View>
                      <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text2, marginTop: 4 }}>
                        {hmTo12h(s.horaEntrada, esFmt)} – {s.horaSalida ? hmTo12h(s.horaSalida, esFmt) : '…'}
                      </Text>
                      {!!estNames.length && <Text style={{ fontSize: 13, color: p.text3, marginTop: 2 }}>{estNames.join(', ')}</Text>}
                    </View>
                    {isToday && (
                      <View style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: '#fff', fontFamily: FONT.mono, fontSize: 10, fontWeight: '700' }}>{t.inicio.hoy.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </MotiView>
            );
          })
        )}
      </ScrollView>

      <ShiftDetailSheet shift={detailShift} onClose={() => setDetailShift(null)} onEdit={(s) => { setEditing(s); setFormOpen(true); }} />
      <ShiftForm visible={formOpen} onClose={() => setFormOpen(false)} editing={editing} defaultDate={today} />
      <Confirm
        visible={confirmId !== null}
        message={t.today.confirmDelete}
        yesLabel={t.today.delete}
        noLabel={t.today.cancel}
        onYes={() => { if (confirmId) deleteShift(confirmId); setConfirmId(null); }}
        onNo={() => setConfirmId(null)}
      />
    </Screen>
  );
}
