/** Modo privado estilo iOS: el monto queda tras un cristal esmerilado
 *  (BlurView de expo-blur, librería ya probada en 23 builds).
 *
 *  NOTA (24 oct 2026): la primera versión usaba expo-backdrop
 *  (GaussianBlurView, difumina el texto mismo), pero el build 24 de
 *  Codemagic FALLÓ por eso: expo-backdrop 0.1.3 usa el formato nuevo
 *  de módulos (`plugins { id 'expo-module-gradle-plugin' }`) que solo
 *  resuelven las plantillas de Expo SDK 54+; en nuestro SDK 52 el
 *  settings.gradle generado no tiene repositorio para ese plugin y
 *  expo-modules-core 2.2.3 ni siquiera trae el directorio maven del
 *  plugin. El blur gaussiano real queda pendiente de una subida de
 *  SDK; mientras tanto el cristal esmerilado cumple la misma función
 *  (el monto es ilegible tras él). */
import React from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';

export function PrivacyBlur({
  active,
  radius = 12,
  children,
}: {
  active: boolean;
  radius?: number;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  return (
    <View style={{ borderRadius: radius, overflow: 'hidden' }}>
      {children}
      <BlurView
        intensity={100}
        tint="dark"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </View>
  );
}
