/** Bottom sheet para crear/editar un turno. */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sheet, Field, Label, Btn, useTheme, useT } from './ui';
import { useStore, type Shift } from '../store';
import { SP, R, FONT } from '../theme/tokens';
import { todayYmd } from '../lib/dates';

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
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const job = jobs.find((j) => j.id === jobId);
  const canSave = jobId !== '' && /^\d{2}:\d{2}$/.test(entrada);

  const save = () => {
    if (!canSave) return;
    const data = {
      jobId,
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
      <Label>{t.shift.job}</Label>
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
        <View style={{ flex: 1 }}>
          <Field label={t.shift.start} value={entrada} onChange={setEntrada} placeholder="09:00" maxLength={5} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t.shift.end} value={salida} onChange={setSalida} placeholder="17:00" maxLength={5} />
        </View>
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
