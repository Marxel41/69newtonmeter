const TasksModule = {
    tasks: [],
    clickTimer: {},

    async init(type, containerId) {
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
                        <option value="daily">Täglich</option>
                        <option value="3days">Alle 3 Tage</option>
                        <option value="5days">Alle 5 Tage</option>
                        <option value="weekly">Wöchentlich</option>
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

        const now = new Date().getTime();

        filtered.forEach(task => {
            let assignTime = task.assigned_at ? new Date(task.assigned_at).getTime() : 0;
            let hoursPassed = (now - assignTime) / (1000 * 60 * 60);
            
            let isLocked = task.assignee && hoursPassed < 2;
            let isMyTask = isLocked && task.assignee === App.user.name;

            let rowClass = "";
            let actionBtn = "";
            let infoText = "";

            // Punkte Anzeige (ohne Datum)
            let pointsDisplay = `<small style="color:var(--text-muted)">${task.points} Pkt</small>`;

            if (!isLocked) {
                actionBtn = `<button class="check-btn" onclick="TasksModule.assignTask('${task.id}')" style="border-color:var(--text-muted); color:var(--text-muted);">✋</button>`;
            } 
            else if (isMyTask) {
                rowClass = "task-assigned-me";
                let minsLeft = Math.round((2 - hoursPassed) * 60);
                infoText = `<span style="color:var(--secondary); font-size:0.8rem; display:block;">⏳ ${minsLeft} Min. reserviert</span>`;
                actionBtn = `<button id="btn-${task.id}" class="check-btn" onclick="TasksModule.handleCheck('${task.id}')">✔</button>`;
            } 
            else {
                rowClass = "task-assigned-other";
                let minsLeft = Math.round((2 - hoursPassed) * 60);
                infoText = `<span style="color:var(--danger); font-size:0.8rem; display:block;">🔒 ${task.assignee} (${minsLeft} Min)</span>`;
                actionBtn = `<span style="font-size:1.5rem; opacity:0.5;">🔒</span>`;
            }

            listDiv.innerHTML += `
                <div class="list-item ${rowClass}" id="row-${task.id}">
                    <div class="task-info">
                        <strong>${task.title}</strong>
                        ${pointsDisplay}
                        ${infoText}
                    </div>
                    ${actionBtn}
                </div>`;
        });
    },

    async assignTask(id) {
        const row = document.getElementById(`row-${id}`);
        if(row) row.style.opacity = '0.5';

        const timestamp = new Date().toISOString();
        
        await API.post('update', { 
            sheet: 'Tasks', 
            id: id, 
            updates: JSON.stringify({ 
                assignee: App.user.name,
                assigned_at: timestamp
            }) 
        });
        
        const isCleaning = document.querySelector('h2') && document.querySelector('h2').innerText.includes('Putzplan');
        await this.loadTasks(isCleaning ? 'cleaning' : 'todo');
    },

    handleCheck(id) {
        const btn = document.getElementById(`btn-${id}`);
        if(!btn) return;

        if (btn.classList.contains('confirm-wait')) {
            this.completeTaskOptimistic(id);
        } else {
            btn.classList.add('confirm-wait');
            btn.innerHTML = "✖";
            this.clickTimer[id] = setTimeout(() => {
                btn.classList.remove('confirm-wait');
                btn.innerHTML = "✔";
                delete TasksModule.clickTimer[id];
            }, 3000);
        }
    },

    async completeTaskOptimistic(id) {
        const row = document.getElementById(`row-${id}`);
        if(row) {
            row.style.transition = "all 0.5s ease";
            row.style.opacity = "0";
            row.style.transform = "translateX(50px)";
            setTimeout(() => row.remove(), 500);
        }
        if(this.clickTimer[id]) clearTimeout(this.clickTimer[id]);

        await API.post('update', { 
            sheet: 'Tasks', 
            id: id, 
            updates: JSON.stringify({ status: 'done' }), 
            user: App.user.name 
        });
    },

    async addTask(type) {
        const title = document.getElementById('t-title').value;
        const date = document.getElementById('t-date').value || new Date().toISOString().split('T')[0];
        const recur = document.getElementById('t-recurrence').value;
        const ptsInput = document.getElementById('t-points');
        const points = ptsInput ? ptsInput.value : (type==='cleaning'?20:10);

        if(!title) return;
        
        const btn = document.querySelector('.add-box button');
        btn.innerText = "⏳";

        const finalType = type === 'cleaning' ? 'cleaning' : 'general';
        await API.post('create', { sheet: 'Tasks', payload: JSON.stringify({
            title, date, type: finalType, points, status: "open", recurrence: recur
        })});
        
        document.getElementById('t-title').value = "";
        btn.innerText = "+";
        await this.loadTasks(type);
    },
    
    async loadRanking() {
        const listDiv = document.getElementById('actual-list');
        listDiv.innerHTML = "Lade Ranking...";
        const result = await API.post('get_ranking', { _t: Date.now() });
        
        if (result.status === 'success') {
            listDiv.innerHTML = "";
            window._rankingLogs = result.log; 
            
            result.data.forEach((entry, idx) => {
                let medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : ''));
                listDiv.innerHTML += `
                    <div class="list-item" onclick="TasksModule.showDetails('${entry.name}')" style="cursor:pointer;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:1.2rem;">${medal}</span>
                            <strong>${entry.name}</strong>
                        </div>
                        <span class="points-badge">${entry.points} Pkt</span>
                    </div>`;
            });
        }
    },
    
    showDetails(name) {
        const logs = window._rankingLogs || [];
        const userLogs = logs.filter(l => l.user === name);
        const modal = document.getElementById('ranking-modal');
        const list = document.getElementById('ranking-modal-list');
        document.getElementById('ranking-modal-user').innerText = `Historie: ${name}`;
        
        list.innerHTML = "";
        if(userLogs.length === 0) list.innerHTML = "<p>Keine Einträge.</p>";
        else {
            userLogs.reverse().forEach(log => {
                const d = new Date(log.date);
                const dateStr = !isNaN(d) ? `${d.getDate()}.${d.getMonth()+1}.` : '';
                list.innerHTML += `
                    <div style="padding:10px 0; border-bottom:1px solid #333; display:flex; justify-content:space-between;">
                        <span><small style="color:var(--text-muted)">${dateStr}</small> ${log.reason}</span>
                        <span style="color:var(--secondary);">+${log.points}</span>
                    </div>`;
            });
        }
        modal.style.display = 'flex';
    }
};
