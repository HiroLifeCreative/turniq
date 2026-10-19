/** Pestaña Semana: estilo referencia SpotOn — columna día, tarjetas con doble formato de horas y estados. */
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import {Screen, H1, Card, Btn, Label, Confirm, useTheme, useT, Header, Icon} from '../components/ui';
import { ShiftForm } from '../components/ShiftForm';
import { useStore, jobsById, type Shift } from '../store';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import {
  startOfWeek, addDays, ymd, weekKey, isWeekLocked, parseYmd, shortDate, hmToMin, hmTo12h, todayYmd,
} from '../lib/dates';
import { calcWeekTotals, shiftHours, fmtMoney, fmtHoursDual } from '../lib/calc';

type Status = 'past' | 'upcoming' | 'now';

function shiftStatus(s: Shift, now: Date): Status {
  const today = ymd(now);
  if (s.fecha < today) return 'past';
  if (s.fecha > today) return 'upcoming';
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = hmToMin(s.horaEntrada);
  if (!s.horaSalida) return 'now';
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

  const doDuplicate = () => {
    const n = duplicateWeek(key);
    if (n > 0) {
      setDupMsg(true);
      setTimeout(() => setDupMsg(false), 2500);
    }
  };

  const statusColor = (st: Status): string => (st === 'now' ? p.primary : st === 'upcoming' ? p.success : p.text3);
  const statusLabel = (st: Status): string => (st === 'now' ? t.semana.enCurso : st === 'upcoming' ? t.semana.proximo : t.semana.pasado);

  return (
    <Screen>
      <Header title={t.tabs.week} onSettings={() => nav.navigate('Mas' as never)} />
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
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, color: isToday ? p.primary : p.text3 }}>
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
                    <View
                      key={s.id}
                      style={{
                        backgroundColor: st === 'now' ? 'rgba(0,100,224,0.07)' : p.card,
                        borderRadius: R.lg,
                        borderWidth: st === 'now' ? 1.5 : 1,
                        borderColor: st === 'now' ? p.primary : p.line,
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
                    </View>
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

      {/* Menú de 3 puntos */}
      <Modal visible={menuShift !== null} transparent animationType="fade" onRequestClose={() => setMenuShift(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setMenuShift(null)}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: p.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SP.xl, paddingBottom: 40 }}>
            <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: p.text, marginBottom: SP.md }}>
              {menuShift ? `${hmTo12h(menuShift.horaEntrada, esFmt)} – ${menuShift.horaSalida ? hmTo12h(menuShift.horaSalida, esFmt) : '…'}` : ''}
            </Text>
            {[
              { label: t.common.edit, fn: () => { setEditing(menuShift); setNewDate(undefined); setMenuShift(null); setFormOpen(true); } },
              { label: t.semana.duplicarTurno, fn: () => { if (menuShift) duplicateShift(menuShift.id); setMenuShift(null); } },
              { label: t.common.delete, danger: true, fn: () => { if (menuShift) setConfirmId(menuShift.id); setMenuShift(null); } },
            ].map((o) => (
              <TouchableOpacity key={o.label} onPress={o.fn} style={{ paddingVertical: SP.md, borderTopWidth: 1, borderTopColor: p.line }}>
                <Text style={{ fontSize: 16, color: o.danger ? p.danger : p.text, fontWeight: '600' }}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
