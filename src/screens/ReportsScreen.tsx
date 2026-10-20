/** Reportes por semana/mes/año + exportar PDF/CSV. */
import React, { useState } from 'react';
import {  View, Text, ScrollView } from 'react-native';
import { ContentSheet,  Screen, Card, Btn, Label, Seg, TopBar, useTheme, useT } from '../components/ui';
import { useNavigation } from '@react-navigation/native';
import { useStore, jobsById } from '../store';
import { SP, FONT } from '../theme/tokens';
import { startOfWeek, addDays, weekKey, parseYmd, ymd, shortDate } from '../lib/dates';
import { fmtMoney, fmtHours, onlyWorked } from '../lib/calc';
import { buildReport, reportToCsv, shareCsv, sharePdf } from '../services/export';

type Mode = 'week' | 'month' | 'year';

export function ReportsScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const jobs = useStore((s) => s.jobs);
  const shifts = useStore((s) => s.shifts);
  const settings = useStore((s) => s.settings);

  const [mode, setMode] = useState<Mode>('week');
  const [offset, setOffset] = useState(0);

  const now = new Date();
  let list = shifts;
  let title = '';
  if (mode === 'week') {
    const mon = addDays(startOfWeek(now), offset * 7);
    const key = weekKey(mon);
    list = shifts.filter((s) => weekKey(parseYmd(s.fecha)) === key);
    title = `${t.reports.week} ${shortDate(ymd(mon), t.months)}`;
  } else if (mode === 'month') {
    const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    list = shifts.filter((s) => {
      const d = parseYmd(s.fecha);
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    });
    title = `${t.months[ref.getMonth()]} ${ref.getFullYear()}`;
  } else {
    const yr = now.getFullYear() + offset;
    list = shifts.filter((s) => parseYmd(s.fecha).getFullYear() === yr);
    title = `${t.reports.year} ${yr}`;
  }

  // Reportes: SOLO turnos trabajados (criterio global de la app).
  const { totals, rows } = buildReport(onlyWorked(list), jobs, settings);
  const byId = jobsById(jobs);

  return (
    <Screen banded>
      <TopBar onDark title={t.reports.title} onBack={() => nav.goBack()} />
      <ContentSheet>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <Seg<Mode>
          options={[
            { value: 'week', label: t.reports.week },
            { value: 'month', label: t.reports.month },
            { value: 'year', label: t.reports.year },
          ]}
          value={mode}
          onChange={(v) => { setMode(v); setOffset(0); }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: SP.md }}>
          <Text onPress={() => setOffset((o) => o - 1)} style={{ fontSize: 24, color: p.primary, padding: 8 }}>‹</Text>
          <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.text }}>{title}</Text>
          <Text onPress={() => setOffset((o) => o + 1)} style={{ fontSize: 24, color: p.primary, padding: 8 }}>›</Text>
        </View>

        <Card style={{ marginBottom: SP.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[
              [t.reports.hours, fmtHours(totals.hours)],
              [t.reports.gross, fmtMoney(totals.gross)],
              [t.reports.net, fmtMoney(totals.net)],
            ].map(([l, v]) => (
              <View key={l as string}>
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3 }}>{l}</Text>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 20, color: p.text }}>{v}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Label>{t.reports.byJob}</Label>
        {rows.map((r) => (
          <Card key={r.job.id} style={{ marginBottom: SP.sm, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: r.job.color, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: p.text }}>{r.job.nombre}</Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2 }}>{fmtHours(r.hours)}</Text>
            </View>
            <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.text }}>{fmtMoney(r.net)}</Text>
          </Card>
        ))}
        {rows.length === 0 && (
          <Text style={{ color: p.text3, fontFamily: FONT.mono, fontSize: 13 }}>{t.earnings.noData}</Text>
        )}

        <View style={{ flexDirection: 'row', gap: SP.md, marginTop: SP.lg }}>
          <View style={{ flex: 1 }}>
            <Btn title={t.reports.exportPdf} kind="ghost" onPress={() => sharePdf(title, rows, totals, list, byId)} />
          </View>
          <View style={{ flex: 1 }}>
            <Btn
              title={t.reports.exportCsv}
              kind="ghost"
              onPress={() => shareCsv(reportToCsv(title, rows, totals), `turniq-${title.replace(/\s+/g, '-').toLowerCase()}.csv`)}
            />
          </View>
        </View>
      </ScrollView>
      </ContentSheet>
    </Screen>
  );
}
