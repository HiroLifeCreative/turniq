/** Pestaña Ganancias: tarjetas, comparativa, meta. */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Screen, H1, Card, Label, useTheme, useT } from '../components/ui';
import { useStore, jobsById } from '../store';
import { SP, FONT } from '../theme/tokens';
import { startOfWeek, addDays, weekKey, parseYmd, ymd } from '../lib/dates';
import { calcWeekTotals, fmtMoney, fmtHours } from '../lib/calc';

export function EarningsScreen() {
  const t = useT();
  const [weekOff, setWeekOff] = React.useState(0);
  const p = useTheme();
  const jobs = useStore((s) => s.jobs);
  const shifts = useStore((s) => s.shifts);
  const settings = useStore((s) => s.settings);
  const byId = jobsById(jobs);

  const thisMon = addDays(startOfWeek(new Date()), weekOff * 7);
  const lastMon = addDays(thisMon, -7);
  const wk = (mon: Date) => weekKey(mon);
  const inWk = (mon: Date) => shifts.filter((s) => weekKey(parseYmd(s.fecha)) === wk(mon));

  const cur = calcWeekTotals(inWk(thisMon), byId, settings.umbralExtraHrs, settings.multExtra);
  const prev = calcWeekTotals(inWk(lastMon), byId, settings.umbralExtraHrs, settings.multExtra);
  const pct = prev.net > 0 ? ((cur.net - prev.net) / prev.net) * 100 : cur.net > 0 ? 100 : 0;

  // Por trabajo (semana actual)
  const perJob = new Map<string, { h: number; g: number; n: number }>();
  for (const s of inWk(thisMon)) {
    const one = calcWeekTotals([s], byId, 1e9, 1);
    const e = perJob.get(s.jobId) ?? { h: 0, g: 0, n: 0 };
    e.h += one.hours;
    e.g += one.gross;
    e.n += one.net;
    perJob.set(s.jobId, e);
  }

  // Por mes (mes actual)
  const now = new Date();
  const monthShifts = shifts.filter((s) => {
    const d = parseYmd(s.fecha);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const month = calcWeekTotals(monthShifts, byId, 1e9, 1);

  const perHour = cur.hours > 0 ? cur.net / cur.hours : 0;
  const goalPct = settings.metaSemanal > 0 ? Math.min(100, (cur.net / settings.metaSemanal) * 100) : 0;

  const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <Card style={{ flex: 1, minWidth: '46%' }}>
      <Label>{label}</Label>
      <Text style={{ fontFamily: FONT.headBold, fontSize: 24, letterSpacing: -0.5, color: p.text }}>{value}</Text>
      {sub ? <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: 4 }}>{sub}</Text> : null}
    </Card>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md }}>
          <H1 style={{ marginBottom: 0 }}>{t.earnings.title}</H1>
          <View style={{ flexDirection: 'row', gap: SP.sm }}>
            <TouchableOpacity onPress={() => setWeekOff((o) => o - 1)} hitSlop={12} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, color: p.primary, fontWeight: '700' }}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setWeekOff((o) => o + 1)} hitSlop={12} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, color: p.primary, fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meta semanal */}
        <Card style={{ marginBottom: SP.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SP.sm }}>
            <Label style={{ marginBottom: 0 }}>{t.earnings.goal}</Label>
            <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2 }}>
              {fmtMoney(cur.net)} {t.earnings.of} {fmtMoney(settings.metaSemanal)}
            </Text>
          </View>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: p.surface, overflow: 'hidden' }}>
            <View style={{ height: 12, borderRadius: 6, width: `${goalPct}%`, backgroundColor: p.primary }} />
          </View>
          <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: SP.sm }}>
            {t.earnings.vsLastWeek}: {pct >= 0 ? '+' : ''}{pct.toFixed(0)}%
          </Text>
        </Card>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.md, marginBottom: SP.md }}>
          <Stat label={t.earnings.perWeek} value={fmtMoney(cur.net)} sub={`${fmtHours(cur.hours)} · ${t.week.gross} ${fmtMoney(cur.gross)}`} />
          <Stat label={t.earnings.perMonth} value={fmtMoney(month.net)} sub={`${fmtHours(month.hours)}`} />
          <Stat label={t.earnings.perHour} value={fmtMoney(perHour)} sub={t.earnings.recorded} />
          <Stat label={t.week.net} value={fmtMoney(cur.net)} sub={`${ymd(thisMon).slice(5)} →`} />
        </View>

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
    </Screen>
  );
}
