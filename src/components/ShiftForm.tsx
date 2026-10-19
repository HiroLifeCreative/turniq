/** Bottom sheet para crear/editar un turno. */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Sheet, Field, Label, Btn, Icon, useTheme, useT } from './ui';
import { useStore, type Shift } from '../store';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import { todayYmd, hmTo12h } from '../lib/dates';

/** Campo de hora con picker nativo (respeta 12h/24h del ajuste). */
function TimeField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const p = useTheme();
  const t = useT();
  const formatoHora = useStore((s) => s.settings.formatoHora);
  const [show, setShow] = useState(false);

  const toDate = (hm: string): Date => {
    const d = new Date();
    const m = /^(\d{1,2}):(\d{2})$/.exec(hm);
    if (m) {
      d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    }
    return d;
  };
  const fromDate = (d: Date): string => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };
  const display = value
    ? formatoHora === '12h'
      ? hmTo12h(value, true)
      : value
    : placeholder ?? '--:--';
  // En 12h, resaltar AM/PM con un badge
  const ampm = formatoHora === '12h' && value ? (Number(value.split(':')[0]) >= 12 ? 'PM' : 'AM') : null;

  const onPick = (e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (e.type === 'set' && d) onChange(fromDate(d));
  };

  return (
    <View style={{ flex: 1 }}>
      <Label>{label}</Label>
      <TouchableOpacity
        onPress={() => setShow(true)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: p.surface,
          borderRadius: R.md,
          borderWidth: 1,
          borderColor: p.line,
          paddingHorizontal: SP.lg,
          paddingVertical: SP.md,
        }}
      >
        <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.h2, color: value ? p.text : p.text3 }}>
          {display}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {ampm && (
            <View style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#fff', fontFamily: FONT.mono, fontSize: 11, fontWeight: '700' }}>{ampm}</Text>
            </View>
          )}
          <Icon name="clock" size={ICON.md} color={p.text3} />
        </View>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={toDate(value || '09:00')}
          mode="time"
          is24Hour={formatoHora === '24h'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPick}
        />
      )}
    </View>
  );
}

