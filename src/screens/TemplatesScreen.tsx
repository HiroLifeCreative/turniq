/** Plantillas de turno: crear, editar, eliminar y asignar a un día. */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Screen, TopBar, ContentSheet, Card, Btn, Label, Field, Sheet, Confirm, Icon, useTheme, useT,
} from '../components/ui';
import { TimeField, DateField } from '../components/ShiftForm';
import { useToast } from '../components/Toast';
import { useStore, jobsById, type ShiftTemplate } from '../store';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import { todayYmd, hmTo12h } from '../lib/dates';
import { isOvernight, scheduledHours, fmtHours } from '../lib/calc';

export function TemplatesScreen() {
  const t = useT();
  const p = useTheme();
  const nav = useNavigation();
  const toast = useToast();
  const jobs = useStore((s) => s.jobs);
  const templates = useStore((s) => s.templates);
  const addTemplate = useStore((s) => s.addTemplate);
  const updateTemplate = useStore((s) => s.updateTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const addShift = useStore((s) => s.addShift);
  const formatoHora = useStore((s) => s.settings.formatoHora);
  const esFmt = formatoHora === '12h';
  const byId = jobsById(jobs);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftTemplate | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [assignTpl, setAssignTpl] = useState<ShiftTemplate | null>(null);
  const [assignDate, setAssignDate] = useState(todayYmd());

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (tpl: ShiftTemplate) => {
    setEditing(tpl);
    setFormOpen(true);
  };

  return (
    <Screen banded>
      <TopBar onDark title={t.more.templates} onBack={() => nav.goBack()} />
      <ContentSheet>
        <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 124 }}>
          <Btn title={t.tpl.new} onPress={openNew} style={{ marginBottom: SP.lg }} />
          {templates.length === 0 && (
            <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text3, lineHeight: 19 }}>
              {t.tpl.empty}
            </Text>
          )}
          {templates.map((tpl) => {
            const job = byId[tpl.jobId];
            const estNames = (tpl.estacionIds ?? [])
              .map((id) => job?.estaciones.find((e) => e.id === id)?.nombre)
              .filter(Boolean) as string[];
            const dur = scheduledHours({
              id: '',
              jobId: '',
              horaEntrada: tpl.horaEntrada,
              horaSalida: tpl.horaSalida,
              breakMin: tpl.breakMin,
              propinas: 0,
              bono: 0,
            });
            return (
              <Card key={tpl.id} style={{ marginBottom: SP.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: job?.color ?? p.primary, marginRight: SP.md }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.text }} numberOfLines={1}>
                      {tpl.nombre}
                    </Text>
                    <Text style={{ fontSize: 13, color: p.text2 }} numberOfLines={1}>
                      {job?.nombre ?? '—'}
                      {estNames.length ? ` · ${estNames.join(', ')}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setConfirmId(tpl.id)} hitSlop={10} style={{ padding: 6 }}>
                    <Icon name="trash" size={ICON.md} color={p.danger} />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontFamily: FONT.mono, fontSize: 13, color: p.text2, marginTop: SP.sm }}>
                  {hmTo12h(tpl.horaEntrada, esFmt)} – {hmTo12h(tpl.horaSalida, esFmt)}
                  {isOvernight(tpl.horaEntrada, tpl.horaSalida) ? ` ${t.shift.nextDay}` : ''} · {fmtHours(dur)}
                  {tpl.breakMin > 0 ? ` · ${tpl.breakMin} min ${t.tpl.breakShort}` : ''}
                </Text>
                <View style={{ flexDirection: 'row', gap: SP.sm, marginTop: SP.md }}>
                  <Btn
                    title={t.tpl.assign}
                    onPress={() => {
                      setAssignTpl(tpl);
                      setAssignDate(todayYmd());
                    }}
                    style={{ flex: 1 }}
                  />
                  <Btn title={t.common.edit} kind="ghost" onPress={() => openEdit(tpl)} style={{ flex: 1 }} />
                </View>
              </Card>
            );
          })}
        </ScrollView>
      </ContentSheet>

      {/* Crear / editar plantilla */}
      <Sheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t.tpl.edit : t.tpl.new}
      >
        {formOpen && (
          <TemplateForm
            key={editing?.id ?? 'new'}
            initial={editing}
            onSave={(data) => {
              if (editing) updateTemplate(editing.id, data);
              else addTemplate(data);
              setFormOpen(false);
              toast.success(t.tpl.saved);
            }}
          />
        )}
      </Sheet>

      {/* Asignar a un día */}
      <Sheet
        visible={!!assignTpl}
        onClose={() => setAssignTpl(null)}
        title={t.tpl.assignTitle}
      >
        {assignTpl && (
          <View>
            <Text style={{ fontFamily: FONT.headBold, fontSize: 16, color: p.text, marginBottom: SP.md }}>
              {assignTpl.nombre} · {hmTo12h(assignTpl.horaEntrada, esFmt)} – {hmTo12h(assignTpl.horaSalida, esFmt)}
              {isOvernight(assignTpl.horaEntrada, assignTpl.horaSalida) ? ` ${t.shift.nextDay}` : ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: SP.md }}>
              <DateField label={t.shift.date} value={assignDate} onChange={setAssignDate} />
            </View>
            <Btn
              title={t.tpl.createShift}
              style={{ marginTop: SP.lg }}
              onPress={() => {
                addShift({
                  jobId: assignTpl.jobId,
                  estacionIds: assignTpl.estacionIds ?? [],
                  fecha: assignDate,
                  horaEntrada: assignTpl.horaEntrada,
                  horaSalida: assignTpl.horaSalida,
                  breakMin: assignTpl.breakMin,
                  propinas: 0,
                  bono: 0,
                  notas: '',
                });
                setAssignTpl(null);
                toast.success(t.tpl.assigned);
              }}
            />
          </View>
        )}
      </Sheet>

      <Confirm
        visible={!!confirmId}
        message={t.tpl.deleteConfirm}
        yesLabel={t.common.delete}
        noLabel={t.common.cancel}
        onYes={() => {
          if (confirmId) deleteTemplate(confirmId);
          setConfirmId(null);
        }}
        onNo={() => setConfirmId(null)}
      />
    </Screen>
  );
}

function TemplateForm({
  initial,
  onSave,
}: {
  initial: ShiftTemplate | null;
  onSave: (data: Omit<ShiftTemplate, 'id'>) => void;
}) {
  const t = useT();
  const p = useTheme();
  const jobs = useStore((s) => s.jobs);
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [jobId, setJobId] = useState(initial?.jobId ?? jobs[0]?.id ?? '');
  const [estacionIds, setEstacionIds] = useState<string[]>(initial?.estacionIds ?? []);
  const [entrada, setEntrada] = useState(initial?.horaEntrada ?? '09:00');
  const [salida, setSalida] = useState(initial?.horaSalida ?? '17:00');
  const [breakMin, setBreakMin] = useState(String(initial?.breakMin ?? 0));

  const job = jobs.find((j) => j.id === jobId);
  const canSave =
    nombre.trim() !== '' && jobId !== '' && /^\d{2}:\d{2}$/.test(entrada) && /^\d{2}:\d{2}$/.test(salida);
  const overnight = isOvernight(entrada, salida);

  return (
    <View>
      <Field label={t.tpl.name} value={nombre} onChange={setNombre} placeholder={t.tpl.namePlaceholder} />
      <Label>{t.shift.job}</Label>
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
        <TimeField label={t.shift.start} value={entrada} onChange={setEntrada} placeholder="09:00" />
        <TimeField label={t.shift.end} value={salida} onChange={setSalida} placeholder="17:00" />
      </View>
      {overnight && (
        <Text style={{ fontFamily: FONT.mono, fontSize: 12, color: p.primary, marginTop: SP.sm }}>
          🌙 {t.shift.endsNextDay}
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: SP.md, marginTop: SP.md }}>
        <View style={{ flex: 1 }}>
          <Field label={t.shift.break} value={breakMin} onChange={setBreakMin} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }} />
      </View>
      <Btn
        title={t.common.save}
        style={{ marginTop: SP.lg, opacity: canSave ? 1 : 0.5 }}
        onPress={() => {
          if (!canSave) return;
          onSave({
            nombre: nombre.trim(),
            jobId,
            estacionIds,
            horaEntrada: entrada,
            horaSalida: salida,
            breakMin: Number(breakMin) || 0,
          });
        }}
      />
    </View>
  );
}
