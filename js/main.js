const App = {
    user: null,

    init() {
        // Dark Mode ist jetzt Standard durch CSS
        const savedUser = localStorage.getItem('wg_user');
        if (savedUser) {
            try { this.user = JSON.parse(savedUser); this.showDashboard(); } 
            catch (e) { localStorage.removeItem('wg_user'); }
        }
    },

    async login() {
        const name = document.getElementById('login-name').value.trim();
        const pin = document.getElementById('login-pin').value.trim();
        const msg = document.getElementById('login-msg');

        if (!name || !pin) return;
        msg.textContent = "Verbinde...";
        
        const result = await API.post('login', { name, pin });

        if (result.status === 'success') {
            this.user = { name: result.user, role: result.role };
            localStorage.setItem('wg_user', JSON.stringify(this.user));
            msg.textContent = "";
            this.showDashboard();
        } else {
            msg.textContent = result.message || "Fehler";
        }
    },

    // DAS NEUE DASHBOARD
    showDashboard() {
        document.getElementById('login-screen').style.display = 'none';
        
        const header = document.getElementById('user-info');
        header.innerHTML = `Hi, <strong>${this.user.name}</strong>`;
        
        const container = document.getElementById('app-container');
        
        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="tile" onclick="App.loadModule('todo')">
                    <span>📌</span><h3>To-Dos</h3>
                </div>
                <div class="tile" onclick="App.loadModule('cleaning')">
                    <span>🧹</span><h3>Putzplan</h3>
                </div>
                <div class="tile" onclick="App.loadModule('shopping')">
                    <span>🛒</span><h3>Einkauf</h3>
                </div>
                <div class="tile" onclick="App.loadModule('voting')">
                    <span>🗳️</span><h3>Votes</h3>
                </div>
                <div class="tile wide" onclick="App.loadModule('ranking')">
                    <div style="display:flex; align-items:center; width:100%; justify-content:space-between;">
                        <div>
                            <span>🏆</span><h3 style="display:inline; margin-left:10px;">Ranking</h3>
                        </div>
                        <small style="color:var(--secondary)">Details ansehen ></small>
                    </div>
                </div>
            </div>
            
            <div style="padding: 15px;">
                <h3 style="margin-bottom:10px; color:var(--text-muted);">Kalender</h3>
                <div id="calendar-wrapper"></div>
            </div>
        `;
        
        // Kalender direkt unten laden
        if(typeof CalendarModule !== 'undefined') {
            // Wir injizieren den Kalender in den wrapper
            CalendarModule.init('calendar-wrapper');
        }
    },

    loadModule(moduleName) {
        const container = document.getElementById('app-container');
        // HTML Template für Modul-Ansicht
        const moduleShell = (title, contentId) => `
            <div class="module-container">
                <button class="back-btn" onclick="App.showDashboard()">❮ Zurück</button>
                <h2 style="margin-bottom:15px;">${title}</h2>
                <div id="${contentId}">Lade...</div>
            </div>
        `;

        if(moduleName === 'todo') {
            container.innerHTML = moduleShell('Aufgaben', 'task-list-container');
            TasksModule.init('todo', 'task-list-container');
        } 
        else if (moduleName === 'cleaning') {
            container.innerHTML = moduleShell('Putzplan', 'task-list-container');
            TasksModule.init('cleaning', 'task-list-container');
        }
        else if (moduleName === 'shopping') {
            container.innerHTML = moduleShell('Einkaufsliste', 'shop-container');
            ShoppingModule.init('shop-container');
        }
        else if (moduleName === 'voting') {
            container.innerHTML = moduleShell('Abstimmungen', 'vote-container');
            VotingModule.init('vote-container');
        }
        else if (moduleName === 'ranking') {
            container.innerHTML = moduleShell('Bestenliste', 'rank-container');
            TasksModule.initRanking('rank-container');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
