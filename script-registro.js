let attendanceData = [];
let teachers = [];
let dates = [];
let filteredData = [];
let registroInitialized = false;

function initRegistroApp() {
    if (registroInitialized) return true;

    const csvInput = document.getElementById('csvFile');
    if (!csvInput) return false;

    registroInitialized = true;

    // CSV File Upload Handler
    csvInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const fileName = document.getElementById('fileName');
            if (fileName) {
                fileName.textContent = file.name;
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                parseCSV(e.target.result);
            };
            // Use ISO-8859-1 encoding to properly handle Spanish characters
            reader.readAsText(file, 'ISO-8859-1');
        }
    });

    // Help modal logic
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const helpClose = document.getElementById('helpClose');
    const helpOverlay = document.getElementById('helpOverlay');

    function openHelpModal() {
        if (!helpModal) return;
        helpModal.classList.add('open');
        helpModal.setAttribute('aria-hidden', 'false');
        if (helpClose) helpClose.focus();
    }

    function closeHelpModal() {
        if (!helpModal) return;
        helpModal.classList.remove('open');
        helpModal.setAttribute('aria-hidden', 'true');
        if (helpBtn) helpBtn.focus();
    }

    if (helpBtn) helpBtn.addEventListener('click', openHelpModal);
    if (helpClose) helpClose.addEventListener('click', closeHelpModal);
    if (helpOverlay) helpOverlay.addEventListener('click', closeHelpModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && helpModal && helpModal.classList.contains('open')) {
            closeHelpModal();
        }
    });

    return true;
}

function waitForRegistroApp() {
    if (initRegistroApp()) return;
    setTimeout(waitForRegistroApp, 300);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForRegistroApp);
} else {
    waitForRegistroApp();
}

