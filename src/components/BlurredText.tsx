/** Texto difuminado DE VERDAD con filtro SVG (feGaussianBlur).
 *
 *  Por qué existe: el overlay de expo-blur NO difumina en el Android
 *  de Nelson (Android 16) — solo oscurece el texto, que queda legible
 *  (reporte con captura, 24 oct 2026: $910.71 se leía apagado). El
 *  filtro SVG sí difumina los glifos tanto en Android como en web,
 *  así que el preview muestra el efecto tal cual se verá en el teléfono.
 *  Cada instancia usa un id de filtro único (en web todos los SVG
 *  comparten el DOM). */
import React from 'react';
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
  const width = Math.ceil(text.length * fontSize * 0.62) + 28;
  const height = Math.ceil(fontSize * 1.3);
  return (
    <Svg width={width} height={height}>
      <Defs>
        <Filter id={id} x="-30%" y="-30%" width="160%" height="160%">
          <FeGaussianBlur stdDeviation={std} />
        </Filter>
      </Defs>
      <SvgText
        filter={`url(#${id})`}
        fill={color}
        fontSize={fontSize}
        fontFamily={FONT.headBold}
        fontWeight="700"
        x={14}
        y={fontSize}
      >
        {text}
      </SvgText>
    </Svg>
  );
}
