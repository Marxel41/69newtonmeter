const TasksModule = {
    tasks: [],
    clickTimer: {}, // Speichert Timer für Doppelklicks

    // Init für ToDos und Putzplan
    async init(type, containerId) {
        const container = document.getElementById(containerId);
        
        // Admin Punkte Input
        const isAdmin = App.user.role === 'Admin' || App.user.role === 'admin';
        const pointsHtml = isAdmin ? `<input type="number" id="t-points" placeholder="Pt" value="${type==='cleaning'?20:10}" style="width:50px;">` : ``;

        // Unterscheidung der Eingabemaske
        let addHtml = '';
        if (type === 'todo' || type === 'cleaning') {
            addHtml = `
                <div class="add-box" style="background:var(--card-bg); padding:15px; border-radius:10px; margin-bottom:20px;">
                    <input type="text" id="t-title" placeholder="Neue Aufgabe...">
                    <div style="display:flex; gap:5px;">
                        <input type="date" id="t-date">
                        ${pointsHtml}
                    </div>
                    <select id="t-recurrence">
                        <option value="">Einmalig</option>
                        <option value="weekly">Wöchentlich</option>
                    </select>
                    <button class="primary" onclick="TasksModule.addTask('${type}')">+</button>
                </div>
            `;
        }

        container.innerHTML = `${addHtml}<div id="actual-list">Lade...</div>`;
        await this.loadTasks(type);
    },

    // Init nur für Ranking
    async initRanking(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `<div id="ranking-list">Lade...</div>`;
        await this.loadRanking();
    },

    async loadTasks(filterType) {
        const listDiv = document.getElementById('actual-list');
        if(!listDiv) return;

        const result = await API.post('read', { sheet: 'Tasks', _t: new Date().getTime() });
        if (result.status === 'success') {
            this.tasks = result.data.filter(t => t.status === 'open');
            this.render(filterType);
        } else {
            listDiv.innerHTML = "Fehler beim Laden.";
        }
    },

    render(filterType) {
        const listDiv = document.getElementById('actual-list');
        listDiv.innerHTML = "";
        
        const filtered = this.tasks.filter(t => {
            if(filterType === 'cleaning') return t.type === 'cleaning';
            if(filterType === 'todo') return t.type !== 'cleaning' && t.type !== 'shopping';
            return true;
        });

        if(filtered.length === 0) {
            listDiv.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>Nichts offen.</p>"; return;
        }

        filtered.forEach(task => {
            listDiv.innerHTML += `
                <div class="list-item">
                    <div class="task-info">
                        <strong>${task.title}</strong>
                        <small style="color:var(--text-muted)">${task.date} • ${task.points} Pkt</small>
                    </div>
                    <!-- Der magische Button -->
                    <button id="btn-${task.id}" class="check-btn" onclick="TasksModule.handleCheck('${task.id}')">✔</button>
                </div>
            `;
        });
    },

    // Die Doppelklick-Logik
    handleCheck(id) {
        const btn = document.getElementById(`btn-${id}`);
        
        // Wenn schon im Bestätigungs-Modus (Timer läuft)
        if (this.clickTimer[id]) {
            // ZWEITER KLICK -> Erledigen
            clearTimeout(this.clickTimer[id]);
            delete this.clickTimer[id];
            this.completeTask(id);
        } else {
            // ERSTER KLICK -> Icon ändern
            btn.classList.add('confirm-mode');
            btn.innerHTML = "?"; // Oder Icon
            
            // Timer starten (2 Sekunden)
            this.clickTimer[id] = setTimeout(() => {
                // Reset wenn nicht nochmal geklickt
                btn.classList.remove('confirm-mode');
                btn.innerHTML = "✔";
                delete TasksModule.clickTimer[id];
            }, 2000);
        }
    },

    async addTask(type) {
        const title = document.getElementById('t-title').value;
        const date = document.getElementById('t-date').value || new Date().toISOString().split('T')[0];
        const recur = document.getElementById('t-recurrence').value;
        const ptsInput = document.getElementById('t-points');
        const points = ptsInput ? ptsInput.value : (type==='cleaning'?20:10);

        if(!title) return;
        
        // Task Typ setzen (Wenn wir im Putzplan Tab sind, ist es cleaning)
        const finalType = type === 'cleaning' ? 'cleaning' : 'general';

        await API.post('create', { sheet: 'Tasks', payload: JSON.stringify({
            title, date, type: finalType, points, status: "open", recurrence: recur
        })});
        
        document.getElementById('t-title').value = "";
        await this.loadTasks(type);
    },

    async completeTask(id) {
        // Feedback: Zeile ausblenden
        const btn = document.getElementById(`btn-${id}`);
        if(btn) btn.parentElement.style.opacity = '0.3';

        await API.post('update', { sheet: 'Tasks', id: id, updates: JSON.stringify({ status: 'done' }), user: App.user.name });
        // Wir laden neu, basierend auf dem aktuellen Tab (etwas hacky, aber geht)
        const isCleaning = document.querySelector('h2').innerText.includes('Putzplan');
        await this.loadTasks(isCleaning ? 'cleaning' : 'todo');
    },

    async loadRanking() {
        const div = document.getElementById('ranking-list');
        const result = await API.post('get_ranking', { _t: new Date().getTime() });
        
        if (result.status === 'success') {
            div.innerHTML = "";
            result.data.forEach((entry, idx) => {
                let medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : ''));
                div.innerHTML += `
                    <div class="list-item" onclick='TasksModule.showRankingDetails(${JSON.stringify(result.log)}, "${entry.name}")'>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:1.2rem;">${medal}</span>
                            <strong>${entry.name}</strong>
                        </div>
                        <span class="points-badge">${entry.points} Pkt</span>
                    </div>`;
            });
            div.innerHTML += `<p style="text-align:center; font-size:0.8rem; color:var(--text-muted); margin-top:20px;">Tippe auf einen Namen für Details.</p>`;
        }
    },

    showRankingDetails(allLogs, username) {
        const modal = document.getElementById('ranking-modal');
        const list = document.getElementById('ranking-modal-list');
        document.getElementById('ranking-modal-user').innerText = `Historie: ${username}`;
        
        // Filtern
        const userLogs = allLogs.filter(l => l.user === username);
        
        list.innerHTML = "";
        if(userLogs.length === 0) {
            list.innerHTML = "<p>Keine Einträge.</p>";
        } else {
            // Neueste zuerst
            userLogs.reverse().forEach(log => {
                // Datum formatieren
                const d = new Date(log.date);
                const dateStr = d.getDate() + "." + (d.getMonth()+1) + ".";
                list.innerHTML += `
                    <div class="ranking-detail-row">
                        <span>${dateStr} ${log.reason}</span>
                        <span style="color:var(--secondary);">+${log.points}</span>
                    </div>
                `;
            });
        }
        modal.style.display = 'flex';
    }
};