export function ShiftForm({
  visible,
  onClose,
  editing,
  defaultDate,
}: {
  visible: boolean;
  onClose: () => void;
  editing: Shift | null;
  defaultDate?: string;
}) {
  const t = useT();
  const p = useTheme();
  const jobs = useStore((s) => s.jobs);
  const addShift = useStore((s) => s.addShift);
  const updateShift = useStore((s) => s.updateShift);

  const [jobId, setJobId] = useState('');
  const [estacionId, setEstacionId] = useState<string | undefined>(undefined);
  const [fecha, setFecha] = useState(defaultDate ?? todayYmd());
  const [entrada, setEntrada] = useState('09:00');
  const [salida, setSalida] = useState('');
  const [breakMin, setBreakMin] = useState('0');
  const [propinas, setPropinas] = useState('0');
  const [bono, setBono] = useState('0');
  const [notas, setNotas] = useState('');
  const [esLibre, setEsLibre] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editing) {
        setJobId(editing.jobId);
        setEstacionId(editing.estacionId);
        setFecha(editing.fecha);
        setEntrada(editing.horaEntrada);
        setSalida(editing.horaSalida ?? '');
        setBreakMin(String(editing.breakMin));
        setPropinas(String(editing.propinas));
        setBono(String(editing.bono));
        setNotas(editing.notas);
        setEsLibre(!!editing.esLibre);
      } else {
        setJobId(jobs[0]?.id ?? '');
        setEstacionId(undefined);
        setFecha(defaultDate ?? todayYmd());
        setEntrada('09:00');
        setSalida('');
        setBreakMin('0');
        setPropinas('0');
        setBono('0');
        setNotas('');
        setEsLibre(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const job = jobs.find((j) => j.id === jobId);
  const canSave = (esLibre || jobId !== '') && /^\d{2}:\d{2}$/.test(entrada);

  const save = () => {
    if (!canSave) return;
    const data = {
      jobId: esLibre ? '' : jobId,
      esLibre,
      estacionId,
      fecha,
      horaEntrada: entrada,
      horaSalida: salida.trim() === '' ? null : salida,
      breakMin: Number(breakMin) || 0,
      propinas: Number(propinas) || 0,
      bono: Number(bono) || 0,
      notas: notas.trim(),
    };
    if (editing) updateShift(editing.id, data);
    else addShift(data);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={editing ? t.shift.edit : t.shift.new}>
      <TouchableOpacity
        onPress={() => setEsLibre((v) => !v)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: esLibre ? 'rgba(0,100,224,0.08)' : p.surface,
          borderWidth: 1,
          borderColor: esLibre ? p.primary : p.line,
          borderRadius: 12,
          padding: SP.md,
          marginBottom: SP.md,
        }}
      >
        <Text style={{ fontWeight: '700', fontSize: 15, color: esLibre ? p.primary : p.text }}>
          {t.shift.freeDay}
        </Text>
        <View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: esLibre ? p.primary : p.line, justifyContent: 'center', paddingHorizontal: 3, alignItems: esLibre ? 'flex-end' : 'flex-start' }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' }} />
        </View>
      </TouchableOpacity>
      {!esLibre && <Label>{t.shift.job}</Label>}
      {!esLibre && (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm, marginBottom: SP.md }}>
        {jobs.map((j) => (
          <TouchableOpacity
            key={j.id}
            onPress={() => {
              setJobId(j.id);
              setEstacionId(undefined);
            }}
            style={{
              borderRadius: R.pill,
              paddingHorizontal: SP.lg,
              paddingVertical: SP.sm,
              backgroundColor: j.id === jobId ? j.color : p.surface,
              borderWidth: 1,
              borderColor: j.id === jobId ? j.color : p.line,
            }}
          >
            <Text style={{ color: j.id === jobId ? '#fff' : p.text, fontWeight: '600', fontSize: 14 }}>{j.nombre}</Text>
          </TouchableOpacity>
        ))}
        {jobs.length === 0 && (
          <Text style={{ color: p.text3, fontFamily: FONT.mono, fontSize: 13 }}>—</Text>
        )}
      </View>
      )}

      {job && job.estaciones.length > 0 && (
        <>
          <Label>{t.shift.station}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm, marginBottom: SP.md }}>
            {job.estaciones.map((e) => (
              <TouchableOpacity
                key={e.id}
                onPress={() => setEstacionId(e.id)}
                style={{
                  borderRadius: R.pill,
                  paddingHorizontal: SP.lg,
                  paddingVertical: SP.sm,
                  backgroundColor: e.id === estacionId ? p.text : p.surface,
                  borderWidth: 1,
                  borderColor: p.line,
                }}
              >
                <Text style={{ color: e.id === estacionId ? p.bg : p.text, fontSize: 14 }}>{e.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <View style={{ flexDirection: 'row', gap: SP.md }}>
        <View style={{ flex: 1 }}>
          <Field label={t.shift.date} value={fecha} onChange={setFecha} placeholder="2026-10-19" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t.shift.break} value={breakMin} onChange={setBreakMin} keyboardType="numeric" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: SP.md }}>
        <TimeField label={t.shift.start} value={entrada} onChange={setEntrada} placeholder="09:00" />
        <TimeField label={t.shift.end} value={salida} onChange={setSalida} placeholder="17:00" />
      </View>
      <View style={{ flexDirection: 'row', gap: SP.md }}>
        <View style={{ flex: 1 }}>
          <Field label={t.shift.tips} value={propinas} onChange={setPropinas} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t.shift.bonus} value={bono} onChange={setBono} keyboardType="decimal-pad" />
        </View>
      </View>
      <Field label={t.shift.notes} value={notas} onChange={setNotas} />
      <Btn title={t.shift.save} onPress={save} disabled={!canSave} arrow style={{ marginTop: SP.sm }} />
    </Sheet>
  );
}
