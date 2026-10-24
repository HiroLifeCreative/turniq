/** Web: expo-backdrop es nativo (Android/iOS). En el preview web el
 *  contenido se atenúa en vez de difuminarse — el blur real solo se
 *  ve en el teléfono. */
import React from 'react';
import { View } from 'react-native';

export function PrivacyBlur({
  active,
  children,
}: {
  active: boolean;
  radius?: number;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  return <View style={{ opacity: 0.15 }}>{children}</View>;
}
