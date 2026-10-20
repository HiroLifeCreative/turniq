/** Calendario mensual — círculos oscuros en días con turnos (estilo referencia),
 *  resumen del mes en tarjeta oscura y detalle del día seleccionado. */
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, TopBar, Card, TintedCard, Icon, Label, useTheme, useT } from '../components/ui';
import { useStore, jobsById } from '../store';
import { SP, FONT, TYPE, ICON } from '../theme/tokens';
import { parseYmd, ymd, hmTo12h, todayYmd } from '../lib/dates';
import { calcWeekTotals, fmtHours, fmtMoney, shiftHours } from '../lib/calc';

export function MonthCalendarScreen() {
  const p = useTheme();
  const t = useT();
  const nav = useNavigation();
  const { jobs, shifts, settings } = useStore();
  const byId = jobsById(jobs);
  const es = settings.idioma === 'es';

  const now = new Date();
  const [monthOff, setMonthOff] = useState(0);
  const [selected, setSelected] = useState<string>(todayYmd());

  const ref = new Date(now.getFullYear(), now.getMonth() + monthOff, 1);
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7; // lunes primero

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthShifts = useMemo(() => shifts.filter((s) => s.fecha.startsWith(monthKey)), [shifts, monthKey]);
  const monthTotals = useMemo(
    () => calcWeekTotals(monthShifts, byId, settings.umbralExtraHrs, settings.multExtra),
    [monthShifts, byId, settings.umbralExtraHrs, settings.multExtra],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, typeof shifts>();
    for (const s of monthShifts) {
      const arr = map.get(s.fecha) ?? [];
      arr.push(s);
      map.set(s.fecha, arr);
    }
    return map;
  }, [monthShifts]);

  const cells: Array<{ key: string; day?: number; date?: string }> = [];
  for (let i = 0; i < firstOffset; i++) cells.push({ key: `b${i}` });
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${monthKey}-${String(d).padStart(2, '0')}`;
    cells.push({ key: ds, day: d, date: ds });
  }
  while (cells.length % 7 !== 0) cells.push({ key: `a${cells.length}` });

  const selShifts = (selected ? byDate.get(selected) : undefined) ?? shifts.filter((s) => s.fecha === selected);
  const selTotals = calcWeekTotals(selShifts, byId, settings.umbralExtraHrs, settings.multExtra);
  const selDate = selected ? parseYmd(selected) : null;
  const today = todayYmd();
  const weekDays = es ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 60 }}>
        <TopBar title={t.calendario.title} onBack={() => nav.goBack()} />

        {/* Resumen del mes (tarjeta oscura) */}
        <TintedCard accent="#0064E0" style={{ marginBottom: SP.md }}>
          <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: 'rgba(255,255,255,0.55)', marginBottom: SP.sm }}>
            {(t.months[month] ?? '').toUpperCase()} {year}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 30, letterSpacing: -0.5, color: '#FFFFFF' }}>
                {fmtMoney(monthTotals.net)}
              </Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                {t.week.net}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 18, color: '#FFFFFF' }}>{fmtHours(monthTotals.hours)}</Text>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                {monthShifts.length} {t.semana.turnos}
              </Text>
            </View>
          </View>
        </TintedCard>

        {/* Navegación del mes */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md }}>
          <TouchableOpacity
            onPress={() => setMonthOff((o) => o - 1)}
            hitSlop={12}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="chevronLeft" size={ICON.lg} color={p.primary} />
          </TouchableOpacity>
          <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.h2, letterSpacing: -0.3, color: p.text }}>
            {t.months[month]} {year}
          </Text>
          <TouchableOpacity
            onPress={() => setMonthOff((o) => o + 1)}
            hitSlop={12}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="chevronRight" size={ICON.lg} color={p.primary} />
          </TouchableOpacity>
        </View>

        {/* Encabezado de días */}
        <View style={{ flexDirection: 'row', marginBottom: SP.sm }}>
          {weekDays.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3 }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Rejilla del mes */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((c) => {
            if (!c.day || !c.date) return <View key={c.key} style={{ width: '14.28%', height: 62 }} />;
            const dayShifts = byDate.get(c.date) ?? [];
            const has = dayShifts.length > 0;
            const isSel = c.date === selected;
            const isToday = c.date === today;
            const hours = dayShifts.reduce((acc, s) => acc + shiftHours(s), 0);
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setSelected(c.date!)}
                activeOpacity={0.8}
                style={{ width: '14.28%', height: 62, alignItems: 'center', justifyContent: 'flex-start' }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSel ? '#0392FF' : has ? '#14161A' : 'transparent',
                    borderWidth: !isSel && !has && isToday ? 1.5 : 0,
                    borderColor: '#0392FF',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONT.head,
                      fontWeight: '700',
                      fontSize: 15,
                      color: isSel || has ? '#FFFFFF' : isToday ? '#0392FF' : p.text,
                    }}
                  >
                    {c.day}
                  </Text>
                </View>
                {has && (
                  <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: p.text3, marginTop: 3 }}>
                    {fmtHours(hours)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Detalle del día seleccionado */}
        <Card style={{ marginTop: SP.md }}>
          <Label>
            {selDate
              ? selDate.toLocaleDateString(es ? 'es' : 'en', { weekday: 'long', day: 'numeric', month: 'long' })
              : ''}
          </Label>
          {selShifts.length === 0 ? (
            <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text3 }}>{t.calendario.sinTurnos}</Text>
          ) : (
            <>
              {selShifts
                .slice()
                .sort((a, b) => a.horaEntrada.localeCompare(b.horaEntrada))
                .map((s) => {
                  const job = byId[s.jobId];
                  return (
                    <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SP.sm }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: job?.color ?? p.primary, marginRight: SP.sm }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONT.head, fontWeight: '700', fontSize: 14, color: p.text }}>
                          {hmTo12h(s.horaEntrada, es)}
                          {s.horaSalida ? ` – ${hmTo12h(s.horaSalida, es)}` : ''}
                        </Text>
                        <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3, marginTop: 1 }}>
                          {job?.nombre ?? ''}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: FONT.headBold, fontSize: 14, color: p.text }}>{fmtHours(shiftHours(s))}</Text>
                    </View>
                  );
                })}
              <View style={{ height: 1, backgroundColor: p.line, marginVertical: SP.sm }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2 }}>{t.calendario.totalDia}</Text>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 15, color: p.success }}>
                  {fmtHours(selTotals.hours)} · {fmtMoney(selTotals.net)}
                </Text>
              </View>
            </>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
