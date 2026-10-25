/** Historial de versiones (changelog) — del build más nuevo al más viejo.
 *  RUTINA DE VERSIONADO al lanzar un build nuevo:
 *  1. app.json: sube `version` (parche +1; menor +1 si trae una función
 *     grande) y `android.versionCode` (+1 siempre, coincide con el build).
 *  2. Agrega la entrada del build ARRIBA de esta lista y en CHANGELOG.md.
 *  3. Las etiquetas de versión en la app se leen solas desde app.json.
 *  NOTA DE ESTILO (24 oct 2026): las notas son profesionales y neutras —
 *  sin segunda persona, sin citas, sin detalles internos de
 *  implementación y sin énfasis con mayúsculas. La fecha siempre va en
 *  formato YYYY-MM-DD: la pantalla Novedades la parsea como tal. */
export interface ChangelogEntry {
  build: number;
  version: string;
  fecha: string; // YYYY-MM-DD
  notas: { es: string[]; en: string[] };
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    build: 28,
    version: '1.1.10',
    fecha: '2026-10-24',
    notas: {
      es: [
        'Animación de los iconos de la barra de navegación al tocarlos: cada pestaña responde con un efecto de escala y un leve balanceo, también al tocar la pestaña activa.',
        'Control de privacidad en la tarjeta principal: el dinero se oculta con ••••• y se muestra de nuevo al tocar el botón, sin desenfoque y sin solicitar PIN.',
        'Edición de horas trabajadas: ahora permite modificar la fecha del turno y eliminarlo, con confirmación previa.',
        'Cierre automático: si un turno queda abierto, se cierra solo a las 4:00 a.m. del día siguiente; la hora tope se cambia en Ajustes → Trabajo.',
        'Fechas de entrada y salida en el editor del turno: cada turno guarda su fecha de salida de forma explícita y los turnos que terminan otro día muestran esa fecha en lugar de un marcador.',
        'Estado del turno en Semana: un turno ya cerrado se muestra como pasado y uno abierto con entrada marcada se muestra en curso, según sus horas reales.',
      ],
      en: [
        'Navigation bar icons now animate on tap: each tab responds with a scale effect and a subtle wiggle, including the active tab.',
        'Privacy control on the main card: amounts are hidden behind ••••• and revealed by tapping the button, without blur and without requiring a PIN.',
        'Worked-hours editing: the shift date can now be changed and the shift deleted, with prior confirmation.',
        'Auto close: if a shift is left open, it closes on its own at 4:00 a.m. the next day; the cutoff time can be changed in Settings → Work.',
        'Start and end dates in the shift editor: each shift now stores its end date explicitly, and shifts ending on another day show that date instead of a marker.',
        'Week shift status: a closed shift now shows as past and an open shift with a clock-in shows as in progress, based on actual hours.',
      ],
    },
  },
  {
    build: 27,
    version: '1.1.9',
    fecha: '2026-10-24',
    notas: {
      es: [
        'Se retiró el efecto de desenfoque del modo privado: los montos se muestran siempre con claridad. El botón de privacidad y el interruptor de Dinero oculto se eliminaron; el bloqueo de la app con PIN no se modificó.',
      ],
      en: [
        'The private-mode blur effect was removed: amounts are always shown clearly. The privacy button and the Hidden money switch were removed; the app PIN lock was not modified.',
      ],
    },
  },
  {
    build: 26,
    version: '1.1.8',
    fecha: '2026-10-24',
    notas: {
      es: [
        'Corrección: el contenido de los chips de dinero ya no se desborda de su borde redondeado.',
        'El pie de la pantalla Más ahora respeta el idioma seleccionado en la app.',
      ],
      en: [
        'Fix: money chip content no longer overflows its rounded border.',
        'The More screen footer now follows the app language.',
      ],
    },
  },
  {
    build: 25,
    version: '1.1.7',
    fecha: '2026-10-24',
    notas: {
      es: [
        'Botón de privacidad ampliado, con las etiquetas Mostrar y Ocultar.',
        'Nuevo interruptor «Dinero oculto» en Ajustes → Seguridad.',
        'Nueva pantalla Permisos (Más → Permisos): muestra el estado de cada permiso requerido y permite otorgarlo, además de incluir una prueba de alarma de 6 segundos.',
        'Pantalla Permisos: se agregaron los permisos de alarmas y recordatorios y de mostrar sobre otras apps; la lista queda completa con 5 permisos en Android.',
        'Pie de la pantalla Más: icono de Instagram con enlace al perfil, crédito de desarrollo y aviso de derechos reservados.',
        'Pie de la pantalla Más: se retiró el texto del usuario de Instagram; el icono conserva su enlace.',
      ],
      en: [
        'Privacy button enlarged, labeled Show and Hide.',
        'New “Hidden money” switch in Settings → Security.',
        'New Permissions screen (More → Permissions): shows the status of each required permission with an option to grant it, plus a 6-second alarm test.',
        'Permissions screen: alarm and reminder permission and display-over-other-apps permission added; the list is complete with 5 permissions on Android.',
        'More screen footer: Instagram icon linking to the profile, development credit and copyright notice.',
        'More screen footer: Instagram handle text removed; the icon keeps its link.',
      ],
    },
  },
  {
    build: 24,
    version: '1.1.6',
    fecha: '2026-10-24',
    notas: {
      es: [
        'Modo privado: el desenfoque ahora oculta los montos por completo, con bordes suaves.',
        'Semana: se retiró el botón flotante (+). Agregar turno sigue disponible en cada día, duplicar semana al final de la pantalla y plantillas en Más.',
        'Ganancias: la lista por trabajo muestra su semana, con sus propias flechas de navegación, e incluye la hora extra por trabajo.',
      ],
      en: [
        'Private mode: blur now fully hides amounts, with soft edges.',
        'Week: floating (+) button removed. Adding a shift remains available on each day, duplicating a week at the bottom of the screen, and templates in More.',
        'Earnings: the per-job list shows its week, with its own navigation arrows, and includes per-job overtime.',
      ],
    },
  },
  {
    build: 23,
    version: '1.1.5',
    fecha: '2026-10-24',
    notas: {
      es: [
        'Modo privado: los montos se muestran con desenfoque estilo iOS en lugar de puntos.',
        'Semana: botón flotante (+) con acciones rápidas: agregar turno, duplicar semana y plantillas.',
        'Términos: secciones plegables para una lectura más cómoda.',
      ],
      en: [
        'Private mode: amounts are shown with iOS-style blur instead of dots.',
        'Week: floating (+) button with quick actions: add shift, duplicate week and templates.',
        'Terms: collapsible sections for easier reading.',
      ],
    },
  },
  {
    build: 22,
    version: '1.1.4',
    fecha: '2026-10-23',
    notas: {
      es: [
        'Estadísticas: la hora extra se aplica por trabajo y por semana, y el promedio semanal se calcula sobre semanas reales.',
        'Editar entrada en vivo: con un turno en curso, permite corregir la hora real de entrada con atajos de −30, −15, −5 y +5 minutos; el contador y el neto estimado se recalculan al instante.',
        'Detalle del turno en tiempo real: los cambios de hora se reflejan sin cerrar y volver a abrir la hoja.',
      ],
      en: [
        'Statistics: overtime is applied per job and per week, and the weekly average is calculated over real weeks.',
        'Live clock-in editing: with a shift in progress, the actual clock-in time can be corrected with −30, −15, −5 and +5 minute shortcuts; the timer and estimated net recalculate instantly.',
        'Shift detail in real time: time changes are reflected without closing and reopening the sheet.',
      ],
    },
  },
  {
    build: 21,
    version: '1.1.3',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Google Calendar y Gmail: conexión restablecida con la redirección correcta.',
        'El engranaje del encabezado abre el menú Más en todas las pantallas.',
        'Hojas inferiores: el gesto de deslizar para cerrar funciona correctamente en Android.',
        'Alarma: nuevos canales de sonido y solicitud del permiso de notificaciones desde Ajustes con el diálogo del sistema.',
      ],
      en: [
        'Google Calendar and Gmail: connection restored with the correct redirect.',
        'The header gear opens the More menu on every screen.',
        'Bottom sheets: swipe-to-close works correctly on Android.',
        'Alarm: new sound channels and notification permission request from Settings with the system dialog.',
      ],
    },
  },
  {
    build: 20,
    version: '1.1.2',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Horas extra por trabajo: el límite semanal se aplica a las horas de cada empleo por separado.',
        'PIN de marcaje por trabajo (opcional): se guarda en cada empleo y se muestra al marcar entrada y en el recordatorio del turno.',
        'Corrección: mostrar el dinero con PIN funciona en Android.',
        'Alarma: la prueba suena a los 6 segundos y Ajustes avisa si faltan los permisos de notificaciones o de batería.',
        'La conexión con Google Calendar abre el selector de cuenta de Google.',
        'Menú Más rediseñado: iconos limpios y Ajustes sin opciones duplicadas.',
        'Las hojas inferiores se cierran deslizando en cualquier parte.',
      ],
      en: [
        'Overtime per job: the weekly limit applies to each job’s hours separately.',
        'Clock PIN per job (optional): saved per job and shown when clocking in and in the shift reminder.',
        'Fix: revealing amounts with a PIN works on Android.',
        'Alarm: the test rings after 6 seconds, and Settings warns when notification or battery permissions are missing.',
        'Google Calendar connection opens the Google account picker.',
        'More menu redesigned: clean icons and Settings without duplicated options.',
        'Bottom sheets close by swiping anywhere.',
      ],
    },
  },
  {
    build: 19,
    version: '1.1.1',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Conexión con Google renovada con inicio de sesión oficial.',
        'Sincronización automática con Google Calendar: crear, editar o borrar un turno crea, actualiza o borra su evento.',
        'Gmail ya no muestra errores sin conexión y Calendario ya no se cierra de forma inesperada.',
      ],
      en: [
        'Google connection renewed with official sign-in.',
        'Automatic Google Calendar sync: creating, editing or deleting a shift creates, updates or deletes its event.',
        'Gmail no longer shows errors while disconnected, and Calendar no longer closes unexpectedly.',
      ],
    },
  },
  {
    build: 18,
    version: '1.1.0',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Icono nuevo: fondo oscuro con la T y el punto azul, a juego con la pantalla de arranque.',
        'Plantillas: pantalla nueva para crear, editar, eliminar y asignar plantillas a un día.',
        'Ajustes: sección Google con acceso directo a Google Calendar y Gmail.',
        'Importar un respaldo fusiona los datos sin borrar nada y acepta archivos de Mis Horarios.',
        'Los totales de dinero muestran solo lo trabajado (Inicio, Semana, Ganancias, Calendario, Estadísticas y Reportes).',
        'Turnos que cruzan medianoche: se marcan con «+1 día» y sus horas se calculan correctamente.',
        'El menú Más es accesible al volver desde Ajustes.',
        'Novedades: pantalla con el historial de versiones.',
      ],
      en: [
        'New icon: dark background with the T and the blue dot, matching the splash screen.',
        'Templates: new screen to create, edit, delete and assign templates to a day.',
        'Settings: Google section with direct access to Google Calendar and Gmail.',
        'Importing a backup merges data without deleting anything and accepts Mis Horarios files.',
        'Money totals show only worked time (Home, Week, Earnings, Calendar, Statistics and Reports).',
        'Overnight shifts: marked with “+1 day” and their hours calculated correctly.',
        'The More menu is reachable when returning from Settings.',
        'What’s new: version history screen.',
      ],
    },
  },
  {
    build: 17,
    version: '1.0.0',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Alarma real de Android: suena a pantalla completa aunque la app esté cerrada, con sonidos a elegir y posponer.',
        'Aviso en pantalla durante el trabajo y recordatorio si se olvida marcar la salida.',
        'Diseño unificado: botones sólidos, navegación más compacta y animaciones suaves.',
      ],
      en: [
        'Real Android alarm: rings full-screen even with the app closed, with selectable sounds and snooze.',
        'On-screen notice while working and a reminder if clock-out is forgotten.',
        'Unified design: solid buttons, more compact navigation and smooth animations.',
      ],
    },
  },
  {
    build: 15,
    version: '1.0.0',
    fecha: '2026-10-20',
    notas: {
      es: [
        'Diseño unificado en toda la app: tarjetas redondeadas, franja superior oscura y barra inferior de vidrio.',
        'Deslizar un turno a los lados para duplicarlo, editarlo o eliminarlo.',
        'Avisos al guardar, duplicar o borrar.',
      ],
      en: [
        'Unified design across the app: rounded cards, dark top band and glass bottom bar.',
        'Swipe a shift sideways to duplicate, edit or delete it.',
        'Notices when saving, duplicating or deleting.',
      ],
    },
  },
  {
    build: 13,
    version: '1.0.0',
    fecha: '2026-10-19',
    notas: {
      es: [
        'Corrección: los datos ya no se borran al actualizar la app.',
      ],
      en: [
        'Fix: data is no longer wiped when updating the app.',
      ],
    },
  },
];
