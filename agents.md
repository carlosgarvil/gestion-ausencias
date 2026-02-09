# Guía para Agentes IA - Proyecto `gestion-ausencias`

## 1) Objetivo del proyecto
Aplicación web para gestionar ausencias del profesorado y su impacto en clases:
- Registro y consulta de ausencias.
- Panel de clases a cubrir.
- Justificaciones.
- Horario semanal del profesorado.
- Horario semanal de grupos (con simulación visual de ausencias).
- Gestión de sustituciones (copiar horario de docente titular a sustituto).
- Herramientas de apoyo (permisos P27, control de presencia, ayuda).

## 2) Stack y estructura
- Frontend: HTML + CSS + Vue 3 (CDN, sin build step).
- Backend BaaS: Supabase (`@supabase/supabase-js@2`, CDN).
- Estilos globales: `style.css`.
- Lógica principal de la mayoría de pantallas: `script.js`.
- Pantalla específica de horario de grupos: `horario-grupos.html` (incluye su propia lógica Vue inline).

Archivos clave:
- `index.html`: entrada principal (ausencias).
- `script.js`: autenticación, consultas y acciones principales.
- `style.css`: estilos compartidos de todo el sitio.
- `horario-grupos.html`: módulo independiente de horario por grupo.

## 3) Autenticación y sesión
Patrón usado en casi todas las páginas:
1. Crear cliente Supabase con `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
2. `checkSession()` al iniciar.
3. `client.auth.onAuthStateChange(...)` para sincronizar estado de login/logout.
4. Mostrar `#login-section` si no hay sesión y `#app-section` si hay sesión.

## 4) Tablas Supabase usadas (esperadas)
- `teachers`: catálogo de profesorado.
  - Campos habituales: `name`, `email`, etc.
- `timetable`: horario lectivo base.
  - Campos usados en el código (pueden variar por importación):
    - profesor: `teacher_name` / `teacher`
    - grupo: `group_name` / `group`
    - materia: `subject` / variantes
    - aula: `classroom` / variantes
    - día: `weekday`, `weekday_letter`, etc.
    - tramo: `slot`, `slot_value`, etc.
    - visibilidad: `visible` / variantes
- `absences`: ausencias registradas.
  - Campos usados: `teacher_name`, `date`, `start_slot`, `end_slot`, `status`, `reason`, `planned`.
- `groups` (recomendado): catálogo estable de grupos.
  - Usado por `horario-grupos.html` como fuente principal del selector de grupos.
  - Fallback temporal a `timetable.group_name` si no existe o está vacía.

## 5) Convenciones funcionales importantes
- Tramos horarios definidos de 1 a 14 (`SLOT_OPTIONS`), con recreos en 4 y 11.
- Días lectivos principales en vistas semanales: lunes-viernes (`WEEK_DAYS` 1..5).
- Se normalizan nombres de campos en `timetable` porque el origen puede cambiar (HORW/importaciones).
- Evitar romper la compatibilidad con nombres alternativos de columnas.

## 6) Horario de grupos (estado actual)
Archivo: `horario-grupos.html`.

Características:
- Selector de grupo.
- Carga de horario semanal desde `timetable`.
- Opción `Mostrar ausencias`:
  - Consulta ausencias reales del día actual en `absences`.
  - Marca clases con docente ausente (`Profesor ausente hoy`).
- Simulación visual de ausencias adicionales:
  - Bloque `details/summary` con profesorado del grupo.
  - Checkboxes para simular ausencia (solo en UI, sin escritura en BD).
  - Docentes ya ausentes hoy aparecen bloqueados/marcados y no se duplican como simulados.

## 7) Reglas para cambios seguros
1. Mantener navegación (`.top-nav`) coherente en todas las páginas.
2. Si se añade una nueva pantalla, incluir enlace en todos los menús.
3. No acoplar cambios de `horario-grupos.html` a `script.js` salvo necesidad real (actualmente es módulo independiente).
4. Antes de borrar compatibilidades, comprobar esquema real de Supabase (nombres de columnas).
5. No registrar datos en `absences` durante simulaciones: solo estado local de Vue.

## 8) Checklist rápido antes de cerrar una tarea
- [ ] ¿La página funciona logueado y deslogueado?
- [ ] ¿Se mantiene responsive en móvil?
- [ ] ¿El menú tiene el enlace nuevo en todas las vistas?
- [ ] ¿No se rompió la normalización de `timetable`?
- [ ] ¿No se escriben cambios en BD cuando solo debe haber simulación?
- [ ] ¿No hay errores JS en consola por variables duplicadas o watchers?

## 9) Mejoras sugeridas
- Extraer configuración Supabase a un único archivo compartido.
- Añadir selector de fecha en horario de grupos para ausencias no solo de "hoy".
- Añadir tests E2E básicos de login + carga de horarios.
- Documentar esquema SQL exacto (DDL) en un archivo versionado.
