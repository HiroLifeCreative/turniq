/** Fila deslizable estilo iOS (recreación de expo-ios-like-swipe-actions,
 *  que exige Reanimated 4; aquí con Gesture Handler 2 + Reanimated 3):
 *  - Deslizar a la IZQUIERDA revela [Duplicar] [Eliminar].
 *  - Deslizar más allá de las acciones (full-swipe) confirma Eliminar.
 *  - Deslizar a la DERECHA revela [Editar].
 *  - Háptico al cruzar el umbral de apertura y al hacer full-swipe.
 *  - Con la fila abierta, tocar la tarjeta la cierra (no abre el detalle). */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from './ui';
import { R, SP, FONT } from '../theme/tokens';

const ACT_W = 74;
const GAP = 6;
const RIGHT_W = ACT_W * 2 + GAP * 3; // duplicar + eliminar
const LEFT_W = ACT_W + GAP * 2; // editar
const FULL_EXTRA = 64;
const SPRING = { damping: 26, stiffness: 300 } as const;

const hapticSel = () => {
  void Haptics.selectionAsync();
};
const hapticWarn = () => {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

function ActionBtn({
  color,
  icon,
  label,
  onPress,
}: {
  color: string;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: ACT_W,
        borderRadius: R.lg,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Icon name={icon as never} size={20} color="#FFFFFF" />
      <Text style={{ fontFamily: FONT.head, fontWeight: '600', fontSize: 10, color: '#FFFFFF' }}>{label}</Text>
    </Pressable>
  );
}

export function SwipeRow({
  children,
  onEdit,
  onDuplicate,
  onDelete,
  labels,
  disabled = false,
  startOpen = false,
}: {
  children: React.ReactNode;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  labels: { edit: string; duplicate: string; delete: string };
  disabled?: boolean;
  /** Solo para la vista previa web: monta la fila ya abierta. */
  startOpen?: boolean;
}) {
  const tx = useSharedValue(0);
  const startX = useSharedValue(0);
  const crossed = useSharedValue(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (startOpen) {
      tx.value = -RIGHT_W;
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOpen]);

  const closeJS = () => setOpen(false);
  const openJS = () => setOpen(true);

  const close = () => {
    tx.value = withSpring(0, SPRING);
    setOpen(false);
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onStart(() => {
      startX.value = tx.value;
      crossed.value = false;
    })
    .onUpdate((e) => {
      const v = startX.value + e.translationX;
      tx.value = Math.max(-RIGHT_W - FULL_EXTRA - 20, Math.min(LEFT_W + 26, v));
      if (!crossed.value && (tx.value <= -RIGHT_W || tx.value >= LEFT_W)) {
        crossed.value = true;
        runOnJS(hapticSel)();
      }
    })
    .onEnd(() => {
      if (tx.value <= -(RIGHT_W + FULL_EXTRA * 0.6)) {
        // Full-swipe: commit de eliminar (el padre pide confirmación)
        tx.value = withSpring(0, SPRING);
        runOnJS(hapticWarn)();
        runOnJS(closeJS)();
        runOnJS(onDelete)();
      } else if (tx.value <= -RIGHT_W / 2) {
        tx.value = withSpring(-RIGHT_W, SPRING);
        runOnJS(openJS)();
      } else if (tx.value >= LEFT_W / 2) {
        tx.value = withSpring(LEFT_W, SPRING);
        runOnJS(openJS)();
      } else {
        tx.value = withSpring(0, SPRING);
        runOnJS(closeJS)();
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));
  const rightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-RIGHT_W, -12], [1, 0], Extrapolation.CLAMP),
  }));
  const leftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [12, LEFT_W], [0, 1], Extrapolation.CLAMP),
  }));

  if (disabled) {
    return <View style={{ marginBottom: SP.sm }}>{children}</View>;
  }

  return (
    <View style={{ marginBottom: SP.sm, position: 'relative' }}>
      {/* Acciones de la derecha (al deslizar a la izquierda) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            flexDirection: 'row',
            gap: GAP,
            paddingLeft: GAP,
          },
          rightStyle,
        ]}
      >
        <ActionBtn
          color="#0392FF"
          icon="copy"
          label={labels.duplicate}
          onPress={() => {
            close();
            onDuplicate();
          }}
        />
        <ActionBtn
          color="#E5484D"
          icon="trash"
          label={labels.delete}
          onPress={() => {
            close();
            onDelete();
          }}
        />
      </Animated.View>
      {/* Acción de la izquierda (al deslizar a la derecha) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            flexDirection: 'row',
            gap: GAP,
            paddingRight: GAP,
          },
          leftStyle,
        ]}
      >
        <ActionBtn
          color="#5B6472"
          icon="edit"
          label={labels.edit}
          onPress={() => {
            close();
            onEdit();
          }}
        />
      </Animated.View>
      {/* Tarjeta deslizable */}
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          {children}
          {open && (
            <Pressable
              onPress={close}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
