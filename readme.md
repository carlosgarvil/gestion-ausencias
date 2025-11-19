# Gestión de Ausencias del Profesorado — IES Polígono Sur

Proyecto web para la gestión de ausencias del profesorado, generación automática de clases a cubrir y administración de sustituciones. Integra Google Forms + Apps Script y Supabase.

---

## Estado actual (resumen rápido)

- Interfaz migrada a Vue 3 (single-file-lite en `index.html` + `script.js`).
- Tramos horarios: 14 tramos (4 y 11 son recreos). Tramos definidos en la UI con selects.
- Integración activa con Supabase; las consultas al horario (`timetable`) se filtran por profesor para mejorar rendimiento.
- La vista de horario unifica registros del mismo aula y materia concatenando grupos (evita duplicados por desdobles/optativas).
- El panel de clases a cubrir agrupa por tramo y usa rowspan para no repetir la columna del tramo.
- Impresión optimizada: media query `@media print` para imprimir la tabla en horizontal.
- Ayuda actualizada in-app (`#help-section`) con instrucciones sobre Google Classroom, tramos por defecto y vínculo con la TV de Sala del Profesorado.

---

## Funcionalidades principales

### Registro de ausencias
- Formulario para registrar ausencias individuales o en rango (genera una ausencia por día).
- Selección de tramos (selects con valores 1..14).
- Por defecto las ausencias se crean como día completo (tramos 1–14). Si el profesor se reincorpora, editar los tramos para que deje de aparecer en el panel.
- Las ausencias también se guardan automáticamente cuando el profesorado rellena el Google Form (Apps Script envía a Supabase).

### Panel de clases a cubrir
- Agrupa las clases por tramo horario; filas del mismo tramo se unifican visualmente.
- Calcula qué clases quedan sin docente y muestra la información pública necesaria (sin motivos/observaciones).
- Lo que ves en el panel es exactamente lo que se visualiza en la TV de la Sala del Profesorado (tras actualizar el panel).

### Horario del profesorado
- Selecciona un docente para cargar su horario semanal.
- Consulta a Supabase filtrada por `teacher_name` (mejor rendimiento).
- Las entradas del mismo día/tramo que comparten aula y materia se unifican concatenando grupos.

### Gestión de sustituciones
- Listado y alta/baja de sustitutos.
- Detección automática comparando `email_form` y `email` del titular.

### Seguridad y privacidad
- Motivos/observaciones no se muestran en paneles públicos.
- RLS en Supabase y autenticación con Supabase Auth para la gestión.

---

## Esquema esperado (campos relevantes)

Las funciones y el mapeo esperan, como mínimo, los siguientes campos en `timetable`:
- id
- subject
- group_name
- classroom
- teacher_name
- weekday_letter (L/M/X/J/V) o equivalente (se normaliza)
- slot (número del tramo)
- visible (boolean)

Si tu esquema difiere, actualiza las funciones en `script.js`:
- `normalizeWeekdayValue` / `parseWeekday` — convierte letras/nombres a números de día.
- `normalizeSlotValue` — extrae el número de tramo de diversos nombres de campo.

---

## Capturas (añadir en `assets/screenshots`)


- assets/screenshots/captura1_ausencias.png  
  ![Ausencias](assets/screenshots/captura1_ausencias.png)  
  Figura — Formulario de registro de ausencias.

- assets/screenshots/captura2_panel.png  
  ![Panel de clases a cubrir](assets/screenshots/captura2_panel.png)  
  Figura — Panel de clases pendientes (agrupado por tramo, vista para la TV).

- assets/screenshots/captura3_justificantes.png  
  ![Justificantes](assets/screenshots/captura3_justificantes.png)  
  Figura — Gestión de justificantes y estados.

- assets/screenshots/captura4_profesorado.png  
  ![Profesorado — horario](assets/screenshots/captura4_profesorado.png)  
  Figura — Horario semanal del profesorado (entradas unificadas por aula/materia).

- assets/screenshots/captura5_sustituciones.png  
  ![Sustituciones](assets/screenshots/captura5.png)  
  Figura — Panel de sustituciones.

---

## Depuración rápida

- Abrir consola del navegador (F12) y revisar logs generados por `script.js`:
  - `loadTeacherSchedule()` imprime la respuesta de Supabase.
  - `mapEntriesToTeacherSchedule()` muestra campos disponibles y por qué entradas se ignoran.
- Si `.eq('teacher_name', ...)` devuelve vacío, listar los `teacher_name` de la tabla con:
  - Añade temporalmente en `script.js`: `await client.from('timetable').select('teacher_name')` y comprueba valores.
- Verifica tildes, espacios y formato del nombre al filtrar.

---

## Desarrollo y puesta en marcha local

1. Clonar y abrir el proyecto:
   ```
   git clone <repo>
   cd gestion-ausencias
   ```

2. Servidor estático simple (Linux):
   ```
   python3 -m http.server 8000
   # abrir http://localhost:8000/index.html
   ```

3. Archivo con credenciales Supabase: revisar `script.js` (URL y clave anónima). Para producción usa variables de entorno y RLS.

---

Si quieres que inserte las imágenes con nombres y pies de foto exactos en el README (o que genere ejemplos de captura y texto alternativo), indícame los nombres de fichero exactos y los pies de foto que prefieres.

