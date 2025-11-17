// 1. Configurar cliente Supabase
    const { createClient } = supabase;
    const SUPABASE_URL = "https://kbluhvorfldptbcnwvvx.supabase.co";   // <-- RELLENA
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibHVodm9yZmxkcHRiY253dnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNDIxNjIsImV4cCI6MjA3ODYxODE2Mn0.WUeTibJHnmVCsNqcwvzsUdFpsTn8BzjM-W7eZCRaZ7I";         // <-- RELLENA
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    const loginSection = document.getElementById("login-section");
    const appSection = document.getElementById("app-section");
    const loginForm = document.getElementById("login-form");
    const loginMessage = document.getElementById("login-message");
    const userEmailSpan = document.getElementById("user-email");
    const btnLogout = document.getElementById("btn-logout");

    const teacherSelect = document.getElementById("teacher-select");
    const dateInput = document.getElementById("date-input");
    const absenceForm = document.getElementById("absence-form");
    const absenceMessage = document.getElementById("absence-message");
	const listDateInput = document.getElementById("list-date");
const listContainer = document.getElementById("list-container");
const btnRefreshList = document.getElementById("btn-refresh-list");

// Sustituciones
const substitutionsBody = document.getElementById("substitutions-body");
const substitutionsEmpty = document.getElementById("substitutions-empty");
const substitutionForm = document.getElementById("substitution-form");
const substitutionTeacherSelect = document.getElementById("substitution-teacher-select");
const substitutionDisplayNameInput = document.getElementById("substitution-display-name");
const substitutionEmailFormInput = document.getElementById("substitution-email-form");


async function loadActiveSubstitutions() {
  const { data, error } = await client
    .from("teachers")
    .select("name, display_name, email, email_form")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error cargando sustituciones activas:", error);
    substitutionsBody.innerHTML = "";
    substitutionsEmpty.style.display = "block";
    substitutionsEmpty.textContent = "Error al cargar sustituciones activas.";
    return;
  }

  // 👉 Aquí filtramos de verdad los sustitutos:
  const rows = (data || []).filter(row =>
    row.email_form && row.email && row.email_form !== row.email
  );

  renderSubstitutionsTable(rows);
}


function renderSubstitutionsTable(rows) {
  substitutionsBody.innerHTML = "";

  if (!rows.length) {
    substitutionsEmpty.style.display = "block";
    substitutionsEmpty.textContent = "No hay sustituciones activas.";
    return;
  }

  substitutionsEmpty.style.display = "none";

  rows.forEach(row => {
    const tr = document.createElement("tr");

    const tdTitular = document.createElement("td");
    tdTitular.textContent = row.name;

    const tdDisplay = document.createElement("td");
    tdDisplay.textContent = row.display_name || row.name;

    const tdEmailForm = document.createElement("td");
    tdEmailForm.textContent = row.email_form || "";

    const tdActions = document.createElement("td");
    const btnRemove = document.createElement("button");
    btnRemove.type = "button";
    btnRemove.textContent = "Quitar sustituto";
    btnRemove.className = "btn-delete";
    btnRemove.dataset.email = row.email;
    btnRemove.dataset.name = row.name;

    tdActions.appendChild(btnRemove);

    tr.appendChild(tdTitular);
    tr.appendChild(tdDisplay);
    tr.appendChild(tdEmailForm);
    tr.appendChild(tdActions);

    substitutionsBody.appendChild(tr);
  });
}


function setTodayOnDateInputs() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const iso = `${year}-${month}-${day}`;

  const from = document.getElementById("date-from");
  if (from) from.value = iso;

  if (listDateInput) listDateInput.value = iso;
}

    // Poner hoy por defecto
 function setTodayOnDateFrom() {
  const input = document.getElementById("date-from");
  if (!input) return;
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  input.value = `${year}-${month}-${day}`;
}

    // 2. Gestión de sesión
    async function checkSession() {
      const { data } = await client.auth.getSession();
      const session = data.session;
      if (session && session.user) {
        showApp(session.user);
      } else {
        showLogin();
      }
    }

    function showLogin() {
      loginSection.classList.remove("hidden");
      appSection.classList.add("hidden");
    }

