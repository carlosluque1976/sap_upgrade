// ========================================
// I18N - Translations
// ========================================
const translations = {
    es: {
        "nav.dashboard": "Dashboard",
        "nav.steps": "Pasos",
        "nav.incidents": "Incidencias",
        "nav.docs": "Documentación",
        "nav.contacts": "Contactos",
        "dashboard.overall_progress": "Progreso General del Upgrade",
        "dashboard.steps_completed": "{0} de {1} pasos completados",
        "status.pending": "Pendiente",
        "status.in_progress": "En Progreso",
        "status.completed": "Completado",
        "status.blocked": "Bloqueado",
        "status.open_incidents": "Incidencias Abiertas",
        "steps.title": "Gestión de Pasos",
        "steps.new": "Nuevo Paso",
        "steps.all": "Todas",
        "steps.empty": "No hay pasos registrados. Añade el primero.",
        "steps.documented": "Documentado",
        "incidents.title": "Gestión de Incidencias",
        "incidents.new": "Nueva Incidencia",
        "incidents.empty": "No hay incidencias registradas.",
        "incidents.all": "Todas",
        "incidents.open": "Abiertas",
        "incidents.in_progress": "En Progreso",
        "incidents.resolved": "Resueltas",
        "incidents.closed": "Cerradas",
        "incidents.resolution": "Resolución",
        "docs.title": "Documentación del Proceso",
        "docs.new": "Nuevo Documento",
        "docs.select_prompt": "Selecciona un documento para editarlo",
        "gantt.title": "Vista Gantt del Proyecto",
        "gantt.task": "Tarea",
        "gantt.responsible": "Resp.",
        "gantt.no_dates": "No hay pasos con fechas planificadas.",
        "contacts.title": "Equipo de Contactos",
        "contacts.new": "Nuevo Contacto",
        "contacts.edit": "Editar Contacto",
        "contacts.info": "Información de Contacto",
        "contacts.name": "Nombre",
        "contacts.role": "Rol",
        "contacts.phone": "Teléfono",
        "contacts.company": "Empresa",
        "contacts.notes": "Notas",
        "contacts.empty": "No hay contactos registrados.",
        "form.phase": "Fase",
        "form.title_label": "Título",
        "form.description": "Descripción",
        "form.responsible": "Responsable",
        "form.severity": "Severidad",
        "form.related_phase": "Fase",
        "form.resolution": "Resolución",
        "form.category": "Categoría",
        "form.cancel": "Cancelar",
        "form.save": "Guardar",
        "form.save_notes": "Guardar Notas",
        "form.create": "Crear",
        "form.delete_confirm": "¿Estás seguro de eliminar?",
        "notes.title": "Documentación del Paso",
        "severity.low": "Baja",
        "severity.medium": "Media",
        "severity.high": "Alta",
        "severity.critical": "Crítica",
        "no_responsible": "Sin asignar",
    },
    ro: {
        "nav.dashboard": "Panou",
        "nav.steps": "Pași",
        "nav.incidents": "Incidente",
        "nav.docs": "Documentație",
        "nav.contacts": "Contacte",
        "dashboard.overall_progress": "Progresul General al Upgrade-ului",
        "dashboard.steps_completed": "{0} din {1} pași finalizați",
        "status.pending": "În așteptare",
        "status.in_progress": "În curs",
        "status.completed": "Finalizat",
        "status.blocked": "Blocat",
        "status.open_incidents": "Incidente Deschise",
        "steps.title": "Gestionarea Pașilor",
        "steps.new": "Pas Nou",
        "steps.all": "Toate",
        "steps.empty": "Nu sunt pași înregistrați. Adaugă primul.",
        "steps.documented": "Documentat",
        "incidents.title": "Gestionarea Incidentelor",
        "incidents.new": "Incident Nou",
        "incidents.empty": "Nu sunt incidente înregistrate.",
        "incidents.all": "Toate",
        "incidents.open": "Deschise",
        "incidents.in_progress": "În curs",
        "incidents.resolved": "Rezolvate",
        "incidents.closed": "Închise",
        "incidents.resolution": "Rezoluție",
        "docs.title": "Documentația Procesului",
        "docs.new": "Document Nou",
        "docs.select_prompt": "Selectează un document pentru editare",
        "gantt.title": "Vizualizare Gantt a Proiectului",
        "gantt.task": "Sarcină",
        "gantt.responsible": "Resp.",
        "gantt.no_dates": "Nu sunt pași cu date planificate.",
        "contacts.title": "Echipa de Contact",
        "contacts.new": "Contact Nou",
        "contacts.edit": "Editare Contact",
        "contacts.info": "Informații Contact",
        "contacts.name": "Nume",
        "contacts.role": "Rol",
        "contacts.phone": "Telefon",
        "contacts.company": "Companie",
        "contacts.notes": "Note",
        "contacts.empty": "Nu sunt contacte înregistrate.",
        "form.phase": "Fază",
        "form.title_label": "Titlu",
        "form.description": "Descriere",
        "form.responsible": "Responsabil",
        "form.severity": "Severitate",
        "form.related_phase": "Fază",
        "form.resolution": "Rezoluție",
        "form.category": "Categorie",
        "form.cancel": "Anulare",
        "form.save": "Salvare",
        "form.save_notes": "Salvare Note",
        "form.create": "Creare",
        "form.delete_confirm": "Sigur doriți să ștergeți?",
        "notes.title": "Documentația Pasului",
        "severity.low": "Scăzută",
        "severity.medium": "Medie",
        "severity.high": "Ridicată",
        "severity.critical": "Critică",
        "no_responsible": "Neatribuit",
    }
};

