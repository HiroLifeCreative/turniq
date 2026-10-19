/** Pestaña Inicio — rediseño bento: héroe compacto, mosaico 2x2, turnos de hoy. */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Screen, Card, Btn, Label, Confirm, useTheme, useT } from '../components/ui';
import { ShiftForm } from '../components/ShiftForm';
import { useStore, jobsById, type Shift } from '../store';
import type { TabsParamList } from '../navigation/types';
import { SP, R, FONT } from '../theme/tokens';
import { todayYmd, nowHm, hmToMin, hmTo12h, weekKey, parseYmd, startOfWeek, addDays, ymd, shortDate } from '../lib/dates';
import { shiftHours, fmtHours, fmtMoney, calcWeekTotals } from '../lib/calc';

/** Mini tarjeta del bento. */
function Bento({
  label, value, sub, onPress, accent,
}: {
  label: string; value: string; sub?: string; onPress?: () => void; accent?: string;
}) {
  const p = useTheme();
  const inner = (
    <View style={{ flex: 1, backgroundColor: p.card, borderRadius: R.lg, borderWidth: 1, borderColor: p.line, padding: SP.lg, justifyContent: 'space-between', minHeight: 118 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {accent && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />}
        <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.4, color: p.text3 }}>{label.toUpperCase()}</Text>
      </View>
      <View>
        <Text style={{ fontFamily: FONT.headBold, fontSize: 30, letterSpacing: -0.8, color: p.text }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {!!sub && <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: 2 }} numberOfLines={1}>{sub}</Text>}
      </View>
    </View>
  );
  if (!onPress) return inner;
  return <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>;
}

