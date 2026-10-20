/** Bottom sheet con detalle completo de un turno. */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sheet, Icon, Confirm, useTheme, useT } from './ui';
import { useStore, jobsById, type Shift } from '../store';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import { hmTo12h, parseYmd, shortDate } from '../lib/dates';
import { scheduledHours, workedHours, fmtHours, fmtMoney } from '../lib/calc';
import { TimeField } from './ShiftForm';

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  const p = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SP.sm }}>
      <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: p.text3 }}>{label.toUpperCase()}</Text>
      <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.body, color: color ?? p.text }}>{value}</Text>
    </View>
  );
}

export function ShiftDetailSheet({
  shift,
  onClose,
  onEdit,
}: {
  shift: Shift | null;
  onClose: () => void;
  onEdit: (s: Shift) => void;
}) {
  const t = useT();
  const p = useTheme();
  const jobs = useStore((s) => s.jobs);
  const deleteShift = useStore((s) => s.deleteShift);
  const updateShift = useStore((s) => s.updateShift);
  const settings = useStore((s) => s.settings);
  const [confirm, setConfirm] = React.useState(false);
  const [editWorked, setEditWorked] = React.useState(false);
  const [wIn, setWIn] = React.useState('');
  const [wOut, setWOut] = React.useState('');

  if (!shift) return null;
  const byId = jobsById(jobs);
  const job = byId[shift.jobId];
  const estNames = (shift.estacionIds ?? []).map((id) => job?.estaciones.find((e) => e.id === id)?.nombre).filter(Boolean);
  const esFmt = settings.idioma === 'es';
  const isOpen = !!shift.horaEntradaReal && !shift.horaSalidaReal;
  const hrsProg = scheduledHours(shift);
  const hrsWork = workedHours(shift);
  const gross = hrsWork * (job?.sueldoHora ?? 0);
  const net = gross * (1 - (job?.taxPct ?? 0) / 100);
  const hasWorked = !!shift.horaEntradaReal;

  return (
    <>
      <Sheet visible={!!shift} onClose={onClose} title={job?.nombre ?? t.semana.turno}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.lg }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: job?.color ?? p.primary, marginRight: 8 }} />
          <Text style={{ fontFamily: FONT.mono, fontSize: TYPE.mono, color: p.text3 }}>
            {shortDate(shift.fecha, t.months).toUpperCase()}
          </Text>
          {isOpen && (
            <View style={{ backgroundColor: p.primary, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 8 }}>
              <Text style={{ color: '#fff', fontFamily: FONT.mono, fontSize: 10, fontWeight: '700' }}>{t.semana.enCurso.toUpperCase()}</Text>
            </View>
          )}
        </View>

        <Row label={t.shift.scheduled} value={`${hmTo12h(shift.horaEntrada, esFmt)} – ${shift.horaSalida ? hmTo12h(shift.horaSalida, esFmt) : '…'} · ${fmtHours(hrsProg)}`} />
        {hasWorked ? (
          <Row label={t.shift.worked} value={`${hmTo12h(shift.horaEntradaReal!, esFmt)} – ${shift.horaSalidaReal ? hmTo12h(shift.horaSalidaReal, esFmt) : '…'} · ${fmtHours(hrsWork)}`} color={p.success} />
        ) : (
          <Row label={t.shift.worked} value="—" />
        )}
        {estNames.length > 0 && <Row label={t.shift.station} value={estNames.join(", ")} />}
        {shift.breakMin > 0 && <Row label={t.shift.break} value={`${shift.breakMin} min`} />}
        {shift.propinas > 0 && <Row label={t.shift.tips} value={fmtMoney(shift.propinas)} color={p.success} />}
        {shift.bono > 0 && <Row label={t.shift.bonus} value={fmtMoney(shift.bono)} color={p.success} />}
        {!!shift.notas && <Row label={t.shift.notes} value={shift.notas} />}
        <View style={{ height: 1, backgroundColor: p.line, marginVertical: SP.sm }} />
        <Row label={t.inicio.bruto} value={fmtMoney(gross)} color={p.warning} />
        <Row label={t.inicio.taxes} value={fmtMoney(gross - net)} color={p.danger} />
        <Row label={t.inicio.netoEstimado} value={fmtMoney(net)} color={p.success} />

        <View style={{ flexDirection: 'row', gap: SP.sm, marginTop: SP.lg }}>
          <TouchableOpacity
            onPress={() => { onClose(); onEdit(shift); }}
            style={{ flex: 1, height: 50, borderRadius: R.pill, borderWidth: 0.5, borderColor: p.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Icon name="edit" size={ICON.sm} color={p.text} />
            <Text style={{ fontWeight: '700', color: p.text, fontSize: TYPE.body }}>{t.common.edit}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setConfirm(true)}
            style={{ flex: 1, height: 50, borderRadius: R.pill, backgroundColor: 'rgba(209,52,56,0.10)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Icon name="trash" size={ICON.sm} color={p.danger} />
            <Text style={{ fontWeight: '700', color: p.danger, fontSize: TYPE.body }}>{t.common.delete}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            setWIn(shift.horaEntradaReal ?? shift.horaEntrada);
            setWOut(shift.horaSalidaReal ?? shift.horaSalida ?? '');
            setEditWorked(true);
          }}
          style={{ marginTop: SP.sm, height: 50, borderRadius: R.pill, borderWidth: 0.5, borderColor: p.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Icon name="clock" size={ICON.sm} color={p.text} />
          <Text style={{ fontWeight: '700', color: p.text, fontSize: TYPE.body }}>{t.shift.editWorked}</Text>
        </TouchableOpacity>
        {isOpen && (
          <TouchableOpacity
            onPress={() => { updateShift(shift.id, { horaSalidaReal: new Date().toTimeString().slice(0, 5) }); onClose(); }}
            style={{ marginTop: SP.sm, height: 52, borderRadius: R.pill, backgroundColor: p.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.body, color: '#fff' }}>{t.today.clockOut} →</Text>
          </TouchableOpacity>
        )}
      </Sheet>

      {/* Editar horas trabajadas */}
      <Sheet visible={editWorked} onClose={() => setEditWorked(false)} title={t.shift.editWorked}>
        <TimeField label={t.shift.checkIn} value={wIn} onChange={setWIn} placeholder="--:--" />
        <TimeField label={t.shift.checkOut} value={wOut} onChange={setWOut} placeholder="--:--" />
        <TouchableOpacity
          onPress={() => { updateShift(shift.id, { horaEntradaReal: wIn, horaSalidaReal: wOut || null }); setEditWorked(false); }}
          style={{ marginTop: SP.lg, marginBottom: SP.md, height: 52, borderRadius: R.pill, backgroundColor: p.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.body, color: '#fff' }}>{t.common.save}</Text>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      </Sheet>
      <Confirm
        visible={confirm}
        message={t.today.confirmDelete}
        yesLabel={t.today.delete}
        noLabel={t.today.cancel}
        onYes={() => { deleteShift(shift.id); setConfirm(false); onClose(); }}
        onNo={() => setConfirm(false)}
      />
    </>
  );
}
