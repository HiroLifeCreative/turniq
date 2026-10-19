/** Tokens visuales de Turniq — identidad de plantilla-nativos.html en patrones nativos. */
export const BLUE = '#0064E0';

export interface Palette {
  bg: string;
  surface: string;
  card: string;
  text: string;
  text2: string;
  text3: string;
  line: string;
  primary: string;
  onPrimary: string;
  danger: string;
  success: string;
  warning: string;
  shadow: string;
}

export const light: Palette = {
  bg: '#FFFFFF',
  surface: '#F5F6F8',
  card: '#FFFFFF',
  text: '#0C0E13',
  text2: '#4A5160',
  text3: '#646B7A',
  line: 'rgba(12,14,19,0.09)',
  primary: BLUE,
  onPrimary: '#FFFFFF',
  danger: '#D13438',
  success: '#0E7C3E',
  warning: '#B77900',
  shadow: '#0C0E13',
};

export const dark: Palette = {
  bg: '#0B0B0C',
  surface: '#141416',
  card: '#17171A',
  text: '#F4F4F5',
  text2: '#A6A6B0',
  text3: '#8A8A95',
  line: 'rgba(255,255,255,0.10)',
  primary: BLUE,
  onPrimary: '#FFFFFF',
  danger: '#F04438',
  success: '#32C46D',
  warning: '#F5A623',
  shadow: '#000000',
};

export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const R = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 26, pill: 999 } as const;

/** Escala tipográfica fija — 6 niveles, nada supera Display. */
export const TYPE = {
  display: 34, // héroe dinero
  h1: 24,      // títulos de pantalla
  h2: 18,      // títulos de tarjeta/sección
  body: 15,    // texto principal
  caption: 13, // texto secundario
  mono: 11,    // etiquetas, badges
} as const;

/** Tamaños de icono fijos. */
export const ICON = { sm: 16, md: 20, lg: 24 } as const;

/** Fuentes: Switzer (titulares) + JetBrains Mono (etiquetas/números). */
export const FONT = {
  head: 'Switzer',
  headBold: 'SwitzerBold',
  mono: 'JetBrainsMono',
  monoBold: 'JetBrainsMonoBold',
} as const;
