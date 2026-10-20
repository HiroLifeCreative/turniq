# Changelog — Turniq

Historial de versiones por build (del más nuevo al más viejo).
La misma lista vive dentro de la app en **Ajustes → Acerca de → Novedades**
(`src/lib/changelog.ts`).

**Rutina de versionado al lanzar un build:** (1) en `app.json` sube `version`
(parche +1; menor +1 si trae una función grande) y `android.versionCode`
(+1 siempre — coincide con el número de build); (2) agrega la entrada en
este archivo y en `src/lib/changelog.ts`. Las etiquetas de versión dentro
de la app se leen solas desde `app.json`.

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
