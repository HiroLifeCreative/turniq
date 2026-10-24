# Changelog — Turniq
## v1.1.10/28 — 24 oct 2026 (sin compilar, pendiente "Build")
- **Animación de los iconos de la barra de navegación al tocarlos**: cada pestaña responde con un efecto de escala y un leve balanceo, también al tocar la pestaña activa.
- **Control de privacidad en la tarjeta principal**: el dinero se oculta con ••••• y se muestra de nuevo al tocar el botón, sin desenfoque y sin solicitar PIN.
- **Edición de horas trabajadas**: ahora permite modificar la fecha del turno y eliminarlo, con confirmación previa.
- **Cierre automático**: si un turno queda abierto, se cierra solo a las 4:00 a.m. del día siguiente; la hora tope se cambia en Ajustes → Trabajo.
- **Fechas de entrada y salida en el editor del turno**: cada turno guarda su fecha de salida de forma explícita y los turnos que terminan otro día muestran esa fecha en lugar de un marcador.
## v1.1.9/27 — 24 oct 2026 (entregada, Codemagic build 30)
- **Se retiró el efecto de desenfoque del modo privado**: los montos se muestran siempre con claridad. El botón de privacidad y el interruptor de Dinero oculto se eliminaron; el bloqueo de la app con PIN no se modificó.
## v1.1.8/26 — 24 oct 2026 (entregada, Codemagic build 29)
- **Corrección: chips de dinero sin desborde**: el contenido ya no se sale de su borde redondeado.
- **Pie de Más con traducción**: el crédito y el copyright ahora respetan el idioma seleccionado en la app.
## v1.1.7/25 — 24 oct 2026 (entregada, Codemagic build 28)
- **Botón de privacidad ampliado**: ahora es una píldora con las etiquetas Mostrar y Ocultar.
- **Ajustes → Seguridad: interruptor «Dinero oculto»**.
- **Nueva pantalla Permisos (Más → Permisos)**: muestra el estado de cada permiso requerido con su botón Permitir, además de la prueba de alarma de 6 s.
- **Permisos: 2 tarjetas más**: Alarmas y recordatorios y Mostrar sobre otras apps (5 permisos en total en Android).
- **Pie de Más**: icono de Instagram con enlace al perfil, «Desarrollado por Nelson Herrera», «© 2026 HiroLifeStudio · Todos los derechos reservados».
- **Pie de Más**: se retiró el texto del usuario de Instagram; el icono conserva su enlace.

## v1.1.6 (build 24) — 2026-10-24
- **Modo privado con desenfoque real**: los montos quedan ocultos por completo, con bordes suaves.
- **Semana sin botón flotante**: agregar turno sigue disponible en cada día, duplicar semana al final de la pantalla y plantillas en Más.
- **Ganancias por trabajo y por semana**: la lista por trabajo muestra su semana con sus propias flechas de navegación e incluye la hora extra por trabajo.

## v1.1.5 (build 23) — 2026-10-24
- **Modo privado con desenfoque estilo iOS**: los montos se muestran difuminados en lugar de puntos.
- **Acciones rápidas en Semana (botón + flotante)**: agregar turno, duplicar semana y plantillas.
- **Términos con secciones plegables**: lectura más cómoda.

## v1.1.4 (build 22) — 2026-10-23
- **Estadísticas**: la hora extra se aplica por trabajo y por semana, y el promedio semanal se calcula sobre semanas reales.
- **Editar entrada en vivo**: con un turno en curso, permite corregir la hora real de entrada con atajos de −30, −15, −5 y +5 minutos; el contador y el neto estimado se recalculan al instante.
- **Detalle del turno en tiempo real**: los cambios de hora se reflejan sin cerrar y volver a abrir la hoja.

## v1.1.3 (build 21) — 2026-10-20
- **Google Calendar y Gmail**: conexión restablecida con la redirección correcta.
- **Engranaje del encabezado**: abre el menú Más en todas las pantallas.
- **Hojas inferiores**: el gesto de deslizar para cerrar funciona correctamente en Android.
- **Alarma**: nuevos canales de sonido y solicitud del permiso de notificaciones desde Ajustes con el diálogo del sistema.
## v1.1.2 (build 20) — 2026-10-20
- **Horas extra por trabajo**: el límite semanal se aplica a las horas de cada empleo por separado.
- **PIN de marcaje por trabajo (opcional)**: se guarda en cada empleo y se muestra al marcar entrada y en el recordatorio del turno.
- **Corrección: mostrar el dinero con PIN** funciona en Android.
- **Alarma**: la prueba suena a los 6 s y Ajustes avisa si faltan los permisos de notificaciones o de batería.
- **Google Calendar**: al conectar se abre el selector de cuenta.
- **Menú Más rediseñado**: iconos limpios y Ajustes sin opciones duplicadas.
- **Hojas inferiores**: se cierran deslizando en cualquier parte.

Historial de versiones por build (del más nuevo al más viejo).
La misma lista vive dentro de la app en **Ajustes → Acerca de → Novedades**
(`src/lib/changelog.ts`).

**Rutina de versionado al lanzar un build:** (1) en `app.json` sube `version`
(parche +1; menor +1 si trae una función grande) y `android.versionCode`
(+1 siempre — coincide con el número de build); (2) agrega la entrada en
este archivo y en `src/lib/changelog.ts`. Las etiquetas de versión dentro
de la app se leen solas desde `app.json`.

## v1.1.1 · Build 19 — 2026-10-20
- Conexión con Google renovada con inicio de sesión oficial
- Sincronización automática con Google Calendar: al crear, editar o borrar un turno, su evento se crea, se actualiza o se borra solo
- Gmail ya no muestra errores sin conexión y Calendario ya no se cierra de forma inesperada

## v1.1.0 · Build 18 — 2026-10-20
- Icono nuevo: fondo oscuro con la T y el punto azul, a juego con la pantalla de arranque
- Plantillas: pantalla nueva para crear, editar, eliminar y asignar plantillas a un día
- Ajustes: sección Google con acceso directo a Google Calendar y Gmail
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
