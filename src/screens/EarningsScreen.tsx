/** Pestaña Ganancias: semanal (programadas vs trabajadas), proyección mensual, por trabajo, meta. */
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Screen, Card, TintedCard, Label, ContentSheet, useTheme, useT, Header, Icon } from '../components/ui';
import { MotiView } from 'moti';
import { useStore, jobsById, type Shift } from '../store';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import { startOfWeek, addDays, weekKey, parseYmd, ymd, todayYmd, hmToMin } from '../lib/dates';
import { calcWeekTotals, fmtMoney, fmtHours, shiftHours } from '../lib/calc';

type WorkState = 'worked' | 'scheduled';

function workState(s: Shift, now: Date): WorkState {
  const today = ymd(now);
  if (s.fecha < today) return 'worked';
  if (s.fecha > today) return 'scheduled';
  // Hoy: trabajado solo si marcó entrada real o si ya pasó su hora de salida programada
  if (s.horaEntradaReal) return 'worked';
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (s.horaSalida && nowMin >= hmToMin(s.horaSalida)) return 'worked';
  return 'scheduled';
}

export function EarningsScreen() {
  const t = useT();
  const nav = useNavigation();
  const [weekOff, setWeekOff] = React.useState(0);
  const [monthOff, setMonthOff] = React.useState(0);
  const [yearOff, setYearOff] = React.useState(0);
  const [showYear, setShowYear] = React.useState(false);
  const p = useTheme();
  const jobs = useStore((s) => s.jobs);
  const shifts = useStore((s) => s.shifts);
  const settings = useStore((s) => s.settings);
  const byId = jobsById(jobs);
  const now = new Date();

  // ── Semana seleccionada ──
  const thisMon = addDays(startOfWeek(now), weekOff * 7);
  const lastMon = addDays(thisMon, -7);
  const wk = (mon: Date) => weekKey(mon);
  const inWk = (mon: Date) => shifts.filter((s) => weekKey(parseYmd(s.fecha)) === wk(mon));
  const weekShifts = inWk(thisMon);

  const workedShifts = weekShifts.filter((s) => workState(s, now) === 'worked');
  const scheduledShifts = weekShifts.filter((s) => workState(s, now) === 'scheduled');
  const worked = calcWeekTotals(workedShifts, byId, settings.umbralExtraHrs, settings.multExtra);
  const scheduled = calcWeekTotals(scheduledShifts, byId, settings.umbralExtraHrs, settings.multExtra);
  const cur = calcWeekTotals(weekShifts, byId, settings.umbralExtraHrs, settings.multExtra);

  const prev = calcWeekTotals(inWk(lastMon), byId, settings.umbralExtraHrs, settings.multExtra);
  const pct = prev.net > 0 ? ((cur.net - prev.net) / prev.net) * 100 : cur.net > 0 ? 100 : 0;

  // ── Mes seleccionado (proyección) ──
  const refMonth = new Date(now.getFullYear(), now.getMonth() + monthOff, 1);
  const monthShifts = shifts.filter((s) => {
    const d = parseYmd(s.fecha);
    return d.getFullYear() === refMonth.getFullYear() && d.getMonth() === refMonth.getMonth();
  });
  const month = calcWeekTotals(monthShifts, byId, 1e9, 1);
  const monthName = t.months[refMonth.getMonth()] ?? '';
  const isCurrentMonth = monthOff === 0;

  // ── Año seleccionado ──
  const refYear = now.getFullYear() + yearOff;
  const yearMonths: { label: string; net: number; gross: number; hours: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const list = shifts.filter((s) => {
      const d = parseYmd(s.fecha);
      return d.getFullYear() === refYear && d.getMonth() === m;
    });
    const ym = calcWeekTotals(list, byId, 1e9, 1);
    yearMonths.push({ label: (t.months[m] ?? '').slice(0, 3), net: ym.net, gross: ym.gross, hours: ym.hours });
  }
  const yearTotal = yearMonths.reduce((a, m) => ({ net: a.net + m.net, gross: a.gross + m.gross, hours: a.hours + m.hours }), { net: 0, gross: 0, hours: 0 });
  const maxYearNet = Math.max(...yearMonths.map((m) => m.net), 1);

  // Por trabajo (semana seleccionada)
  const perJob = new Map<string, { h: number; g: number; n: number }>();
  for (const s of weekShifts) {
    const one = calcWeekTotals([s], byId, 1e9, 1);
    const e = perJob.get(s.jobId) ?? { h: 0, g: 0, n: 0 };
    e.h += one.hours;
    e.g += one.gross;
    e.n += one.net;
    perJob.set(s.jobId, e);
  }

  const perHour = cur.hours > 0 ? cur.net / cur.hours : 0;
  const goalPct = settings.metaSemanal > 0 ? Math.min(100, (cur.net / settings.metaSemanal) * 100) : 0;

  const Stat = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
    <Card style={{ flex: 1, minWidth: '46%' }}>
      <Label>{label}</Label>
      <Text style={{ fontFamily: FONT.headBold, fontSize: 24, letterSpacing: -0.5, color: color ?? p.text }}>{value}</Text>
      {sub ? <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: 4 }}>{sub}</Text> : null}
    </Card>
  );

  const NavArrows = ({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) => (
    <View style={{ flexDirection: 'row', gap: SP.sm }}>
      <TouchableOpacity onPress={onPrev} hitSlop={12} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevronLeft" size={ICON.lg} color={p.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onNext} hitSlop={12} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevronRight" size={ICON.lg} color={p.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen banded>
      <Header onDark title={t.tabs.earnings} onSettings={() => (nav.navigate as any)('Mas', { screen: 'Settings' })} />
      <ContentSheet>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>

        {/* ── SEMANA ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md }}>
          <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.h2, letterSpacing: -0.3, color: p.text }}>
            {t.earnings.perWeek}
          </Text>
          <NavArrows onPrev={() => setWeekOff((o) => o - 1)} onNext={() => setWeekOff((o) => o + 1)} />
        </View>

        {/* Trabajadas vs programadas */}
        <TintedCard accent="#30A46C" style={{ marginBottom: SP.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: SP.md }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: 'rgba(255,255,255,0.55)' }}>{t.earnings.worked.toUpperCase()}</Text>
              <Text
                style={{ fontFamily: FONT.headBold, fontSize: 30, color: '#32C46D', marginTop: 2 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {fmtHours(worked.hours)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: 'rgba(255,255,255,0.55)' }}>{t.week.gross.toUpperCase()}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: '#FFFFFF', marginTop: 2 }}>{fmtMoney(cur.gross)}</Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: 'rgba(255,255,255,0.55)', marginTop: SP.sm }}>{t.week.net.toUpperCase()}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 20, color: '#32C46D', marginTop: 2 }}>{fmtMoney(cur.net)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.14)', marginTop: SP.md }}>
            {cur.hours > 0 && (
              <>
                <MotiView animate={{ width: `${(worked.hours / cur.hours) * 100}%` }} transition={{ type: 'timing', duration: 700 }} style={{ backgroundColor: '#32C46D' }} />
                <MotiView animate={{ width: `${(scheduled.hours / cur.hours) * 100}%` }} transition={{ type: 'timing', duration: 700 }} style={{ backgroundColor: '#5EA9FF' }} />
              </>
            )}
          </View>
          <View style={{ flexDirection: 'row', marginTop: SP.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: 'rgba(255,255,255,0.55)' }}>{t.earnings.scheduled.toUpperCase()}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: '#5EA9FF', marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>{fmtHours(scheduled.hours)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginHorizontal: SP.md }} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: 'rgba(255,255,255,0.55)' }}>{t.earnings.total.toUpperCase()}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: '#FFFFFF', marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>{fmtHours(cur.hours)}</Text>
            </View>
          </View>
        </TintedCard>

        {/* Meta semanal */}
        {settings.mostrarMeta && (
          <Card style={{ marginBottom: SP.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SP.sm }}>
            <Label style={{ marginBottom: 0 }}>{t.earnings.goal}</Label>
            <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2 }}>
              {fmtMoney(cur.net)} {t.earnings.of} {fmtMoney(settings.metaSemanal)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 12,
                  borderRadius: 4,
                  backgroundColor: i < Math.round((goalPct / 100) * 12) ? '#0392FF' : p.surface,
                }}
              />
            ))}
          </View>
          <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2, marginTop: SP.sm }}>
            {Math.round(goalPct)}% {t.earnings.goalDone}
          </Text>
          <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: 2 }}>
            {t.earnings.vsLastWeek}: {pct >= 0 ? '+' : ''}{pct.toFixed(0)}%
          </Text>
          </Card>
        )}

        {/* ── MES (proyección) ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md, marginTop: SP.sm }}>
          <View>
            <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.h2, letterSpacing: -0.3, color: p.text }}>
              {monthName} {refMonth.getFullYear()}
            </Text>
            {!isCurrentMonth && (
              <TouchableOpacity onPress={() => setMonthOff(0)} hitSlop={8}>
                <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: p.primary, marginTop: 2 }}>{t.inicio.hoy.toUpperCase()}</Text>
              </TouchableOpacity>
            )}
          </View>
          <NavArrows onPrev={() => setMonthOff((o) => o - 1)} onNext={() => setMonthOff((o) => o + 1)} />
        </View>

        <TintedCard accent="#0064E0" style={{ marginBottom: SP.md }} delay={60}>
          <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: 'rgba(255,255,255,0.55)', marginBottom: SP.sm }}>{t.earnings.monthProjection.toUpperCase()}</Text>
          <Text style={{ fontFamily: FONT.headBold, fontSize: 34, letterSpacing: -1, color: '#FFFFFF' }}>
            {fmtMoney(month.net)}
          </Text>
          <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
            {t.week.net} · {t.earnings.withTaxes}
          </Text>
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginVertical: SP.md }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: 'rgba(255,255,255,0.55)' }}>{t.week.gross.toUpperCase()}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 20, color: '#F5A623', marginTop: 2 }}>{fmtMoney(month.gross)}</Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{t.earnings.withoutTaxes}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: 'rgba(255,255,255,0.55)' }}>{t.week.hours.toUpperCase()}</Text>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 20, color: '#FFFFFF', marginTop: 2 }}>{fmtHours(month.hours)}</Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{monthShifts.length} {t.semana.turnos.toLowerCase()}</Text>
            </View>
          </View>
        </TintedCard>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.md, marginBottom: SP.md }}>
          <Stat label={t.earnings.perHour} value={fmtMoney(perHour)} sub={t.earnings.recorded} />
          <Stat label={t.earnings.perWeek} value={fmtMoney(cur.net)} sub={`${fmtHours(cur.hours)}`} />
        </View>

        {/* ── AÑO ── */}
        <TouchableOpacity
          onPress={() => setShowYear((v) => !v)}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md, marginTop: SP.sm }}
        >
          <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.h2, letterSpacing: -0.3, color: p.text }}>
            {t.earnings.perYear}
          </Text>
          <Icon name={showYear ? 'chevronDown' : 'chevronRight'} size={ICON.lg} color={p.primary} />
        </TouchableOpacity>

        {showYear && (
          <Card style={{ marginBottom: SP.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md }}>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 20, color: p.text }}>{refYear}</Text>
              <View style={{ flexDirection: 'row', gap: SP.sm }}>
                <TouchableOpacity onPress={() => setYearOff((o) => o - 1)} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="chevronLeft" size={ICON.md} color={p.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setYearOff((o) => o + 1)} hitSlop={12} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="chevronRight" size={ICON.md} color={p.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SP.md }}>
              <View>
                <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: p.text3 }}>{t.week.net.toUpperCase()}</Text>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 24, color: p.text }}>{fmtMoney(yearTotal.net)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: p.text3 }}>{t.week.hours.toUpperCase()}</Text>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 24, color: p.text }}>{fmtHours(yearTotal.hours)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 }}>
              {yearMonths.map((m, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 140 }}>
                  <MotiView
                    from={{ height: 0 }}
                    animate={{ height: Math.max(3, (m.net / maxYearNet) * 100) }}
                    transition={{ type: 'spring', delay: i * 50 }}
                    style={{ width: '65%', borderRadius: 4, backgroundColor: m.net > 0 ? p.primary : p.surface }}
                  />
                  <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: p.text3, marginTop: 4 }}>
                    {m.label.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Por trabajo */}
        <Label>{t.earnings.perJob}</Label>
        {[...perJob.entries()].map(([jobId, e]) => {
          const job = byId[jobId];
          return (
            <Card key={jobId} style={{ marginBottom: SP.sm, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: job?.color ?? p.primary, marginRight: SP.md }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.text }}>{job?.nombre}</Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2 }}>{fmtHours(e.h)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 18, color: p.text }}>{fmtMoney(e.n)}</Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3 }}>{fmtMoney(e.g)} {t.week.gross.toLowerCase()}</Text>
              </View>
            </Card>
          );
        })}
        {perJob.size === 0 && (
          <Text style={{ color: p.text3, fontFamily: FONT.mono, fontSize: 13 }}>{t.earnings.noData}</Text>
        )}

        <View style={{ height: SP.md }} />
        <Card>
          <Label>{t.earnings.recorded}</Label>
          <Text style={{ fontFamily: FONT.headBold, fontSize: 34, letterSpacing: -1, color: p.text }}>
            {fmtMoney(shifts.reduce((a, s) => a + calcWeekTotals([s], byId, 1e9, 1).net, 0))}
          </Text>
          <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: 4 }}>
            {shifts.length} turnos · {fmtHours(shifts.reduce((a, s) => a + calcWeekTotals([s], byId, 1e9, 1).hours, 0))}
          </Text>
        </Card>
      </ScrollView>
      </ContentSheet>
    </Screen>
  );
}
