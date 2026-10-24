/** Modo privado estilo iOS: difumina el contenido (montos) con el
 *  blur gaussiano NATIVO de expo-backdrop — difumina los hijos
 *  mismos, no el fondo. Reemplaza los puntitos "••••" por el número
 *  real borroso, que es como lo hace iOS. */
import React from 'react';
import { GaussianBlurView } from 'expo-backdrop';

export function PrivacyBlur({
  active,
  radius = 11,
  children,
}: {
  active: boolean;
  radius?: number;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  return <GaussianBlurView blurRadius={radius}>{children}</GaussianBlurView>;
}
