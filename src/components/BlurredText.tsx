/** Texto difuminado DE VERDAD con filtro SVG (feGaussianBlur).
 *
 *  Por qué existe: el overlay de expo-blur NO difumina en el Android
 *  de Nelson (Android 16) — solo oscurece el texto, que queda legible
 *  (reporte con captura, 24 oct 2026: $910.71 se leía apagado). El
 *  filtro SVG sí difumina los glifos tanto en Android como en web,
 *  así que el preview muestra el efecto tal cual se verá en el teléfono.
 *  Cada instancia usa un id de filtro único (en web todos los SVG
 *  comparten el DOM).
 *
 *  Bordes suaves (24 oct 2026, segundo reporte): el primer intento
 *  dejaba el desenfoque con borde duro — la región del filtro era
 *  corta en vertical y el lienzo SVG era justo del tamaño del texto,
 *  así que el blur se cortaba de golpe. Ahora el SVG es más grande
 *  que la caja (margen de 3σ por lado) y va en posición absoluta
 *  dentro de una caja del tamaño original: el desenfoque se desvanece
 *  completo dentro del lienzo y la pantalla NO cambia de tamaño al
 *  activar el modo privado. */
import React from 'react';
import { View } from 'react-native';
import Svg, { Text as SvgText, Defs, Filter, FeGaussianBlur } from 'react-native-svg';
import { FONT } from '../theme/tokens';

export function BlurredText({
  text,
  fontSize,
  color,
}: {
  text: string;
  fontSize: number;
  color: string;
}) {
  const id = `blur-${React.useId().replace(/:/g, '')}`;
  const std = Math.max(6, fontSize * 0.28);
  // Margen de 3σ: a esa distancia el gaussiano ya cayó al ~1%, el corte es invisible.
  const pad = Math.ceil(std * 3);
  const layoutW = Math.ceil(text.length * fontSize * 0.62) + 28;
  const layoutH = Math.ceil(fontSize * 1.3);
  const W = layoutW + pad * 2;
  const H = layoutH + pad * 2;
  return (
    <View style={{ width: layoutW, height: layoutH }}>
      <Svg
        style={{ position: 'absolute', left: -pad, top: -pad }}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <Defs>
          <Filter id={id} filterUnits="userSpaceOnUse" x={-pad} y={-pad} width={W + pad * 2} height={H + pad * 2}>
            <FeGaussianBlur stdDeviation={std} />
          </Filter>
        </Defs>
        <SvgText
          filter={`url(#${id})`}
          fill={color}
          fontSize={fontSize}
          fontFamily={FONT.headBold}
          fontWeight="700"
          x={14 + pad}
          y={fontSize + pad}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
}
