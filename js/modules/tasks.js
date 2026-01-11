const TasksModule = {
    tasks: [],
    clickTimer: {},
    currentType: 'general', 

    async init(type, containerId) {
        this.currentType = type;
        const container = document.getElementById(containerId);
        const isAdmin = App.user.role === 'Admin' || App.user.role === 'admin';
        
        let addHtml = '';
        if (type !== 'ranking') {
            addHtml = `
                <div class="add-box" style="background:var(--card-bg); padding:15px; border-radius:10px; margin-bottom:20px;">
                    <input type="text" id="t-title" placeholder="Neue Aufgabe...">
                    <div style="display:flex; gap:5px;">
                        <input type="date" id="t-date">
                        ${isAdmin ? `<input type="number" id="t-points" placeholder="Pt" value="${type==='cleaning'?20:10}" style="width:50px;">` : ''}
                    </div>
                    <select id="t-recurrence">
                        <option value="">Einmalig</option>
                        <option value="weekly">Wöchentlich</option>
                        <!-- Weitere Optionen hier -->
                    </select>
                    <button class="primary" onclick="TasksModule.addTask('${type}')">+</button>
                </div>
            `;
        }
        
        container.innerHTML = `${addHtml}<div id="actual-list">Lade...</div>`;
        if (type === 'ranking') await this.loadRanking();
        else await this.loadTasks(type);
    },

    async initRanking(cId) { return this.init('ranking', cId); },

    async loadTasks(filterType) {
        const listDiv = document.getElementById('actual-list');
        if(!listDiv) return;
        const result = await API.post('read', { sheet: 'Tasks', _t: Date.now() });
        
        if (result.status === 'success') {
            // ... (Filterlogik wie gehabt) ...
            this.tasks = result.data.filter(t => t.status === 'open');
            this.render(filterType);
        }
    },

    render(filterType) {
        const listDiv = document.getElementById('actual-list');
        listDiv.innerHTML = "";
        
        const filtered = this.tasks.filter(t => {
            if(filterType === 'cleaning') return t.type === 'cleaning';
            if(filterType === 'todo') return t.type !== 'cleaning'; 
            return true;
        });

        if(filtered.length === 0) { listDiv.innerHTML = "<p style='text-align:center;color:var(--text-muted);'>Nichts offen. 🎉</p>"; return; }

        filtered.forEach(task => {
            // ... (Reservierungslogik hier verkürzt) ...
            let actionHtml = `<div style="display:flex; gap:5px;">
                        <button class="icon-btn-small" onclick="window.TasksModule.openEdit('${task.id}')">✏️</button>
                        <button class="check-btn" onclick="window.TasksModule.handleCheck('${task.id}')">✔</button>
                    </div>`;
            // ... 

            listDiv.innerHTML += `
                <div class="list-item" id="row-${task.id}">
                    <div class="task-info" style="flex:1;">
                        <strong>${task.title}</strong>
                        <small style="color:var(--text-muted)">${task.points} Pkt</small>
                    </div>
                    ${actionHtml}
                </div>`;
        });
    },

    // --- EDIT LOGIK ---
    openEdit(id) {
        console.log("Edit clicked for " + id); // Debug
        const task = this.tasks.find(t => t.id === id);
        if(!task) return;

        const modal = document.getElementById('edit-modal');
        if(modal) {
            modal.style.display = 'flex';
            document.getElementById('edit-title').value = task.title;
            document.getElementById('edit-points').value = task.points;
            document.getElementById('edit-points-wrapper').style.display = 'block'; 
            
            const saveBtn = document.getElementById('edit-save-btn');
            saveBtn.onclick = () => this.saveEdit(id);
        } else {
            alert("Edit Modal nicht gefunden!");
        }
    },

    async saveEdit(id) {
        const newTitle = document.getElementById('edit-title').value;
        const newPoints = document.getElementById('edit-points').value;

        if(!newTitle) return;

        document.getElementById('edit-modal').style.display = 'none';

        // Optimistic
        const row = document.getElementById(`row-${id}`);
        if(row) row.querySelector('strong').innerText = newTitle;

        await API.post('update', { 
            sheet: 'Tasks', 
            id: id, 
            updates: JSON.stringify({ title: newTitle, points: newPoints }) 
        });
        
        await this.loadTasks(this.currentType);
    },

    // ... (Restliche Funktionen: assignTask, handleCheck, completeTaskOptimistic, addTask, loadRanking, showDetails - alle unverändert) ...
    async assignTask(id) { /* ... */ },
    handleCheck(id) { /* ... */ },
    async completeTaskOptimistic(id) { /* ... */ },
    async addTask(type) { /* ... */ },
    async loadRanking() { /* ... */ },
    showDetails(name) { /* ... */ }
};

// GLOBAL MACHEN!
window.TasksModule = TasksModule;
