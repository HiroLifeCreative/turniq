/** Pestaña Semana: estilo referencia SpotOn — columna día, tarjetas con doble formato de horas y estados. */
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {Screen, H1, Card, TintedCard, Btn, Label, Confirm, useTheme, useT, Header, Icon, Sheet, ContentSheet} from '../components/ui';
import { MotiView } from 'moti';
import { ShiftForm } from '../components/ShiftForm';
import { ShiftDetailSheet } from '../components/ShiftDetailSheet';
import { useToast } from '../components/Toast';
import { SwipeRow } from '../components/SwipeRow';
import { useStore, jobsById, type Shift } from '../store';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import {
  startOfWeek, addDays, ymd, weekKey, isWeekLocked, parseYmd, shortDate, hmToMin, hmTo12h, todayYmd,
} from '../lib/dates';
import { calcWeekTotals, shiftHours, fmtMoney, fmtHours, fmtHoursDual, onlyWorked, isOvernight } from '../lib/calc';

type Status = 'past' | 'upcoming' | 'now' | 'missed';

function shiftStatus(s: Shift, now: Date): Status {
  const today = ymd(now);
  // Sin salida y de un día anterior: nunca se marcó → rojo
  if (!s.horaSalida && s.fecha < today) return 'missed';
  if (s.fecha < today) return 'past';
  if (s.fecha > today) return 'upcoming';
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = hmToMin(s.horaEntrada);
  if (!s.horaSalida) return nowMin < start ? 'upcoming' : 'now';
  const end = hmToMin(s.horaSalida);
  if (nowMin < start) return 'upcoming';
  if (nowMin >= (end < start ? end + 1440 : end)) return 'past';
  return 'now';
}

