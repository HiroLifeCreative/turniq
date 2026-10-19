/** Pestaña Inicio: saludo, clock, próximos turnos (carrusel), resumen, turnos de hoy. */
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

export function HomeScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation<BottomTabNavigationProp<TabsParamList>>();
  const goMas = () =>
    (nav.getParent() as unknown as { navigate: (s: 'Mas') => void } | undefined)?.navigate('Mas');
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

  // Próximos turnos: hoy (pendientes) + futuro, ordenados
  const nowMin = hmToMin(nowHm());
  const upcoming = shifts
    .filter((s) => s.fecha > today || (s.fecha === today && hmToMin(s.horaEntrada) >= nowMin))
    .sort((a, b) => (a.fecha + a.horaEntrada).localeCompare(b.fecha + b.horaEntrada))
    .slice(0, 8);

  // Resumen semanal
  const monday = startOfWeek(new Date());
  const inWeek = shifts.filter((s) => weekKey(parseYmd(s.fecha)) === weekKey(monday));
  const totals = calcWeekTotals(inWeek, byId, settings.umbralExtraHrs, settings.multExtra);
  const weekLabel = `${shortDate(ymd(monday), t.months)} – ${shortDate(ymd(addDays(monday, 6)), t.months)}`;

  const clockIn = () => {
    const jobId = clockJobId ?? jobs[0]?.id;
    if (!jobId) return;
    addShift({ jobId, fecha: today, horaEntrada: nowHm(), horaSalida: null, breakMin: 0, propinas: 0, bono: 0, notas: '' });
  };
  const clockOut = () => {
    if (openShift) updateShift(openShift.id, { horaSalida: nowHm() });
  };

  const dayBadge = (fecha: string) => {
    const d = parseYmd(fecha);
    const isToday = fecha === today;
    const isTomorrow = fecha === ymd(addDays(parseYmd(today), 1));
    return { num: d.getDate(), dow: t.week.days[(d.getDay() + 6) % 7] ?? '', isToday, isTomorrow };
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        {/* Saludo + ajustes */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md }}>
          <Text style={{ fontFamily: FONT.headBold, fontSize: 30, letterSpacing: -0.8, color: p.text }}>
            {t.inicio.greeting}{settings.nombreUsuario ? `, ${settings.nombreUsuario}` : ''}
          </Text>
          <TouchableOpacity
            onPress={goMas}
            style={{
              width: 44, height: 44, borderRadius: 22, backgroundColor: p.surface,
              borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20, color: p.text2 }}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Clock */}
        <Card style={{ alignItems: 'center', paddingVertical: SP.xl, marginBottom: SP.lg }}>
          {openShift ? (
            <>
              <Label>{t.today.openShift}</Label>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 19, color: p.text, marginBottom: SP.md }}>
                {byId[openShift.jobId]?.nombre} · {t.today.since} {hmTo12h(openShift.horaEntrada, esFmt)}
              </Text>
              <Btn title={t.today.clockOut} onPress={clockOut} arrow />
            </>
          ) : (
            <>
              {jobs.length > 1 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm, marginBottom: SP.md, justifyContent: 'center' }}>
                  {jobs.map((j) => {
                    const active = (clockJobId ?? jobs[0]?.id) === j.id;
                    return (
                      <TouchableOpacity
                        key={j.id}
                        onPress={() => setClockJobId(j.id)}
                        style={{
                          borderRadius: R.pill, paddingHorizontal: SP.lg, paddingVertical: SP.sm,
                          backgroundColor: active ? j.color : p.surface,
                          borderWidth: 1, borderColor: p.line,
                        }}
                      >
                        <Text style={{ color: active ? '#fff' : p.text, fontWeight: '600' }}>{j.nombre}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <Btn title={t.today.clockIn} onPress={clockIn} arrow disabled={jobs.length === 0} style={{ minWidth: 240 }} />
              {jobs.length === 0 && (
                <Text style={{ marginTop: SP.md, color: p.text3, fontFamily: FONT.mono, fontSize: 12 }}>+ {t.more.jobs}</Text>
              )}
            </>
          )}
        </Card>

        {/* Próximos turnos */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.sm }}>
          <Text style={{ fontFamily: FONT.headBold, fontSize: 19, letterSpacing: -0.3, color: p.text }}>{t.inicio.proximos}</Text>
        </View>
        {upcoming.length === 0 ? (
          <Text style={{ color: p.text3, fontFamily: FONT.mono, fontSize: 13, marginBottom: SP.lg }}>{t.inicio.sinProximos}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SP.md, paddingBottom: SP.sm, marginBottom: SP.md }}>
            {upcoming.map((s) => {
              const job = byId[s.jobId];
              const est = job?.estaciones.find((e) => e.id === s.estacionId);
              const b = dayBadge(s.fecha);
              return (
                <View
                  key={s.id}
                  style={{
                    width: 300, borderRadius: 24, backgroundColor: p.card, padding: SP.lg,
                    flexDirection: 'row', borderWidth: 1, borderColor: p.line,
                  }}
                >
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingRight: SP.lg, borderRightWidth: 1, borderRightColor: p.line }}>
                    {b.isToday && (
                      <View style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 }}>
                        <Text style={{ color: '#fff', fontFamily: FONT.mono, fontSize: 10, fontWeight: '700' }}>
                          {t.inicio.hoy.toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {b.isTomorrow && !b.isToday && (
                      <View style={{ backgroundColor: p.surface, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 6 }}>
                        <Text style={{ color: p.text2, fontFamily: FONT.mono, fontSize: 10, fontWeight: '700' }}>
                          {t.inicio.manana.toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={{ fontFamily: FONT.headBold, fontSize: 34, color: p.text }}>{b.num}</Text>
                    <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3 }}>{b.dow}</Text>
                  </View>
                  <View style={{ flex: 1, paddingLeft: SP.lg, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: job?.color ?? p.primary, marginRight: 6 }} />
                      <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.text }} numberOfLines={2}>{job?.nombre}</Text>
                    </View>
                    <Text style={{ fontFamily: FONT.mono, fontSize: 14, color: p.text2, marginTop: 6 }}>
                      {hmTo12h(s.horaEntrada, esFmt)} - {s.horaSalida ? hmTo12h(s.horaSalida, esFmt) : '…'}
                    </Text>
                    {est && (
                      <View style={{ alignSelf: 'flex-start', backgroundColor: p.surface, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 5, marginTop: 8 }}>
                        <Text style={{ color: p.text2, fontSize: 13, fontWeight: '600' }}>{est.nombre}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Resumen de ganancias */}
        <Text style={{ fontFamily: FONT.headBold, fontSize: 19, letterSpacing: -0.3, color: p.text, marginBottom: 2 }}>{t.inicio.resumen}</Text>
        <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginBottom: SP.sm }}>{weekLabel}</Text>
        <Card style={{ flexDirection: 'row', marginBottom: SP.lg, paddingVertical: SP.xl }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(14,124,62,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: SP.sm }}>
              <Text style={{ fontSize: 20, color: p.success, fontWeight: '800' }}>$</Text>
            </View>
            <Text style={{ fontFamily: FONT.headBold, fontSize: 26, color: p.text }}>{fmtMoney(totals.gross)}</Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1.2, color: p.text3, marginTop: 2 }}>{t.week.gross.toUpperCase()}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: p.line }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,100,224,0.10)', alignItems: 'center', justifyContent: 'center', marginBottom: SP.sm }}>
              <Text style={{ fontSize: 18, color: p.primary, fontWeight: '800' }}>◷</Text>
            </View>
            <Text style={{ fontFamily: FONT.headBold, fontSize: 26, color: p.text }}>{totals.hours.toFixed(2)}h</Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1.2, color: p.text3, marginTop: 2 }}>{t.week.hours.toUpperCase()}</Text>
          </View>
        </Card>

        {/* Turnos de hoy */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.sm }}>
          <Label style={{ marginBottom: 0 }}>{t.inicio.turnosHoy}</Label>
          <TouchableOpacity onPress={() => { setEditing(null); setFormOpen(true); }}>
            <Text style={{ color: p.text2, fontWeight: '700' }}>+ {t.today.addShift}</Text>
          </TouchableOpacity>
        </View>
        {dayShifts.length === 0 && (
          <Text style={{ color: p.text3, fontFamily: FONT.mono, fontSize: 13 }}>{t.today.noShifts}</Text>
        )}
        {dayShifts.map((s) => {
          const job = byId[s.jobId];
          const est = job?.estaciones.find((e) => e.id === s.estacionId);
          return (
            <Card key={s.id} style={{ marginBottom: SP.sm, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, borderRadius: 3, backgroundColor: job?.color ?? p.primary, alignSelf: 'stretch', marginRight: SP.md }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.text }}>
                  {job?.nombre ?? ''}{est ? ` · ${est.nombre}` : ''}
                </Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text2, marginTop: 2 }}>
                  {hmTo12h(s.horaEntrada, esFmt)} – {s.horaSalida ? hmTo12h(s.horaSalida, esFmt) : '…'} · {fmtHours(shiftHours(s))}
                  {s.propinas + s.bono > 0 ? ` · ${fmtMoney(s.propinas + s.bono)}` : ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: SP.md }}>
                <TouchableOpacity onPress={() => { setEditing(s); setFormOpen(true); }}>
                  <Text style={{ color: p.text2, fontWeight: '600' }}>{t.common.edit}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setConfirmId(s.id)}>
                  <Text style={{ color: p.danger, fontWeight: '600' }}>{t.common.delete}</Text>
                </TouchableOpacity>
              </View>
            </Card>
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
