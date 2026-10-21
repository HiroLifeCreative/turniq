/** Historial de versiones (changelog) — del build más nuevo al más viejo.
 *  RUTINA DE VERSIONADO al lanzar un build nuevo:
 *  1. app.json: sube `version` (parche +1; menor +1 si trae una función
 *     grande) y `android.versionCode` (+1 siempre, coincide con el build).
 *  2. Agrega la entrada del build ARRIBA de esta lista y en CHANGELOG.md.
 *  3. Las etiquetas de versión en la app se leen solas desde app.json. */
export interface ChangelogEntry {
  build: number;
  version: string;
  fecha: string; // YYYY-MM-DD
  notas: { es: string[]; en: string[] };
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    build: 21,
    version: '1.1.3',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Google Calendar y Gmail: conexión ARREGLADA — Google bloqueaba el acceso (error 400) porque al cliente Android le faltaba activar el esquema de URI personalizado; ya está activado en tu consola y la app usa la redirección correcta',
        'El engranaje del encabezado ahora abre el menú Más en todas las pantallas (antes te llevaba a Ajustes)',
        'Sheets: deslizar para cerrar ya funciona bien en Android — el scroll interno ahora usa el sistema de gestos correcto',
        'Alarma: canales de sonido nuevos sin conflictos (antes la alarma podía quedarse sin sonido) y el permiso de notificaciones ahora se pide desde Ajustes con el diálogo del sistema — actívalo para que la alarma suene',
      ],
      en: [
        'Google Calendar & Gmail: connection FIXED — Google blocked sign-in (error 400) because the Android client was missing the enabled custom URI scheme; it is now enabled in your console and the app uses the correct redirect',
        'The header gear now opens the More menu on every screen (before it took you to Settings)',
        'Sheets: swipe-to-close now works properly on Android — the inner scroll now uses the right gesture system',
        'Alarm: new conflict-free sound channels (before, the alarm could end up silent) and the notification permission is now requested from Settings with the system dialog — enable it so the alarm can ring',
      ],
    },
  },
  {
    build: 20,
    version: '1.1.2',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Horas extra POR TRABAJO: el límite semanal se aplica a las horas de cada empleo por separado, ya no a la suma de todos tus trabajos — el dinero ahora cuadra',
        'PIN del reloj por trabajo (opcional): guárdalo en cada empleo y Turniq te lo muestra al marcar entrada y en el recordatorio del turno',
        'Arreglado el ojo del neto: volver a mostrar el dinero con PIN ya funciona en Android (antes solo respondía con biometría)',
        'Alarma: la prueba suena a los 6 segundos para que alcances a cerrar la app, y Ajustes te avisa si faltan los permisos de notificaciones o de batería',
        'Conectar Google Calendar ahora abre el selector de tu cuenta de Google',
        'Menú Más rediseñado: iconos limpios sin cuadros de colores, y Ajustes ya no duplica opciones',
        'Las ventanas (sheets) se cierran deslizando en cualquier parte, sin fallar',
      ],
      en: [
        'Overtime PER JOB: the weekly limit now applies to each job on its own, not to all your jobs added together — your money adds up now',
        'Clock PIN per job (optional): save the PIN you punch at each workplace and Turniq shows it when you clock in and in the shift reminder',
        'Fixed the net eye toggle: showing your money again with a PIN now works on Android (before it only responded to biometrics)',
        'Alarm: the test rings after 6 seconds so you can close the app first, and Settings now warns you if notification or battery permissions are missing',
        'Connecting Google Calendar now opens your Google account picker',
        'More menu redesigned: clean icons with no colored boxes, and Settings no longer duplicates options',
        'Sheets now close by swiping anywhere, reliably',
      ],
    },
  },
  {
    build: 19,
    version: '1.1.1',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Conexión con Google rehecha: inicio de sesión oficial, sin pegar códigos raros',
        'Sincronización automática con Google Calendar: al crear, editar o borrar un turno, su evento se crea, se actualiza o se borra solo',
        'Gmail ya no muestra errores sin estar conectado, y Calendario ya no se cierra',
      ],
      en: [
        'Google connection rebuilt: official sign-in, no pasting codes',
        'Automatic Google Calendar sync: when you create, edit or delete a shift, its event is created, updated or deleted on its own',
        'Gmail no longer shows errors while disconnected, and Calendar no longer closes',
      ],
    },
  },
  {
    build: 18,
    version: '1.1.0',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Icono nuevo: fondo oscuro con la T y el punto azul, a juego con la pantalla de arranque',
        'Plantillas: pantalla nueva para crear, editar, eliminar y asignar plantillas a un día',
        'Ajustes: sección Google con acceso directo a Calendario Google y Gmail',
        'Importar un respaldo ahora fusiona tus datos sin borrar nada, y acepta archivos de Mis Horarios',
        'Los totales de dinero muestran solo lo que ya trabajaste (Inicio, Semana, Ganancias, Calendario, Estadísticas y Reportes)',
        'Turnos que cruzan medianoche: se marcan con «+1 día» y las horas se calculan bien',
        'El menú Más ahora sí se alcanza al volver desde Ajustes',
        'Novedades: esta pantalla con el historial de versiones',
      ],
      en: [
        'New icon: dark background with the T and the blue dot, matching the splash screen',
        'Templates: new screen to create, edit, delete and assign templates to a day',
        'Settings: Google section with direct access to Google Calendar and Gmail',
        'Importing a backup now merges your data without deleting anything, and accepts Mis Horarios files',
        'Money totals now show only what you have already worked (Home, Week, Earnings, Calendar, Stats and Reports)',
        'Overnight shifts: marked with "+1 day" and hours are calculated correctly',
        'The More menu is now reachable when going back from Settings',
        "What's new: this version history screen",
      ],
    },
  },
  {
    build: 17,
    version: '1.0.0',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Alarma real de Android: suena a pantalla completa aunque la app esté cerrada, con sonidos a elegir y posponer',
        'Aviso en pantalla cuando estás trabajando y recordatorio si olvidas marcar la salida',
        'Diseño unificado: botones sólidos, navegación más compacta y animaciones suaves',
      ],
      en: [
        'Real Android alarm: rings full-screen even with the app closed, with sounds to choose from and snooze',
        'On-screen notice while you are working and a reminder if you forget to clock out',
        'Unified design: solid buttons, more compact navigation and smooth animations',
      ],
    },
  },
  {
    build: 15,
    version: '1.0.0',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Diseño unificado en toda la app: tarjetas redondeadas, franja superior oscura y barra inferior de vidrio',
        'Desliza un turno a los lados para duplicarlo, editarlo o eliminarlo',
        'Avisos (toasts) nuevos al guardar, duplicar o borrar',
      ],
      en: [
        'Unified design across the app: rounded cards, dark top band and glass bottom bar',
        'Swipe a shift sideways to duplicate, edit or delete it',
        'New toast notices when saving, duplicating or deleting',
      ],
    },
  },
  {
    build: 13,
    version: '1.0.0',
    fecha: '2026-10-19',
    notas: {
      es: [
        'Corrección importante: tus datos ya no se borran al actualizar la app',
      ],
      en: [
        'Important fix: your data is no longer wiped when updating the app',
      ],
    },
  },
];
