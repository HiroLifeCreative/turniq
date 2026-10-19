/** Kit UI nativo con identidad Turniq: píldoras con flecha, Switzer, etiquetas mono. */
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { STR } from '../i18n';
import { light, dark, SP, R, FONT, type Palette } from '../theme/tokens';

export const useTheme = (): Palette => (useStore((s) => s.settings.dark) ? dark : light);
export const useT = () => STR[useStore((s) => s.settings.idioma)];

export const H1 = ({ children, style }: { children: React.ReactNode; style?: TextStyle }) => {
  const p = useTheme();
  return (
    <Text style={[{ fontFamily: FONT.headBold, fontSize: 28, letterSpacing: -0.5, color: p.text }, style]}>
      {children}
    </Text>
  );
};

export const Label = ({ children, style }: { children: React.ReactNode; style?: TextStyle }) => {
  const p = useTheme();
  return (
    <Text
      style={[
        { fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: p.text3, marginBottom: SP.sm },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

export const Screen = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
  const p = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: p.bg }, style]} edges={['top', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
};

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
  const p = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: p.card,
          borderRadius: R.lg,
          borderWidth: 1,
          borderColor: p.line,
          padding: SP.lg,
          shadowColor: p.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const Arrow = ({ color }: { color: string }) => (
  <View
    style={{
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ color, fontSize: 16, fontWeight: '700' }}>→</Text>
  </View>
);

export function Btn({
  title,
  onPress,
  kind = 'primary',
  arrow = false,
  style,
  disabled,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  arrow?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const p = useTheme();
  const bg = kind === 'primary' ? p.primary : kind === 'danger' ? p.danger : 'transparent';
  const fg = kind === 'ghost' ? p.text : '#FFFFFF';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        {
          height: 52,
          borderRadius: R.pill,
          backgroundColor: bg,
          borderWidth: kind === 'ghost' ? 1 : 0,
          borderColor: p.line,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: arrow ? 'space-between' : 'center',
          paddingLeft: 22,
          paddingRight: arrow ? 6 : 22,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: FONT.head, fontWeight: '700', fontSize: 16, color: fg }}>{title}</Text>
      {arrow && <Arrow color="#FFFFFF" />}
    </TouchableOpacity>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = 'default',
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  maxLength?: number;
}) {
  const p = useTheme();
  return (
    <View style={{ marginBottom: SP.md }}>
      <Label>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={p.text3}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={{
          fontFamily: FONT.head,
          fontSize: 16,
          color: p.text,
          backgroundColor: p.surface,
          borderRadius: R.md,
          borderWidth: 1,
          borderColor: p.line,
          paddingHorizontal: SP.lg,
          paddingVertical: SP.md,
        }}
      />
    </View>
  );
}

export function Seg<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const p = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: p.surface, borderRadius: R.pill, padding: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              borderRadius: R.pill,
              backgroundColor: active ? p.primary : 'transparent',
              paddingVertical: 10,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: FONT.mono,
                fontSize: 12,
                color: active ? '#FFFFFF' : p.text2,
                fontWeight: active ? '700' : '400',
              }}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Bottom sheet nativo (modal deslizante). */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const p = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={{
              backgroundColor: p.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: SP.xl,
              paddingTop: SP.md,
              paddingBottom: SP.xxxl,
              maxHeight: '88%',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: SP.md }}>
              <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: p.line }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.lg }}>
              <Text style={{ fontFamily: FONT.headBold, fontSize: 20, letterSpacing: -0.3, color: p.text }}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Text style={{ fontSize: 20, color: p.text3 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Barra superior con atrás (para pantallas del stack "Más"). */
export function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  const p = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.md }}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={12}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: p.surface,
          borderWidth: 1,
          borderColor: p.line,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SP.md,
        }}
      >
        <Text style={{ fontSize: 20, color: p.primary, fontWeight: '700' }}>‹</Text>
      </TouchableOpacity>
      <Text style={{ fontFamily: FONT.headBold, fontSize: 22, letterSpacing: -0.4, color: p.text }}>{title}</Text>
    </View>
  );
}

/** Diálogo de confirmación. */export function Confirm({
  visible,
  message,
  onYes,
  onNo,
  yesLabel,
  noLabel,
}: {
  visible: boolean;
  message: string;
  onYes: () => void;
  onNo: () => void;
  yesLabel: string;
  noLabel: string;
}) {
  const p = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onNo}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: SP.xxl }}>
        <View style={{ backgroundColor: p.card, borderRadius: R.xl, padding: SP.xl, width: '100%' }}>
          <Text style={{ fontFamily: FONT.head, fontSize: 16, color: p.text, marginBottom: SP.xl }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: SP.md }}>
            <TouchableOpacity
              onPress={onNo}
              style={{ flex: 1, height: 48, borderRadius: R.pill, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: p.text2, fontWeight: '600' }}>{noLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onYes}
              style={{ flex: 1, height: 48, borderRadius: R.pill, backgroundColor: p.danger, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>{yesLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ── Iconos SVG consistentes (16/20/24px) ─────────────────────────── */
import Svg, { Path, Circle } from 'react-native-svg';
import { ICON, TYPE } from '../theme/tokens';

const ICON_PATHS: Record<string, string> = {
  settings: 'M4 8h16M4 16h16',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  wallet: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 13h.01',
  edit: 'M4 20l4-1L20 7a2.4 2.4 0 0 0-3.4-3.4L5 15zM14 6l3 3',
  trash: 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0l-.8 12a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8L6 7',
  chevronRight: 'M9 6l6 6-6 6',
  calendar: 'M8 3v4M16 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
};

export function Icon({ name, size = ICON.md, color }: { name: string; size?: number; color: string }) {
  const p = useTheme();
  const d = ICON_PATHS[name] ?? ICON_PATHS.clock;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? p.text2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  );
}

/* ── Header global: título + botón ajustes a la derecha ────────────── */
export function Header({ title, onSettings }: { title: string; onSettings?: () => void }) {
  const p = useTheme();
  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.lg, marginBottom: SP.sm }}>
      <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.h1, letterSpacing: -0.5, color: p.text }}>{title}</Text>
      {onSettings && (
        <TouchableOpacity
          onPress={onSettings}
          hitSlop={12}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="settings" size={ICON.md} color={p.text2} />
        </TouchableOpacity>
      )}
    </View>
  );
}
