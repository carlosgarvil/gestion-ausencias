# Gestión de Ausencias del Profesorado — IES Polígono Sur

Este proyecto proporciona una solución web completa para la **gestión de ausencias del profesorado**, generación automática de clases a cubrir y administración de sustituciones.  
El sistema está diseñado para su uso interno en el centro y se integra con Google Forms, Google Apps Script y Supabase.

---

## ✨ Funcionalidades principales

### ✔ Registro de ausencias previstas
- Formulario para registrar ausencias individuales.
- Opción de seleccionar un **rango de fechas**, generando una ausencia independiente por cada día.
- Permite modificar/eliminar solo algunos días cuando un docente se reincorpora antes de lo esperado.

### ✔ Consulta de ausencias por fecha
- Selector de día para visualizar rápidamente todas las ausencias registradas.
- Botón de actualización y opciones para eliminar ausencias específicas.
- Vista organizada por profesor y fecha.

### ✔ Panel de clases a cubrir
- Pantalla de visualización automática para el profesorado (TV/monitor del centro).
- Cálculo dinámico de las clases que quedan sin docente en cada franja horaria.
- Integración con el horario del centro (“timetable”) a través de la base de datos.
- Agrupación automática de optativas/desdobles para evitar duplicidades.

### ✔ Gestión de sustituciones
- Detección de sustituciones **automática** comparando `email_form` y `email` del titular.
- Tabla de sustituciones activas, indicando:
  - Titular
  - Nombre mostrado en el panel
  - Email del sustituto
- Formulario para **añadir sustitutos**, indicando:
  - Titular
  - Nombre a mostrar
  - Email del sustituto (correo desde el que enviará las ausencias)
- Botón para **quitar sustituto**, restaurando nombre y correo del titular.

### ✔ Seguridad y privacidad
- Motivos de ausencia y observaciones **no se muestran** en los paneles públicos.
- RLS activado en Supabase para evitar acceso no autorizado.
- Acceso al panel de gestión mediante autenticación con Supabase Auth.
- El panel público solo muestra información estrictamente necesaria.

---

## 🧱 Arquitectura del sistema

### 🔧 Supabase (Base de datos + API)
Tablas principales:
- `teachers` — datos del profesorado (titular, display_name, email, email_form).
- `absences` — ausencias registradas (día, docente, franja horaria).
- `timetable` — horario oficial del centro.
- Vista `classes_to_cover` — calcula las clases a cubrir en base a ausencias y horario.

### 📤 Google Form → Apps Script → Supabase
Un Google Form permite al profesorado comunicar ausencias rápidamente.

Apps Script:
- Recibe el envío.
- Identifica al docente desde el correo.
- Envía la ausencia a Supabase mediante `UrlFetchApp.fetch()` con clave segura.
- Envía aviso a todo el Equipo Directivo o Jefatura según si la ausencia es sobrevenida (mismo día) o planificada (futura).

### 🖥 Panel de gestión (HTML + JS + Supabase client)
Incluye:
- Inicio de sesión con Supabase Auth.
- Formulario para nuevas ausencias.
- Selector de fecha y listado editable.
- Gestión de sustituciones.
- Diseño responsive sin frameworks externos.


---

## 🚀 Puesta en marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/xxxx/gestion-ausencias.git
cd gestion-ausencias
