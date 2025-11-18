const { createApp } = Vue;
const { createClient } = supabase;

const SUPABASE_URL = "https://kbluhvorfldptbcnwvvx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibHVodm9yZmxkcHRiY253dnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNDIxNjIsImV4cCI6MjA3ODYxODE2Mn0.WUeTibJHnmVCsNqcwvzsUdFpsTn8BzjM-W7eZCRaZ7I";

const SLOT_OPTIONS = [
  { value: 1, label: "08:15–09:15" },
  { value: 2, label: "09:15–10:15" },
  { value: 3, label: "10:15–11:15" },
  { value: 4, label: "11:15–11:45 (recreo)" },
  { value: 5, label: "11:45–12:45" },
  { value: 6, label: "12:45–13:45" },
  { value: 7, label: "13:45–14:45" },
  { value: 8, label: "15:00–16:00" },
  { value: 9, label: "16:00–17:00" },
  { value: 10, label: "17:00–18:00" },
  { value: 11, label: "18:00–18:15 (recreo)" },
  { value: 12, label: "18:15–19:15" },
  { value: 13, label: "19:15–20:15" },
  { value: 14, label: "20:15–21:15" }
];

const MENU_ITEMS = [
  { value: "ausencias", label: "Ausencias" },
  { value: "panel", label: "Panel" },
  { value: "justificaciones", label: "Justificantes" },
  { value: "sustituciones", label: "Sustituciones" },
  { value: "ayuda", label: "Ayuda" }
];

const JUSTIFICATION_STATUS_OPTIONS = [
  { value: "Sin justificar", label: "Sin justificar" },
  { value: "Justificado", label: "Justificado" },
  { value: "Aviso", label: "Aviso" }
];

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getTodayISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMonthValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

