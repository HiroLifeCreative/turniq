/** Kit UI nativo con identidad Turniq: píldoras con flecha, Switzer, etiquetas mono. */
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Animated as RNAnimated,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
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

/** Color de la banda superior (header sobre oscuro, estilo referencia
 *  de Nelson: header con color + hoja redondeada debajo). */
export const bandColor = (darkMode: boolean) => (darkMode ? '#17171A' : '#14161A');

export const Screen = ({
  children,
  style,
  banded = false,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  /** banded: fondo oscuro arriba; el Header vive sobre la banda y el
   *  contenido va dentro de <Sheet> (hoja con esquinas superiores 28). */
  banded?: boolean;
}) => {
  const p = useTheme();
  const darkMode = p.bg === '#0B0B0C';
  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: banded ? bandColor(darkMode) : p.bg }, style]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={banded || darkMode ? 'light' : 'dark'} />
      {children}
    </SafeAreaView>
  );
};

/** Hoja de contenido: fondo del tema con las esquinas SUPERIORES muy
 *  redondeadas (28), montada sobre la banda oscura del header.
 *  (Se llama ContentSheet para no chocar con el Sheet modal.) */
export const ContentSheet = ({ children }: { children: React.ReactNode }) => {
  const p = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: p.bg,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
};

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => {
  const p = useTheme();
  const darkMode = p.bg === '#0B0B0C';
  // Degradado súper suave según tema
  const gradColors: [string, string] = darkMode
    ? ['#1E1E22', p.card]
    : ['#FFFFFF', p.card];
  return (
    <LinearGradient
      colors={gradColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        {
          borderRadius: 20,
          borderWidth: 0.5,
          borderColor: darkMode ? '#2E2E33' : '#EDEFF2',
          padding: SP.lg,
          shadowColor: '#6B7A99',
          shadowOpacity: 0.22,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
};

const Arrow = ({ color }: { color: string }) => (
  <View
    style={{
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ color, fontSize: 20, fontWeight: '700' }}>→</Text>
  </View>
);

/** Mezcla un color hex con otro (amt 0..1 hacia el destino). */
function mixHex(hex: string, target: string, amt: number): string {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(target.slice(1), 16);
  const ch = (shift: number) => {
    const va = (a >> shift) & 255;
    const vb = (b >> shift) & 255;
    return Math.round(va + (vb - va) * amt);
  };
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

/** Tarjeta destacada OSCURA (estilo referencia: negro protagonista, texto claro).
 *  Degradado oscuro sólido con un toque del acento; funciona en ambos temas. */
export const TintedCard = ({
  accent,
  children,
  style,
  delay = 0,
}: {
  accent: string;
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}) => {
  const colors: [string, string] = [mixHex(accent, '#101216', 0.8), '#14161A'];
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 240, delay }}
      style={style}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          borderWidth: 0.5,
          borderColor: 'rgba(255,255,255,0.09)',
          padding: SP.lg,
          shadowColor: '#000000',
          shadowOpacity: 0.28,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        {children}
      </LinearGradient>
    </MotiView>
  );
};

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
  const fg = kind === 'ghost' ? p.text : '#FFFFFF';
  const content = (
    <>
      <Text style={{ fontFamily: FONT.head, fontWeight: '700', fontSize: 16, color: fg }}>{title}</Text>
      {arrow && <Arrow color="#FFFFFF" />}
    </>
  );
  const rowStyle: ViewStyle = {
    height: 52,
    borderRadius: R.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: arrow ? 'space-between' : 'center',
    paddingLeft: 22,
    paddingRight: arrow ? 6 : 22,
  };
  if (kind === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        style={[
          {
            ...rowStyle,
            backgroundColor: 'transparent',
            borderWidth: 0.5,
            borderColor: p.line,
            opacity: disabled ? 0.5 : 1,
            marginBottom: SP.md,
          },
          style,
        ]}
      >
        {content}
      </TouchableOpacity>
    );
  }
  // Diseño universal (Nelson): el de la píldora activa del navbar —
  // azul #0392FF SÓLIDO, sin degradado ni brillo, texto #C4E9FF,
  // sombra azul suave y press con escala.
  const base = kind === 'danger' ? p.danger : '#0392FF';
  const label = (
    <>
      <Text
        style={{
          fontFamily: FONT.head,
          fontWeight: '600',
          fontSize: 16,
          color: kind === 'danger' ? '#FFFFFF' : '#C4E9FF',
        }}
      >
        {title}
      </Text>
      {arrow && <Arrow color="#FFFFFF" />}
    </>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          borderRadius: R.pill,
          backgroundColor: base,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }, { translateY: pressed && !disabled ? 1 : 0 }],
          shadowColor: base,
          shadowOpacity: 0.38,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
          marginBottom: SP.md,
        },
        style,
      ]}
    >
      <View style={{ ...rowStyle, overflow: 'hidden' }}>{label}</View>
    </Pressable>
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

