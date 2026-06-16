// --- State ---
let currentView = 'dashboard';
let currentPhaseFilter = null;
let currentIncidentFilter = null;
let phases = [];
let currentDocId = null;

// --- API Helpers ---
async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error en la petición');
    }
    return res.status === 204 ? null : res.json();
}

// --- Views ---
function showView(view) {
    currentView = view;
    const views = ['dashboard', 'steps', 'incidents', 'docs', 'gantt'];
    views.forEach(v => {
        document.getElementById(`view-${v}`).classList.toggle('hidden', v !== view);
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-300');
    });
    document.getElementById(`btn-${view}`).classList.remove('bg-gray-700', 'text-gray-300');
    document.getElementById(`btn-${view}`).classList.add('bg-blue-600', 'text-white');

    if (view === 'dashboard') loadDashboard();
    if (view === 'steps') loadSteps();
    if (view === 'incidents') loadIncidents();
    if (view === 'docs') loadDocs();
    if (view === 'gantt') loadGantt();
}

// ========================================
// DASHBOARD
// ========================================
async function loadDashboard() {
    const data = await api('/api/dashboard');
    const incidents = await api('/api/incidents?status=open');

    document.getElementById('overall-progress-bar').style.width = `${data.overall_progress}%`;
    document.getElementById('overall-progress-text').textContent = `${data.overall_progress}%`;
    document.getElementById('overall-progress-detail').textContent =
        `${data.completed_steps} de ${data.total_steps} pasos completados`;

    let totalPending = 0, totalInProgress = 0, totalCompleted = 0, totalBlocked = 0;

    const cardsHtml = data.phases.map(phase => {
        totalPending += phase.pending_steps;
        totalInProgress += phase.in_progress_steps;
        totalCompleted += phase.completed_steps;
        totalBlocked += phase.blocked_steps;

        const colorMap = {
            'Pre-Upgrade': 'yellow',
            'Durante Upgrade': 'blue',
            'Post-Upgrade': 'green',
        };
        const color = colorMap[phase.name] || 'blue';

        return `
            <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-${color}-400">${phase.name}</h3>
                    <span class="text-lg font-bold text-${color}-400">${phase.progress}%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div class="bg-${color}-500 h-2 rounded-full transition-all duration-500" style="width: ${phase.progress}%"></div>
                </div>
                <p class="text-xs text-gray-400">${phase.completed_steps}/${phase.total_steps} pasos completados</p>
                <p class="text-xs text-gray-500 mt-1">${phase.description || ''}</p>
            </div>
        `;
    }).join('');

    document.getElementById('phase-cards').innerHTML = cardsHtml;
    document.getElementById('stat-pending').textContent = totalPending;
    document.getElementById('stat-in-progress').textContent = totalInProgress;
    document.getElementById('stat-completed').textContent = totalCompleted;
    document.getElementById('stat-blocked').textContent = totalBlocked;
    document.getElementById('stat-incidents').textContent = incidents.length;
}

// ========================================
// STEPS
// ========================================
async function loadPhases() {
    phases = await api('/api/phases');
}

