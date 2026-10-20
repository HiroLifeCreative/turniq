/** Toast morphing estilo Toastiva/Sileo recreado con Moti + BlurView:
 *  pastilla de vidrio oscuro arriba-centro que nace como círculo con icono,
 *  se EXPANDE con spring al ancho del texto y se recoge sola.
 *  (La librería original exige worklets/gesture-handler que chocan con
 *  nuestro Reanimated; esto logra el mismo efecto sin dependencias.) */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './ui';
import { FONT } from '../theme/tokens';

export type ToastKind = 'success' | 'error' | 'info';
interface ToastData {
  id: number;
  kind: ToastKind;
  title: string;
  desc?: string;
}
interface ToastApi {
  show: (kind: ToastKind, title: string, desc?: string) => void;
  success: (title: string, desc?: string) => void;
  error: (title: string, desc?: string) => void;
  info: (title: string, desc?: string) => void;
}

const ToastCtx = createContext<ToastApi>({
  show: () => undefined,
  success: () => undefined,
  error: () => undefined,
  info: () => undefined,
});
export const useToast = () => useContext(ToastCtx);

const KIND_COLOR: Record<ToastKind, string> = {
  success: '#30A46C',
  error: '#E5484D',
  info: '#0392FF',
};
const KIND_ICON: Record<ToastKind, string> = {
  success: 'check',
  error: 'x',
  info: 'clock',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [contentW, setContentW] = useState(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const show = useCallback((kind: ToastKind, title: string, desc?: string) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setToast({ id: Date.now(), kind, title, desc });
    setExpanded(false);
    setLeaving(false);
    timers.current.push(setTimeout(() => setExpanded(true), 160));
    timers.current.push(setTimeout(() => setLeaving(true), 2500));
    timers.current.push(setTimeout(() => setToast(null), 2820));
  }, []);

  const api: ToastApi = {
    show,
    success: (title, desc) => show('success', title, desc),
    error: (title, desc) => show('error', title, desc),
    info: (title, desc) => show('info', title, desc),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {toast && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: insets.top + 10,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 999,
          }}
        >
          <MotiView
            key={toast.id}
            from={{ opacity: 0, scale: 0.6, translateY: -14 }}
            animate={{
              opacity: leaving ? 0 : 1,
              scale: leaving ? 0.7 : 1,
              translateY: leaving ? -10 : 0,
              width: expanded && !leaving && contentW > 0 ? contentW : 46,
            }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            style={{
              height: 46,
              borderRadius: 999,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
              backgroundColor: 'rgba(18,18,22,0.88)',
            }}
          >
            <BlurView intensity={50} tint="dark" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', height: 46, paddingLeft: 8, paddingRight: 16 }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: KIND_COLOR[toast.kind],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 9,
                }}
              >
                <Icon name={KIND_ICON[toast.kind] as never} size={15} color="#FFFFFF" />
              </View>
              <MotiView animate={{ opacity: expanded ? 1 : 0 }} transition={{ type: 'timing', duration: 160 }}>
                <Text style={{ fontFamily: FONT.head, fontWeight: '700', fontSize: 13.5, color: '#FFFFFF' }} numberOfLines={1}>
                  {toast.title}
                </Text>
                {toast.desc ? (
                  <Text style={{ fontFamily: FONT.mono, fontSize: 10.5, color: 'rgba(255,255,255,0.6)' }} numberOfLines={1}>
                    {toast.desc}
                  </Text>
                ) : null}
              </MotiView>
            </View>
          </MotiView>
          {/* Medidor invisible del ancho natural del contenido */}
          <View
            style={{ position: 'absolute', opacity: 0, flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 16 }}
            onLayout={(e) => setContentW(Math.min(340, Math.ceil(e.nativeEvent.layout.width)))}
          >
            <View style={{ width: 30, marginRight: 9 }} />
            <View>
              <Text style={{ fontFamily: FONT.head, fontWeight: '700', fontSize: 13.5 }} numberOfLines={1}>
                {toast.title}
              </Text>
              {toast.desc ? (
                <Text style={{ fontFamily: FONT.mono, fontSize: 10.5 }} numberOfLines={1}>
                  {toast.desc}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      )}
    </ToastCtx.Provider>
  );
}