export function HomeScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation<BottomTabNavigationProp<TabsParamList>>();
  const goWeek = () => nav.navigate('Semana' as never);
  const jobs = useStore((s) => s.jobs);
  const shifts = useStore((s) => s.shifts);
  const settings = useStore((s) => s.settings);
  const addShift = useStore((s) => s.addShift);
  const updateShift = useStore((s) => s.updateShift);
  const deleteShift = useStore((s) => s.deleteShift);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [clockJobId, setClockJobId] = useState<string | null>(null);

  const today = todayYmd();
  const byId = jobsById(jobs);
  const esFmt = settings.idioma === 'es';

  const dayShifts = shifts
    .filter((s) => s.fecha === today)
    .sort((a, b) => hmToMin(a.horaEntrada) - hmToMin(b.horaEntrada));
  const openShift = dayShifts.find((s) => !s.horaSalida);

  const nowMin = hmToMin(nowHm());
  const nextShift = shifts
    .filter((s) => s.fecha > today || (s.fecha === today && hmToMin(s.horaEntrada) >= nowMin && s.id !== openShift?.id))
    .sort((a, b) => (a.fecha + a.horaEntrada).localeCompare(b.fecha + b.horaEntrada))[0];

  const monday = startOfWeek(new Date());
  const inWeek = shifts.filter((s) => weekKey(parseYmd(s.fecha)) === weekKey(monday));
  const totals = calcWeekTotals(inWeek, byId, settings.umbralExtraHrs, settings.multExtra);

  const goal = settings.metaSemanal ?? 0;
  const goalPct = goal > 0 ? Math.min(1, totals.gross / goal) : 0;

  const clockIn = () => {
    const jobId = clockJobId ?? jobs[0]?.id;
    if (!jobId) return;
    addShift({ jobId, fecha: today, horaEntrada: nowHm(), horaSalida: null, breakMin: 0, propinas: 0, bono: 0, notas: '' });
  };
  const clockOut = () => {
    if (openShift) updateShift(openShift.id, { horaSalida: nowHm() });
  };

  const nextJob = nextShift ? byId[nextShift.jobId] : undefined;
  const nextEst = nextShift && nextJob ? nextJob.estaciones.find((e) => e.id === nextShift.estacionId) : undefined;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 140 }}>
        {/* Héroe: saludo + fecha */}
        <View style={{ marginBottom: SP.md }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1.6, color: p.text3 }}>
            {shortDate(today, t.months).toUpperCase()}
          </Text>
          <Text style={{ fontFamily: FONT.headBold, fontSize: 32, letterSpacing: -0.8, color: p.text, marginTop: 2 }}>
            {t.inicio.greeting}{settings.nombreUsuario ? `, ${settings.nombreUsuario.split(' ')[0]}` : ''}
          </Text>
        </View>

        {/* Héroe clock: turno abierto o botón grande */}
        {openShift ? (
          <View style={{ backgroundColor: p.primary, borderRadius: R.xl, padding: SP.xl, marginBottom: SP.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SP.sm }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1.4, color: 'rgba(255,255,255,0.85)' }}>
                {t.today.openShift.toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.headBold, fontSize: 22, color: '#fff', marginBottom: 2 }}>
              {byId[openShift.jobId]?.nombre}
            </Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: SP.lg }}>
              {t.today.since} {hmTo12h(openShift.horaEntrada, esFmt)}
            </Text>
            <TouchableOpacity
              onPress={clockOut}
              style={{ backgroundColor: '#fff', borderRadius: R.pill, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.primary }}>{t.today.clockOut} →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ backgroundColor: p.card, borderRadius: R.xl, borderWidth: 1, borderColor: p.line, padding: SP.xl, marginBottom: SP.md, alignItems: 'center' }}>
            {jobs.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SP.sm, marginBottom: SP.md }}>
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
              style={{
                backgroundColor: p.primary, borderRadius: R.pill, paddingVertical: 16, paddingHorizontal: 32,
                minWidth: 220, alignItems: 'center', opacity: jobs.length === 0 ? 0.5 : 1,
              }}
            >
              <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: '#fff' }}>{t.today.clockIn} →</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: SP.sm }}>{nowHm()} · {t.today.tapToStart}</Text>
          </View>
        )}

        {/* Bento 2x2 */}
        <View style={{ flexDirection: 'row', gap: SP.md, marginBottom: SP.md }}>
          <Bento label={t.week.gross} value={fmtMoney(totals.gross)} sub={t.inicio.estaSemana} onPress={goWeek} />
          <Bento label={t.week.hours} value={`${totals.hours.toFixed(1)}h`} sub={fmtHours(totals.hours)} onPress={goWeek} />
        </View>
        <View style={{ flexDirection: 'row', gap: SP.md, marginBottom: SP.lg }}>
          {/* Meta semanal con barra */}
          <View style={{ flex: 1, backgroundColor: p.card, borderRadius: R.lg, borderWidth: 1, borderColor: p.line, padding: SP.lg, justifyContent: 'space-between', minHeight: 118 }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.4, color: p.text3 }}>{t.inicio.meta.toUpperCase()}</Text>
            <View>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 30, letterSpacing: -0.8, color: p.text }}>
                {goal > 0 ? `${Math.round(goalPct * 100)}%` : '—'}
              </Text>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: p.surface, marginTop: 8, overflow: 'hidden' }}>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: p.success, width: `${Math.round(goalPct * 100)}%` }} />
              </View>
              {!!goal && <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: 4 }}>{fmtMoney(totals.gross)} / {fmtMoney(goal)}</Text>}
            </View>
          </View>
          {/* Próximo turno */}
          <TouchableOpacity style={{ flex: 1 }} onPress={goWeek} activeOpacity={0.7}>
            <View style={{ flex: 1, backgroundColor: p.card, borderRadius: R.lg, borderWidth: 1, borderColor: p.line, padding: SP.lg, justifyContent: 'space-between', minHeight: 118 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {nextJob && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: nextJob.color }} />}
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 1.4, color: p.text3 }}>{t.inicio.proximo.toUpperCase()}</Text>
              </View>
              {nextShift && nextJob ? (
                <View>
                  <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: p.text }} numberOfLines={1}>{nextJob.nombre}</Text>
                  <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text2, marginTop: 2 }}>
                    {nextShift.fecha === today ? t.inicio.hoy : shortDate(nextShift.fecha, t.months)} · {hmTo12h(nextShift.horaEntrada, esFmt)}
                  </Text>
                  {!!nextEst && <Text style={{ fontSize: 12, color: p.text3, marginTop: 2 }}>{nextEst.nombre}</Text>}
                </View>
              ) : (
                <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text3 }}>{t.inicio.sinProximos}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Turnos de hoy */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.sm }}>
          <Label style={{ marginBottom: 0 }}>{t.inicio.turnosHoy}</Label>
          <TouchableOpacity onPress={() => { setEditing(null); setFormOpen(true); }}>
            <Text style={{ color: p.primary, fontWeight: '700', fontSize: 14 }}>+ {t.today.addShift}</Text>
          </TouchableOpacity>
        </View>
        {dayShifts.length === 0 && (
          <View style={{ backgroundColor: p.surface, borderRadius: R.lg, padding: SP.xl, alignItems: 'center', marginBottom: SP.md }}>
            <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text3 }}>{t.today.noShifts}</Text>
          </View>
        )}
        {dayShifts.map((s) => {
          const job = byId[s.jobId];
          const est = job?.estaciones.find((e) => e.id === s.estacionId);
          const isOpen = !s.horaSalida;
          return (
            <View key={s.id} style={{ backgroundColor: p.card, borderRadius: R.lg, borderWidth: 1, borderColor: p.line, padding: SP.lg, marginBottom: SP.sm, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, borderRadius: 3, backgroundColor: job?.color ?? p.primary, alignSelf: 'stretch', marginRight: SP.md }} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.text, flex: 1 }} numberOfLines={1}>
                    {job?.nombre ?? ''}
                  </Text>
                  {isOpen && (
                    <View style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Text style={{ color: '#fff', fontFamily: FONT.mono, fontSize: 10, fontWeight: '700' }}>{t.semana.enCurso.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text2, marginTop: 4 }}>
                  {hmTo12h(s.horaEntrada, esFmt)} – {s.horaSalida ? hmTo12h(s.horaSalida, esFmt) : '…'} · {fmtHours(shiftHours(s))}
                </Text>
                {!!est && <Text style={{ fontSize: 13, color: p.text3, marginTop: 2 }}>{est.nombre}</Text>}
              </View>
              <TouchableOpacity onPress={() => { setEditing(s); setFormOpen(true); }} hitSlop={12} style={{ padding: SP.sm }}>
                <Text style={{ color: p.text3, fontSize: 18 }}>✎</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

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
