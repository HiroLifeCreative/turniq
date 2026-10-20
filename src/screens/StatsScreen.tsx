/** Estadísticas: mejor día, promedios, gráficos con moti. */
import React from 'react';
import {  View, Text, ScrollView, Dimensions } from 'react-native';
import { ContentSheet,  Screen, Card, Label, TopBar, useTheme, useT } from '../components/ui';
import { useStore, jobsById } from '../store';
import { SP, FONT, TYPE, R } from '../theme/tokens';
import { parseYmd } from '../lib/dates';
import { calcWeekTotals, fmtMoney, fmtHours, onlyWorked } from '../lib/calc';
import { MotiView } from 'moti';
import { useNavigation } from '@react-navigation/native';

const W = Dimensions.get('window').width;

export function StatsScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const jobs = useStore((s) => s.jobs);
  const shifts = useStore((s) => s.shifts);
  const settings = useStore((s) => s.settings);
  const byId = jobsById(jobs);
  // TODAS las estadísticas: solo turnos ya trabajados (criterio global de la app).
  const wShifts = onlyWorked(shifts);

  // Por día de semana (0=lunes..6=domingo)
  const byDow = Array.from({ length: 7 }, () => ({ h: 0, n: 0 }));
  for (const s of wShifts) {
    if (s.esLibre) continue;
    const d = parseYmd(s.fecha);
    const dow = (d.getDay() + 6) % 7;
    const one = calcWeekTotals([s], byId, 1e9, 1);
    byDow[dow]!.h += one.hours;
    byDow[dow]!.n += one.net;
  }
  const bestDow = byDow.reduce((bi, cur, i) => (cur.n > byDow[bi]!.n ? i : bi), 0);
  const maxDowN = Math.max(...byDow.map((d) => d.n), 1);

  // Promedios
  const total = calcWeekTotals(wShifts, byId, 1e9, 1);
  const weeks = new Set(wShifts.map((s) => s.fecha.slice(0, 7))).size;
  const avgPerWeek = weeks > 0 ? total.net / weeks : 0;

  // Trabajo con más horas
  const perJobH = new Map<string, number>();
  for (const s of wShifts) {
    const one = calcWeekTotals([s], byId, 1e9, 1);
    perJobH.set(s.jobId, (perJobH.get(s.jobId) ?? 0) + one.hours);
  }
  let topJobId = '';
  let topJobH = 0;
  for (const [jid, h] of perJobH) {
    if (h > topJobH) {
      topJobH = h;
      topJobId = jid;
    }
  }

  // Últimos 6 meses (barras)
  const now = new Date();
  const months: { label: string; net: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const list = wShifts.filter((s) => {
      const d = parseYmd(s.fecha);
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    });
    const m = calcWeekTotals(list, byId, 1e9, 1);
    months.push({ label: (t.months[ref.getMonth()] ?? '').slice(0, 3), net: m.net });
  }
  const maxMonth = Math.max(...months.map((m) => m.net), 1);

  const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <Card style={{ flex: 1, minWidth: '46%' }}>
      <Label>{label}</Label>
      <Text style={{ fontFamily: FONT.headBold, fontSize: 22, letterSpacing: -0.5, color: p.text }}>{value}</Text>
      {sub ? <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text3, marginTop: 4 }}>{sub}</Text> : null}
    </Card>
  );

  return (
    <Screen banded>
      <TopBar onDark title={t.stats.title} onBack={() => nav.goBack()} />
      <ContentSheet>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.md, marginBottom: SP.md }}>
          <Stat label={t.stats.bestDay} value={t.week.daysFull[bestDow] ?? ''} sub={`${fmtMoney(byDow[bestDow]?.n ?? 0)} ${t.stats.total}`} />
          <Stat label={t.stats.avgWeek} value={fmtMoney(avgPerWeek)} sub={`${wShifts.length} ${t.semana.turnos.toLowerCase()}`} />
          <Stat label={t.stats.topJob} value={byId[topJobId]?.nombre ?? '—'} sub={fmtHours(topJobH)} />
          <Stat label={t.stats.avgHour} value={fmtMoney(total.hours > 0 ? total.net / total.hours : 0)} sub={fmtHours(total.hours)} />
        </View>

        {/* Por día de semana */}
        <Label>{t.stats.byDay}</Label>
        <Card style={{ marginBottom: SP.md }}>
          {byDow.map((d, i) => (
            <View key={i} style={{ marginBottom: i < 6 ? SP.sm : 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2, width: 90 }}>
                  {(t.week.days[i] ?? '').toUpperCase()}
                </Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text }}>{fmtMoney(d.n)}</Text>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: p.surface, overflow: 'hidden' }}>
                <MotiView
                  from={{ width: '0%' }}
                  animate={{ width: `${(d.n / maxDowN) * 100}%` }}
                  transition={{ type: 'timing', duration: 700, delay: i * 80 }}
                  style={{ height: 8, borderRadius: 4, backgroundColor: i === bestDow ? p.success : p.primary }}
                />
              </View>
            </View>
          ))}
        </Card>

        {/* Últimos 6 meses */}
        <Label>{t.stats.last6Months}</Label>
        <Card style={{ marginBottom: SP.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160 }}>
            {months.map((m, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 160 }}>
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: p.text3, marginBottom: 4 }}>
                  {m.net > 0 ? `$${Math.round(m.net / 100) / 10}k` : ''}
                </Text>
                <MotiView
                  from={{ height: 0 }}
                  animate={{ height: Math.max(4, (m.net / maxMonth) * 110) }}
                  transition={{ type: 'spring', delay: i * 100 }}
                  style={{ width: '60%', borderRadius: 6, backgroundColor: p.primary }}
                />
                <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: p.text2, marginTop: 6 }}>
                  {m.label.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
      </ContentSheet>
    </Screen>
  );
}
