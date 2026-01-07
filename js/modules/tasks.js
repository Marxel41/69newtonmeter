const TasksModule = {
    tasks: [],

    async init() {
        const container = document.getElementById('app-container');
        const isAdmin = App.user.role === 'Admin' || App.user.role === 'admin';
        const pointsHtml = isAdmin ? `<input type="number" id="task-points" placeholder="Pkt" value="10" style="width:60px;">` : ``;

        container.innerHTML = `
            <div class="tabs">
                <button onclick="TasksModule.switchTab('todo')">To-Dos</button>
                <button onclick="TasksModule.switchTab('cleaning')">Putzplan</button>
                <button onclick="TasksModule.switchTab('ranking')">🏆 Ranking</button>
            </div>

            <div id="task-view">
                <div class="add-box">
                    <input type="text" id="task-title" placeholder="Aufgabe...">
                    <input type="date" id="task-date">
                    ${pointsHtml}
                    <select id="task-type">
                        <option value="general">Allgemein</option>
                        <option value="cleaning">Putzen</option>
                    </select>
                    <select id="task-recurrence">
                        <option value="">Einmalig</option>
                        <option value="weekly">Wöchentlich</option>
                    </select>
                    <button class="primary" onclick="TasksModule.addTask()">+</button>
                </div>
                <div id="task-list" class="list-container">Lade...</div>
            </div>

            <div id="ranking-view" style="display:none;">
                <h3 style="text-align:center; margin-top:20px;">Monats-Champions</h3>
                <div id="ranking-list" class="list-container"></div>
            </div>
        `;
        await this.loadTasks();
    },

    async loadTasks() {
        const listContainer = document.getElementById('task-list');
        // Sicherheitscheck, falls der User schnell den Tab gewechselt hat
        if (!listContainer) return;

        try {
            const result = await API.post('read', { sheet: 'Tasks' });
            
            if (result.status === 'success') {
                this.tasks = result.data.filter(t => t.status === 'open');
                this.render('todo');
            } else {
                listContainer.innerHTML = `<p style="color:red; text-align:center;">Fehler beim Laden:<br>${result.message}</p>`;
                console.error("Ladefehler:", result);
            }
        } catch (e) {
            listContainer.innerHTML = `<p style="color:red; text-align:center;">Kritischer Fehler:<br>${e.toString()}</p>`;
        }
    },

    switchTab(tab) {
        if(tab === 'ranking') {
            document.getElementById('task-view').style.display = 'none';
            document.getElementById('ranking-view').style.display = 'block';
            this.loadRanking();
        } else {
            document.getElementById('task-view').style.display = 'block';
            document.getElementById('ranking-view').style.display = 'none';
            this.render(tab);
        }
    },

    render(filterType) {
        const list = document.getElementById('task-list');
        if (!list) return;
        
        list.innerHTML = "";
        let filtered = (filterType === 'cleaning') ? this.tasks.filter(t => t.type === 'cleaning') : this.tasks;

        if (filtered.length === 0) {
            list.innerHTML = "<p class='empty-msg' style='text-align:center; padding: 20px; color: #888;'>Nichts zu tun! 🎉</p>";
            return;
        }

        filtered.forEach(task => {
            let icon = task.type === 'cleaning' ? '🧹' : (task.type === 'shopping' ? '🛒' : '📌');
            list.innerHTML += `
                <div class="list-item task-item">
                    <div class="task-info"><strong>${icon} ${task.title}</strong><small>${task.date} | ${task.points} Pkt</small></div>
                    <button class="check-btn" onclick="TasksModule.completeTask('${task.id}')">✔</button>
                </div>`;
        });
    },

    async addTask() {
        const titleInput = document.getElementById('task-title');
        const title = titleInput.value;
        const dateInput = document.getElementById('task-date');
        // Wenn kein Datum gewählt, nimm heute
        const date = dateInput.value || new Date().toISOString().split('T')[0];
        
        const type = document.getElementById('task-type').value;
        const recur = document.getElementById('task-recurrence').value;
        const ptsInput = document.getElementById('task-points');
        const points = ptsInput ? ptsInput.value : 10;
        
        if(!title) {
            alert("Bitte gib einen Titel für die Aufgabe ein.");
            return;
        }

        // Visuelles Feedback: Button deaktivieren & Ladesymbol
        const btn = document.querySelector('#task-view button.primary');
        const oldText = btn.innerText;
        btn.innerText = "⏳";
        btn.disabled = true;

        const payload = {title, date, type, points, status: "open", recurrence: recur};
        
        // Sende Anfrage
        const result = await API.post('create', { sheet: 'Tasks', payload: JSON.stringify(payload) });

        // Button zurücksetzen
        btn.innerText = oldText;
        btn.disabled = false;

        if (result.status === 'success') {
            titleInput.value = "";
            // Neu laden um den neuen Eintrag zu sehen
            await this.loadTasks();
            this.render(type === 'cleaning' ? 'cleaning' : 'todo');
        } else {
            // FEHLER ANZEIGEN!
            alert("Fehler beim Speichern:\n" + (result.message || "Unbekannter Fehler"));
        }
    },

    async completeTask(id) {
        if(!confirm("Aufgabe erledigt? Punkte werden gutgeschrieben!")) return;
        
        // Button Feedback nicht so wichtig hier, da Zeile gleich verschwindet
        const result = await API.post('update', { sheet: 'Tasks', id: id, updates: JSON.stringify({ status: 'done' }), user: App.user.name });
        
        if (result.status === 'success') {
            await this.loadTasks();
            this.render('todo');
        } else {
            alert("Konnte Status nicht ändern: " + result.message);
        }
    },

    async loadRanking() {
        const list = document.getElementById('ranking-list');
        list.innerHTML = "Lade Highscore...";
        const result = await API.post('get_ranking');
        if (result.status === 'success') {
            list.innerHTML = "";
            if (result.data.length === 0) {
                 list.innerHTML = "<p style='text-align:center;'>Noch keine Punkte vergeben.</p>";
                 return;
            }
            result.data.forEach((entry, idx) => {
                let medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : ''));
                list.innerHTML += `<div class="list-item"><span>${medal} <strong>${entry.name}</strong></span><span class="points-badge">${entry.points} Pkt</span></div>`;
            });
        } else {
            list.innerHTML = "Fehler beim Laden des Rankings.";
        }
    }
};
