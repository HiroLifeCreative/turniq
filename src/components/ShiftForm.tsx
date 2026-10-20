/** Bottom sheet para crear/editar un turno. */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Sheet, Field, Label, Btn, Icon, useTheme, useT } from './ui';
import { IosTimePicker, IosDatePicker } from './IosPickers';
import { useStore, type Shift } from '../store';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import { todayYmd, hmTo12h } from '../lib/dates';

/** Campo de hora con picker estilo iOS (respeta 12h/24h del ajuste). */
export function TimeField({
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

  const display = value
    ? formatoHora === '12h'
      ? hmTo12h(value, true)
      : value
    : placeholder ?? '--:--';
  // En 12h, resaltar AM/PM con un badge
  const ampm = formatoHora === '12h' && value ? (Number(value.split(':')[0]) >= 12 ? 'PM' : 'AM') : null;

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
      <IosTimePicker
        visible={show}
        onClose={() => setShow(false)}
        value={value || '09:00'}
        onChange={onChange}
        title={label}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
        is24h={formatoHora === '24h'}
      />
    </View>
  );
}

/** Campo de fecha con picker estilo iOS. */
function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const p = useTheme();
  const t = useT();
  const [show, setShow] = useState(false);

  const display = (() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) return '--/--/----';
    return `${m[3]}/${m[2]}/${m[1]}`;
  })();

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
        <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.h2, color: p.text }}>
          {display}
        </Text>
        <Icon name="calendar" size={ICON.md} color={p.text3} />
      </TouchableOpacity>
      <IosDatePicker
        visible={show}
        onClose={() => setShow(false)}
        value={value}
        onChange={onChange}
        title={label}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
      />
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
  const templates = useStore((s) => s.templates);
  const addTemplate = useStore((s) => s.addTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const addShift = useStore((s) => s.addShift);
  const updateShift = useStore((s) => s.updateShift);

  const [jobId, setJobId] = useState('');
  const [estacionIds, setEstacionIds] = useState<string[]>([]);
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
        setEstacionIds(editing.estacionIds ?? []);
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
        setEstacionIds([]);
        setFecha(defaultDate ?? todayYmd());
        setEntrada('09:00');
        setSalida('');
        setBreakMin('0');
        setPropinas('0');
        setBono('0');
        setNotas('');
        setEsLibre(false);
      }
      setShowOverlap(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const job = jobs.find((j) => j.id === jobId);
  const canSave = (esLibre || jobId !== '') && /^\d{2}:\d{2}$/.test(entrada);
  const shifts = useStore((s) => s.shifts);

  // Detectar traslape con otros turnos del mismo día
  const overlapWarning = React.useMemo(() => {
    if (!/^\d{2}:\d{2}$/.test(entrada)) return null;
    const toMin = (hm: string) => {
      const [h, m] = hm.split(':').map(Number);
      return (h ?? 0) * 60 + (m ?? 0);
    };
    const start = toMin(entrada);
    const end = salida.trim() !== '' && /^\d{2}:\d{2}$/.test(salida) ? toMin(salida) : start + 1;
    const endN = end <= start ? end + 1440 : end;
    for (const s of shifts) {
      if (s.fecha !== fecha) continue;
      if (editing && s.id === editing.id) continue;
      if (!/^\d{2}:\d{2}$/.test(s.horaEntrada)) continue;
      const os = toMin(s.horaEntrada);
      const oe = s.horaSalida && /^\d{2}:\d{2}$/.test(s.horaSalida) ? toMin(s.horaSalida) : os + 1;
      const oeN = oe <= os ? oe + 1440 : oe;
      if (start < oeN && os < endN) return s;
    }
    return null;
  }, [shifts, fecha, entrada, salida, editing]);

  const [showOverlap, setShowOverlap] = useState(false);

  const save = () => {
    if (!canSave) return;
    // Advertir si hay traslape
    if (overlapWarning && !showOverlap) {
      setShowOverlap(true);
      return;
    }
    const data = {
      jobId: esLibre ? '' : jobId,
      esLibre,
      estacionIds,
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
    setShowOverlap(false);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={editing ? t.shift.edit : t.shift.new}>
      {/* Plantillas */}
      {templates.length > 0 && !editing && (
        <View style={{ marginBottom: SP.md }}>
          <Label>{t.shift.templates}</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SP.sm }}>
            {templates.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                onPress={() => {
                  setJobId(tpl.jobId);
                  setEstacionIds(tpl.estacionIds ?? []);
                  setEntrada(tpl.horaEntrada);
                  setSalida(tpl.horaSalida);
                  setBreakMin(String(tpl.breakMin));
                }}
                onLongPress={() => deleteTemplate(tpl.id)}
                activeOpacity={0.7}
                style={{
                  borderRadius: R.pill,
                  paddingHorizontal: SP.lg,
                  paddingVertical: SP.sm,
                  backgroundColor: p.surface,
                  borderWidth: 1,
                  borderColor: p.line,
                }}
              >
                <Text style={{ fontWeight: '600', fontSize: 13, color: p.text }}>{tpl.nombre}</Text>
                <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: p.text3 }}>
                  {tpl.horaEntrada}–{tpl.horaSalida}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
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
              setEstacionIds([]);
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
            {job.estaciones.map((e) => {
              const active = estacionIds.includes(e.id);
              return (
                <TouchableOpacity
                  key={e.id}
                  onPress={() => setEstacionIds(active ? estacionIds.filter((id) => id !== e.id) : [...estacionIds, e.id])}
                  style={{
                    borderRadius: R.pill,
                    paddingHorizontal: SP.lg,
                    paddingVertical: SP.sm,
                    backgroundColor: active ? p.text : p.surface,
                    borderWidth: 1,
                    borderColor: p.line,
                  }}
                >
                  <Text style={{ color: active ? p.bg : p.text, fontSize: 14 }}>{e.nombre}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <View style={{ flexDirection: 'row', gap: SP.md }}>
        <DateField label={t.shift.date} value={fecha} onChange={setFecha} />
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
      {showOverlap && overlapWarning && (
        <View style={{ backgroundColor: '#FFF3E0', borderRadius: R.md, padding: SP.md, marginBottom: SP.sm, borderWidth: 1, borderColor: '#FFB74D' }}>
          <Text style={{ fontWeight: '700', color: '#E65100', fontSize: 14, marginBottom: 4 }}>
            ⚠️ {t.shift.overlapTitle}
          </Text>
          <Text style={{ color: '#BF360C', fontSize: 13 }}>
            {t.shift.overlapMsg}
          </Text>
          <View style={{ flexDirection: 'row', gap: SP.sm, marginTop: SP.sm }}>
            <TouchableOpacity
              onPress={() => setShowOverlap(false)}
              style={{ flex: 1, height: 44, borderRadius: R.pill, borderWidth: 1, borderColor: '#FFB74D', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontWeight: '700', color: '#E65100' }}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowOverlap(false); save(); }}
              style={{ flex: 1, height: 44, borderRadius: R.pill, backgroundColor: '#E65100', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontWeight: '700', color: '#fff' }}>{t.shift.saveAnyway}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <Btn title={t.shift.save} onPress={save} disabled={!canSave} arrow style={{ marginTop: SP.sm }} />
      {!editing && !esLibre && jobId !== '' && (
        <TouchableOpacity
          onPress={() => {
            const job = jobs.find((j) => j.id === jobId);
            addTemplate({
              nombre: `${job?.nombre ?? ''} ${entrada}–${salida || '…'}`,
              jobId,
              estacionIds,
              horaEntrada: entrada,
              horaSalida: salida.trim() === '' ? entrada : salida,
              breakMin: Number(breakMin) || 0,
            });
          }}
          activeOpacity={0.7}
          style={{ marginTop: SP.sm, alignItems: 'center', paddingVertical: SP.sm }}
        >
          <Text style={{ color: p.primary, fontWeight: '600', fontSize: 14 }}>
            + {t.shift.saveAsTemplate}
          </Text>
        </TouchableOpacity>
      )}
    </Sheet>
  );
}