createApp({
  data() {
    return {
      menuItems: MENU_ITEMS,
      slotOptions: SLOT_OPTIONS,
      justificationStatusOptions: JUSTIFICATION_STATUS_OPTIONS,
      activeMenu: "ausencias",
      isLoggedIn: false,
      userEmail: "",
      loginForm: {
        email: "",
        password: ""
      },
      loginMessage: "",
      loginMessageType: "",
      teachers: [],
      substitutionTeachers: [],
      absenceForm: {
        teacher: "",
        dateFrom: "",
        dateTo: "",
        startSlot: SLOT_OPTIONS[0].value,
        endSlot: SLOT_OPTIONS[SLOT_OPTIONS.length - 1].value,
        reason: ""
      },
      listDate: "",
      absences: [],
      loadingAbsences: false,
      absenceMessage: "",
      absenceMessageType: "",
      panelDate: "",
      panelRows: [],
      loadingPanel: false,
      panelMessage: "",
      justificationsMonth: getCurrentMonthValue(),
      justifications: [],
      loadingJustifications: false,
      justificationsMessage: "",
      substitutions: [],
      substitutionForm: {
        teacher: "",
        displayName: "",
        emailForm: "@iespoligonosur.org"
      }
    };
  },
  created() {
    this.initializeApp();
  },
    watch: {
      listDate(newValue, oldValue) {
        if (newValue && newValue !== oldValue && this.isLoggedIn) {
          this.loadAbsencesForDate();
        }
      },
      panelDate(newValue, oldValue) {
        if (newValue && newValue !== oldValue && this.isLoggedIn) {
          this.loadPanelData();
        }
      },
      justificationsMonth(newValue, oldValue) {
        if (newValue && newValue !== oldValue && this.isLoggedIn) {
          this.loadJustifications();
        }
      }
  },
  methods: {
    initializeApp() {
      this.setTodayDefaults();
      this.checkSession();
      client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.handleAuthenticated(session.user);
        } else {
          this.resetAppState();
        }
      });
    },
    setTodayDefaults() {
      const today = getTodayISO();
      this.absenceForm.dateFrom = today;
      this.listDate = today;
      this.panelDate = today;
    },
    async checkSession() {
      const { data } = await client.auth.getSession();
      const session = data?.session;
      if (session?.user) {
        this.handleAuthenticated(session.user);
      }
    },
    async handleLogin() {
      this.loginMessage = "";
      this.loginMessageType = "";
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: this.loginForm.email.trim(),
          password: this.loginForm.password
        });
        if (error) throw error;
        this.loginMessage = "Sesión iniciada correctamente.";
        this.loginMessageType = "ok";
        this.handleAuthenticated(data.user);
      } catch (error) {
        this.loginMessage = `Error al iniciar sesión: ${error.message}`;
        this.loginMessageType = "error";
      }
    },
    async handleLogout() {
      await client.auth.signOut();
      this.resetAppState();
    },
    resetAppState() {
      this.isLoggedIn = false;
      this.userEmail = "";
      this.absences = [];
      this.panelRows = [];
      this.panelMessage = "";
      this.loadingPanel = false;
      this.justifications = [];
      this.substitutions = [];
      this.loadingJustifications = false;
      this.justificationsMessage = "";
      this.justificationsMonth = getCurrentMonthValue();
      this.loginForm.password = "";
      this.activeMenu = "ausencias";
    },
    handleAuthenticated(user) {
      this.isLoggedIn = true;
      this.userEmail = user.email;
      this.activeMenu = "ausencias";
      this.loadInitialData();
    },
    async loadInitialData() {
      await Promise.all([this.populateTeachers(), this.populateSubstitutionTeachers()]);
      this.setTodayDefaults();
      await this.loadAbsencesForDate();
      await this.loadPanelData();
      await this.loadJustifications();
      await this.loadActiveSubstitutions();
    },
    async populateTeachers() {
      const { data, error } = await client
        .from("teachers")
        .select("name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error cargando profes:", error);
        this.teachers = [];
        return;
      }

      this.teachers = data || [];
    },
    async populateSubstitutionTeachers() {
      const { data, error } = await client
        .from("teachers")
        .select("name, display_name, email, email_form")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error cargando profesores para sustituciones:", error);
        this.substitutionTeachers = [];
        return;
      }

      this.substitutionTeachers = data || [];
    },
    getDateRange(from, to) {
      if (!from) return [];
      if (!to) return [from];

      const start = new Date(`${from}T00:00:00`);
      const end = new Date(`${to}T00:00:00`);
      if (end < start) return null;

      const dates = [];
      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, "0");
        const day = String(current.getDate()).padStart(2, "0");
        dates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    },
    async handleAbsenceSubmit() {
      this.absenceMessage = "";
      this.absenceMessageType = "";

      const { teacher, dateFrom, dateTo, startSlot, endSlot, reason } = this.absenceForm;

      if (!teacher || !dateFrom) {
        this.absenceMessage = "Completa profesor/a y fecha desde.";
        this.absenceMessageType = "error";
        return;
      }

      if (endSlot < startSlot) {
        this.absenceMessage = "La hora final no puede ser menor que la inicial.";
        this.absenceMessageType = "error";
        return;
      }

      const dates = this.getDateRange(dateFrom, dateTo);
      if (!dates) {
        this.absenceMessage = "La fecha hasta no puede ser anterior a la fecha desde.";
        this.absenceMessageType = "error";
        return;
      }

      const rows = dates.map((date) => ({
        teacher_name: teacher,
        date,
        start_slot: startSlot,
        end_slot: endSlot,
        reason: reason?.trim() || null,
        planned: true
      }));

      const { error } = await client.from("absences").insert(rows);

      if (error) {
        this.absenceMessage = `Error al guardar: ${error.message}`;
        this.absenceMessageType = "error";
        return;
      }

      this.absenceMessage = `Ausencia registrada para ${rows.length} día(s).`;
      this.absenceMessageType = "ok";
      this.absenceForm.teacher = "";
      this.absenceForm.dateTo = "";
      this.absenceForm.reason = "";
      this.absenceForm.startSlot = SLOT_OPTIONS[0].value;
      this.absenceForm.endSlot = SLOT_OPTIONS[SLOT_OPTIONS.length - 1].value;
      this.setTodayDefaults();
      this.loadAbsencesForDate();
    },
    async loadAbsencesForDate() {
      if (!this.listDate) {
        this.listDate = getTodayISO();
      }
      this.loadingAbsences = true;
      const { data, error } = await client
        .from("absences")
        .select("id, teacher_name, date, start_slot, end_slot, reason")
        .eq("date", this.listDate)
        .order("teacher_name", { ascending: true })
        .order("start_slot", { ascending: true });

      if (error) {
        console.error("Error cargando ausencias del día:", error);
        this.absences = [];
        this.loadingAbsences = false;
        return;
      }

      this.absences = (data || []).map((row) => ({
        ...row,
        editing: false,
        editStart: row.start_slot,
        editEnd: row.end_slot,
        editMessage: "",
        editMessageType: ""
      }));
      this.loadingAbsences = false;
    },
    async loadPanelData() {
      if (!this.panelDate) {
        this.panelDate = getTodayISO();
      }
      this.loadingPanel = true;
      this.panelMessage = "";
      const { data, error } = await client
        .from("classes_to_cover")
        .select("*")
        .eq("date", this.panelDate)
        .order("slot", { ascending: true })
        .order("group_name", { ascending: true });

      if (error) {
        console.error("Error cargando datos del panel:", error);
        this.panelRows = [];
        this.panelMessage = "No se pudieron cargar las clases pendientes de cubrir.";
        this.loadingPanel = false;
        return;
      }

      this.panelRows = this.mapClassesToPanelRows(data || []);
      if (!this.panelRows.length) {
        this.panelMessage = "No hay clases pendientes de cubrir para este día.";
      }
      this.loadingPanel = false;
    },
    getMonthDateRange(monthValue) {
      if (!monthValue) return null;
      const [year, month] = monthValue.split("-");
      if (!year || !month) return null;
      const start = new Date(Number(year), Number(month) - 1, 1);
      if (Number.isNaN(start.getTime())) return null;
      const nextMonth = new Date(start);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
      const exclusiveEndDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
      return { startDate, exclusiveEndDate };
    },
    async loadJustifications() {
      if (!this.justificationsMonth) {
        this.justificationsMonth = getCurrentMonthValue();
      }

      const range = this.getMonthDateRange(this.justificationsMonth);
      if (!range) {
        this.justificationsMessage = "Selecciona un mes válido.";
        this.justifications = [];
        return;
      }

      this.loadingJustifications = true;
      this.justificationsMessage = "";

      const { data, error } = await client
        .from("absences")
        .select("id, teacher_name, date, start_slot, end_slot, status")
        .gte("date", range.startDate)
        .lt("date", range.exclusiveEndDate)
        .order("date", { ascending: true })
        .order("teacher_name", { ascending: true })
        .order("start_slot", { ascending: true });

      if (error) {
        console.error("Error cargando justificaciones:", error);
        this.justificationsMessage = "No se pudieron cargar las ausencias. Inténtalo más tarde.";
        this.justifications = [];
        this.loadingJustifications = false;
        return;
      }

      this.justifications = (data || []).map((row) => ({
        ...row,
        statusMessage: "",
        statusMessageType: ""
      }));
      this.loadingJustifications = false;
    },
    formatSlotLabel(start, end) {
      if (start === end) {
        return `Tramo ${start}`;
      }
      return `Tramos ${start}–${end}`;
    },
    getSlotLabel(slotValue) {
      const slotNumber = Number(slotValue);
      const slot = this.slotOptions.find((option) => option.value === slotNumber);
      return slot ? slot.label : `Tramo ${slotValue}`;
    },
    mapClassesToPanelRows(entries = []) {
      const rows = [];
      entries.forEach((entry) => {
        const group =
          entry.group_name || entry.group || entry.class_group || entry.grupo || "—";
        const subject =
          entry.subject || entry.subject_name || entry.materia || entry.asignatura || "—";
        const classroom =
          entry.classroom || entry.room || entry.aula || entry.classroom_name || "—";
        const teacher =
          entry.teacher_display_name || entry.teacher_name || entry.teacher || "—";

        const start = Number(entry.start_slot);
        const end = Number(entry.end_slot);
        if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
          for (let slot = start; slot <= end; slot += 1) {
            rows.push({
              slotValue: slot,
              slotLabel: this.getSlotLabel(slot),
              group,
              subject,
              classroom,
              teacher
            });
          }
          return;
        }

        const slotValueRaw =
          entry.slot ?? entry.slot_value ?? entry.slot_number ?? entry.tramo ?? null;
        const slotValue = Number(slotValueRaw);
        const slotLabel =
          entry.slot_label ||
          entry.slotLabel ||
          (Number.isFinite(slotValue) ? this.getSlotLabel(slotValue) : "—");

        rows.push({
          slotValue: Number.isFinite(slotValue) ? slotValue : null,
          slotLabel,
          group,
          subject,
          classroom,
          teacher
        });
      });

      const normalizedRows = rows.sort((a, b) => {
        if (a.slotValue === null) return 1;
        if (b.slotValue === null) return -1;
        if (a.slotValue === b.slotValue) {
          return a.teacher.localeCompare(b.teacher);
        }
        return a.slotValue - b.slotValue;
      });

      const slotGroups = new Map();
      normalizedRows.forEach((row) => {
        const slotKey = Number.isFinite(row.slotValue)
          ? row.slotValue
          : `null-${row.slotLabel}`;
        if (!slotGroups.has(slotKey)) {
          slotGroups.set(slotKey, {
            slotValue: row.slotValue,
            slotLabel: row.slotLabel,
            teachers: new Map()
          });
        }

        const slotEntry = slotGroups.get(slotKey);
        const teacherKey = row.teacher || "—";
        if (!slotEntry.teachers.has(teacherKey)) {
          slotEntry.teachers.set(teacherKey, {
            teacher: teacherKey,
            groups: new Set(),
            subjects: new Set(),
            classrooms: new Set()
          });
        }

        const teacherEntry = slotEntry.teachers.get(teacherKey);
        teacherEntry.groups.add(row.group);
        teacherEntry.subjects.add(row.subject);
        teacherEntry.classrooms.add(row.classroom);
      });

      const groupedRows = [];
      const sortedSlotEntries = Array.from(slotGroups.values()).sort((a, b) => {
        if (a.slotValue === null) return 1;
        if (b.slotValue === null) return -1;
        if (a.slotValue === b.slotValue) return 0;
        return a.slotValue - b.slotValue;
      });

      sortedSlotEntries.forEach((slotEntry) => {
        const teacherRows = Array.from(slotEntry.teachers.values()).sort((a, b) =>
          a.teacher.localeCompare(b.teacher)
        );

        teacherRows.forEach((teacherRow, index) => {
          groupedRows.push({
            key: `${slotEntry.slotValue ?? slotEntry.slotLabel}-${teacherRow.teacher}-${index}`,
            slotValue: slotEntry.slotValue,
            slotLabel: slotEntry.slotLabel,
            showSlotLabel: index === 0,
            slotRowSpan: teacherRows.length,
            group: Array.from(teacherRow.groups).join(", "),
            subject: Array.from(teacherRow.subjects).join(", "),
            classroom: Array.from(teacherRow.classrooms).join(", "),
            teacher: teacherRow.teacher
          });
        });
      });

      return groupedRows;
    },
    formatDateForDisplay(dateString) {
      if (!dateString) return "";
      const parsed = new Date(dateString);
      if (Number.isNaN(parsed.getTime())) {
        return dateString;
      }
      return parsed.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit"
      });
    },
    toggleAbsenceEdit(absence) {
      absence.editing = !absence.editing;
      if (!absence.editing) {
        this.cancelAbsenceEdit(absence);
      }
    },
    cancelAbsenceEdit(absence) {
      absence.editing = false;
      absence.editStart = absence.start_slot;
      absence.editEnd = absence.end_slot;
      absence.editMessage = "";
      absence.editMessageType = "";
    },
    async saveAbsenceSlots(absence) {
      if (absence.editEnd < absence.editStart) {
        absence.editMessage = "La hora final no puede ser menor que la inicial.";
        absence.editMessageType = "error";
        return;
      }

      absence.editMessage = "Guardando cambios…";
      absence.editMessageType = "info";

      const { error } = await client
        .from("absences")
        .update({ start_slot: absence.editStart, end_slot: absence.editEnd })
        .eq("id", absence.id);

      if (error) {
        absence.editMessage = `Error al guardar: ${error.message}`;
        absence.editMessageType = "error";
        return;
      }

      absence.start_slot = absence.editStart;
      absence.end_slot = absence.editEnd;
      absence.editMessage = "Cambios guardados";
      absence.editMessageType = "ok";
    },
    async updateJustificationStatus(absence, newStatus) {
      const previousStatus = absence.status;
      absence.status = newStatus;
      absence.statusMessage = "Guardando…";
      absence.statusMessageType = "info";

      const { error } = await client
        .from("absences")
        .update({ status: newStatus })
        .eq("id", absence.id);

      if (error) {
        console.error("Error actualizando estado:", error);
        absence.status = previousStatus;
        absence.statusMessage = `Error: ${error.message}`;
        absence.statusMessageType = "error";
        return;
      }

      absence.statusMessage = "Estado actualizado";
      absence.statusMessageType = "ok";
      setTimeout(() => {
        absence.statusMessage = "";
        absence.statusMessageType = "";
      }, 2500);
    },
    async deleteAbsence(absenceId) {
      if (!confirm("¿Eliminar esta ausencia?")) return;
      const { error } = await client.from("absences").delete().eq("id", absenceId);
      if (error) {
        alert("Error al eliminar ausencia: " + error.message);
        return;
      }
      this.absences = this.absences.filter((absence) => absence.id !== absenceId);
    },
    async loadActiveSubstitutions() {
      const { data, error } = await client
        .from("teachers")
        .select("name, display_name, email, email_form")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error cargando sustituciones activas:", error);
        this.substitutions = [];
        return;
      }

      this.substitutions = (data || []).filter(
        (row) => row.email_form && row.email && row.email_form !== row.email
      );
    },
    async handleSubstitutionSubmit() {
      const { teacher, displayName, emailForm } = this.substitutionForm;
      if (!teacher || !displayName.trim() || !emailForm.trim()) {
        alert("Completa titular, nombre y email del sustituto.");
        return;
      }

      const { error } = await client
        .from("teachers")
        .update({
          display_name: displayName.trim(),
          email_form: emailForm.trim()
        })
        .eq("name", teacher);

      if (error) {
        alert("Error al guardar la sustitución: " + error.message);
        return;
      }

      this.substitutionForm.teacher = "";
      this.substitutionForm.displayName = "";
      this.substitutionForm.emailForm = "@iespoligonosur.org";
      await this.loadActiveSubstitutions();
      await this.populateSubstitutionTeachers();
    },
    async removeSubstitution(row) {
      const ok = confirm(`¿Quitar sustituto de "${row.name}" y volver al titular?`);
      if (!ok) return;

      const { error } = await client
        .from("teachers")
        .update({
          display_name: row.name,
          email_form: row.email
        })
        .eq("name", row.name);

      if (error) {
        alert("Error al quitar el sustituto: " + error.message);
        return;
      }

      await this.loadActiveSubstitutions();
      await this.populateSubstitutionTeachers();
    }
  }
}).mount("#app");