/** Switch estilo iOS (pista verde/gris, círculo blanco con animación). */
export function IosSwitch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const anim = React.useRef(new RNAnimated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    RNAnimated.timing(anim, { toValue: value ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [value]);
  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#E9E9EA', '#34C759'] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => onValueChange(!value)}>
      <RNAnimated.View style={{ width: 51, height: 31, borderRadius: 16, backgroundColor: trackColor, justifyContent: 'center' }}>
        <RNAnimated.View style={{ width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF', transform: [{ translateX }], shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 3 }} />
      </RNAnimated.View>
    </TouchableOpacity>
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
              backgroundColor: active ? '#0392FF' : 'transparent',
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

/** Bottom sheet fluido con Reanimated: spring al abrir, fade en el backdrop.
 *  Cierre deslizando: gesto (Gesture Handler) SIMULTÁNEO al scroll —
 *  arrastrando hacia abajo desde CUALQUIER parte (cuando el scroll
 *  está arriba) el sheet sigue el dedo y se cierra. Clave en Android:
 *  el scroll DEBE ser el de Gesture Handler (GHScrollView); con el
 *  ScrollView normal de RN el gesto nativo le gana la arena al Pan
 *  y el arrastre dejaba de funcionar en el teléfono (reporte de
 *  Nelson en builds 19/20, aun tras el primer arreglo). */
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
  const scrollOff = useSharedValue(0);

  const onScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollOff.value = e.nativeEvent.contentOffset.y;
  };

  const scrollNative = React.useMemo(() => Gesture.Native(), []);
  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-4, 4])
        .failOffsetX([-28, 28])
        .simultaneousWithExternalGesture(scrollNative)
        .onUpdate((e) => {
          if (scrollOff.value <= 0 && e.translationY > 0) {
            translateY.value = e.translationY;
          }
        })
        .onEnd((e) => {
          if (e.translationY > 70 || e.velocityY > 700) {
            runOnJS(onClose)();
          } else {
            translateY.value = withSpring(0, { damping: 28, stiffness: 320, mass: 0.9 });
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
      <View style={{ flex: 1 }}>
        <Animated.View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' }, backdropStyle]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              {
                backgroundColor: p.card,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                paddingHorizontal: SP.xl,
                paddingTop: SP.sm,
                paddingBottom: insets.bottom + SP.xl,
                maxHeight: '92%',
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
            <GestureDetector gesture={scrollNative}>
            <GHScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              onScroll={onScroll}
            >
              {children}
            </GHScrollView>
            </GestureDetector>
          </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** Barra superior con atrás (para pantallas del stack "Más"). */
export function TopBar({
  title,
  onBack,
  onDark = false,
}: {
  title: string;
  onBack: () => void;
  /** onDark: barra fija sobre la banda oscura (botón de cristal,
   *  título blanco centrado vertical real). */
  onDark?: boolean;
}) {
  const p = useTheme();
  if (onDark) {
    return (
      <View
        style={{
          height: 60,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SP.lg,
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          hitSlop={12}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SP.md,
          }}
        >
          <Icon name="chevronLeft" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: FONT.headBold,
            fontSize: 21,
            lineHeight: 26,
            letterSpacing: -0.4,
            includeFontPadding: false,
            textAlignVertical: 'center',
            color: '#FFFFFF',
          }}
        >
          {title}
        </Text>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.md }}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={12}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: p.card,
          borderWidth: 0.5,
          borderColor: p.bg === '#0B0B0C' ? '#2E2E33' : '#EDEFF2',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SP.md,
          shadowColor: '#6B7A99',
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <Icon name="chevronLeft" size={20} color={p.primary} />
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
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, ScrollView as GHScrollView } from 'react-native-gesture-handler';
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
  Mail as LucideMail,
  Bell as LucideBell,
  House as LucideHome,
  Briefcase as LucideBriefcase,
  ChartColumn as LucideChart,
  Eye as LucideEye,
  EyeOff as LucideEyeOff,
  User as LucideUser,
  Check as LucideCheck,
  Copy as LucideCopy,
  FileText as LucideFileText,
  Coffee as LucideCoffee,
  Scale as LucideScale,
  KeyRound as LucideKeyRound,
} from 'lucide-react-native';
import Svg, { Rect, Path, Line } from 'react-native-svg';

/** Glifo de Instagram (lucide eliminó los iconos de marcas en la
 *  versión instalada): mismo trazo que los iconos lucide — viewBox 24,
 *  stroke 2, puntas redondas. Se usa como un icono más vía `Icon`. */
function InstagramIcon({ size = 24, color = '#000', strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <Path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <Line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </Svg>
  );
}

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
  mail: LucideMail,
  bell: LucideBell,
  home: LucideHome,
  briefcase: LucideBriefcase,
  chart: LucideChart,
  eye: LucideEye,
  eyeOff: LucideEyeOff,
  user: LucideUser,
  check: LucideCheck,
  copy: LucideCopy,
  fileText: LucideFileText,
  coffee: LucideCoffee,
  scale: LucideScale,
  key: LucideKeyRound,
  instagram: InstagramIcon,
};