// Parse CSV Data
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const records = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line (handle quoted fields)
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches || matches.length < 6) continue;

        const record = {
            type: matches[0].replace(/"/g, ''),
            location: matches[1].replace(/"/g, ''),
            datetime: matches[2].replace(/"/g, ''),
            method: matches[3].replace(/"/g, ''),
            observations: matches[4].replace(/"/g, ''),
            name: matches[5].replace(/"/g, ''),
            approved: matches[6] ? matches[6].replace(/"/g, '') : ''
        };

        records.push(record);
    }

    processAttendanceData(records);
}

// Process Attendance Data
function processAttendanceData(records) {
    const teacherMap = new Map();

    records.forEach(record => {
        if (!record.name || !record.datetime) return;

        // Parse date (format: DD/MM/YYYY HH:MM)
        const dateParts = record.datetime.split(' ')[0].split('/');
        if (dateParts.length !== 3) return;

        const date = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // YYYY-MM-DD
        const teacher = record.name;

        // Initialize teacher data
        if (!teacherMap.has(teacher)) {
            teacherMap.set(teacher, new Map());
        }

        const teacherDates = teacherMap.get(teacher);
        if (!teacherDates.has(date)) {
            teacherDates.set(date, {
                hasEntry: false,
                hasExit: false,
                isLeave: false,
                records: []
            });
        }

        const dayData = teacherDates.get(date);
        dayData.records.push(record);

        // Process record type
        switch (record.type) {
            case 'ENTRADA':
                dayData.hasEntry = true;
                break;
            case 'SALIDA':
                dayData.hasExit = true;
                break;
            case 'SOL. ENTRADA':
                dayData.hasEntry = true;
                break;
            case 'SOL. SALIDA':
                dayData.hasExit = true;
                break;
            case 'SOL. ENTRADA/SALIDA':
                dayData.hasEntry = true;
                dayData.hasExit = true;
                break;
            case 'BAJA':
                dayData.isLeave = true;
                break;
        }
    });

    // Convert to array and sort
    teachers = Array.from(teacherMap.keys()).sort();
    const allDates = new Set();

    teacherMap.forEach(teacherDates => {
        teacherDates.forEach((_, date) => allDates.add(date));
    });

    dates = Array.from(allDates).sort();

    // Build attendance data
    attendanceData = teachers.map(teacher => {
        const teacherDates = teacherMap.get(teacher);
        const attendance = {};

        dates.forEach(date => {
            if (teacherDates.has(date)) {
                attendance[date] = teacherDates.get(date);
            } else {
                attendance[date] = {
                    hasEntry: false,
                    hasExit: false,
                    isLeave: false,
                    records: []
                };
            }
        });

        return {
            name: teacher,
            attendance: attendance,
            score: 0 // Will be calculated later
        };
    });

    filteredData = [...attendanceData];
    renderTable();
    updateStats();
    setupFilters();
}

// Render Table
function renderTable() {
    const wrapper = document.getElementById('tableWrapper');
    if (!wrapper) return;

    if (filteredData.length === 0) {
        wrapper.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">!</div>
                <h2>No se encontraron resultados</h2>
                <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }

    let html = '<table><thead><tr>';
    html += '<th class="teacher-col">Profesor/a</th>';

    dates.forEach(date => {
        const [year, month, day] = date.split('-');
        html += `<th class="tooltip" data-tooltip="${date}">${day}/${month}</th>`;
    });

    html += '</tr></thead><tbody>';

    filteredData.forEach(teacher => {
        html += '<tr>';
        html += `<td class="teacher-name">${teacher.name}</td>`;

        dates.forEach(date => {
            const dayData = teacher.attendance[date];
            const status = getStatus(dayData);
            const icon = getStatusIcon(status);
            const tooltip = getTooltip(dayData, date);

            html += `<td><span class="status-icon status-${status} tooltip" data-tooltip="${tooltip}">${icon}</span></td>`;
        });

        html += '</tr>';
    });

    html += '</tbody></table>';
    wrapper.innerHTML = html;

    const stats = document.getElementById('stats');
    if (stats) {
        stats.style.display = 'grid';
    }
}

// Get Status
function getStatus(dayData) {
    if (dayData.isLeave) return 'leave';
    if (dayData.hasEntry && dayData.hasExit) return 'complete';
    if (dayData.hasEntry || dayData.hasExit) return 'partial';
    return 'missing';
}

// Get Status Icon
function getStatusIcon(status) {
    switch (status) {
        case 'complete': return 'OK';
        case 'partial': return '~';
        case 'leave': return 'B';
        case 'missing': return 'X';
        default: return '?';
    }
}

// Normalize text by removing accents and diacritics
function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Get Tooltip
function getTooltip(dayData, date) {
    if (dayData.isLeave) return 'Baja/Ausencia';

    const parts = [];
    if (dayData.hasEntry) parts.push('Entrada OK');
    else parts.push('Entrada --');

    if (dayData.hasExit) parts.push('Salida OK');
    else parts.push('Salida --');

    return parts.join(' | ');
}

// Calculate Teacher Score (higher score = less usage of attendance system)
function calculateTeacherScore(teacher, dateRange = null) {
    let score = 0;
    const datesToCheck = dateRange || dates;

    datesToCheck.forEach(date => {
        const dayData = teacher.attendance[date];
        const status = getStatus(dayData);

        // Scoring system:
        // partial (~) = 1 point
        // missing (X) = 2 points
        // complete (OK) = 0 points
        // leave (B) = 0 points
        if (status === 'partial') {
            score += 1;
        } else if (status === 'missing') {
            score += 2;
        }
    });

    return score;
}

// Update Stats
function updateStats() {
    const totalTeachers = document.getElementById('totalTeachers');
    const totalDays = document.getElementById('totalDays');
    const completeCount = document.getElementById('completeCount');
    const incompleteCount = document.getElementById('incompleteCount');

    if (totalTeachers) totalTeachers.textContent = teachers.length;
    if (totalDays) totalDays.textContent = dates.length;

    let complete = 0;
    let incomplete = 0;

    attendanceData.forEach(teacher => {
        dates.forEach(date => {
            const dayData = teacher.attendance[date];
            const status = getStatus(dayData);
            if (status === 'complete') complete++;
            else if (status === 'partial' || status === 'missing') incomplete++;
        });
    });

    if (completeCount) completeCount.textContent = complete;
    if (incompleteCount) incompleteCount.textContent = incomplete;
}

// Setup Filters
function setupFilters() {
    if (dates.length > 0) {
        document.getElementById('dateFrom').value = dates[0];
        document.getElementById('dateTo').value = dates[dates.length - 1];
    }

    document.getElementById('searchTeacher').addEventListener('input', applyFilters);
    document.getElementById('filterStatus').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);
    document.getElementById('dateFrom').addEventListener('change', applyFilters);
    document.getElementById('dateTo').addEventListener('change', applyFilters);
}

// Apply Filters
function applyFilters() {
    const searchTerm = document.getElementById('searchTeacher').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortBy').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    let dateRange = dates;
    if (dateFrom || dateTo) {
        dateRange = dates.filter(date => {
            if (dateFrom && date < dateFrom) return false;
            if (dateTo && date > dateTo) return false;
            return true;
        });
    }

    filteredData = attendanceData.filter(teacher => {
        if (searchTerm && !normalizeText(teacher.name).includes(normalizeText(searchTerm))) {
            return false;
        }

        if (statusFilter !== 'all') {
            let hasMatchingStatus = false;
            dateRange.forEach(date => {
                const status = getStatus(teacher.attendance[date]);
                if (status === statusFilter) {
                    hasMatchingStatus = true;
                }
            });
            if (!hasMatchingStatus) return false;
        }

        return true;
    });

    filteredData.forEach(teacher => {
        teacher.score = calculateTeacherScore(teacher, dateRange);
    });

    if (sortBy === 'score') {
        filteredData.sort((a, b) => b.score - a.score);
    } else {
        filteredData.sort((a, b) => a.name.localeCompare(b.name));
    }

    renderTable();
}