let currentLang = localStorage.getItem('sap_upgrade_lang') || 'es';

function t(key, ...args) {
    let text = translations[currentLang][key] || translations['es'][key] || key;
    args.forEach((arg, i) => { text = text.replace(`{${i}}`, arg); });
    return text;
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('sap_upgrade_lang', lang);
    document.getElementById('flag-es').classList.toggle('opacity-100', lang === 'es');
    document.getElementById('flag-es').classList.toggle('opacity-50', lang !== 'es');
    document.getElementById('flag-ro').classList.toggle('opacity-100', lang === 'ro');
    document.getElementById('flag-ro').classList.toggle('opacity-50', lang !== 'ro');
    applyTranslations();
    // Reload current view
    showView(currentView);
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
}

// ========================================
// STATE
// ========================================
let currentView = 'dashboard';
let currentPhaseFilter = null;
let currentIncidentFilter = null;
let phases = [];
let contacts = [];
let currentDocId = null;

// ========================================
// API
// ========================================
async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error');
    }
    return res.status === 204 ? null : res.json();
}

// ========================================
// VIEWS
// ========================================
function showView(view) {
    currentView = view;
    const views = ['dashboard', 'steps', 'incidents', 'docs', 'gantt', 'contacts'];
    views.forEach(v => document.getElementById(`view-${v}`).classList.toggle('hidden', v !== view));

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
    if (view === 'contacts') loadContacts();
}

