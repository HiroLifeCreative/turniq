/** Pestaña Semana: estilo referencia SpotOn — columna día, tarjetas con doble formato de horas y estados. */
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {Screen, H1, Card, Btn, Label, Confirm, useTheme, useT, Header, Icon, Sheet} from '../components/ui';
import { MotiView } from 'moti';
import { ShiftForm } from '../components/ShiftForm';
import { ShiftDetailSheet } from '../components/ShiftDetailSheet';
import { useStore, jobsById, type Shift } from '../store';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import {
  startOfWeek, addDays, ymd, weekKey, isWeekLocked, parseYmd, shortDate, hmToMin, hmTo12h, todayYmd,
} from '../lib/dates';
import { calcWeekTotals, shiftHours, fmtMoney, fmtHoursDual } from '../lib/calc';

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

  const inWeek = shifts.filter((s) => weekKey(parseYmd(s.fecha)) === key);
  const totals = calcWeekTotals(inWeek, byId, settings.umbralExtraHrs, settings.multExtra);
  const otPct = settings.umbralExtraHrs > 0 ? Math.min(100, (totals.hours / settings.umbralExtraHrs) * 100) : 0;
  const otLeft = Math.max(0, settings.umbralExtraHrs - totals.hours);

  const doDuplicate = () => {
    const n = duplicateWeek(key);
    if (n > 0) {
      setDupMsg(true);
      setTimeout(() => setDupMsg(false), 2500);
    }
  };

  const statusColor = (st: Status): string =>
    st === 'now' ? '#E8830C' : st === 'missed' ? p.danger : st === 'upcoming' ? p.success : p.text3;
  const statusLabel = (st: Status): string =>
    st === 'now' ? t.semana.enCurso : st === 'missed' ? t.semana.noMarcado : st === 'upcoming' ? t.semana.proximo : t.semana.pasado;

  return (
    <Screen>
      <Header title={t.tabs.week} onSettings={() => (nav.navigate as any)('Mas', { screen: 'Settings' })} />
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
        {settings.umbralExtraHrs > 0 && inWeek.length > 0 && (
          <Card style={{ marginBottom: SP.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SP.sm }}>
              <Label style={{ marginBottom: 0 }}>{t.semana.horaExtra}</Label>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2 }}>
                {fmtHoursDual(totals.hours)} / {fmtHoursDual(settings.umbralExtraHrs)}
              </Text>
            </View>
            <View style={{ height: 12, borderRadius: 6, backgroundColor: p.surface, overflow: 'hidden' }}>
              <MotiView
                animate={{ width: `${otPct}%` }}
                transition={{ type: 'timing', duration: 600 }}
                style={{ height: 12, borderRadius: 6, backgroundColor: totals.overtimeHours > 0 ? '#E8830C' : p.primary }}
              />
            </View>
            <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: SP.sm }}>
              {totals.overtimeHours > 0
                ? `${fmtHoursDual(totals.overtimeHours)} ${t.semana.horaExtraDone}`
                : `${fmtHoursDual(otLeft)} ${t.semana.horaExtraLeft}`}
            </Text>
          </Card>
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
                  const est = job?.estaciones.find((e) => e.id === s.estacionId);
                  const st = shiftStatus(s, now);
                  const h = shiftHours(s);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setDetailShift(s)}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: st === 'past' ? p.surface : p.card,
                        borderRadius: R.lg,
                        borderWidth: st === 'past' ? 1 : 1.5,
                        borderColor: st === 'past' ? p.line : statusColor(st),
                        padding: SP.md,
                        marginBottom: SP.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: p.text }}>
                          {hmTo12h(s.horaEntrada, esFmt)} - {s.horaSalida ? hmTo12h(s.horaSalida, esFmt) : '…'} · {fmtHoursDual(h)}
                        </Text>
                        <Text style={{ fontSize: 13, marginTop: 3, color: statusColor(st), fontWeight: st === 'now' ? '700' : '400' }}>
                          {s.esLibre ? t.shift.freeDay : `${job?.nombre ?? ''}${est ? ` · ${est.nombre}` : ''}`} · {statusLabel(st)}
                        </Text>
                      </View>
                      {!locked && (
                        <TouchableOpacity onPress={() => setMenuShift(s)} hitSlop={10} style={{ padding: 4 }}>
                          <Text style={{ fontSize: 18, color: p.primary, fontWeight: '800', letterSpacing: 1 }}>⋮</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
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
        <Card style={{ marginTop: SP.sm }}>
          <Label>{t.week.total}</Label>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3 }}>{t.week.hours}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 20, color: p.text }}>{fmtHoursDual(totals.hours)}</Text>
            </View>
            <View>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3 }}>{t.week.gross}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 20, color: p.text }}>{fmtMoney(totals.gross)}</Text>
            </View>
            <View>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3 }}>{t.week.net}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 20, color: p.text }}>{fmtMoney(totals.net)}</Text>
            </View>
          </View>
          {totals.overtimeHours > 0 && (
            <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2, marginTop: SP.sm }}>
              +{fmtHoursDual(totals.overtimeHours)} extra ×{settings.multExtra}
            </Text>
          )}
        </Card>

        {!locked && (
          <Btn title={t.week.duplicate} onPress={doDuplicate} kind="ghost" style={{ marginTop: SP.lg }} />
        )}
        {dupMsg && (
          <Text style={{ textAlign: 'center', color: p.success, fontWeight: '600', marginTop: SP.sm }}>
            ✓ {t.week.duplicated}
          </Text>
        )}
      </ScrollView>

      {/* Menú de 3 puntos — sheet fluido con acciones */}
      <Sheet
        visible={menuShift !== null}
        onClose={() => setMenuShift(null)}
        title={menuShift ? `${hmTo12h(menuShift.horaEntrada, esFmt)} – ${menuShift.horaSalida ? hmTo12h(menuShift.horaSalida, esFmt) : '…'}` : ''}
      >
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
        onYes={() => { if (confirmId) deleteShift(confirmId); setConfirmId(null); }}
        onNo={() => setConfirmId(null)}
      />
    </Screen>
  );
}
