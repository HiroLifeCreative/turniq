/** CRUD de trabajos + estaciones (bottom sheet). */
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {Screen, H1, Card, Btn, Field, Label, Sheet, ContentSheet, Confirm, useTheme, useT, Header} from '../components/ui';
import { useStore, JOB_COLORS, type Job } from '../store';
import { SP, R, FONT, TYPE } from '../theme/tokens';
import { uid } from '../lib/calc';

export function JobsScreen() {
  const t = useT();
  const nav = useNavigation();
  const p = useTheme();
  const jobs = useStore((s) => s.jobs);
  const addJob = useStore((s) => s.addJob);
  const updateJob = useStore((s) => s.updateJob);
  const deleteJob = useStore((s) => s.deleteJob);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(JOB_COLORS[0]!);
  const [sueldo, setSueldo] = useState('15');
  const [tax, setTax] = useState('0');
  const [estaciones, setEstaciones] = useState<{ id: string; nombre: string }[]>([]);
  const [nuevaEst, setNuevaEst] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editing) {
        setNombre(editing.nombre);
        setColor(editing.color);
        setSueldo(String(editing.sueldoHora));
        setTax(String(editing.taxPct));
        setEstaciones(editing.estaciones);
      } else {
        setNombre('');
        setColor(JOB_COLORS[Math.floor(Math.random() * JOB_COLORS.length)]!);
        setSueldo('15');
        setTax('0');
        setEstaciones([]);
      }
      setNuevaEst('');
    }
  }, [open, editing]);

  const save = () => {
    if (!nombre.trim()) return;
    const data = {
      nombre: nombre.trim(),
      color,
      sueldoHora: Number(sueldo) || 0,
      taxPct: Math.min(100, Math.max(0, Number(tax) || 0)),
      estaciones,
    };
    if (editing) updateJob(editing.id, data);
    else addJob(data);
    setOpen(false);
  };

  return (
    <Screen banded>
      <Header onDark title={t.tabs.jobs} onSettings={() => (nav.navigate as any)('Mas', { screen: 'Settings' })} />
      <ContentSheet>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
        <TouchableOpacity
          onPress={() => { setEditing(null); setOpen(true); }}
          activeOpacity={0.85}
          style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingVertical: 15, alignItems: 'center', marginBottom: SP.md }}
        >
          <Text style={{ color: '#fff', fontFamily: FONT.headBold, fontSize: TYPE.body }}>+ {t.jobs.add}</Text>
        </TouchableOpacity>

        {jobs.map((j) => (
          <Card key={j.id} style={{ marginBottom: SP.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: j.color, marginRight: SP.md }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 17, color: p.text }}>{j.nombre}</Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.text2, marginTop: 2 }}>
                  ${j.sueldoHora}/h · {j.taxPct}% tax
                  {j.estaciones.length > 0 ? ` · ${j.estaciones.map((e) => e.nombre).join(', ')}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setEditing(j); setOpen(true); }} hitSlop={8}>
                <Text style={{ color: p.text2, fontWeight: '600', marginRight: SP.md }}>{t.common.edit}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setConfirmId(j.id)} hitSlop={8}>
                <Text style={{ color: p.danger, fontWeight: '600' }}>{t.common.delete}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
      </ContentSheet>

      <Sheet visible={open} onClose={() => setOpen(false)} title={editing ? t.jobs.edit : t.jobs.add}>
        <Field label={t.jobs.name} value={nombre} onChange={setNombre} />
        <Label>{t.jobs.color}</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm, marginBottom: SP.md }}>
          {JOB_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: p.text,
              }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: SP.md }}>
          <View style={{ flex: 1 }}>
            <Field label={t.jobs.wage} value={sueldo} onChange={setSueldo} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t.jobs.tax} value={tax} onChange={setTax} keyboardType="decimal-pad" />
          </View>
        </View>
        <Label>{t.jobs.stations}</Label>
        {estaciones.map((e) => (
          <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.sm }}>
            <Text style={{ flex: 1, color: p.text, fontSize: 15 }}>{e.nombre}</Text>
            <TouchableOpacity onPress={() => setEstaciones((es) => es.filter((x) => x.id !== e.id))}>
              <Text style={{ color: p.danger }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: SP.sm, marginBottom: SP.md }}>
          <View style={{ flex: 1 }}>
            <Field label={t.jobs.stationName} value={nuevaEst} onChange={setNuevaEst} />
          </View>
          <TouchableOpacity
            onPress={() => {
              if (nuevaEst.trim()) {
                setEstaciones((es) => [...es, { id: uid(), nombre: nuevaEst.trim() }]);
                setNuevaEst('');
              }
            }}
            style={{ backgroundColor: p.surface, borderRadius: R.md, paddingHorizontal: SP.lg, justifyContent: 'center', borderWidth: 1, borderColor: p.line, alignSelf: 'flex-start', marginTop: 26, height: 50 }}
          >
            <Text style={{ color: p.primary, fontWeight: '700' }}>+</Text>
          </TouchableOpacity>
        </View>
        <Btn title={t.jobs.save} onPress={save} arrow disabled={!nombre.trim()} />
      </Sheet>

      <Confirm
        visible={confirmId !== null}
        message={t.jobs.confirmDelete}
        yesLabel={t.common.delete}
        noLabel={t.common.cancel}
        onYes={() => { if (confirmId) deleteJob(confirmId); setConfirmId(null); }}
        onNo={() => setConfirmId(null)}
      />
    </Screen>
  );
}