function showApp(user) {
  loginSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  userEmailSpan.textContent = user.email;

  populateTeachers();
  setTodayOnDateInputs();
  loadAbsencesForSelectedDate();

  // Sustituciones
  populateSubstitutionTeacherSelect();
  loadActiveSubstitutions();
}



    // 3. Login con email/contraseña
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginMessage.classList.add("hidden");
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        loginMessage.textContent = "Error al iniciar sesión: " + error.message;
        loginMessage.className = "message error";
        loginMessage.classList.remove("hidden");
      } else {
        loginMessage.classList.add("hidden");
        showApp(data.user);
      }
    });

    // 4. Logout
    btnLogout.addEventListener("click", async () => {
      await client.auth.signOut();
      showLogin();
    });

async function populateSubstitutionTeacherSelect() {
  // Queremos todos los titulares (aunque tengan sustituto, no pasa nada)
  const { data, error } = await client
    .from("teachers")
    .select("name, display_name, email, email_form")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error cargando profesores para sustituciones:", error);
    return;
  }

  // Guardamos en una variable global si quieres, pero para ahora basta con solo llenar el select
  substitutionTeacherSelect.innerHTML = '<option value="">Selecciona titular…</option>';

  (data || []).forEach(row => {
    const opt = document.createElement("option");
    opt.value = row.name;
    opt.textContent = row.name;
    substitutionTeacherSelect.appendChild(opt);
  });
}


    // 5. Rellenar combo de profesores (distinct teacher_name de timetable)
async function populateTeachers() {
  const { data, error } = await client
    .from("teachers")
    .select("name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error cargando profes:", error);
    return;
  }

  teacherSelect.innerHTML = '<option value="">Selecciona…</option>';
  data.forEach(row => {
    const opt = document.createElement("option");
    opt.value = row.name;
    opt.textContent = row.name;
    teacherSelect.appendChild(opt);
  });
}


