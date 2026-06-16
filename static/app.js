// --- State ---
let currentView = 'dashboard';
let currentPhaseFilter = null;
let phases = [];

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
    document.getElementById('view-dashboard').classList.toggle('hidden', view !== 'dashboard');
    document.getElementById('view-steps').classList.toggle('hidden', view !== 'steps');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-300');
    });
    document.getElementById(`btn-${view}`).classList.remove('bg-gray-700', 'text-gray-300');
    document.getElementById(`btn-${view}`).classList.add('bg-blue-600', 'text-white');

    if (view === 'dashboard') loadDashboard();
    if (view === 'steps') loadSteps();
}

// --- Dashboard ---
async function loadDashboard() {
    const data = await api('/api/dashboard');

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
}

// --- Steps ---
async function loadPhases() {
    phases = await api('/api/phases');
}

async function loadSteps() {
    if (phases.length === 0) await loadPhases();

    // Render phase tabs
    const tabsHtml = [
        `<button onclick="filterPhase(null)" class="phase-tab px-3 py-1.5 rounded-lg text-sm transition-colors ${!currentPhaseFilter ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">Todas</button>`,
        ...phases.map(p =>
            `<button onclick="filterPhase(${p.id})" class="phase-tab px-3 py-1.5 rounded-lg text-sm transition-colors ${currentPhaseFilter === p.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">${p.name}</button>`
        )
    ].join('');
    document.getElementById('phase-tabs').innerHTML = tabsHtml;

    // Fetch steps
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
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${st.color}-500/20 text-${st.color}-400">
                                <i class="fas fa-${st.icon} text-[10px]"></i> ${st.label}
                            </span>
                            <span class="text-xs text-gray-500">${phaseName}</span>
                        </div>
                        <h4 class="font-medium text-white">${escapeHtml(step.title)}</h4>
                        ${step.description ? `<p class="text-sm text-gray-400 mt-1">${escapeHtml(step.description)}</p>` : ''}
                        ${step.responsible ? `<p class="text-xs text-gray-500 mt-1"><i class="fas fa-user mr-1"></i>${escapeHtml(step.responsible)}</p>` : ''}
                        ${step.notes ? `<p class="text-xs text-gray-500 mt-1 italic"><i class="fas fa-file-lines mr-1"></i>Documentado</p>` : ''}
                    </div>
                    <div class="flex items-center gap-1">
                        <select onchange="updateStatus(${step.id}, this.value)" 
                            class="bg-gray-700 border border-gray-600 rounded text-xs px-2 py-1 text-gray-300">
                            <option value="pending" ${step.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                            <option value="in_progress" ${step.status === 'in_progress' ? 'selected' : ''}>En Progreso</option>
                            <option value="completed" ${step.status === 'completed' ? 'selected' : ''}>Completado</option>
                            <option value="blocked" ${step.status === 'blocked' ? 'selected' : ''}>Bloqueado</option>
                        </select>
                        <button onclick="openNotesModal(${step.id}, '${escapeHtml(step.title)}', \`${escapeHtml(step.notes || '')}\`)"
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

// --- Status Update ---
async function updateStatus(stepId, status) {
    await api(`/api/steps/${stepId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
    loadSteps();
}

// --- Modal: Add/Edit Step ---
function openAddModal() {
    document.getElementById('modal-title').textContent = 'Nuevo Paso';
    document.getElementById('form-step-id').value = '';
    document.getElementById('form-title').value = '';
    document.getElementById('form-description').value = '';
    document.getElementById('form-responsible').value = '';

    // Populate phases select
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

// --- Modal: Notes ---
function openNotesModal(stepId, title, notes) {
    document.getElementById('notes-step-id').value = stepId;
    document.getElementById('notes-step-title').textContent = title;
    document.getElementById('notes-content').value = notes;
    document.getElementById('modal-notes').classList.remove('hidden');
}

function closeNotesModal() {
    document.getElementById('modal-notes').classList.add('hidden');
}

async function saveNotes() {
    const stepId = document.getElementById('notes-step-id').value;
    const notes = document.getElementById('notes-content').value;
    await api(`/api/steps/${stepId}`, {
        method: 'PUT',
        body: JSON.stringify({ notes }),
    });
    closeNotesModal();
    loadSteps();
}

// --- Delete Step ---
async function deleteStep(stepId) {
    if (!confirm('¿Estás seguro de eliminar este paso?')) return;
    await api(`/api/steps/${stepId}`, { method: 'DELETE' });
    loadSteps();
}

// --- Utils ---
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    loadPhases().then(() => loadDashboard());
});
