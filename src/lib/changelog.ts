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
