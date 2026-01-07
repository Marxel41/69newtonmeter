const TasksModule = {
    tasks: [],

    async init() {
        const container = document.getElementById('app-container');
        // Admin darf Punkte vergeben
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
        const result = await API.post('read', { sheet: 'Tasks' });
        if (result.status === 'success') {
            this.tasks = result.data.filter(t => t.status === 'open');
            this.render('todo');
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
        list.innerHTML = "";

        let filtered = [];
        if (filterType === 'cleaning') {
            filtered = this.tasks.filter(t => t.type === 'cleaning');
        } else {
            // Bei "ToDo" zeigen wir alles (auch Putzen und Einkaufen)
            filtered = this.tasks;
        }

        if (filtered.length === 0) {
            list.innerHTML = "<p class='empty-msg' style='text-align:center;'>Nichts zu tun!</p>";
            return;
        }

        filtered.forEach(task => {
            let icon = '📌';
            if(task.type === 'cleaning') icon = '🧹';
            if(task.type === 'shopping') icon = '🛒';

            list.innerHTML += `
                <div class="list-item task-item">
                    <div class="task-info">
                        <strong>${icon} ${task.title}</strong>
                        <small>Bis: ${task.date} | ${task.points} Pkt</small>
                    </div>
                    <button class="check-btn" onclick="TasksModule.completeTask('${task.id}')">✔</button>
                </div>
            `;
        });
    },

    async addTask() {
        const title = document.getElementById('task-title').value;
        const date = document.getElementById('task-date').value;
        const type = document.getElementById('task-type').value;
        const recur = document.getElementById('task-recurrence').value;
        const ptsInput = document.getElementById('task-points');
        const points = ptsInput ? ptsInput.value : 10;

        if(!title) return;

        const payload = {
            title: title,
            date: date || new Date().toISOString().split('T')[0],
            type: type,
            points: points,
            status: "open",
            recurrence: recur
        };

        await API.post('create', { sheet: 'Tasks', payload: JSON.stringify(payload) });
        document.getElementById('task-title').value = "";
        await this.loadTasks();
        this.render(type === 'cleaning' ? 'cleaning' : 'todo');
    },

    async completeTask(id) {
        if(!confirm("Aufgabe erledigt? Punkte werden gutgeschrieben!")) return;
        await API.post('update', { 
            sheet: 'Tasks', 
            id: id, 
            updates: JSON.stringify({ status: 'done' }),
            user: App.user.name 
        });
        await this.loadTasks();
        this.render('todo');
    },

    async loadRanking() {
        const list = document.getElementById('ranking-list');
        list.innerHTML = "Lade...";
        const result = await API.post('get_ranking');
        if (result.status === 'success') {
            list.innerHTML = "";
            result.data.forEach((entry, idx) => {
                let medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : ''));
                list.innerHTML += `
                    <div class="list-item">
                        <span>${medal} <strong>${entry.name}</strong></span>
                        <span class="points-badge">${entry.points} Pkt</span>
                    </div>`;
            });
        }
    }
};
