/** Pestaña Inicio — flujo Mis Horarios: dinero primero (verde), clock en vivo, próximos turnos. */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Screen, Card, Label, Confirm, Header, Icon, useTheme, useT } from '../components/ui';
import { ShiftForm } from '../components/ShiftForm';
import { ShiftDetailSheet } from '../components/ShiftDetailSheet';
import { useStore, jobsById, type Shift } from '../store';
import type { TabsParamList } from '../navigation/types';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import { todayYmd, nowHm, hmToMin, hmTo12h, weekKey, parseYmd, startOfWeek, addDays, ymd, shortDate } from '../lib/dates';
import { shiftHours, fmtHours, fmtMoney, calcWeekTotals } from '../lib/calc';

/** Chip de dinero: icono + etiqueta + valor. */
function MoneyChip({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const p = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: SP.sm }}>
      <View style={{ marginBottom: 4 }}>
        <Icon name={icon} size={ICON.md} color={color} />
      </View>
      <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.body, color: p.text }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: 0.8, color: p.text3, marginTop: 2 }} numberOfLines={1}>{label.toUpperCase()}</Text>
    </View>
  );
}

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

  const today = todayYmd();
  const byId = jobsById(jobs);
  const esFmt = settings.idioma === 'es';

  const dayShifts = shifts
    .filter((s) => s.fecha === today)
    .sort((a, b) => hmToMin(a.horaEntrada) - hmToMin(b.horaEntrada));
  const openShift = dayShifts.find((s) => !s.horaSalida);
  const openJob = openShift ? byId[openShift.jobId] : undefined;

  // Tick cada 30s para el contador en vivo
  useEffect(() => {
    if (!openShift) return;
    const id = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, [openShift?.id]);

  // Minutos trabajados en el turno abierto + neto estimado en vivo
  const liveInfo = (() => {
    if (!openShift || !openJob) return null;
    const mins = Math.max(0, hmToMin(nowHm()) - hmToMin(openShift.horaEntrada));
    const rate = openJob.sueldoHora ?? 0;
    const tax = (openJob.taxPct ?? 0) / 100;
    const net = ((rate * mins) / 60) * (1 - tax);
    return { mins, net };
  })();

  const nowMin = hmToMin(nowHm());
  const upcoming = shifts
    .filter((s) => s.fecha > today || (s.fecha === today && hmToMin(s.horaEntrada) >= nowMin && s.id !== openShift?.id))
    .sort((a, b) => (a.fecha + a.horaEntrada).localeCompare(b.fecha + b.horaEntrada))
    .slice(0, 3);

  const monday = startOfWeek(new Date());
  const inWeek = shifts.filter((s) => weekKey(parseYmd(s.fecha)) === weekKey(monday));
  const totals = calcWeekTotals(inWeek, byId, settings.umbralExtraHrs, settings.multExtra);
  // Neto estimado = bruto - impuestos configurados (aprox)
  const netEstimate = totals.gross * (1 - 0); // calcWeekTotals ya descuenta si hay impuesto

  const clockIn = () => {
    const jobId = clockJobId ?? jobs[0]?.id;
    if (!jobId) return;
    addShift({ jobId, fecha: today, horaEntrada: nowHm(), horaSalida: null, breakMin: 0, propinas: 0, bono: 0, notas: '' });
  };
  const clockOut = () => {
    if (openShift) updateShift(openShift.id, { horaSalida: nowHm() });
  };

  return (
    <Screen>
      <Header
        title={`${t.inicio.greeting}${settings.nombreUsuario ? `, ${settings.nombreUsuario.split(' ')[0]}` : ''}`}
        onSettings={() => nav.navigate('Mas' as never)}
      />
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 140 }}>

        {/* HÉROE DINERO — estilo Mis Horarios: neto grande en verde */}
        <View style={{ backgroundColor: p.card, borderRadius: 26, borderWidth: 1, borderColor: p.line, padding: SP.xl, marginBottom: SP.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.sm }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center', marginRight: SP.md }}>
              <Icon name="wallet" size={ICON.lg} color={p.success} />
            </View>
            <View>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1.6, color: p.text3 }}>{t.inicio.netoEstimado.toUpperCase()}</Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3 }}>{t.inicio.estaSemana}</Text>
            </View>
          </View>
          <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.display, letterSpacing: -0.8, color: p.success }}>
            {fmtMoney(totals.net)}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: SP.md, borderTopWidth: 1, borderTopColor: p.line, paddingTop: SP.sm }}>
            <MoneyChip icon="clock" label={t.week.hours} value={`${totals.hours.toFixed(1)}h`} color={p.primary} />
            <MoneyChip icon="wallet" label={t.inicio.bruto} value={fmtMoney(totals.gross)} color={p.warning} />
            <MoneyChip icon="edit" label={t.inicio.taxes} value={fmtMoney(totals.gross - totals.net)} color={p.danger} />
          </View>
        </View>

        {/* CLOCK — en vivo si hay turno abierto */}
        {openShift && openJob ? (
          <View style={{ backgroundColor: p.card, borderRadius: 20, borderWidth: 1, borderColor: p.line, padding: SP.lg, marginBottom: SP.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.sm }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.primary, marginRight: 8 }} />
              <Text style={{ fontFamily: FONT.headBold, fontSize: 18, color: p.text }}>
                {t.today.openShift} · {openJob.nombre}
              </Text>
            </View>
            <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text2, marginBottom: SP.sm }}>
              {t.today.since} {hmTo12h(openShift.horaEntrada, esFmt)}
            </Text>
            {liveInfo && (
              <View style={{ backgroundColor: p.surface, borderRadius: R.md, padding: SP.md, marginBottom: SP.md }}>
                <Text style={{ fontFamily: FONT.mono, fontSize: 14, color: p.text }}>
                  {t.inicio.trabajando} {fmtHours(liveInfo.mins / 60)} · {t.inicio.netoEstimado} {fmtMoney(liveInfo.net)}
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={clockOut} style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: '#fff' }}>{t.today.clockOut} →</Text>
            </TouchableOpacity>
          </View>
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
              style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingVertical: 16, alignItems: 'center', opacity: jobs.length === 0 ? 0.5 : 1 }}
            >
              <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: '#fff' }}>{t.today.clockIn} →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Acción: añadir turno */}
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
          <View style={{ backgroundColor: p.card, borderRadius: R.lg, borderWidth: 1, borderColor: p.line, padding: SP.xl, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: p.text, marginBottom: 6 }}>{t.inicio.tuSemanaEmpieza}</Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text3, textAlign: 'center', marginBottom: SP.md }}>
              {t.inicio.agregaTrabajos}
            </Text>
            <TouchableOpacity onPress={goJobs} style={{ backgroundColor: p.surface, borderRadius: R.pill, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderWidth: 1, borderColor: p.line }}>
              <Text style={{ fontWeight: '700', color: p.text }}>+ {t.tabs.jobs}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcoming.map((s) => {
            const job = byId[s.jobId];
            const est = job?.estaciones.find((e) => e.id === s.estacionId);
            const d = parseYmd(s.fecha);
            const isToday = s.fecha === today;
            return (
              <TouchableOpacity key={s.id} onPress={goWeek} activeOpacity={0.7}>
                <View style={{ backgroundColor: p.card, borderRadius: R.lg, borderWidth: 1, borderColor: p.line, padding: SP.lg, marginBottom: SP.sm, flexDirection: 'row', alignItems: 'center' }}>
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
                    {!!est && <Text style={{ fontSize: 13, color: p.text3, marginTop: 2 }}>{est.nombre}</Text>}
                  </View>
                  {isToday && (
                    <View style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: '#fff', fontFamily: FONT.mono, fontSize: 10, fontWeight: '700' }}>{t.inicio.hoy.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
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