export function WeekScreen() {
  const t = useT();
  const nav = useNavigation();
  const p = useTheme();
  const toast = useToast();
  const jobs = useStore((s) => s.jobs);
  const shifts = useStore((s) => s.shifts);
  const settings = useStore((s) => s.settings);
  const duplicateWeek = useStore((s) => s.duplicateWeek);
  const duplicateShift = useStore((s) => s.duplicateShift);
  const deleteShift = useStore((s) => s.deleteShift);

  const [offset, setOffset] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [newDate, setNewDate] = useState<string | undefined>(undefined);
  const [menuShift, setMenuShift] = useState<Shift | null>(null);
  const [detailShift, setDetailShift] = useState<Shift | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dupMsg, setDupMsg] = useState(false);

  const esFmt = settings.idioma === 'es';
  const now = new Date();
  const monday = addDays(startOfWeek(now), offset * 7);
  const key = weekKey(monday);
  const locked = isWeekLocked(key);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const byId = jobsById(jobs);
  // Solo para la vista previa web: montar abierta la primera fila de turnos
  const swipeTest =
    Platform.OS === 'web' && typeof localStorage !== 'undefined' && localStorage.getItem('turniq-test-swipe') === '1';
  const firstShiftId = days
    .map((d) => shifts.find((s) => s.fecha === ymd(d)))
    .find(Boolean)?.id;

  const inWeek = shifts.filter((s) => weekKey(parseYmd(s.fecha)) === key);
  // Totales de la semana: SOLO turnos ya trabajados (criterio global de la app).
  const workedInWeek = onlyWorked(inWeek);
  const totals = calcWeekTotals(workedInWeek, byId, settings.umbralExtraHrs, settings.multExtra);
  // Hora extra POR TRABAJO: horas trabajadas de cada empleo por separado.
  const jobOtRows = jobs
    .map((j) => ({
      job: j,
      hours: workedInWeek
        .filter((s) => s.jobId === j.id && !s.esLibre)
        .reduce((a, s) => a + shiftHours(s), 0),
    }))
    .filter((r) => r.hours > 0);

  const doDuplicate = () => {
    const n = duplicateWeek(key);
    if (n > 0) {
      setDupMsg(true);
      setTimeout(() => setDupMsg(false), 2500);
      toast.success(t.toast.weekDuplicated);
    }
  };

  const statusColor = (st: Status): string =>
    st === 'now' ? '#E8830C' : st === 'missed' ? p.danger : st === 'upcoming' ? p.success : p.text3;
  // Fondo tintado + color de acento por estado
  const statusBg = (st: Status): string =>
    st === 'now' ? '#FFF4E5' : st === 'missed' ? '#FDECEA' : st === 'upcoming' ? '#E8F5E9' : p.surface;
  const statusBorder = (st: Status): string =>
    p.bg === '#0B0B0C'
      ? st === 'now' ? '#5A3A1A' : st === 'missed' ? '#5A2A2A' : st === 'upcoming' ? '#2A4A2E' : '#2A2A2E'
      : st === 'now' ? '#FFB74D' : st === 'missed' ? '#F5A5A5' : st === 'upcoming' ? '#A5D6A7' : p.line;
  const statusLabel = (st: Status): string =>
    st === 'now' ? t.semana.enCurso : st === 'missed' ? t.semana.noMarcado : st === 'upcoming' ? t.semana.proximo : t.semana.pasado;

  return (
    <Screen banded>
      <Header onDark title={t.tabs.week} onSettings={() => (nav.navigate as any)('Mas', { state: { index: 1, routes: [{ name: 'MasHome' }, { name: 'Settings' }] } })} />
      <ContentSheet>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md }}>
          <TouchableOpacity
            onPress={() => setOffset((o) => o - 1)}
            hitSlop={12}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="chevronLeft" size={ICON.lg} color={p.primary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.h2, letterSpacing: -0.3, color: p.text }}>
              {shortDate(ymd(days[0]!), t.months)} – {shortDate(ymd(days[6]!), t.months)}
            </Text>
            {offset !== 0 && (
              <TouchableOpacity onPress={() => setOffset(0)} hitSlop={8}>
                <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: p.primary, marginTop: 4 }}>{t.inicio.hoy.toUpperCase()}</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setOffset((o) => o + 1)}
            hitSlop={12}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="chevronRight" size={ICON.lg} color={p.primary} />
          </TouchableOpacity>
        </View>

        {locked && (
          <Card style={{ marginBottom: SP.md, backgroundColor: p.surface }}>
            <Text style={{ fontWeight: '700', color: p.text }}>
              <Text style={{ color: p.primary }}>■ </Text>{t.week.locked}
            </Text>
            <Text style={{ color: p.text2, fontSize: 13, marginTop: 4 }}>{t.week.lockedMsg}</Text>
          </Card>
        )}

        {/* Alerta hora extra */}
        {/* Botón Calendario mensual */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: SP.md }}>
          <TouchableOpacity
            onPress={() => (nav.navigate as any)('MonthCalendar')}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: p.surface,
              borderWidth: 1,
              borderColor: p.line,
              borderRadius: R.pill,
              paddingVertical: 8,
              paddingHorizontal: 14,
            }}
          >
            <Icon name="calendar" size={ICON.sm} color={p.primary} />
            <Text style={{ fontFamily: FONT.head, fontWeight: '700', fontSize: 13, color: p.text }}>{t.calendario.title}</Text>
          </TouchableOpacity>
        </View>

        {settings.mostrarHoraExtra && settings.umbralExtraHrs > 0 && jobOtRows.length > 0 && (
          <TintedCard accent="#E8830C" style={{ marginBottom: SP.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SP.sm }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                {t.semana.horaExtra.toUpperCase()} · {t.semana.porTrabajo.toUpperCase()}
              </Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>×{settings.multExtra}</Text>
            </View>
            {jobOtRows.map((r, i) => {
              const pct = Math.min(100, (r.hours / settings.umbralExtraHrs) * 100);
              const ot = Math.max(0, r.hours - settings.umbralExtraHrs);
              return (
                <View key={r.job.id} style={{ marginTop: i > 0 ? SP.md : 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.job.color, marginRight: 8 }} />
                    <Text style={{ flex: 1, fontFamily: FONT.head, fontWeight: '600', fontSize: 13, color: '#FFFFFF' }} numberOfLines={1}>
                      {r.job.nombre}
                    </Text>
                    <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                      {fmtHoursDual(r.hours)} / {fmtHoursDual(settings.umbralExtraHrs)}
                    </Text>
                    {ot > 0 && (
                      <Text style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: '700', color: '#F5A623', marginLeft: 8 }}>
                        +{fmtHoursDual(ot)}
                      </Text>
                    )}
                  </View>
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
                    <MotiView
                      animate={{ width: `${pct}%` }}
                      transition={{ type: 'timing', duration: 600 }}
                      style={{ height: 10, borderRadius: 5, backgroundColor: ot > 0 ? '#F5A623' : '#5EA9FF' }}
                    />
                  </View>
                </View>
              );
            })}
            {totals.overtimeHours > 0 && (
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: SP.md }}>
                {fmtHoursDual(totals.overtimeHours)} {t.semana.horaExtraDone}
              </Text>
            )}
          </TintedCard>
        )}

        {days.map((d, i) => {
          const dk = ymd(d);
          const ds = shifts
            .filter((s) => s.fecha === dk)
            .sort((a, b) => hmToMin(a.horaEntrada) - hmToMin(b.horaEntrada));
          const dh = ds.reduce((a, s) => a + shiftHours(s), 0);
          const isToday = dk === todayYmd();
          return (
            <View key={dk} style={{ flexDirection: 'row', marginBottom: SP.md }}>
              {/* Columna día */}
              <View style={{ width: 52, alignItems: 'center', paddingTop: 2 }}>
                <Text style={{
                  fontFamily: FONT.headBold, fontSize: 26, color: isToday ? p.primary : p.text3,
                }}>
                  {d.getDate()}
                </Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: isToday ? p.primary : p.text3 }}>
                  {t.week.days[i]?.toUpperCase()}
                </Text>
              </View>
              {/* Contenido del día */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.sm }}>
                  <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2 }}>
                    {ds.length === 1 ? `1 ${t.semana.turno}` : `${ds.length} ${t.semana.turnos}`}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SP.sm }}>
                    <Text style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: '700', color: p.text }}>
                      {fmtHoursDual(dh)}
                    </Text>
                    {!locked && ds.length > 0 && (
                      <TouchableOpacity
                        onPress={() => { setEditing(null); setNewDate(dk); setFormOpen(true); }}
                        hitSlop={10}
                        style={{
                          width: 30, height: 30, borderRadius: 15,
                          backgroundColor: p.surface, borderWidth: 1, borderColor: p.line,
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Icon name="plus" size={ICON.sm} color={p.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {ds.map((s) => {
                  const job = byId[s.jobId];
                  const estNames = (s.estacionIds ?? []).map((id) => job?.estaciones.find((e) => e.id === id)?.nombre).filter(Boolean);
                  const st = shiftStatus(s, now);
                  const h = shiftHours(s);
                  // Detectar si se traslapa con otro turno del mismo día
                  const overlaps = ds.some((o) => {
                    if (o.id === s.id) return false;
                    if (!/^\d{2}:\d{2}$/.test(s.horaEntrada) || !/^\d{2}:\d{2}$/.test(o.horaEntrada)) return false;
                    const toMin = (hm: string) => { const [hh, mm] = hm.split(':').map(Number); return (hh ?? 0) * 60 + (mm ?? 0); };
                    const a1 = toMin(s.horaEntrada);
                    const a2raw = s.horaSalida && /^\d{2}:\d{2}$/.test(s.horaSalida) ? toMin(s.horaSalida) : a1 + 1;
                    const a2 = a2raw <= a1 ? a2raw + 1440 : a2raw;
                    const b1 = toMin(o.horaEntrada);
                    const b2raw = o.horaSalida && /^\d{2}:\d{2}$/.test(o.horaSalida) ? toMin(o.horaSalida) : b1 + 1;
                    const b2 = b2raw <= b1 ? b2raw + 1440 : b2raw;
                    return a1 < b2 && b1 < a2;
                  });
                  const darkMode = p.bg === '#0B0B0C';
                  // Mismo diseño que la tarjeta de recordatorio y las de
                  // Próximos turnos: blanca limpia (sin tinte por estado);
                  // el estado lo cuentan la barra lateral y los textos.
                  const grad: readonly [string, string] = darkMode
                    ? (['#1E1E22', '#17171A'] as const)
                    : (['#FFFFFF', '#F8F9FB'] as const);
                  return (
                    <SwipeRow
                      key={s.id}
                      disabled={locked}
                      labels={{ edit: t.swipe.edit, duplicate: t.swipe.duplicate, delete: t.swipe.delete }}
                      onEdit={() => setDetailShift(s)}
                      onDuplicate={() => {
                        duplicateShift(s.id);
                        toast.success(t.toast.shiftDuplicated);
                      }}
                      onDelete={() => setConfirmId(s.id)}
                      startOpen={swipeTest && s.id === firstShiftId}
                    >
                    <TouchableOpacity
                      onPress={() => setDetailShift(s)}
                      activeOpacity={0.7}
                      style={{
                        borderRadius: 20,
                        shadowColor: '#6B7A99',
                        shadowOpacity: 0.2,
                        shadowRadius: 14,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: 5,
                      }}
                    >
                      <LinearGradient
                        colors={[...grad]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{
                          borderRadius: 20,
                          borderWidth: 0.5,
                          borderColor: p.bg === '#0B0B0C' ? '#2E2E33' : '#EDEFF2',
                          padding: SP.lg,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                      <View style={{ width: 4, borderRadius: 2, alignSelf: 'stretch', backgroundColor: statusColor(st), marginRight: SP.md }} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: p.text }} numberOfLines={1}>
                            {hmTo12h(s.horaEntrada, esFmt)} – {s.horaSalida ? hmTo12h(s.horaSalida, esFmt) : '…'}{isOvernight(s.horaEntrada, s.horaSalida) ? ` ${t.shift.nextDay}` : ''}
                          </Text>
                          <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: statusColor(st), marginLeft: SP.sm }} numberOfLines={1}>
                            {fmtHours(h)}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                          <Text style={{ fontSize: 13, color: p.text2, flex: 1 }} numberOfLines={1}>
                            {s.esLibre ? t.shift.freeDay : `${job?.nombre ?? ''}${estNames.length ? ` · ${estNames.join(', ')}` : ''}`}
                          </Text>
                          <Text style={{ fontSize: 12, color: statusColor(st), fontWeight: '700', marginLeft: SP.sm }}>{statusLabel(st)}</Text>
                        </View>
                        {overlaps && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#FFF3E0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
                            <Text style={{ fontSize: 12, color: '#E65100', fontWeight: '700' }}>⚠️ {t.shift.sameTime}</Text>
                          </View>
                        )}
                      </View>
                      {!locked && (
                        <TouchableOpacity onPress={() => setMenuShift(s)} hitSlop={10} style={{ padding: 4 }}>
                          <Text style={{ fontSize: 18, color: p.primary, fontWeight: '800', letterSpacing: 1 }}>⋮</Text>
                        </TouchableOpacity>
                      )}
                      </LinearGradient>
                    </TouchableOpacity>
                    </SwipeRow>
                  );
                })}
                {!locked && ds.length === 0 && (
                  <TouchableOpacity
                    onPress={() => { setEditing(null); setNewDate(dk); setFormOpen(true); }}
                    style={{
                      borderWidth: 1, borderColor: p.line, borderStyle: 'dashed', borderRadius: R.lg,
                      padding: SP.sm, alignItems: 'center', marginBottom: SP.sm,
                    }}
                  >
                    <Text style={{ color: p.text2, fontWeight: '600' }}>+ {t.today.addShift}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Total semanal */}
        <TintedCard accent="#0064E0" style={{ marginTop: SP.sm }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: SP.sm }}>{t.week.total.toUpperCase()}</Text>
          <View style={{ flexDirection: 'row', gap: SP.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{t.week.hours}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: '#FFFFFF' }} numberOfLines={1} adjustsFontSizeToFit>{fmtHoursDual(totals.hours)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{t.week.gross}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: '#FFFFFF' }} numberOfLines={1} adjustsFontSizeToFit>{fmtMoney(totals.gross)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{t.week.net}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: '#32C46D' }} numberOfLines={1} adjustsFontSizeToFit>{fmtMoney(totals.net)}</Text>
            </View>
          </View>
          {totals.overtimeHours > 0 && (
            <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: SP.sm }}>
              +{fmtHoursDual(totals.overtimeHours)} extra ×{settings.multExtra}
            </Text>
          )}
        </TintedCard>

        {!locked && (
          <Btn title={t.week.duplicate} onPress={doDuplicate} kind="ghost" style={{ marginTop: SP.lg }} />
        )}
        {dupMsg && (
          <Text style={{ textAlign: 'center', color: p.success, fontWeight: '600', marginTop: SP.sm }}>
            ✓ {t.week.duplicated}
          </Text>
        )}
      </ScrollView>
      </ContentSheet>

      {/* Menú de 3 puntos — sheet fluido con acciones */}
      <Sheet
        visible={menuShift !== null}
        onClose={() => setMenuShift(null)}
        title={menuShift ? (() => {
          const job = byId[menuShift.jobId];
          const estList = (menuShift.estacionIds ?? []).map((id) => job?.estaciones.find((e) => e.id === id)?.nombre).filter(Boolean);
          return `${hmTo12h(menuShift.horaEntrada, esFmt)} – ${menuShift.horaSalida ? hmTo12h(menuShift.horaSalida, esFmt) : '…'}${isOvernight(menuShift.horaEntrada, menuShift.horaSalida) ? ` ${t.shift.nextDay}` : ''}`;
        })() : ''}
      >
        {menuShift && (() => {
          const job = byId[menuShift.jobId];
          const estList = (menuShift.estacionIds ?? []).map((id) => job?.estaciones.find((e) => e.id === id)?.nombre).filter(Boolean);
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.md }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: job?.color ?? p.primary, marginRight: 8 }} />
              <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: p.text3 }}>
                {[job?.nombre, estList.join(', ')].filter(Boolean).join(' · ')}
              </Text>
            </View>
          );
        })()}
        {[
          { label: t.common.edit, icon: 'edit', fn: () => { setEditing(menuShift); setNewDate(undefined); setMenuShift(null); setFormOpen(true); } },
          { label: t.semana.duplicarTurno, icon: 'plus', fn: () => { if (menuShift) duplicateShift(menuShift.id); setMenuShift(null); } },
          { label: t.common.delete, icon: 'trash', danger: true, fn: () => { if (menuShift) setConfirmId(menuShift.id); setMenuShift(null); } },
        ].map((o) => (
          <TouchableOpacity
            key={o.label}
            onPress={o.fn}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SP.md, borderTopWidth: 1, borderTopColor: p.line }}
          >
            <Icon name={o.icon} size={ICON.md} color={o.danger ? p.danger : p.text2} />
            <Text style={{ fontSize: TYPE.body, color: o.danger ? p.danger : p.text, fontWeight: '600', marginLeft: SP.md }}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </Sheet>

      {/* Detalle del turno al tocar la tarjeta */}
      <ShiftDetailSheet
        shift={detailShift}
        onClose={() => setDetailShift(null)}
        onEdit={(s) => { setEditing(s); setNewDate(undefined); setDetailShift(null); setFormOpen(true); }}
      />

      <ShiftForm visible={formOpen} onClose={() => setFormOpen(false)} editing={editing} defaultDate={newDate} />
      <Confirm
        visible={confirmId !== null}
        message={t.today.confirmDelete}
        yesLabel={t.today.delete}
        noLabel={t.today.cancel}
        onYes={() => { if (confirmId) { deleteShift(confirmId); toast.success(t.toast.shiftDeleted); } setConfirmId(null); }}
        onNo={() => setConfirmId(null)}
      />
    </Screen>
  );
}