function getDateRange(from, to) {
  const dates = [];

  // Si no hay "hasta", usamos solo "desde"
  if (!to) {
    return [from];
  }

  const start = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");

  if (end < start) {
    return null; // lo usaremos para lanzar error
  }

  const current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function getSlotLabel(start_slot, end_slot) {
  if (start_slot === end_slot) return `Tramo ${start_slot}`;
  return `Tramos ${start_slot}–${end_slot}`;
}

async function loadAbsencesForSelectedDate() {
  const date = listDateInput.value;
  if (!date) return;
  const { data, error } = await client
    .from("absences")
    .select("id, teacher_name, date, start_slot, end_slot, reason")
    .eq("date", date)
    .order("teacher_name", { ascending: true })
    .order("start_slot", { ascending: true });

  if (error) {
    console.error("Error cargando ausencias del día:", error);
    listContainer.innerHTML = "<p>Error al cargar ausencias.</p>";
    return;
  }

  renderAbsenceList(data || []);
}

function renderAbsenceList(rows) {
  listContainer.innerHTML = "";

  if (!rows.length) {
    listContainer.innerHTML = "<p>No hay ausencias registradas para este día.</p>";
    return;
  }

  rows.forEach(row => {
    const div = document.createElement("div");
    div.className = "absence-item";
    div.dataset.id = row.id;

    const main = document.createElement("div");
    main.className = "absence-main";

    const strong = document.createElement("strong");
    strong.textContent = row.teacher_name;
    main.appendChild(strong);

    const meta = document.createElement("div");
    meta.className = "absence-meta";
    meta.textContent = getSlotLabel(row.start_slot, row.end_slot);
    main.appendChild(meta);

    if (row.reason) {
      const reasonP = document.createElement("div");
      reasonP.className = "absence-meta";
      reasonP.textContent = `Motivo: ${row.reason}`;
      main.appendChild(reasonP);
    }

    const actions = document.createElement("div");
    actions.className = "absence-actions";

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.textContent = "Eliminar";
    btnDel.dataset.id = row.id;
    btnDel.dataset.action = "delete";
    btnDel.className = "btn-delete";


    actions.appendChild(btnDel);

    const editContainer = document.createElement("div");
    editContainer.className = "absence-edit hidden";

    const editTitle = document.createElement("p");
    editTitle.className = "absence-edit-title";
    editTitle.textContent = "Editar tramos";
    editContainer.appendChild(editTitle);

    const controls = document.createElement("div");
    controls.className = "absence-edit-controls";

    const startSelect = createSlotSelect(row.start_slot, "edit-start-slot");
    const endSelect = createSlotSelect(row.end_slot, "edit-end-slot");
    controls.appendChild(startSelect);
    controls.appendChild(endSelect);

    const buttonsWrapper = document.createElement("div");
    buttonsWrapper.className = "absence-edit-buttons";

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.textContent = "Guardar";
    btnSave.dataset.id = row.id;
    btnSave.dataset.action = "save";
    btnSave.className = "btn-save";

    const btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.textContent = "Cancelar";
    btnCancel.dataset.action = "cancel";

    buttonsWrapper.appendChild(btnSave);
    buttonsWrapper.appendChild(btnCancel);

    const editMessage = document.createElement("div");
    editMessage.className = "absence-edit-message hidden";

    editContainer.appendChild(controls);
    editContainer.appendChild(buttonsWrapper);
    editContainer.appendChild(editMessage);

    div.appendChild(main);
    div.appendChild(actions);
    div.appendChild(editContainer);
    listContainer.appendChild(div);
  });
}

function createSlotSelect(selectedValue, className) {
  const select = document.createElement("select");
  select.className = className;
  SLOT_OPTIONS.forEach(option => {
    const opt = document.createElement("option");
    opt.value = String(option.value);
    opt.textContent = option.label;
    select.appendChild(opt);
  });
  select.value = String(selectedValue);
  return select;
}

function toggleAbsenceEdit(item, forceShow = null) {
  if (!item) return;
  const edit = item.querySelector(".absence-edit");
  if (!edit) return;

  const shouldShow = forceShow === null ? edit.classList.contains("hidden") : forceShow;

  if (listContainer) {
    listContainer.querySelectorAll(".absence-edit").forEach(panel => {
      if (panel !== edit) panel.classList.add("hidden");
    });
  }

  if (shouldShow) {
    edit.classList.remove("hidden");
  } else {
    edit.classList.add("hidden");
  }
}

function setAbsenceEditMessage(item, text, type = "") {
  const message = item.querySelector(".absence-edit-message");
  if (!message) return;
  if (!text) {
    message.textContent = "";
    message.className = "absence-edit-message hidden";
    return;
  }

  message.textContent = text;
  message.className = `absence-edit-message ${type}`;
}

async function updateAbsenceSlots(id, startSlot, endSlot, item) {
  if (!item) return;
  setAbsenceEditMessage(item, "Guardando cambios…", "info");

  const { error } = await client
    .from("absences")
    .update({ start_slot: startSlot, end_slot: endSlot })
    .eq("id", id);

  if (error) {
    setAbsenceEditMessage(item, "Error al guardar: " + error.message, "error");
    return;
  }

  setAbsenceEditMessage(item, "Cambios guardados", "ok");
  await loadAbsencesForSelectedDate();
}

async function deleteAbsence(id) {
  const { error } = await client
    .from("absences")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error al eliminar ausencia: " + error.message);
  } else {
    // recargamos la lista para la fecha seleccionada
    await loadAbsencesForSelectedDate();
  }
}

    // 6. Envío de ausencia
absenceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  absenceMessage.classList.add("hidden");

  const teacher_name = teacherSelect.value;
  const dateFrom = document.getElementById("date-from").value;
  const dateTo = document.getElementById("date-to").value;
  const start_slot = parseInt(document.getElementById("start-slot").value, 10);
  const end_slot = parseInt(document.getElementById("end-slot").value, 10);
  const reason = document.getElementById("reason").value.trim();

  if (!teacher_name || !dateFrom) {
    absenceMessage.textContent = "Completa profesor/a y fecha desde.";
    absenceMessage.className = "message error";
    absenceMessage.classList.remove("hidden");
    return;
  }

  if (end_slot < start_slot) {
    absenceMessage.textContent = "La hora final no puede ser menor que la inicial.";
    absenceMessage.className = "message error";
    absenceMessage.classList.remove("hidden");
    return;
  }

  const dates = getDateRange(dateFrom, dateTo);
  if (!dates) {
    absenceMessage.textContent = "La fecha hasta no puede ser anterior a la fecha desde.";
    absenceMessage.className = "message error";
    absenceMessage.classList.remove("hidden");
    return;
  }

  const rows = dates.map(d => ({
    teacher_name,
    date: d,
    start_slot,
    end_slot,
    reason: reason || null,
    planned: true
  }));

  const { error } = await client
    .from("absences")
    .insert(rows);

  if (error) {
    absenceMessage.textContent = "Error al guardar: " + error.message;
    absenceMessage.className = "message error";
    absenceMessage.classList.remove("hidden");
  } else {
    absenceMessage.textContent = `Ausencia registrada para ${rows.length} día(s).`;
    absenceMessage.className = "message ok";
    absenceMessage.classList.remove("hidden");

    absenceForm.reset();
    setTodayOnDateInputs();   // reseteamos fechas a hoy
    loadAbsencesForSelectedDate(); // refrescamos la lista de ese día
  }
});

