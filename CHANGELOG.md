# Changelog — Turniq
## v1.1.4 (build 22) — 2026-10-23
- **Estadísticas (reporte de Nelson)**: todos sus totales usaban umbral infinito (1e9) — la hora extra no existía ahí y nunca cuadraba con Semana/Inicio. Nuevo `calcRangeTotals`/`calcRangeShiftPay` en calc.ts: agrupa por (trabajo × semana lun–dom), aplica el umbral por grupo y reparte el recargo entre los turnos del grupo ∝ horas. StatsScreen lo usa en totales, desglose por día, trabajo top y barras de 6 meses. Además el "promedio por semana" dividía entre MESES (`fecha.slice(0,7)`) — ahora cuenta semanas reales con `weekKey`.
- **Editar entrada en vivo (pedido de Nelson)**: botón "Editar entrada · HH:MM" bajo Marcar salida cuando hay turno en curso; hoja con TimeField + chips −30/−15/−5/+5 y texto guía; al guardar escribe `horaEntradaReal` vía updateShift y el anillo/contador/neto se recalculan solos. Strings nuevas ES/EN (`inicio.editEntry/realEntry/editEntryHint`, `toast.entryFixed`).
- **Realtime en sheets (pedido de Nelson)**: `ShiftDetailSheet` ya no recibe el objeto turno (copia congelada al tocar) — recibe `shiftId` y selecciona el turno VIVO del store; Home/Week guardan solo el id. Editar las horas trabajadas dentro de la hoja ahora se refleja al instante en la misma hoja abierta.

## v1.1.3 (build 21) — 2026-10-20
- **Google ARREGLADO (error 400 invalid_request)**: la página de error de Google lo decía codificado — "Custom URI scheme is not enabled for your Android client". Se activó "Habilitar el esquema de URI personalizado" en Configuración avanzada del cliente Turniq Android (Auth Platform, verificado persistente) y la app fija `redirectUri` al esquema del paquete (`com.hirolifecreative.turniq:/oauthredirect`); antes AuthSession elegía el esquema "turniq" del array de app.json. Verificado en vivo: la URL de autorización ya llega al flujo normal de inicio de sesión.
- **Engranaje → Más**: los 4 tabs abrían Ajustes vía estado anidado [MasHome, Settings]; ahora abren MasHome.
- **Sheets**: el scroll interno ahora es `GHScrollView` de gesture-handler (el ScrollView de RN le ganaba la arena de gestos al Pan en Android — por eso deslizar-para-cerrar fallaba en el teléfono pese a dos arreglos previos). Umbral de cierre 70px/700 vel.
- **Alarma sin sonido (causa probable)**: expo-notifications creaba los canales `turniq-alarma-*` y Android los congela; el receiver nativo los reutilizaba sin poder poner su sonido USAGE_ALARM. El receiver ahora usa canales propios `turniq-sistema-*`. Además Ajustes → Notificaciones "Permitir" ahora pide el permiso con el diálogo del sistema antes de mandar a Ajustes.
## v1.1.2 (build 20) — 2026-10-20
- **Horas extra POR TRABAJO**: el umbral semanal se aplica a cada empleo por separado (sueldo e impuesto propios), no a la suma de todos los trabajos — fin del dinero que no cuadraba. Barra de hora extra en Semana ahora por trabajo; totales de mes/día sin extra fantasma.
- **PIN del reloj por trabajo** (opcional, `Job.pinMarcaje`): campo en el formulario del empleo, se muestra en la lista de trabajos, en el recordatorio del próximo turno y en la ventana de marcar entrada.
- **Bug del ojo arreglado**: desbloquear el neto con PIN usaba `Alert.prompt` (solo iOS, en Android no hacía nada) — ahora abre el PinLock en un Modal; la biometría sigue igual y si falla cae al PIN.
- **Alarma**: prueba a los 6 s (da tiempo a cerrar la app) con toasts de éxito/error; nuevas filas en Ajustes con el estado de permisos de **Notificaciones** y **Batería sin restricción** (módulo nativo: `isIgnoringBatteryOptimizations` + abrir ajustes de batería).
- **Google**: `selectAccount: true` — al conectar se abre el selector de cuenta de Google.
- **Más**: menú rediseñado con iconos Lucide sin contenedores de colores; **Ajustes** sin duplicados (fuera la sección Google y las filas de Términos/Café de Acerca de).
- **Sheets**: gesto de cerrar reescrito con Gesture Handler simultáneo al scroll nativo — deslizar ya no se traba.

Historial de versiones por build (del más nuevo al más viejo).
La misma lista vive dentro de la app en **Ajustes → Acerca de → Novedades**
(`src/lib/changelog.ts`).

**Rutina de versionado al lanzar un build:** (1) en `app.json` sube `version`
(parche +1; menor +1 si trae una función grande) y `android.versionCode`
(+1 siempre — coincide con el número de build); (2) agrega la entrada en
este archivo y en `src/lib/changelog.ts`. Las etiquetas de versión dentro
de la app se leen solas desde `app.json`.

## v1.1.1 · Build 19 — 2026-10-20
- Conexión con Google rehecha: inicio de sesión oficial, sin pegar códigos raros
- Sincronización automática con Google Calendar: al crear, editar o borrar un turno, su evento se crea, se actualiza o se borra solo
- Gmail ya no muestra errores sin estar conectado, y Calendario ya no se cierra

## v1.1.0 · Build 18 — 2026-10-20
- Icono nuevo: fondo oscuro con la T y el punto azul, a juego con la pantalla de arranque
- Plantillas: pantalla nueva para crear, editar, eliminar y asignar plantillas a un día
- Ajustes: sección Google con acceso directo a Calendario Google y Gmail
- Importar un respaldo ahora fusiona tus datos sin borrar nada, y acepta archivos de Mis Horarios
- Los totales de dinero muestran solo lo que ya trabajaste (Inicio, Semana, Ganancias, Calendario, Estadísticas y Reportes)
- Turnos que cruzan medianoche: se marcan con «+1 día» y las horas se calculan bien
- El menú Más ahora sí se alcanza al volver desde Ajustes
- Novedades: pantalla con el historial de versiones

## v1.0.0 · Build 17 — 2026-10-20
- Alarma real de Android: suena a pantalla completa aunque la app esté cerrada, con sonidos a elegir y posponer
- Aviso en pantalla cuando estás trabajando y recordatorio si olvidas marcar la salida
- Diseño unificado: botones sólidos, navegación más compacta y animaciones suaves

## v1.0.0 · Build 15 — 2026-10-20
- Diseño unificado en toda la app: tarjetas redondeadas, franja superior oscura y barra inferior de vidrio
- Desliza un turno a los lados para duplicarlo, editarlo o eliminarlo
- Avisos (toasts) nuevos al guardar, duplicar o borrar

## v1.0.0 · Build 13 — 2026-10-19
- Corrección importante: tus datos ya no se borran al actualizar la app
