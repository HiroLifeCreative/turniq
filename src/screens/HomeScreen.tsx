/** Pestaña Inicio — héroe oscuro con reloj en vivo, estados por color, todo redondeado. */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedRollingNumbers from 'react-native-animated-rolling-numbers';
import { Screen, Label, Confirm, Header, Icon, Sheet, Card, ContentSheet, useTheme, useT } from '../components/ui';
import { ShiftForm, TimeField } from '../components/ShiftForm';
import { ShiftDetailSheet } from '../components/ShiftDetailSheet';
import { useToast } from '../components/Toast';
import { useStore, jobsById, type Shift } from '../store';
import type { TabsParamList } from '../navigation/types';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import { todayYmd, nowHm, hmToMin, minToHm, hmTo12h, weekKey, parseYmd, startOfWeek, ymd } from '../lib/dates';
import { fmtHours, fmtMoney, calcWeekTotals, workState, isOvernight } from '../lib/calc';
import { MotiView } from 'moti';
import Svg, { Circle } from 'react-native-svg';

const DARK_CARD = '#16181D';
const DARK_CARD_2 = '#1E2128';

type HeroState = 'working' | 'missed' | 'upcoming' | 'idle';

export function HomeScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation<BottomTabNavigationProp<TabsParamList>>();
  const toast = useToast();
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
  const [detailShiftId, setDetailShiftId] = useState<string | null>(null);
  const [clockJobId, setClockJobId] = useState<string | null>(null);
  const [clockSheetOpen, setClockSheetOpen] = useState(false);
  const [editEntryOpen, setEditEntryOpen] = useState(false);
  const [entryDraft, setEntryDraft] = useState('');
  const [, setTick] = useState(0);
  const setSettings = useStore((s) => s.setSettings);

  // Ojito (24 oct 2026, vuelve a pedido de Nelson): oculta/muestra el
  // dinero con •••••, SIN blur y SIN pedir PIN/biometría para mostrar.
  // La trampa de v1.1.7 era justo esa: Mostrar exigía autenticación y
  // si fallaba, el dinero quedaba bloqueado. Ahora el cambio es directo.
  const togglePrivacy = () => {
    setSettings({ dineroOculto: !settings.dineroOculto });
    void Haptics.selectionAsync();
  };
  const hidden = settings.dineroOculto;

  const today = todayYmd();
  const byId = jobsById(jobs);
  const esFmt = settings.idioma === 'es';
  const darkMode = p.bg === '#000000' || settings.dark;

  const dayShifts = shifts
    .filter((s) => s.fecha === today)
    .sort((a, b) => hmToMin(a.horaEntrada) - hmToMin(b.horaEntrada));
  const openShift = dayShifts.find((s) => s.horaEntradaReal && !s.horaSalidaReal);
  const openJob = openShift ? byId[openShift.jobId] : undefined;

  // Tick cada segundo para el reloj en vivo
  useEffect(() => {
    if (!openShift) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [openShift?.id]);

  // Tick lento (30 s) para la cuenta atrás del próximo turno
  useEffect(() => {
    if (openShift) return;
    const id = setInterval(() => setTick((x) => x + 1), 30000);
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

  // Tiempo en vivo del turno abierto (desde hora real marcada)
  const liveSecs = openShift ? Math.max(0, Math.floor(Date.now() / 1000) - (() => {
    const d = parseYmd(openShift.fecha);
    const hm = openShift.horaEntradaReal ?? openShift.horaEntrada;
    d.setHours(Math.floor(hmToMin(hm) / 60), hmToMin(hm) % 60, 0, 0);
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

  // Próximo turno + cuenta atrás (tarjeta recordatorio)
  const nextShift = !openShift ? upcoming[0] : undefined;
  const nextJob = nextShift ? byId[nextShift.jobId] : undefined;
  const countdown = (() => {
    if (!nextShift) return '';
    const d = parseYmd(nextShift.fecha);
    const m = hmToMin(nextShift.horaEntrada);
    d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    const mins = Math.round((d.getTime() - Date.now()) / 60000);
    if (mins <= 1) return null;
    if (mins >= 1440) return `${Math.floor(mins / 1440)} d ${Math.floor((mins % 1440) / 60)} h`;
    if (mins >= 60) return `${Math.floor(mins / 60)} h ${mins % 60} min`;
    return `${mins} min`;
  })();
  const nextDayLabel = nextShift
    ? nextShift.fecha === today
      ? t.inicio.hoy
      : nextShift.fecha === ymd(new Date(Date.now() + 86400000))
        ? t.inicio.manana
        : parseYmd(nextShift.fecha).toLocaleDateString(esFmt ? 'es' : 'en', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';

  const monday = startOfWeek(new Date());
  const inWeek = shifts.filter((s) => weekKey(parseYmd(s.fecha)) === weekKey(monday));
  // El héroe muestra SOLO lo ya trabajado esta semana (no la proyección completa).
  const workedWeek = inWeek.filter((s) => workState(s, new Date()) === 'worked');
  const totals = calcWeekTotals(workedWeek, byId, settings.umbralExtraHrs, settings.multExtra);

  const clockIn = (shiftId: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateShift(shiftId, { horaEntradaReal: nowHm() });
    setClockSheetOpen(false);
    toast.success(t.toast.clockIn);
  };
  const clockOut = () => {
    if (openShift) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateShift(openShift.id, { horaSalidaReal: nowHm() });
      toast.success(t.toast.clockOut);
    }
  };

  // Corregir la hora de entrada EN VIVO: marcó en el reloj del
  // trabajo pero olvidó marcar en la app. Al guardar, el anillo, el
  // contador y el neto estimado se recalculan solos (leen del store).
  const openEditEntry = () => {
    if (!openShift) return;
    setEntryDraft(openShift.horaEntradaReal ?? openShift.horaEntrada);
    setEditEntryOpen(true);
  };
  const adjustEntry = (deltaMin: number) => {
    const base = hmToMin(entryDraft);
    if (Number.isNaN(base)) return;
    setEntryDraft(minToHm(((base + deltaMin) % 1440 + 1440) % 1440));
  };
  const saveEntry = () => {
    if (!openShift) return;
    if (Number.isNaN(hmToMin(entryDraft))) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateShift(openShift.id, { horaEntradaReal: entryDraft });
    setEditEntryOpen(false);
    toast.success(t.toast.entryFixed);
  };

  const cardBg = darkMode ? DARK_CARD : DARK_CARD;

  return (
    <Screen banded>
      <Header
        onDark
        title={`${t.inicio.greeting}${settings.nombreUsuario ? `, ${settings.nombreUsuario.split(' ')[0]}` : ''}`}
        onSettings={() => (nav.navigate as any)('Mas', { state: { index: 0, routes: [{ name: 'MasHome' }] } })}
      />
      <ContentSheet>
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
          style={{ borderRadius: 28, padding: SP.xl, overflow: 'hidden', shadowColor: '#6B7A99', shadowOpacity: 0.25, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8 }}
        >

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                {t.inicio.netoTrabajado} · {t.inicio.estaSemana}
              </Text>
              {/* Ojito GRANDE con texto (no el de 24×24 que no se acertaba):
                  toca y el dinero se oculta/muestra al instante, sin PIN. */}
              <TouchableOpacity
                onPress={togglePrivacy}
                style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: R.pill, paddingVertical: 8, paddingHorizontal: 12 }}
              >
                <Icon name={hidden ? 'eyeOff' : 'eye'} size={18} color="rgba(255,255,255,0.85)" />
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginLeft: 6 }}>
                  {hidden ? t.inicio.mostrar : t.inicio.ocultar}
                </Text>
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

          {/* Oculto = ••••• (desde v1.1.10): sin blur, y el ojito lo quita
              al instante sin pedir PIN — así nunca se queda bloqueado. */}
          {hidden ? (
            <Text style={{ fontFamily: FONT.headBold, fontSize: 44, letterSpacing: -1.5, color: '#fff' }}>•••••</Text>
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

          {/* Reloj en vivo con ANILLO de progreso (estilo Focus) */}
          {openShift && (() => {
            const inMin = hmToMin(openShift.horaEntradaReal ?? openShift.horaEntrada);
            let totalSecs = 8 * 3600;
            if (openShift.horaSalida) {
              let outMin = hmToMin(openShift.horaSalida);
              if (outMin <= inMin) outMin += 1440;
              totalSecs = Math.max(60, (outMin - inMin) * 60);
            }
            const pct = Math.max(0, Math.min(1, liveSecs / totalSecs));
            const RING = 96;
            const SW = 8;
            const RR = (RING - SW) / 2;
            const CC = 2 * Math.PI * RR;
            return (
              <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden', marginTop: SP.md, padding: SP.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: RING, height: RING }}>
                    <Svg width={RING} height={RING} style={{ transform: [{ rotate: '-90deg' }] }}>
                      <Circle cx={RING / 2} cy={RING / 2} r={RR} stroke="rgba(255,255,255,0.14)" strokeWidth={SW} fill="none" />
                      <Circle
                        cx={RING / 2}
                        cy={RING / 2}
                        r={RR}
                        stroke="#0392FF"
                        strokeWidth={SW}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${CC * pct} ${CC}`}
                      />
                    </Svg>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: FONT.mono, fontSize: 16, color: '#fff', fontVariant: ['tabular-nums'] }}>
                        {liveHH}:{liveMM}
                      </Text>
                      <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: '#0392FF', fontVariant: ['tabular-nums'] }}>
                        :{liveSS}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, marginLeft: SP.lg }}>
                    <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>
                      {openJob?.nombre} · {t.inicio.enVivo}
                    </Text>
                    <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                      {t.inicio.netoEstimado}
                    </Text>
                    {hidden ? (
                      <Text style={{ fontFamily: FONT.headBold, fontSize: 24, color: stateColor }}>••••</Text>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: stateColor, marginRight: 1 }}>$</Text>
                        <AnimatedRollingNumbers
                          value={liveNet}
                          toFixed={2}
                          useGrouping
                          textStyle={{ fontFamily: FONT.headBold, fontSize: 24, color: stateColor }}
                        />
                      </View>
                    )}
                    {openShift.horaSalida && (
                      <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                        {t.inicio.salidaProg} {hmTo12h(openShift.horaSalida, esFmt)} · {Math.round(pct * 100)}%
                      </Text>
                    )}
                  </View>
                </View>
              </BlurView>
            );
          })()}

          {/* Chips */}
          <View style={{ flexDirection: 'row', gap: SP.sm, marginTop: SP.md }}>
            {[
              { v: `${totals.hours.toFixed(1)}h`, l: t.week.hours, money: false },
              { v: fmtMoney(totals.gross), l: t.inicio.bruto, money: true },
              { v: fmtMoney(totals.gross - totals.net), l: t.inicio.taxes, money: true },
            ].map((c, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: SP.md, alignItems: 'center', overflow: 'hidden' }}>
                {hidden && c.money ? (
                  <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: '#fff' }}>••••</Text>
                ) : (
                  <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: '#fff' }} numberOfLines={1} adjustsFontSizeToFit>{c.v}</Text>
                )}
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{c.l}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
        </MotiView>

        {/* CLOCK */}
        {openShift ? (
          <MotiView from={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ marginBottom: SP.md }}>
            <TouchableOpacity onPress={clockOut} activeOpacity={0.85} style={{ backgroundColor: stateColor, borderRadius: 999, paddingVertical: 18, alignItems: 'center', overflow: 'hidden' }}>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: '#fff' }}>{t.today.clockOut}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openEditEntry}
              activeOpacity={0.7}
              style={{ marginTop: SP.sm, height: 46, borderRadius: 999, borderWidth: 0.5, borderColor: p.line, backgroundColor: p.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Icon name="edit" size={ICON.sm} color={p.text} />
              <Text style={{ fontWeight: '700', fontSize: TYPE.body, color: p.text }}>
                {t.inicio.editEntry} · {hmTo12h(openShift.horaEntradaReal ?? openShift.horaEntrada, esFmt)}
              </Text>
            </TouchableOpacity>
          </MotiView>
        ) : dayShifts.length > 0 ? (
          <View style={{ marginBottom: SP.md }}>
            <TouchableOpacity
              onPress={() => setClockSheetOpen(true)}
              activeOpacity={0.85}
              style={{ backgroundColor: '#0392FF', borderRadius: 999, paddingVertical: 18, alignItems: 'center', overflow: 'hidden' }}
            >
              <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: '#C4E9FF' }}>{t.today.clockIn}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* RECORDATORIO: próximo turno con cuenta atrás */}
        {nextShift && (
          <TouchableOpacity onPress={() => nav.navigate('Semana')} activeOpacity={0.85} style={{ marginBottom: SP.md }}>
            <Card style={{ marginBottom: 0, borderRadius: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(3,146,255,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: SP.md }}>
                  <Icon name="bell" size={ICON.md} color="#0392FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.head, fontWeight: '700', fontSize: 15, color: p.text }} numberOfLines={1}>
                    {countdown ? `${t.inicio.empiezaEn} ${countdown}` : t.inicio.empiezaYa}
                  </Text>
                  <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2, marginTop: 2 }} numberOfLines={1}>
                    {nextJob?.nombre} · {nextDayLabel} · {hmTo12h(nextShift.horaEntrada, esFmt)}
                    {nextShift.horaSalida ? ` – ${hmTo12h(nextShift.horaSalida, esFmt)}` : ''}{isOvernight(nextShift.horaEntrada, nextShift.horaSalida) ? ` ${t.shift.nextDay}` : ''}
                  </Text>
                  {!!nextJob?.pinMarcaje && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                      <Icon name="key" size={13} color={p.text3} />
                      <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2, marginLeft: 5 }}>PIN {nextJob.pinMarcaje}</Text>
                    </View>
                  )}
                </View>
                <Icon name="chevronRight" size={ICON.md} color={p.text3} />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Sheet para elegir turno al marcar entrada */}
        <Sheet visible={clockSheetOpen} onClose={() => setClockSheetOpen(false)} title={t.today.clockIn}>
          {dayShifts
            .filter((s) => !s.horaEntradaReal)
            .sort((a, b) => hmToMin(a.horaEntrada) - hmToMin(b.horaEntrada))
            .map((s) => {
              const job = byId[s.jobId];
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => clockIn(s.id)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SP.md, borderBottomWidth: 0.5, borderBottomColor: p.line }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: job?.color ?? p.primary, marginRight: SP.md }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: p.text }}>
                      {job?.nombre ?? ''} · {hmTo12h(s.horaEntrada, esFmt)} - {s.horaSalida ? hmTo12h(s.horaSalida, esFmt) : '…'}{isOvernight(s.horaEntrada, s.horaSalida) ? ` ${t.shift.nextDay}` : ''}
                    </Text>
                    {!!job?.pinMarcaje && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                        <Icon name="key" size={13} color={p.text3} />
                        <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2, marginLeft: 5 }}>PIN {job.pinMarcaje}</Text>
                      </View>
                    )}
                  </View>
                  <Icon name="chevronRight" size={18} color={p.text3} />
                </TouchableOpacity>
              );
            })}
        </Sheet>

        {/* Corregir la hora de entrada del turno en curso */}
        <Sheet visible={editEntryOpen} onClose={() => setEditEntryOpen(false)} title={t.inicio.editEntry}>
          <TimeField label={t.inicio.realEntry} value={entryDraft} onChange={setEntryDraft} placeholder="--:--" />
          <View style={{ flexDirection: 'row', gap: SP.sm, marginTop: SP.md }}>
            {[-30, -15, -5, 5].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => adjustEntry(d)}
                activeOpacity={0.7}
                style={{ flex: 1, height: 42, borderRadius: R.pill, borderWidth: 0.5, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text }}>{d > 0 ? `+${d}` : `−${Math.abs(d)}`} min</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: TYPE.caption, color: p.text2, marginTop: SP.md, lineHeight: 18 }}>{t.inicio.editEntryHint}</Text>
          <TouchableOpacity
            onPress={saveEntry}
            activeOpacity={0.85}
            style={{ marginTop: SP.lg, marginBottom: SP.md, height: 52, borderRadius: R.pill, backgroundColor: '#0392FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.body, color: '#C4E9FF' }}>{t.common.save}</Text>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </Sheet>

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
                <TouchableOpacity onPress={goWeek} activeOpacity={0.7} style={{ marginBottom: SP.sm, borderRadius: 20, shadowColor: '#6B7A99', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 }}>
                  <LinearGradient
                    colors={p.bg === '#0B0B0C' ? ['#1E1E22', '#17171A'] : ['#FFFFFF', '#F8F9FB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ borderRadius: 20, borderWidth: 0.5, borderColor: p.bg === '#0B0B0C' ? '#2E2E33' : '#EDEFF2', padding: SP.lg, flexDirection: 'row', alignItems: 'center' }}
                  >
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
                        {hmTo12h(s.horaEntrada, esFmt)} – {s.horaSalida ? hmTo12h(s.horaSalida, esFmt) : '…'}{isOvernight(s.horaEntrada, s.horaSalida) ? ` ${t.shift.nextDay}` : ''}
                      </Text>
                      {!!estNames.length && <Text style={{ fontSize: 13, color: p.text3, marginTop: 2 }}>{estNames.join(', ')}</Text>}
                    </View>
                    {isToday && (
                      <View style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: '#fff', fontFamily: FONT.mono, fontSize: 10, fontWeight: '700' }}>{t.inicio.hoy.toUpperCase()}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </MotiView>
            );
          })
        )}
      </ScrollView>
      </ContentSheet>

      <ShiftDetailSheet shiftId={detailShiftId} onClose={() => setDetailShiftId(null)} onEdit={(s) => { setEditing(s); setFormOpen(true); }} />
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
