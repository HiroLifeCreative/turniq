/** Onboarding interactivo para primera vez: nombre, trabajo, estación, primer turno. */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MotiView } from 'moti';
import { Screen, useTheme, useT, Icon } from '../components/ui';
import { IosTimePicker, IosDatePicker } from '../components/IosPickers';
import { useStore } from '../store';
import { SP, R, FONT, TYPE, ICON } from '../theme/tokens';
import { todayYmd } from '../lib/dates';

const JOB_COLORS = ['#0064E0', '#E8830C', '#30A46C', '#E5484D', '#8E4EC6', '#0E9BD8', '#D97706', '#6B7280'];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const t = useT();
  const p = useTheme();
  const setSettings = useStore((s) => s.setSettings);
  const addJob = useStore((s) => s.addJob);
  const addShift = useStore((s) => s.addShift);
  const settings = useStore((s) => s.settings);

  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState('');
  const [jobName, setJobName] = useState('');
  const [sueldo, setSueldo] = useState('');
  const [tax, setTax] = useState('');
  const [color, setColor] = useState<string>(JOB_COLORS[0] ?? '#0064E0');
  const [estacion, setEstacion] = useState('');
  const [estaciones, setEstaciones] = useState<string[]>([]);
  const [fecha, setFecha] = useState(todayYmd());
  const [entrada, setEntrada] = useState('09:00');
  const [salida, setSalida] = useState('17:00');
  const [showDate, setShowDate] = useState(false);
  const [showTimeIn, setShowTimeIn] = useState(false);
  const [showTimeOut, setShowTimeOut] = useState(false);
  const formatoHora = settings.formatoHora;

  const totalSteps = 5;
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = () => {
    // Guardar nombre
    if (nombre.trim()) setSettings({ nombreUsuario: nombre.trim() });
    setSettings({ terminosAceptados: true });
    // Crear trabajo
    const jobId = addJob({
      nombre: jobName.trim(),
      color,
      sueldoHora: Number(sueldo) || 0,
      taxPct: Number(tax) || 0,
      estaciones: estaciones.map((n, i) => ({ id: `st-${Date.now()}-${i}`, nombre: n })),
    });
    // Crear primer turno
    const ests = estaciones.map((n, i) => `st-${Date.now()}-${i}`);
    addShift({
      jobId,
      estacionIds: ests.slice(0, 1),
      fecha,
      horaEntrada: entrada,
      horaSalida: salida,
      breakMin: 0,
      propinas: 0,
      bono: 0,
      notas: '',
    });
    setSettings({ onboardingDone: true });
    onDone();
  };

  const canNext = () => {
    switch (step) {
      case 0: return aceptaTerminos;
      case 1: return nombre.trim().length > 0;
      case 2: return jobName.trim().length > 0 && Number(sueldo) > 0;
      case 3: return true; // estaciones opcionales
      case 4: return true;
      default: return true;
    }
  };

  const addEstacion = () => {
    if (estacion.trim()) {
      setEstaciones([...estaciones, estacion.trim()]);
      setEstacion('');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: SP.xl }} showsVerticalScrollIndicator={false}>
          {/* Progreso */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.xl, marginTop: SP.md }}>
            <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
              {Array.from({ length: totalSteps + 1 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: i <= step ? p.primary : p.line,
                  }}
                />
              ))}
            </View>
            <TouchableOpacity onPress={() => { setSettings({ onboardingDone: true }); onDone(); }} hitSlop={12} style={{ marginLeft: SP.md, padding: 4 }}>
              <Text style={{ fontSize: 14, color: p.text3, fontWeight: '600' }}>{t.onboarding.skip}</Text>
            </TouchableOpacity>
          </View>

          <MotiView key={step} from={{ opacity: 0, translateX: 30 }} animate={{ opacity: 1, translateX: 0 }} style={{ flex: 1 }}>
            {step === 0 && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: p.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: SP.xl }}>
                  <Icon name="clock" size={48} color={p.primary} />
                </View>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 28, color: p.text, textAlign: 'center', marginBottom: SP.md }}>
                  {t.onboarding.welcome}
                </Text>
                <Text style={{ fontSize: 16, color: p.text2, textAlign: 'center', lineHeight: 24 }}>
                  {t.onboarding.welcomeDesc}
                </Text>
                <TouchableOpacity
                  onPress={() => setAceptaTerminos((v) => !v)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: SP.xl, paddingHorizontal: SP.md }}
                >
                  <View style={{
                    width: 26, height: 26, borderRadius: 8, marginRight: SP.sm,
                    backgroundColor: aceptaTerminos ? p.primary : 'transparent',
                    borderWidth: 2, borderColor: aceptaTerminos ? p.primary : p.line,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {aceptaTerminos && <Icon name="check" size={16} color="#fff" />}
                  </View>
                  <Text style={{ fontSize: 14, color: p.text, flexShrink: 1 }}>
                    {t.onboarding.acceptTerms}{' '}
                    <Text style={{ color: p.primary, fontWeight: '700' }}>{t.more.terms}</Text>
                  </Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: p.text3, textAlign: 'center', marginTop: SP.sm, paddingHorizontal: SP.lg }}>
                  {t.onboarding.localDataNote}
                </Text>
              </View>
            )}

            {step === 1 && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 24, color: p.text, marginBottom: SP.sm }}>
                  {t.onboarding.nameTitle}
                </Text>
                <Text style={{ fontSize: 15, color: p.text2, marginBottom: SP.xl }}>
                  {t.onboarding.nameDesc}
                </Text>
                <TextInput
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder={t.onboarding.namePlaceholder}
                  placeholderTextColor={p.text3}
                  autoFocus
                  style={{
                    backgroundColor: p.surface,
                    borderRadius: R.lg,
                    borderWidth: 1,
                    borderColor: p.line,
                    padding: SP.lg,
                    fontSize: 18,
                    color: p.text,
                    fontFamily: FONT.head,
                  }}
                />
              </View>
            )}

            {step === 2 && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 24, color: p.text, marginBottom: SP.sm }}>
                  {t.onboarding.jobTitle}
                </Text>
                <Text style={{ fontSize: 15, color: p.text2, marginBottom: SP.xl }}>
                  {t.onboarding.jobDesc}
                </Text>
                <Text style={{ fontSize: 13, color: p.text3, marginBottom: SP.sm, fontWeight: '600' }}>{t.onboarding.jobName}</Text>
                <TextInput
                  value={jobName}
                  onChangeText={setJobName}
                  placeholder="Longhorn"
                  placeholderTextColor={p.text3}
                  style={{
                    backgroundColor: p.surface, borderRadius: R.lg, borderWidth: 1, borderColor: p.line,
                    padding: SP.lg, fontSize: 17, color: p.text, marginBottom: SP.lg,
                  }}
                />
                <View style={{ flexDirection: 'row', gap: SP.md, marginBottom: SP.lg }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: p.text3, marginBottom: SP.sm, fontWeight: '600' }}>{t.onboarding.hourly}</Text>
                    <TextInput
                      value={sueldo}
                      onChangeText={setSueldo}
                      placeholder="15.00"
                      placeholderTextColor={p.text3}
                      keyboardType="decimal-pad"
                      style={{
                        backgroundColor: p.surface, borderRadius: R.lg, borderWidth: 1, borderColor: p.line,
                        padding: SP.lg, fontSize: 17, color: p.text,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: p.text3, marginBottom: SP.sm, fontWeight: '600' }}>{t.onboarding.tax}</Text>
                    <TextInput
                      value={tax}
                      onChangeText={setTax}
                      placeholder="18"
                      placeholderTextColor={p.text3}
                      keyboardType="decimal-pad"
                      style={{
                        backgroundColor: p.surface, borderRadius: R.lg, borderWidth: 1, borderColor: p.line,
                        padding: SP.lg, fontSize: 17, color: p.text,
                      }}
                    />
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: p.text3, marginBottom: SP.sm, fontWeight: '600' }}>{t.onboarding.color}</Text>
                <View style={{ flexDirection: 'row', gap: SP.sm, flexWrap: 'wrap' }}>
                  {JOB_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setColor(c)}
                      style={{
                        width: 44, height: 44, borderRadius: 22, backgroundColor: c,
                        borderWidth: color === c ? 3 : 0, borderColor: p.text,
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 24, color: p.text, marginBottom: SP.sm }}>
                  {t.onboarding.stationTitle}
                </Text>
                <Text style={{ fontSize: 15, color: p.text2, marginBottom: SP.xl }}>
                  {t.onboarding.stationDesc}
                </Text>
                <View style={{ flexDirection: 'row', gap: SP.sm, marginBottom: SP.md }}>
                  <TextInput
                    value={estacion}
                    onChangeText={setEstacion}
                    placeholder="Fry"
                    placeholderTextColor={p.text3}
                    onSubmitEditing={addEstacion}
                    style={{
                      flex: 1, backgroundColor: p.surface, borderRadius: R.lg, borderWidth: 1, borderColor: p.line,
                      padding: SP.lg, fontSize: 17, color: p.text,
                    }}
                  />
                  <TouchableOpacity
                    onPress={addEstacion}
                    style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: p.primary, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon name="plus" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                {estaciones.map((e, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: p.surface, borderRadius: R.lg, padding: SP.md, marginBottom: SP.sm }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: SP.sm }} />
                    <Text style={{ flex: 1, fontSize: 16, color: p.text }}>{e}</Text>
                    <TouchableOpacity onPress={() => setEstaciones(estaciones.filter((_, j) => j !== i))} hitSlop={10}>
                      <Icon name="x" size={18} color={p.text3} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {step === 4 && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 24, color: p.text, marginBottom: SP.sm }}>
                  {t.onboarding.shiftTitle}
                </Text>
                <Text style={{ fontSize: 15, color: p.text2, marginBottom: SP.xl }}>
                  {t.onboarding.shiftDesc}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDate(true)}
                  style={{ backgroundColor: p.surface, borderRadius: R.lg, borderWidth: 1, borderColor: p.line, padding: SP.lg, marginBottom: SP.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, color: p.text3 }}>{t.shift.date}</Text>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: p.text }}>{fecha.split('-').reverse().join('/')}</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: SP.md }}>
                  <TouchableOpacity
                    onPress={() => setShowTimeIn(true)}
                    style={{ flex: 1, backgroundColor: p.surface, borderRadius: R.lg, borderWidth: 1, borderColor: p.line, padding: SP.lg }}
                  >
                    <Text style={{ fontSize: 13, color: p.text3, marginBottom: 4 }}>{t.shift.start}</Text>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: p.text }}>{entrada}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowTimeOut(true)}
                    style={{ flex: 1, backgroundColor: p.surface, borderRadius: R.lg, borderWidth: 1, borderColor: p.line, padding: SP.lg }}
                  >
                    <Text style={{ fontSize: 13, color: p.text3, marginBottom: 4 }}>{t.shift.end}</Text>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: p.text }}>{salida}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 5 && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: p.success + '15', alignItems: 'center', justifyContent: 'center', marginBottom: SP.xl }}>
                  <Text style={{ fontSize: 48 }}>🎉</Text>
                </View>
                <Text style={{ fontFamily: FONT.headBold, fontSize: 28, color: p.text, textAlign: 'center', marginBottom: SP.md }}>
                  {t.onboarding.doneTitle}
                </Text>
                <Text style={{ fontSize: 16, color: p.text2, textAlign: 'center', lineHeight: 24 }}>
                  {t.onboarding.doneDesc}
                </Text>
              </View>
            )}
          </MotiView>

          {/* Botones */}
          <View style={{ flexDirection: 'row', gap: SP.md, marginTop: SP.xl }}>
            {step > 0 && step < totalSteps && (
              <TouchableOpacity
                onPress={back}
                style={{ height: 56, paddingHorizontal: SP.xl, borderRadius: R.pill, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontWeight: '700', color: p.text, fontSize: 16 }}>{t.common.back ?? 'Atrás'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={step === totalSteps ? finish : next}
              disabled={!canNext()}
              style={{
                flex: 1, height: 56, borderRadius: R.pill,
                backgroundColor: canNext() ? p.primary : p.line,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontWeight: '700', color: '#fff', fontSize: 16 }}>
                {step === 0 ? t.onboarding.start : step === totalSteps ? t.onboarding.finish : t.common.next ?? 'Siguiente'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <IosDatePicker
        visible={showDate}
        onClose={() => setShowDate(false)}
        value={fecha}
        onChange={setFecha}
        title={t.shift.date}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
      />
      <IosTimePicker
        visible={showTimeIn}
        onClose={() => setShowTimeIn(false)}
        value={entrada}
        onChange={setEntrada}
        title={t.shift.start}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
        is24h={formatoHora === '24h'}
      />
      <IosTimePicker
        visible={showTimeOut}
        onClose={() => setShowTimeOut(false)}
        value={salida}
        onChange={setSalida}
        title={t.shift.end}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
        is24h={formatoHora === '24h'}
      />
    </Screen>
  );
}