async function loadSteps() {
    if (phases.length === 0) await loadPhases();

    const tabsHtml = [
        `<button onclick="filterPhase(null)" class="phase-tab px-3 py-1.5 rounded-lg text-sm transition-colors ${!currentPhaseFilter ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">Todas</button>`,
        ...phases.map(p =>
            `<button onclick="filterPhase(${p.id})" class="phase-tab px-3 py-1.5 rounded-lg text-sm transition-colors ${currentPhaseFilter === p.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">${p.name}</button>`
        )
    ].join('');
    document.getElementById('phase-tabs').innerHTML = tabsHtml;

    const url = currentPhaseFilter ? `/api/steps?phase_id=${currentPhaseFilter}` : '/api/steps';
    const steps = await api(url);

    if (steps.length === 0) {
        document.getElementById('steps-list').innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-clipboard-list text-4xl mb-3"></i>
                <p>No hay pasos registrados. Añade el primero.</p>
            </div>`;
        return;
    }

    const statusConfig = {
        pending: { label: 'Pendiente', color: 'yellow', icon: 'clock' },
        in_progress: { label: 'En Progreso', color: 'blue', icon: 'spinner' },
        completed: { label: 'Completado', color: 'green', icon: 'check-circle' },
        blocked: { label: 'Bloqueado', color: 'red', icon: 'ban' },
    };

    const stepsHtml = steps.map(step => {
        const st = statusConfig[step.status] || statusConfig.pending;
        const phaseName = phases.find(p => p.id === step.phase_id)?.name || '';

        return `
            <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${st.color}-500/20 text-${st.color}-400">
                                <i class="fas fa-${st.icon} text-[10px]"></i> ${st.label}
                            </span>
                            <span class="text-xs text-gray-500">${phaseName}</span>
                            <span class="text-xs text-gray-600">#${step.sort_order}</span>
                        </div>
                        <h4 class="font-medium text-white">${escapeHtml(step.title)}</h4>
                        ${step.description ? `<p class="text-sm text-gray-400 mt-1">${escapeHtml(step.description)}</p>` : ''}
                        ${step.responsible ? `<p class="text-xs text-gray-500 mt-1"><i class="fas fa-user mr-1"></i>${escapeHtml(step.responsible)}</p>` : ''}
                        ${step.notes ? `<p class="text-xs text-green-500 mt-1"><i class="fas fa-file-lines mr-1"></i>Documentado</p>` : ''}
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <select onchange="updateStatus(${step.id}, this.value)" 
                            class="bg-gray-700 border border-gray-600 rounded text-xs px-2 py-1 text-gray-300">
                            <option value="pending" ${step.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                            <option value="in_progress" ${step.status === 'in_progress' ? 'selected' : ''}>En Progreso</option>
                            <option value="completed" ${step.status === 'completed' ? 'selected' : ''}>Completado</option>
                            <option value="blocked" ${step.status === 'blocked' ? 'selected' : ''}>Bloqueado</option>
                        </select>
                        <button onclick="openNotesModal(${step.id})"
                            class="p-2 text-gray-400 hover:text-blue-400 transition-colors" title="Documentar">
                            <i class="fas fa-file-pen"></i>
                        </button>
                        <button onclick="editStep(${step.id})"
                            class="p-2 text-gray-400 hover:text-yellow-400 transition-colors" title="Editar">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button onclick="deleteStep(${step.id})"
                            class="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('steps-list').innerHTML = stepsHtml;
}

function filterPhase(phaseId) {
    currentPhaseFilter = phaseId;
    loadSteps();
}

async function updateStatus(stepId, status) {
    await api(`/api/steps/${stepId}`, { method: 'PUT', body: JSON.stringify({ status }) });
    loadSteps();
}

// --- Step Modal ---
function openAddModal() {
    document.getElementById('modal-title').textContent = 'Nuevo Paso';
    document.getElementById('form-step-id').value = '';
    document.getElementById('form-title').value = '';
    document.getElementById('form-description').value = '';
    document.getElementById('form-responsible').value = '';
    const select = document.getElementById('form-phase');
    select.innerHTML = phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (currentPhaseFilter) select.value = currentPhaseFilter;
    document.getElementById('modal-step').classList.remove('hidden');
}

async function editStep(stepId) {
    const step = await api(`/api/steps/${stepId}`);
    document.getElementById('modal-title').textContent = 'Editar Paso';
    document.getElementById('form-step-id').value = step.id;
    document.getElementById('form-title').value = step.title;
    document.getElementById('form-description').value = step.description || '';
    document.getElementById('form-responsible').value = step.responsible || '';
    const select = document.getElementById('form-phase');
    select.innerHTML = phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    select.value = step.phase_id;
    document.getElementById('modal-step').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-step').classList.add('hidden');
}

document.getElementById('step-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const stepId = document.getElementById('form-step-id').value;
    const payload = {
        phase_id: parseInt(document.getElementById('form-phase').value),
        title: document.getElementById('form-title').value,
        description: document.getElementById('form-description').value || null,
        responsible: document.getElementById('form-responsible').value || null,
    };
    if (stepId) {
        await api(`/api/steps/${stepId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
        await api('/api/steps', { method: 'POST', body: JSON.stringify(payload) });
    }
    closeModal();
    loadSteps();
});

// --- Notes Modal ---
async function openNotesModal(stepId) {
    const step = await api(`/api/steps/${stepId}`);
    document.getElementById('notes-step-id').value = stepId;
    document.getElementById('notes-step-title').textContent = step.title;
    document.getElementById('notes-content').value = step.notes || '';
    document.getElementById('modal-notes').classList.remove('hidden');
}

function closeNotesModal() {
    document.getElementById('modal-notes').classList.add('hidden');
}

async function saveNotes() {
    const stepId = document.getElementById('notes-step-id').value;
    const notes = document.getElementById('notes-content').value;
    await api(`/api/steps/${stepId}`, { method: 'PUT', body: JSON.stringify({ notes }) });
    closeNotesModal();
    loadSteps();
}

// --- Delete Step ---
async function deleteStep(stepId) {
    if (!confirm('¿Estás seguro de eliminar este paso?')) return;
    await api(`/api/steps/${stepId}`, { method: 'DELETE' });
    loadSteps();
}

// ========================================
// INCIDENTS
// ========================================
async function loadIncidents() {
    if (phases.length === 0) await loadPhases();

    const url = currentIncidentFilter ? `/api/incidents?status=${currentIncidentFilter}` : '/api/incidents';
    const incidents = await api(url);

    // Update filter buttons
    document.querySelectorAll('.inc-filter-btn').forEach((btn, i) => {
        const filters = [null, 'open', 'in_progress', 'resolved', 'closed'];
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-300');
        if (filters[i] === currentIncidentFilter) {
            btn.classList.remove('bg-gray-700', 'text-gray-300');
            btn.classList.add('bg-blue-600', 'text-white');
        }
    });

    if (incidents.length === 0) {
        document.getElementById('incidents-list').innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-check-circle text-4xl mb-3"></i>
                <p>No hay incidencias registradas.</p>
            </div>`;
        return;
    }

    const severityConfig = {
        low: { label: 'Baja', color: 'gray' },
        medium: { label: 'Media', color: 'yellow' },
        high: { label: 'Alta', color: 'orange' },
        critical: { label: 'Crítica', color: 'red' },
    };

    const statusConfig = {
        open: { label: 'Abierta', color: 'red' },
        in_progress: { label: 'En Progreso', color: 'blue' },
        resolved: { label: 'Resuelta', color: 'green' },
        closed: { label: 'Cerrada', color: 'gray' },
    };

    const html = incidents.map(inc => {
        const sev = severityConfig[inc.severity] || severityConfig.medium;
        const st = statusConfig[inc.status] || statusConfig.open;
        const phaseName = inc.phase_id ? (phases.find(p => p.id === inc.phase_id)?.name || '') : '';

        return `
            <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${st.color}-500/20 text-${st.color}-400">
                                ${st.label}
                            </span>
                            <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${sev.color}-500/20 text-${sev.color}-400">
                                <i class="fas fa-triangle-exclamation text-[10px]"></i> ${sev.label}
                            </span>
                            ${phaseName ? `<span class="text-xs text-gray-500">${phaseName}</span>` : ''}
                        </div>
                        <h4 class="font-medium text-white">${escapeHtml(inc.title)}</h4>
                        ${inc.description ? `<p class="text-sm text-gray-400 mt-1">${escapeHtml(inc.description)}</p>` : ''}
                        ${inc.responsible ? `<p class="text-xs text-gray-500 mt-1"><i class="fas fa-user mr-1"></i>${escapeHtml(inc.responsible)}</p>` : ''}
                        ${inc.resolution ? `<p class="text-xs text-green-400 mt-2"><i class="fas fa-check mr-1"></i><strong>Resolución:</strong> ${escapeHtml(inc.resolution)}</p>` : ''}
                        <p class="text-xs text-gray-600 mt-1">${new Date(inc.created_at).toLocaleString('es-ES')}</p>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <select onchange="updateIncidentStatus(${inc.id}, this.value)"
                            class="bg-gray-700 border border-gray-600 rounded text-xs px-2 py-1 text-gray-300">
                            <option value="open" ${inc.status === 'open' ? 'selected' : ''}>Abierta</option>
                            <option value="in_progress" ${inc.status === 'in_progress' ? 'selected' : ''}>En Progreso</option>
                            <option value="resolved" ${inc.status === 'resolved' ? 'selected' : ''}>Resuelta</option>
                            <option value="closed" ${inc.status === 'closed' ? 'selected' : ''}>Cerrada</option>
                        </select>
                        <button onclick="editIncident(${inc.id})"
                            class="p-2 text-gray-400 hover:text-yellow-400 transition-colors" title="Editar">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button onclick="deleteIncident(${inc.id})"
                            class="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('incidents-list').innerHTML = html;
}

function filterIncidents(status) {
    currentIncidentFilter = status;
    loadIncidents();
}

async function updateIncidentStatus(incidentId, status) {
    await api(`/api/incidents/${incidentId}`, { method: 'PUT', body: JSON.stringify({ status }) });
    loadIncidents();
}

// --- Incident Modal ---
function openIncidentModal() {
    document.getElementById('incident-modal-title').textContent = 'Nueva Incidencia';
    document.getElementById('inc-form-id').value = '';
    document.getElementById('inc-form-title').value = '';
    document.getElementById('inc-form-description').value = '';
    document.getElementById('inc-form-severity').value = 'medium';
    document.getElementById('inc-form-responsible').value = '';
    document.getElementById('inc-form-resolution').value = '';
    document.getElementById('inc-resolution-section').classList.add('hidden');

    const select = document.getElementById('inc-form-phase');
    select.innerHTML = '<option value="">-- Sin fase --</option>' +
        phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    document.getElementById('modal-incident').classList.remove('hidden');
}

async function editIncident(incidentId) {
    const inc = await api(`/api/incidents/${incidentId}`);
    document.getElementById('incident-modal-title').textContent = 'Editar Incidencia';
    document.getElementById('inc-form-id').value = inc.id;
    document.getElementById('inc-form-title').value = inc.title;
    document.getElementById('inc-form-description').value = inc.description || '';
    document.getElementById('inc-form-severity').value = inc.severity;
    document.getElementById('inc-form-responsible').value = inc.responsible || '';
    document.getElementById('inc-form-resolution').value = inc.resolution || '';
    document.getElementById('inc-resolution-section').classList.remove('hidden');

    const select = document.getElementById('inc-form-phase');
    select.innerHTML = '<option value="">-- Sin fase --</option>' +
        phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (inc.phase_id) select.value = inc.phase_id;

    document.getElementById('modal-incident').classList.remove('hidden');
}

function closeIncidentModal() {
    document.getElementById('modal-incident').classList.add('hidden');
}

document.getElementById('incident-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const incId = document.getElementById('inc-form-id').value;
    const payload = {
        title: document.getElementById('inc-form-title').value,
        description: document.getElementById('inc-form-description').value || null,
        severity: document.getElementById('inc-form-severity').value,
        phase_id: document.getElementById('inc-form-phase').value ? parseInt(document.getElementById('inc-form-phase').value) : null,
        responsible: document.getElementById('inc-form-responsible').value || null,
    };

    if (incId) {
        payload.resolution = document.getElementById('inc-form-resolution').value || null;
        await api(`/api/incidents/${incId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
        await api('/api/incidents', { method: 'POST', body: JSON.stringify(payload) });
    }
    closeIncidentModal();
    loadIncidents();
});

async function deleteIncident(incidentId) {
    if (!confirm('¿Eliminar esta incidencia?')) return;
    await api(`/api/incidents/${incidentId}`, { method: 'DELETE' });
    loadIncidents();
}

// ========================================
// DOCUMENTATION
// ========================================
async function loadDocs() {
    const docs = await api('/api/docs');

    const categoryIcons = {
        general: 'file-lines',
        plan: 'map',
        arquitectura: 'sitemap',
        rollback: 'rotate-left',
        contactos: 'address-book',
        lecciones: 'lightbulb',
        comandos: 'terminal',
        configuracion: 'gear',
    };

    const html = docs.map(doc => {
        const icon = categoryIcons[doc.category] || 'file-lines';
        const isActive = currentDocId === doc.id;
        return `
            <button onclick="selectDoc(${doc.id})"
                class="w-full text-left p-3 rounded-lg border transition-colors ${isActive ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300'}">
                <div class="flex items-center gap-2">
                    <i class="fas fa-${icon} text-sm"></i>
                    <span class="text-sm font-medium truncate">${escapeHtml(doc.title)}</span>
                </div>
                <span class="text-xs text-gray-500 capitalize">${doc.category}</span>
            </button>
        `;
    }).join('');

    document.getElementById('docs-list').innerHTML = html || '<p class="text-gray-500 text-sm">No hay documentos.</p>';

    if (currentDocId) {
        await renderDocEditor(currentDocId);
    }
}

async function selectDoc(docId) {
    currentDocId = docId;
    loadDocs();
}

async function renderDocEditor(docId) {
    const doc = await api(`/api/docs/${docId}`);
    document.getElementById('doc-editor').innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div>
                <h3 class="font-semibold text-white">${escapeHtml(doc.title)}</h3>
                <span class="text-xs text-gray-500 capitalize">${doc.category} · Actualizado: ${new Date(doc.updated_at).toLocaleString('es-ES')}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="saveDoc(${doc.id})"
                    class="px-3 py-1.5 rounded-lg text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors">
                    <i class="fas fa-save mr-1"></i> Guardar
                </button>
                <button onclick="deleteDoc(${doc.id})"
                    class="px-3 py-1.5 rounded-lg text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <textarea id="doc-content" rows="16"
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
            placeholder="Escribe la documentación aquí...">${escapeHtml(doc.content || '')}</textarea>
    `;
}

async function saveDoc(docId) {
    const content = document.getElementById('doc-content').value;
    await api(`/api/docs/${docId}`, { method: 'PUT', body: JSON.stringify({ content }) });
    loadDocs();
}

async function deleteDoc(docId) {
    if (!confirm('¿Eliminar este documento?')) return;
    await api(`/api/docs/${docId}`, { method: 'DELETE' });
    currentDocId = null;
    document.getElementById('doc-editor').innerHTML = `
        <div class="text-center text-gray-500 py-12">
            <i class="fas fa-file-lines text-4xl mb-3"></i>
            <p>Selecciona un documento para editarlo</p>
        </div>`;
    loadDocs();
}

// --- Doc Modal ---
function openDocModal() {
    document.getElementById('doc-form-title').value = '';
    document.getElementById('doc-form-category').value = 'general';
    document.getElementById('modal-doc').classList.remove('hidden');
}

function closeDocModal() {
    document.getElementById('modal-doc').classList.add('hidden');
}

document.getElementById('doc-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        title: document.getElementById('doc-form-title').value,
        category: document.getElementById('doc-form-category').value,
        content: '',
    };
    const newDoc = await api('/api/docs', { method: 'POST', body: JSON.stringify(payload) });
    closeDocModal();
    currentDocId = newDoc.id;
    loadDocs();
});

// ========================================
// GANTT CHART
// ========================================
async function loadGantt() {
    if (phases.length === 0) await loadPhases();
    const steps = await api('/api/steps');

    // Find date range
    const stepsWithDates = steps.filter(s => s.planned_start && s.planned_end);
    if (stepsWithDates.length === 0) {
        document.getElementById('gantt-container').innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-calendar-xmark text-4xl mb-3"></i>
                <p>No hay pasos con fechas planificadas asignadas.</p>
            </div>`;
        return;
    }

    const allStarts = stepsWithDates.map(s => new Date(s.planned_start));
    const allEnds = stepsWithDates.map(s => new Date(s.planned_end));
    const minDate = new Date(Math.min(...allStarts));
    const maxDate = new Date(Math.max(...allEnds));

    // Add padding
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);

    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    const dayWidth = 28; // pixels per day
    const headerHeight = 50;
    const rowHeight = 32;
    const labelWidth = 320;

    // Generate weeks/days header
    let headerHtml = '';
    let daysHtml = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Week headers
    let weekStart = new Date(minDate);
    const weekLabels = [];
    while (weekStart <= maxDate) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const effectiveEnd = weekEnd > maxDate ? maxDate : weekEnd;
        const daysInWeek = Math.ceil((effectiveEnd - weekStart) / (1000 * 60 * 60 * 24)) + 1;
        weekLabels.push({
            label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
            width: daysInWeek * dayWidth
        });
        weekStart.setDate(weekStart.getDate() + 7);
    }

    headerHtml = weekLabels.map(w =>
        `<div class="flex-shrink-0 text-center text-xs text-gray-400 border-r border-gray-700 font-medium" style="width:${w.width}px">${w.label}</div>`
    ).join('');

    // Day cells
    for (let d = 0; d < totalDays; d++) {
        const currentDay = new Date(minDate);
        currentDay.setDate(currentDay.getDate() + d);
        const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
        const isToday = currentDay.getTime() === today.getTime();
        const dayNum = currentDay.getDate();
        const bgClass = isToday ? 'bg-blue-900/40' : isWeekend ? 'bg-gray-800/50' : '';
        daysHtml += `<div class="flex-shrink-0 text-center text-[10px] text-gray-600 border-r border-gray-700/50 ${bgClass}" style="width:${dayWidth}px">${dayNum}</div>`;
    }

    // Status colors
    const statusColors = {
        pending: 'bg-yellow-500',
        in_progress: 'bg-blue-500',
        completed: 'bg-green-500',
        blocked: 'bg-red-500',
    };

    // Build rows grouped by phase
    let rowsHtml = '';
    let rowIndex = 0;

    phases.forEach(phase => {
        const phaseSteps = stepsWithDates.filter(s => s.phase_id === phase.id);
        if (phaseSteps.length === 0) return;

        // Phase header row
        rowsHtml += `
            <div class="flex border-b border-gray-700" style="height:${rowHeight}px">
                <div class="flex-shrink-0 flex items-center px-3 bg-gray-750 border-r border-gray-700 font-semibold text-xs text-blue-400 truncate" style="width:${labelWidth}px; background: rgba(30,58,95,0.3)">
                    <i class="fas fa-folder-open mr-2 text-[10px]"></i>${escapeHtml(phase.name)}
                </div>
                <div class="flex-1 relative" style="background: rgba(30,58,95,0.15)"></div>
            </div>
        `;
        rowIndex++;

        phaseSteps.forEach(step => {
            const start = new Date(step.planned_start);
            const end = new Date(step.planned_end);
            const startOffset = Math.ceil((start - minDate) / (1000 * 60 * 60 * 24));
            const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            const left = startOffset * dayWidth;
            const width = duration * dayWidth - 4;
            const colorClass = statusColors[step.status] || statusColors.pending;
            const stripedBg = rowIndex % 2 === 0 ? 'bg-gray-800/30' : '';

            rowsHtml += `
                <div class="flex border-b border-gray-700/50" style="height:${rowHeight}px">
                    <div class="flex-shrink-0 flex items-center px-3 border-r border-gray-700 text-xs text-gray-300 truncate ${stripedBg}" style="width:${labelWidth}px" title="${escapeHtml(step.title)}">
                        ${escapeHtml(step.title)}
                    </div>
                    <div class="flex-1 relative ${stripedBg}" style="min-width:${totalDays * dayWidth}px">
                        <div class="absolute top-1.5 rounded-sm h-5 ${colorClass} opacity-85 flex items-center px-2 cursor-default transition-opacity hover:opacity-100"
                             style="left:${left}px; width:${width}px"
                             title="${escapeHtml(step.title)}\n${step.planned_start} → ${step.planned_end}\nEstado: ${step.status}">
                            <span class="text-[10px] text-white font-medium truncate">${duration}d</span>
                        </div>
                    </div>
                </div>
            `;
            rowIndex++;
        });
    });

    // Today line position
    const todayOffset = Math.ceil((today - minDate) / (1000 * 60 * 60 * 24));
    const todayLeft = todayOffset * dayWidth + labelWidth;

    document.getElementById('gantt-container').innerHTML = `
        <div class="relative">
            <!-- Header -->
            <div class="flex border-b border-gray-600 sticky top-0 bg-gray-800 z-10">
                <div class="flex-shrink-0 flex items-center px-3 border-r border-gray-700 text-xs font-semibold text-gray-400" style="width:${labelWidth}px; height:${headerHeight}px">
                    Tarea
                </div>
                <div class="flex-1 overflow-hidden">
                    <div class="flex" style="height:25px">${headerHtml}</div>
                    <div class="flex" style="height:25px">${daysHtml}</div>
                </div>
            </div>
            <!-- Rows -->
            <div class="relative">
                ${rowsHtml}
                <!-- Today marker -->
                ${todayOffset >= 0 && todayOffset <= totalDays ? `
                    <div class="absolute top-0 bottom-0 w-0.5 bg-red-500/70 z-20 pointer-events-none" style="left:${todayLeft}px">
                        <div class="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-gray-800"></div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ========================================
// UTILS
// ========================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    loadPhases().then(() => loadDashboard());
});
