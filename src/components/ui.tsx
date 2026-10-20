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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
        { fontFamily: FONT.mono, fontSize: 11, textTransform: 'uppercase', color: p.text3, marginBottom: SP.sm },
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
          shadowColor: '#8A94A6',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
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

/** Bottom sheet fluido con Reanimated: spring al abrir, fade en el backdrop. */
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
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = React.useState(visible);
  const translateY = useSharedValue(600);
  const backdrop = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = 600;
      backdrop.value = 0;
      translateY.value = withSpring(0, { damping: 28, stiffness: 320, mass: 0.9 });
      backdrop.value = withTiming(1, { duration: 220 });
    } else if (mounted) {
      translateY.value = withTiming(600, { duration: 240, easing: Easing.in(Easing.cubic) });
      backdrop.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' }, backdropStyle]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View
            style={[
              {
                backgroundColor: p.card,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                paddingHorizontal: SP.xl,
                paddingTop: SP.sm,
                paddingBottom: Math.max(SP.xl, insets.bottom + SP.md),
                maxHeight: '92%',
                marginBottom: -insets.bottom,
                shadowColor: '#000',
                shadowOpacity: 0.25,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: -8 },
                elevation: 16,
              },
              sheetStyle,
            ]}
          >
            <View style={{ alignItems: 'center', paddingVertical: SP.sm, marginBottom: SP.xs }}>
              <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: p.line }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.lg }}>
              <Text style={{ fontFamily: FONT.headBold, fontSize: TYPE.h2, letterSpacing: -0.3, color: p.text }}>{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={12}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.surface, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="x" size={ICON.sm} color={p.text2} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </Animated.View>
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

/** Diálogo de confirmación con animación fluida. */
export function Confirm({
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
  const [mounted, setMounted] = React.useState(visible);
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      scale.value = 0.92;
      opacity.value = 0;
      scale.value = withSpring(1, { damping: 22, stiffness: 340 });
      opacity.value = withTiming(1, { duration: 180 });
    } else if (mounted) {
      scale.value = withTiming(0.94, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 }, () => {
        runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onNo} statusBarTranslucent>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SP.xxl }}>
        <Animated.View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' }, backdropStyle]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onNo} activeOpacity={1} />
        </Animated.View>
        <Animated.View style={[{ backgroundColor: p.card, borderRadius: R.xl, padding: SP.xl, width: '100%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 }, cardStyle]}>
          <Text style={{ fontFamily: FONT.head, fontSize: TYPE.body, lineHeight: 22, color: p.text, marginBottom: SP.xl }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: SP.sm }}>
            <TouchableOpacity
              onPress={onNo}
              activeOpacity={0.7}
              style={{ flex: 1, height: 50, borderRadius: R.pill, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: p.text2, fontWeight: '600', fontSize: TYPE.body }}>{noLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onYes}
              activeOpacity={0.85}
              style={{ flex: 1, height: 50, borderRadius: R.pill, backgroundColor: p.danger, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: TYPE.body }}>{yesLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ── Iconos Lucide (16/20/24px) ─────────────────────────────────────── */
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { ICON, TYPE } from '../theme/tokens';
import {
  Settings as LucideSettings,
  Plus as LucidePlus,
  X as LucideX,
  Clock as LucideClock,
  Wallet as LucideWallet,
  Pencil as LucidePencil,
  Trash2 as LucideTrash,
  ChevronRight as LucideChevronRight,
  ChevronLeft as LucideChevronLeft,
  ChevronDown as LucideChevronDown,
  Calendar as LucideCalendar,
  House as LucideHome,
  Briefcase as LucideBriefcase,
  ChartColumn as LucideChart,
} from 'lucide-react-native';

const LUCIDE_ICONS: Record<string, React.ComponentType<any>> = {
  settings: LucideSettings,
  plus: LucidePlus,
  x: LucideX,
  clock: LucideClock,
  wallet: LucideWallet,
  edit: LucidePencil,
  trash: LucideTrash,
  chevronRight: LucideChevronRight,
  chevronLeft: LucideChevronLeft,
  chevronDown: LucideChevronDown,
  calendar: LucideCalendar,
  home: LucideHome,
  briefcase: LucideBriefcase,
  chart: LucideChart,
};

export function Icon({ name, size = ICON.md, color }: { name: string; size?: number; color: string }) {
  const p = useTheme();
  const Cmp = LUCIDE_ICONS[name] ?? LucideClock;
  return <Cmp size={size} color={color ?? p.text2} strokeWidth={2} />;
}

/* ── Header global: título + botón ajustes a la derecha ────────────── */
export function Header({ title, onSettings }: { title: string; onSettings?: () => void }) {
  const p = useTheme();
  return (
    <View style={{
      backgroundColor: p.bg,
      shadowColor: '#8A94A6',
      shadowOpacity: 0.1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
      zIndex: 10,
    }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.lg, marginBottom: SP.sm }}>
        <Text style={{ fontFamily: FONT.headBold, fontSize: 20, letterSpacing: -0.4, color: p.text }}>{title}</Text>
        {onSettings && (
          <TouchableOpacity
            onPress={onSettings}
            hitSlop={12}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="settings" size={ICON.lg} color={p.text2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
