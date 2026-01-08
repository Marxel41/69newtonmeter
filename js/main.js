const App = {
    user: null,
    version: "3.0",

    init() {
        // Version anzeigen
        const vDiv = document.getElementById('version-display');
        if(vDiv) vDiv.innerText = `App v${this.version} | Loaded: ${new Date().toLocaleTimeString()}`;

        const savedUser = localStorage.getItem('wg_user');
        if (savedUser) {
            try { this.user = JSON.parse(savedUser); this.showDashboard(); } 
            catch (e) { localStorage.removeItem('wg_user'); }
        }
    },

    async login() {
        const name = document.getElementById('login-name').value;
        const pin = document.getElementById('login-pin').value;
        if (!name || !pin) return;
        
        const result = await API.post('login', { name, pin });
        if (result.status === 'success') {
            this.user = { name: result.user, role: result.role };
            localStorage.setItem('wg_user', JSON.stringify(this.user));
            this.showDashboard();
        } else {
            alert(result.message);
        }
    },

    logout() { localStorage.removeItem('wg_user'); location.reload(); },

    showDashboard() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('settings-btn').style.display = 'block';
        
        document.getElementById('user-info').innerHTML = `Hi, <strong>${this.user.name}</strong>`;
        
        const c = document.getElementById('app-container');
        c.innerHTML = `
            <div class="dashboard-grid">
                <div class="tile" onclick="App.loadModule('todo')"><span>📌</span><h3>To-Dos</h3></div>
                <div class="tile" onclick="App.loadModule('cleaning')"><span>🧹</span><h3>Putzplan</h3></div>
                <div class="tile" onclick="App.loadModule('shopping')"><span>🛒</span><h3>Einkauf</h3></div>
                <div class="tile" onclick="App.loadModule('voting')"><span>🗳️</span><h3>Votes</h3></div>
                <div class="tile" onclick="App.loadModule('soda')"><span>💧</span><h3>Soda</h3></div>
                <div class="tile wide" onclick="App.loadModule('ranking')">
                    <div style="display:flex;width:100%;justify-content:space-between;">
                         <span>🏆</span><h3>Ranking</h3>
                    </div>
                </div>
            </div>
            <div style="padding:15px;"><div id="calendar-wrapper"></div></div>
        `;
        if(typeof CalendarModule !== 'undefined') CalendarModule.init('calendar-wrapper');
    },

    loadModule(moduleName) {
        document.getElementById('settings-btn').style.display = 'none';
        const c = document.getElementById('app-container');
        
        // ZURÜCK BUTTON FIX: Eigener Container oben
        const shell = (title, id) => `
            <div class="back-bar">
                <button class="back-btn" onclick="App.showDashboard()">❮ Zurück</button>
            </div>
            <div class="module-container">
                <h2 style="margin-bottom:15px;">${title}</h2>
                <div id="${id}">Lade...</div>
            </div>
        `;

        if(moduleName === 'todo') { c.innerHTML = shell('Aufgaben', 'task-cont'); TasksModule.init('todo', 'task-cont'); } 
        else if (moduleName === 'cleaning') { c.innerHTML = shell('Putzplan', 'task-cont'); TasksModule.init('cleaning', 'task-cont'); }
        else if (moduleName === 'shopping') { c.innerHTML = shell('Einkauf', 'shop-cont'); ShoppingModule.init('shop-cont'); }
        else if (moduleName === 'voting') { c.innerHTML = shell('Abstimmung', 'vote-cont'); VotingModule.init('vote-cont'); }
        else if (moduleName === 'ranking') { c.innerHTML = shell('Ranking', 'rank-cont'); TasksModule.initRanking('rank-cont'); }
        else if (moduleName === 'soda') { c.innerHTML = shell('SodaStream', 'soda-cont'); SodaModule.init('soda-cont'); }
    }
};
document.addEventListener('DOMContentLoaded', () => App.init());