export function Icon({ name, size = ICON.md, color }: { name: string; size?: number; color: string }) {
  const p = useTheme();
  const Cmp = LUCIDE_ICONS[name] ?? LucideClock;
  return <Cmp size={size} color={color ?? p.text2} strokeWidth={2} />;
}

/* ── Header global: título + botón ajustes a la derecha ────────────── */
export function Header({
  title,
  onSettings,
  onDark = false,
}: {
  title: string;
  onSettings?: () => void;
  /** onDark: el header vive sobre la banda oscura (título blanco,
   *  botón de cristal). */
  onDark?: boolean;
}) {
  const p = useTheme();
  return (
    <View
      style={
        onDark
          ? undefined
          : {
              backgroundColor: p.bg,
              shadowColor: '#6B7A99',
              shadowOpacity: 0.18,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
              zIndex: 10,
            }
      }
    >
      <View
        style={{
          height: 60,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: SP.lg,
        }}
      >
        <Text
          style={{
            fontFamily: FONT.headBold,
            fontSize: 21,
            lineHeight: 26,
            letterSpacing: -0.4,
            // Centrado vertical REAL: Roboto trae relleno interno de
            // fuente que empuja los glifos hacia arriba en su caja;
            // includeFontPadding:false + lineHeight fijo lo corrigen.
            includeFontPadding: false,
            textAlignVertical: 'center',
            color: onDark ? '#FFFFFF' : p.text,
          }}
        >
          {title}
        </Text>
        {onSettings && (
          <TouchableOpacity
            onPress={onSettings}
            hitSlop={12}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: onDark ? 'rgba(255,255,255,0.12)' : p.surface,
              borderWidth: 1,
              borderColor: onDark ? 'rgba(255,255,255,0.18)' : p.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="settings" size={ICON.lg} color={onDark ? '#FFFFFF' : p.text2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
