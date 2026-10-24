/** Versión real de la app, leída de app.json vía expo-constants.
 *  Única fuente de verdad: al lanzar un build, sube `version` y
 *  `android.versionCode` en app.json y todas las etiquetas se actualizan. */
import Constants from 'expo-constants';

export const APP_VERSION: string = Constants.expoConfig?.version ?? '1.1.0';
export const APP_BUILD: number =
  (Constants.expoConfig as { android?: { versionCode?: number } } | null)?.android?.versionCode ?? 27;
/** Etiqueta corta tipo "v1.1.0 (18)". */
export const APP_VERSION_LABEL = `v${APP_VERSION} (${APP_BUILD})`;
