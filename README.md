# Turniq

Registro de horarios de trabajo por semana. React Native con Expo (TypeScript estricto). **Nada de WebView**: UI 100% nativa.

- **Nombre**: Turniq · **Slug**: `turniq` · **Paquete Android**: `com.hirolifecreative.turniq`
- **Color primario**: `#0064E0` (azul Meta), siempre texto blanco sobre azul.
- **Semana**: lunes–domingo. La semana anterior se **bloquea** para edición pasado el lunes (1 día de gracia).

## Cómo correr

```bash
cd ~/workspace/turniq-app
bun install
bun x expo start        # escanea el QR con Expo Go
```

> Se usa `bun` (npm falla en este filesystem). Requiere Expo SDK ~52.

## Qué incluye

- **Pestañas**: **Inicio** (saludo, clock entrada/salida, carrusel de próximos turnos, resumen de ganancias, turnos de hoy), **Semana** (columna día + tarjetas con horas en formato h/min y decimal, estados Horario pasado/Próximamente/En curso, menú ⋮ por turno: editar/duplicar/eliminar, totales, duplicar semana, candado), **Trabajos**, **Ganancias** (por semana/trabajo/mes, $/hora, comparativa vs anterior, meta semanal).
- **Más** (modal, botón ⚙ en Inicio): Reportes, Ajustes (incluye tu nombre para el saludo), Calendario Google, Gmail.
- **Trabajos**: CRUD con color, sueldo/hora, % taxes y estaciones por trabajo.
- **Turnos**: crear/editar/eliminar en bottom sheet; hora de entrada/salida, descanso, propinas, bono, notas. Botón grande "Marcar entrada ahora" / "Marcar salida".
- **Cálculos**: horas extra configurables (default 40h ×1.5), bruto y neto por turno/semana/mes.
- **Notificaciones** (nativo): aviso 60/30/0 min antes de cada turno + "¿olvidaste marcar salida?" a las 10h de un turno abierto.
- **Reportes**: por semana/mes/año, exportar **PDF** y **CSV**.
- **i18n completo** ES/EN, **tema claro/oscuro**, **PIN de 4 dígitos** + biometría opcional.
- **Google Calendar**: OAuth (expo-auth-session), crea/actualiza eventos por turno. Tokens en SecureStore.
- **Gmail**: lista correos de nómina (`pay stub OR payroll OR nómina OR recibo de pago`) como referencia.
- Datos locales con **Zustand + MMKV** (cifrado) en nativo, `localStorage` en web.

## Pendiente / honesto

- **Widget Android**: NO implementado — imposible en Expo managed. Requiere `expo prebuild` + módulo nativo (AppWidgetProvider). En su lugar, el botón de marcar entrada/salida está bien visible en la pestaña Hoy.
- **Google OAuth Client ID**: hay que crearlo en Google Cloud Console (tipo Android, paquete `com.hirolifecreative.turniq`) y pegarlo en la pantalla Calendario. Sin eso, Calendar/Gmail muestran su estado honesto sin funcionar.
- **APK**: ver "APK release" abajo. iOS se compila después (EAS o Mac con Xcode).
- **Verificación visual**: hooks de prueba `turniq-test-tab` / `turniq-test-screen` en `src/navigation/Root.tsx` (solo leen `localStorage` en web; sin efecto en producción).

## APK release (Android)

```bash
cd ~/workspace/turniq-app
bun x expo prebuild --platform android   # genera android/
cd android
JAVA_HOME=~/workspace/tools/jdk21 ./gradlew assembleRelease
# APK en: android/app/build/outputs/apk/release/app-release.apk
```

El proxy ya está en `~/.gradle/gradle.properties`. Si Gradle falla por red, no reintentar en loop: la alternativa es **EAS Build** (`eas build -p android --profile production`, requiere cuenta de Expo).

## Estructura

```
App.tsx                    # fuentes, PIN gate, programación de avisos
src/
  theme/tokens.ts          # paletas claro/oscuro, espaciados, fuentes
  i18n.ts                  # strings ES/EN
  lib/dates.ts             # semana lun–dom, bloqueo, formatos
  lib/calc.ts              # horas, extra, bruto/neto
  store.ts                 # Zustand persistido (jobs, shifts, settings)
  services/
    storage.ts             # MMKV nativo / localStorage web
    notifications.ts       # avisos locales programados
    google.ts              # OAuth, Calendar, Gmail
    export.ts              # PDF + CSV
  components/
    ui.tsx                 # Screen, Card, Btn píldora, Field, Sheet, Seg, Confirm
    ShiftForm.tsx          # bottom sheet de turno
  screens/                 # Today, Week, Earnings, More, Jobs, Reports,
                           # Settings, Calendar, Gmail, PinLock
  navigation/              # bottom tabs + stack "Más"
assets/
  fonts/                   # Switzer (500/700/800) + JetBrains Mono, locales
  icon.png                 # icono (derivado del logo del usuario)
```

## Flujo de prueba

1. Más → Trabajos → crear trabajo (sueldo, tax, estaciones).
2. Inicio → "Marcar entrada ahora" → aparece "Turno abierto" + "Marcar salida".
3. Semana → ver el turno en el día, totales y duplicar.
4. Ganancias → verificar bruto/neto, $/hora, comparativa y meta.