// Botón "Actualizar" de la lista
btnRefreshList.addEventListener("click", () => {
  loadAbsencesForSelectedDate();
});

// Ejecutar la acción de "Actualizar" cuando cambie la fecha del input
if (listDateInput) {
  listDateInput.addEventListener("change", () => {
    // Simula el click del botón (mantiene comportamiento centralizado)
    btnRefreshList.click();
    // o directamente: loadAbsencesForSelectedDate();
  });
}

// Delegación de eventos para acciones dentro de la lista de ausencias
listContainer.addEventListener("click", (e) => {
  const actionBtn = e.target.closest("button[data-action]");
  if (actionBtn) {
    const id = parseInt(actionBtn.dataset.id, 10);
    const action = actionBtn.dataset.action;
    const item = actionBtn.closest(".absence-item");

    if (action === "delete" && !Number.isNaN(id)) {
      if (confirm("¿Eliminar esta ausencia?")) {
        deleteAbsence(id);
      }
      return;
    }

    if (action === "cancel" && item) {
      toggleAbsenceEdit(item, false);
      setAbsenceEditMessage(item, "");
      return;
    }

    if (action === "save" && item && !Number.isNaN(id)) {
      const startSlot = parseInt(item.querySelector(".edit-start-slot").value, 10);
      const endSlot = parseInt(item.querySelector(".edit-end-slot").value, 10);

      if (endSlot < startSlot) {
        setAbsenceEditMessage(item, "La hora final no puede ser menor que la inicial.", "error");
        return;
      }

      updateAbsenceSlots(id, startSlot, endSlot, item);
      return;
    }
  }

  const main = e.target.closest(".absence-main");
  if (main) {
    const item = main.closest(".absence-item");
    toggleAbsenceEdit(item);
  }
});

substitutionForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const teacherName = substitutionTeacherSelect.value;
  const displayName = substitutionDisplayNameInput.value.trim();
  const emailForm = substitutionEmailFormInput.value.trim();

  if (!teacherName || !displayName || !emailForm) {
    alert("Completa titular, nombre y email del sustituto.");
    return;
  }

  const { error } = await client
    .from("teachers")
    .update({
      display_name: displayName,
      email_form: emailForm
    })
    .eq("name", teacherName);

  if (error) {
    console.error("Error guardando sustitución:", error);
    alert("Error al guardar la sustitución: " + error.message);
    return;
  }

  // Limpiar formulario y recargar datos
  substitutionForm.reset();
  await loadActiveSubstitutions();
  await populateSubstitutionTeacherSelect(); // por si quieres refrescar (aunque no es imprescindible)
});


substitutionsBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-name]");
  if (!btn) return;

  const titularName = btn.dataset.name;
  const titularEmail = btn.dataset.email;

  if (!titularName) return;

  const ok = confirm(`¿Quitar sustituto de "${titularName}" y volver al titular?`);
  if (!ok) return;

  console.log("Intentando quitar sustituto de:", titularName, "->", titularEmail);
  const test = await client
  .from("teachers")
  .select("name, email, email_form")
  .eq("name", titularName);

console.log("Resultado del SELECT previo:", test);

  const { data, error } = await client
  .from("teachers")
  .update({
    display_name: titularName,
    email_form: titularEmail
  })
  .eq("name", titularName)
  .select("name, display_name, email_form");

  if (error) {
    console.error("Error quitando sustituto:", error);
    alert("Error al quitar el sustituto: " + error.message);
    return;
  }

  await loadActiveSubstitutions();
  await populateSubstitutionTeacherSelect();
});


    // Al cargar la página, comprobamos si ya hay sesión
    checkSession();
	setTodayOnDateFrom();