// ========================================
// DASHBOARD
// ========================================
async function loadDashboard() {
    const data = await api('/api/dashboard');
    const incidents = await api('/api/incidents?status=open');

    document.getElementById('overall-progress-bar').style.width = `${data.overall_progress}%`;
    document.getElementById('overall-progress-text').textContent = `${data.overall_progress}%`;
    document.getElementById('overall-progress-detail').textContent = t('dashboard.steps_completed', data.completed_steps, data.total_steps);

    let totalPending = 0, totalInProgress = 0, totalCompleted = 0, totalBlocked = 0;

    const cardsHtml = data.phases.map(phase => {
        totalPending += phase.pending_steps;
        totalInProgress += phase.in_progress_steps;
        totalCompleted += phase.completed_steps;
        totalBlocked += phase.blocked_steps;
        const colors = ['yellow', 'blue', 'orange', 'purple', 'teal', 'indigo', 'green', 'emerald'];
        const color = colors[phase.id % colors.length] || 'blue';
        return `
            <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-medium text-sm text-${color}-400 truncate">${phase.name}</h3>
                    <span class="text-sm font-bold text-${color}-400">${phase.progress}%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div class="bg-${color}-500 h-2 rounded-full transition-all" style="width:${phase.progress}%"></div>
                </div>
                <p class="text-xs text-gray-400">${phase.completed_steps}/${phase.total_steps}</p>
            </div>`;
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
async function loadPhases() { phases = await api('/api/phases'); }
async function loadContactsList() { contacts = await api('/api/contacts'); }

async function loadSteps() {
    if (phases.length === 0) await loadPhases();
    if (contacts.length === 0) await loadContactsList();

    const tabsHtml = [
        `<button onclick="filterPhase(null)" class="px-3 py-1.5 rounded-lg text-sm transition-colors ${!currentPhaseFilter ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">${t('steps.all')}</button>`,
        ...phases.map(p => `<button onclick="filterPhase(${p.id})" class="px-3 py-1.5 rounded-lg text-sm transition-colors ${currentPhaseFilter === p.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">${p.name}</button>`)
    ].join('');
    document.getElementById('phase-tabs').innerHTML = tabsHtml;

    const url = currentPhaseFilter ? `/api/steps?phase_id=${currentPhaseFilter}` : '/api/steps';
    const steps = await api(url);

    if (steps.length === 0) {
        document.getElementById('steps-list').innerHTML = `<div class="text-center py-12 text-gray-500"><i class="fas fa-clipboard-list text-4xl mb-3"></i><p>${t('steps.empty')}</p></div>`;
        return;
    }

    const statusCfg = {
        pending: { label: t('status.pending'), color: 'yellow', icon: 'clock' },
        in_progress: { label: t('status.in_progress'), color: 'blue', icon: 'spinner' },
        completed: { label: t('status.completed'), color: 'green', icon: 'check-circle' },
        blocked: { label: t('status.blocked'), color: 'red', icon: 'ban' },
    };

    const html = steps.map(step => {
        const st = statusCfg[step.status] || statusCfg.pending;
        const phaseName = phases.find(p => p.id === step.phase_id)?.name || '';
        const contact = step.responsible ? contacts.find(c => c.name === step.responsible) : null;
        const respHtml = contact
            ? `<span class="cursor-pointer text-teal-400 hover:underline" onclick="showContactInfo('${escapeAttr(contact.name)}')">${escapeHtml(contact.name)}</span>`
            : (step.responsible ? escapeHtml(step.responsible) : '');

        return `
            <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${st.color}-500/20 text-${st.color}-400">
                                <i class="fas fa-${st.icon} text-[10px]"></i> ${st.label}
                            </span>
                            <span class="text-xs text-gray-500">${phaseName}</span>
                        </div>
                        <h4 class="font-medium text-white">${escapeHtml(step.title)}</h4>
                        ${step.description ? `<p class="text-sm text-gray-400 mt-1">${escapeHtml(step.description)}</p>` : ''}
                        ${respHtml ? `<p class="text-xs text-gray-500 mt-1"><i class="fas fa-user mr-1"></i>${respHtml}</p>` : ''}
                        ${step.notes ? `<p class="text-xs text-green-500 mt-1"><i class="fas fa-file-lines mr-1"></i>${t('steps.documented')}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <select onchange="updateStatus(${step.id}, this.value)" class="bg-gray-700 border border-gray-600 rounded text-xs px-2 py-1 text-gray-300">
                            <option value="pending" ${step.status === 'pending' ? 'selected' : ''}>${t('status.pending')}</option>
                            <option value="in_progress" ${step.status === 'in_progress' ? 'selected' : ''}>${t('status.in_progress')}</option>
                            <option value="completed" ${step.status === 'completed' ? 'selected' : ''}>${t('status.completed')}</option>
                            <option value="blocked" ${step.status === 'blocked' ? 'selected' : ''}>${t('status.blocked')}</option>
                        </select>
                        <button onclick="openNotesModal(${step.id})" class="p-2 text-gray-400 hover:text-blue-400" title="Notes"><i class="fas fa-file-pen"></i></button>
                        <button onclick="editStep(${step.id})" class="p-2 text-gray-400 hover:text-yellow-400"><i class="fas fa-pen"></i></button>
                        <button onclick="deleteStep(${step.id})" class="p-2 text-gray-400 hover:text-red-400"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>`;
    }).join('');
    document.getElementById('steps-list').innerHTML = html;
}

function filterPhase(id) { currentPhaseFilter = id; loadSteps(); }
async function updateStatus(stepId, status) { await api(`/api/steps/${stepId}`, { method: 'PUT', body: JSON.stringify({ status }) }); loadSteps(); }

function openAddModal() {
    document.getElementById('modal-title').textContent = t('steps.new');
    document.getElementById('form-step-id').value = '';
    document.getElementById('form-title').value = '';
    document.getElementById('form-description').value = '';
    const sel = document.getElementById('form-phase');
    sel.innerHTML = phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (currentPhaseFilter) sel.value = currentPhaseFilter;
    const respSel = document.getElementById('form-responsible');
    respSel.innerHTML = `<option value="">${t('no_responsible')}</option>` + contacts.map(c => `<option value="${escapeAttr(c.name)}">${c.name} (${c.role || ''})</option>`).join('');
    document.getElementById('modal-step').classList.remove('hidden');
}

async function editStep(stepId) {
    const step = await api(`/api/steps/${stepId}`);
    document.getElementById('modal-title').textContent = t('form.save');
    document.getElementById('form-step-id').value = step.id;
    document.getElementById('form-title').value = step.title;
    document.getElementById('form-description').value = step.description || '';
    const sel = document.getElementById('form-phase');
    sel.innerHTML = phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    sel.value = step.phase_id;
    const respSel = document.getElementById('form-responsible');
    respSel.innerHTML = `<option value="">${t('no_responsible')}</option>` + contacts.map(c => `<option value="${escapeAttr(c.name)}">${c.name} (${c.role || ''})</option>`).join('');
    if (step.responsible) respSel.value = step.responsible;
    document.getElementById('modal-step').classList.remove('hidden');
}

function closeModal() { document.getElementById('modal-step').classList.add('hidden'); }

document.getElementById('step-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const stepId = document.getElementById('form-step-id').value;
    const payload = {
        phase_id: parseInt(document.getElementById('form-phase').value),
        title: document.getElementById('form-title').value,
        description: document.getElementById('form-description').value || null,
        responsible: document.getElementById('form-responsible').value || null,
    };
    if (stepId) await api(`/api/steps/${stepId}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('/api/steps', { method: 'POST', body: JSON.stringify(payload) });
    closeModal();
    loadSteps();
});

async function openNotesModal(stepId) {
    const step = await api(`/api/steps/${stepId}`);
    document.getElementById('notes-step-id').value = stepId;
    document.getElementById('notes-step-title').textContent = step.title;
    document.getElementById('notes-content').value = step.notes || '';
    document.getElementById('modal-notes').classList.remove('hidden');
}
function closeNotesModal() { document.getElementById('modal-notes').classList.add('hidden'); }
async function saveNotes() {
    const stepId = document.getElementById('notes-step-id').value;
    await api(`/api/steps/${stepId}`, { method: 'PUT', body: JSON.stringify({ notes: document.getElementById('notes-content').value }) });
    closeNotesModal();
    loadSteps();
}
async function deleteStep(stepId) {
    if (!confirm(t('form.delete_confirm'))) return;
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

    const filters = [
        { val: null, label: t('incidents.all') },
        { val: 'open', label: t('incidents.open') },
        { val: 'in_progress', label: t('incidents.in_progress') },
        { val: 'resolved', label: t('incidents.resolved') },
        { val: 'closed', label: t('incidents.closed') },
    ];
    document.getElementById('incident-filters').innerHTML = filters.map(f =>
        `<button onclick="filterIncidents(${f.val === null ? 'null' : `'${f.val}'`})" class="px-3 py-1.5 rounded-lg text-sm ${currentIncidentFilter === f.val ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">${f.label}</button>`
    ).join('');

    if (incidents.length === 0) {
        document.getElementById('incidents-list').innerHTML = `<div class="text-center py-12 text-gray-500"><i class="fas fa-check-circle text-4xl mb-3"></i><p>${t('incidents.empty')}</p></div>`;
        return;
    }

    const sevCfg = { low: { l: t('severity.low'), c: 'gray' }, medium: { l: t('severity.medium'), c: 'yellow' }, high: { l: t('severity.high'), c: 'orange' }, critical: { l: t('severity.critical'), c: 'red' } };
    const stCfg = { open: { l: t('incidents.open'), c: 'red' }, in_progress: { l: t('incidents.in_progress'), c: 'blue' }, resolved: { l: t('incidents.resolved'), c: 'green' }, closed: { l: t('incidents.closed'), c: 'gray' } };

    const html = incidents.map(inc => {
        const sev = sevCfg[inc.severity] || sevCfg.medium;
        const st = stCfg[inc.status] || stCfg.open;
        const phaseName = inc.phase_id ? (phases.find(p => p.id === inc.phase_id)?.name || '') : '';
        return `
            <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="text-xs px-2 py-0.5 rounded-full bg-${st.c}-500/20 text-${st.c}-400">${st.l}</span>
                            <span class="text-xs px-2 py-0.5 rounded-full bg-${sev.c}-500/20 text-${sev.c}-400"><i class="fas fa-triangle-exclamation text-[10px] mr-1"></i>${sev.l}</span>
                            ${phaseName ? `<span class="text-xs text-gray-500">${phaseName}</span>` : ''}
                        </div>
                        <h4 class="font-medium text-white">${escapeHtml(inc.title)}</h4>
                        ${inc.description ? `<p class="text-sm text-gray-400 mt-1">${escapeHtml(inc.description)}</p>` : ''}
                        ${inc.responsible ? `<p class="text-xs text-gray-500 mt-1"><i class="fas fa-user mr-1"></i>${escapeHtml(inc.responsible)}</p>` : ''}
                        ${inc.resolution ? `<p class="text-xs text-green-400 mt-2"><i class="fas fa-check mr-1"></i>${escapeHtml(inc.resolution)}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <select onchange="updateIncidentStatus(${inc.id}, this.value)" class="bg-gray-700 border border-gray-600 rounded text-xs px-2 py-1 text-gray-300">
                            <option value="open" ${inc.status === 'open' ? 'selected' : ''}>${t('incidents.open')}</option>
                            <option value="in_progress" ${inc.status === 'in_progress' ? 'selected' : ''}>${t('incidents.in_progress')}</option>
                            <option value="resolved" ${inc.status === 'resolved' ? 'selected' : ''}>${t('incidents.resolved')}</option>
                            <option value="closed" ${inc.status === 'closed' ? 'selected' : ''}>${t('incidents.closed')}</option>
                        </select>
                        <button onclick="editIncident(${inc.id})" class="p-2 text-gray-400 hover:text-yellow-400"><i class="fas fa-pen"></i></button>
                        <button onclick="deleteIncident(${inc.id})" class="p-2 text-gray-400 hover:text-red-400"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>`;
    }).join('');
    document.getElementById('incidents-list').innerHTML = html;
}

function filterIncidents(s) { currentIncidentFilter = s; loadIncidents(); }
async function updateIncidentStatus(id, status) { await api(`/api/incidents/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }); loadIncidents(); }

function openIncidentModal() {
    document.getElementById('incident-modal-title').textContent = t('incidents.new');
    document.getElementById('inc-form-id').value = '';
    document.getElementById('inc-form-title').value = '';
    document.getElementById('inc-form-description').value = '';
    document.getElementById('inc-form-severity').value = 'medium';
    document.getElementById('inc-form-responsible').value = '';
    document.getElementById('inc-form-resolution').value = '';
    document.getElementById('inc-resolution-section').classList.add('hidden');
    const sel = document.getElementById('inc-form-phase');
    sel.innerHTML = '<option value="">--</option>' + phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('modal-incident').classList.remove('hidden');
}

async function editIncident(id) {
    const inc = await api(`/api/incidents/${id}`);
    document.getElementById('incident-modal-title').textContent = t('form.save');
    document.getElementById('inc-form-id').value = inc.id;
    document.getElementById('inc-form-title').value = inc.title;
    document.getElementById('inc-form-description').value = inc.description || '';
    document.getElementById('inc-form-severity').value = inc.severity;
    document.getElementById('inc-form-responsible').value = inc.responsible || '';
    document.getElementById('inc-form-resolution').value = inc.resolution || '';
    document.getElementById('inc-resolution-section').classList.remove('hidden');
    const sel = document.getElementById('inc-form-phase');
    sel.innerHTML = '<option value="">--</option>' + phases.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    if (inc.phase_id) sel.value = inc.phase_id;
    document.getElementById('modal-incident').classList.remove('hidden');
}

function closeIncidentModal() { document.getElementById('modal-incident').classList.add('hidden'); }

document.getElementById('incident-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('inc-form-id').value;
    const payload = {
        title: document.getElementById('inc-form-title').value,
        description: document.getElementById('inc-form-description').value || null,
        severity: document.getElementById('inc-form-severity').value,
        phase_id: document.getElementById('inc-form-phase').value ? parseInt(document.getElementById('inc-form-phase').value) : null,
        responsible: document.getElementById('inc-form-responsible').value || null,
    };
    if (id) {
        payload.resolution = document.getElementById('inc-form-resolution').value || null;
        await api(`/api/incidents/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
        await api('/api/incidents', { method: 'POST', body: JSON.stringify(payload) });
    }
    closeIncidentModal();
    loadIncidents();
});

async function deleteIncident(id) { if (!confirm(t('form.delete_confirm'))) return; await api(`/api/incidents/${id}`, { method: 'DELETE' }); loadIncidents(); }

// ========================================
// DOCUMENTATION
// ========================================
async function loadDocs() {
    const docs = await api('/api/docs');
    const icons = { general: 'file-lines', plan: 'map', arquitectura: 'sitemap', rollback: 'rotate-left', contactos: 'address-book', lecciones: 'lightbulb', comandos: 'terminal', configuracion: 'gear' };
    const html = docs.map(doc => {
        const icon = icons[doc.category] || 'file-lines';
        const active = currentDocId === doc.id;
        return `<button onclick="selectDoc(${doc.id})" class="w-full text-left p-3 rounded-lg border transition-colors ${active ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300'}">
            <div class="flex items-center gap-2"><i class="fas fa-${icon} text-sm"></i><span class="text-sm font-medium truncate">${escapeHtml(doc.title)}</span></div>
            <span class="text-xs text-gray-500 capitalize">${doc.category}</span></button>`;
    }).join('');
    document.getElementById('docs-list').innerHTML = html || `<p class="text-gray-500 text-sm">${t('docs.select_prompt')}</p>`;
    if (currentDocId) renderDocEditor(currentDocId);
}

async function selectDoc(id) { currentDocId = id; loadDocs(); }

async function renderDocEditor(id) {
    const doc = await api(`/api/docs/${id}`);
    document.getElementById('doc-editor').innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div><h3 class="font-semibold text-white">${escapeHtml(doc.title)}</h3><span class="text-xs text-gray-500">${doc.category}</span></div>
            <div class="flex gap-2">
                <button onclick="saveDoc(${doc.id})" class="px-3 py-1.5 rounded-lg text-sm bg-purple-600 hover:bg-purple-700 text-white"><i class="fas fa-save mr-1"></i>${t('form.save')}</button>
                <button onclick="deleteDoc(${doc.id})" class="px-3 py-1.5 rounded-lg text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <textarea id="doc-content" rows="16" class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm font-mono resize-y">${escapeHtml(doc.content || '')}</textarea>`;
}

async function saveDoc(id) { await api(`/api/docs/${id}`, { method: 'PUT', body: JSON.stringify({ content: document.getElementById('doc-content').value }) }); loadDocs(); }
async function deleteDoc(id) { if (!confirm(t('form.delete_confirm'))) return; await api(`/api/docs/${id}`, { method: 'DELETE' }); currentDocId = null; document.getElementById('doc-editor').innerHTML = `<div class="text-center text-gray-500 py-12"><i class="fas fa-file-lines text-4xl mb-3"></i><p>${t('docs.select_prompt')}</p></div>`; loadDocs(); }

function openDocModal() { document.getElementById('doc-form-title').value = ''; document.getElementById('doc-form-category').value = 'general'; document.getElementById('modal-doc').classList.remove('hidden'); }
function closeDocModal() { document.getElementById('modal-doc').classList.add('hidden'); }

document.getElementById('doc-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newDoc = await api('/api/docs', { method: 'POST', body: JSON.stringify({ title: document.getElementById('doc-form-title').value, category: document.getElementById('doc-form-category').value, content: '' }) });
    closeDocModal();
    currentDocId = newDoc.id;
    loadDocs();
});

// ========================================
// CONTACTS
// ========================================
async function loadContacts() {
    contacts = await api('/api/contacts');
    if (contacts.length === 0) {
        document.getElementById('contacts-list').innerHTML = `<div class="text-center py-12 text-gray-500 col-span-3"><i class="fas fa-address-book text-4xl mb-3"></i><p>${t('contacts.empty')}</p></div>`;
        return;
    }
    const html = contacts.map(c => `
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
            <div class="flex items-start justify-between">
                <div>
                    <h4 class="font-semibold text-white">${escapeHtml(c.name)}</h4>
                    <p class="text-sm text-teal-400">${escapeHtml(c.role || '')}</p>
                </div>
                <div class="flex gap-1">
                    <button onclick="editContact(${c.id})" class="p-2 text-gray-400 hover:text-yellow-400"><i class="fas fa-pen"></i></button>
                    <button onclick="deleteContact(${c.id})" class="p-2 text-gray-400 hover:text-red-400"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="mt-3 space-y-1 text-sm">
                ${c.email ? `<p class="text-gray-300"><i class="fas fa-envelope text-gray-500 w-5"></i> ${escapeHtml(c.email)}</p>` : ''}
                ${c.phone ? `<p class="text-gray-300"><i class="fas fa-phone text-gray-500 w-5"></i> ${escapeHtml(c.phone)}</p>` : ''}
                ${c.company ? `<p class="text-gray-300"><i class="fas fa-building text-gray-500 w-5"></i> ${escapeHtml(c.company)}</p>` : ''}
                ${c.notes ? `<p class="text-gray-400 text-xs mt-2 italic">${escapeHtml(c.notes)}</p>` : ''}
            </div>
        </div>`).join('');
    document.getElementById('contacts-list').innerHTML = html;
}

function openContactModal() {
    document.getElementById('contact-modal-title').textContent = t('contacts.new');
    document.getElementById('contact-form-id').value = '';
    document.getElementById('contact-form-name').value = '';
    document.getElementById('contact-form-role').value = '';
    document.getElementById('contact-form-email').value = '';
    document.getElementById('contact-form-phone').value = '';
    document.getElementById('contact-form-company').value = '';
    document.getElementById('contact-form-notes').value = '';
    document.getElementById('modal-contact').classList.remove('hidden');
}

async function editContact(id) {
    const c = await api(`/api/contacts/${id}`);
    document.getElementById('contact-modal-title').textContent = t('contacts.edit');
    document.getElementById('contact-form-id').value = c.id;
    document.getElementById('contact-form-name').value = c.name;
    document.getElementById('contact-form-role').value = c.role || '';
    document.getElementById('contact-form-email').value = c.email || '';
    document.getElementById('contact-form-phone').value = c.phone || '';
    document.getElementById('contact-form-company').value = c.company || '';
    document.getElementById('contact-form-notes').value = c.notes || '';
    document.getElementById('modal-contact').classList.remove('hidden');
}

function closeContactModal() { document.getElementById('modal-contact').classList.add('hidden'); }

document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('contact-form-id').value;
    const payload = {
        name: document.getElementById('contact-form-name').value,
        role: document.getElementById('contact-form-role').value || null,
        email: document.getElementById('contact-form-email').value || null,
        phone: document.getElementById('contact-form-phone').value || null,
        company: document.getElementById('contact-form-company').value || null,
        notes: document.getElementById('contact-form-notes').value || null,
    };
    if (id) await api(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await api('/api/contacts', { method: 'POST', body: JSON.stringify(payload) });
    closeContactModal();
    loadContacts();
    await loadContactsList(); // refresh global contacts list
});

async function deleteContact(id) { if (!confirm(t('form.delete_confirm'))) return; await api(`/api/contacts/${id}`, { method: 'DELETE' }); loadContacts(); await loadContactsList(); }

// Contact info modal (from Gantt click)
function showContactInfo(name) {
    const c = contacts.find(ct => ct.name === name);
    if (!c) return;
    document.getElementById('contact-info-content').innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-teal-600/30 flex items-center justify-center"><i class="fas fa-user text-teal-400 text-lg"></i></div>
                <div><p class="font-semibold text-white text-lg">${escapeHtml(c.name)}</p><p class="text-sm text-teal-400">${escapeHtml(c.role || '')}</p></div>
            </div>
            <div class="border-t border-gray-700 pt-3 space-y-2 text-sm">
                ${c.email ? `<p class="text-gray-300"><i class="fas fa-envelope text-gray-500 w-6"></i> <a href="mailto:${escapeAttr(c.email)}" class="text-blue-400 hover:underline">${escapeHtml(c.email)}</a></p>` : ''}
                ${c.phone ? `<p class="text-gray-300"><i class="fas fa-phone text-gray-500 w-6"></i> ${escapeHtml(c.phone)}</p>` : ''}
                ${c.company ? `<p class="text-gray-300"><i class="fas fa-building text-gray-500 w-6"></i> ${escapeHtml(c.company)}</p>` : ''}
                ${c.notes ? `<p class="text-gray-400 text-xs mt-2 border-t border-gray-700 pt-2 italic">${escapeHtml(c.notes)}</p>` : ''}
            </div>
        </div>`;
    document.getElementById('modal-contact-info').classList.remove('hidden');
}
function closeContactInfoModal() { document.getElementById('modal-contact-info').classList.add('hidden'); }

// ========================================
// GANTT
// ========================================
async function loadGantt() {
    if (phases.length === 0) await loadPhases();
    if (contacts.length === 0) await loadContactsList();
    const steps = await api('/api/steps');

    const stepsWithDates = steps.filter(s => s.planned_start && s.planned_end);
    if (stepsWithDates.length === 0) {
        document.getElementById('gantt-container').innerHTML = `<div class="text-center py-12 text-gray-500"><i class="fas fa-calendar-xmark text-4xl mb-3"></i><p>${t('gantt.no_dates')}</p></div>`;
        return;
    }

    const allStarts = stepsWithDates.map(s => new Date(s.planned_start));
    const allEnds = stepsWithDates.map(s => new Date(s.planned_end));
    const minDate = new Date(Math.min(...allStarts));
    const maxDate = new Date(Math.max(...allEnds));
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);

    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    const dayWidth = 26;
    const rowHeight = 30;
    const labelWidth = 300;
    const respWidth = 100;

    const today = new Date(); today.setHours(0, 0, 0, 0);

    // Week headers
    let weekStart = new Date(minDate);
    const weekLabels = [];
    while (weekStart <= maxDate) {
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
        const effectiveEnd = weekEnd > maxDate ? maxDate : weekEnd;
        const daysInWeek = Math.ceil((effectiveEnd - weekStart) / (1000 * 60 * 60 * 24)) + 1;
        weekLabels.push({ label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`, width: daysInWeek * dayWidth });
        weekStart.setDate(weekStart.getDate() + 7);
    }

    let headerWeeks = weekLabels.map(w => `<div class="flex-shrink-0 text-center text-xs text-gray-400 border-r border-gray-700" style="width:${w.width}px">${w.label}</div>`).join('');
    let headerDays = '';
    for (let d = 0; d < totalDays; d++) {
        const day = new Date(minDate); day.setDate(day.getDate() + d);
        const isWe = day.getDay() === 0 || day.getDay() === 6;
        const isToday = day.getTime() === today.getTime();
        const bg = isToday ? 'bg-blue-900/40' : isWe ? 'bg-gray-800/50' : '';
        headerDays += `<div class="flex-shrink-0 text-center text-[10px] text-gray-600 border-r border-gray-700/50 ${bg}" style="width:${dayWidth}px">${day.getDate()}</div>`;
    }

    const statusColors = { pending: 'bg-yellow-500', in_progress: 'bg-blue-500', completed: 'bg-green-500', blocked: 'bg-red-500' };
    let rowsHtml = '';
    let rowIdx = 0;

    phases.forEach(phase => {
        const phaseSteps = stepsWithDates.filter(s => s.phase_id === phase.id);
        if (phaseSteps.length === 0) return;

        rowsHtml += `<div class="flex border-b border-gray-700" style="height:${rowHeight}px">
            <div class="flex-shrink-0 flex items-center px-2 border-r border-gray-700 font-semibold text-xs text-blue-400 truncate" style="width:${labelWidth}px; background:rgba(30,58,95,0.3)"><i class="fas fa-folder-open mr-1 text-[10px]"></i>${escapeHtml(phase.name)}</div>
            <div class="flex-shrink-0 border-r border-gray-700" style="width:${respWidth}px; background:rgba(30,58,95,0.3)"></div>
            <div class="flex-1" style="background:rgba(30,58,95,0.15)"></div>
        </div>`;
        rowIdx++;

        phaseSteps.forEach(step => {
            const start = new Date(step.planned_start);
            const end = new Date(step.planned_end);
            const startOff = Math.ceil((start - minDate) / (1000 * 60 * 60 * 24));
            const dur = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            const left = startOff * dayWidth;
            const width = Math.max(dur * dayWidth - 4, 8);
            const color = statusColors[step.status] || statusColors.pending;
            const stripe = rowIdx % 2 === 0 ? 'bg-gray-800/30' : '';

            const contact = step.responsible ? contacts.find(c => c.name === step.responsible) : null;
            const respCell = contact
                ? `<span class="cursor-pointer text-teal-400 hover:underline text-xs truncate" onclick="showContactInfo('${escapeAttr(contact.name)}')">${escapeHtml(contact.name)}</span>`
                : (step.responsible ? `<span class="text-xs text-gray-400 truncate">${escapeHtml(step.responsible)}</span>` : '');

            rowsHtml += `<div class="flex border-b border-gray-700/50" style="height:${rowHeight}px">
                <div class="flex-shrink-0 flex items-center px-2 border-r border-gray-700 text-xs text-gray-300 truncate ${stripe}" style="width:${labelWidth}px" title="${escapeAttr(step.title)}">${escapeHtml(step.title)}</div>
                <div class="flex-shrink-0 flex items-center px-2 border-r border-gray-700 ${stripe}" style="width:${respWidth}px">${respCell}</div>
                <div class="flex-1 relative ${stripe}" style="min-width:${totalDays * dayWidth}px">
                    <div class="absolute top-1 rounded-sm h-5 ${color} opacity-85 flex items-center px-1.5 hover:opacity-100 transition-opacity"
                         style="left:${left}px; width:${width}px"
                         title="${escapeAttr(step.title)}\n${step.planned_start} → ${step.planned_end}">
                        <span class="text-[10px] text-white font-medium truncate">${dur}d</span>
                    </div>
                </div>
            </div>`;
            rowIdx++;
        });
    });

    const todayOff = Math.ceil((today - minDate) / (1000 * 60 * 60 * 24));
    const todayLeft = todayOff * dayWidth + labelWidth + respWidth;

    document.getElementById('gantt-container').innerHTML = `
        <div class="relative">
            <div class="flex border-b border-gray-600 sticky top-0 bg-gray-800 z-10">
                <div class="flex-shrink-0 flex items-center px-2 border-r border-gray-700 text-xs font-semibold text-gray-400" style="width:${labelWidth}px; height:44px">${t('gantt.task')}</div>
                <div class="flex-shrink-0 flex items-center px-2 border-r border-gray-700 text-xs font-semibold text-gray-400" style="width:${respWidth}px; height:44px">${t('gantt.responsible')}</div>
                <div class="flex-1 overflow-hidden">
                    <div class="flex" style="height:22px">${headerWeeks}</div>
                    <div class="flex" style="height:22px">${headerDays}</div>
                </div>
            </div>
            <div class="relative">
                ${rowsHtml}
                ${todayOff >= 0 && todayOff <= totalDays ? `<div class="absolute top-0 bottom-0 w-0.5 bg-red-500/70 z-20 pointer-events-none" style="left:${todayLeft}px"><div class="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-gray-800"></div></div>` : ''}
            </div>
        </div>`;
}

// ========================================
// UTILS
// ========================================
function escapeHtml(text) { if (!text) return ''; const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }
function escapeAttr(text) { return (text || '').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

// ========================================
// INIT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    setLang(currentLang);
    loadPhases().then(() => loadContactsList()).then(() => loadDashboard());
});
