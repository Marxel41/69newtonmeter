const App = {
    user: null,

    init() {
        const savedUser = localStorage.getItem('wg_user');
        if (savedUser) {
            try { this.user = JSON.parse(savedUser); this.showDashboard(); } 
            catch (e) { localStorage.removeItem('wg_user'); }
        }

        // Lade Notification Status aus Speicher
        const notifEnabled = localStorage.getItem('wg_notif_enabled') === 'true';
        // Wir setzen die Checkbox erst, wenn das Modal geöffnet wird, 
        // aber wir merken uns den Status.
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

    logout() {
        localStorage.removeItem('wg_user');
        location.reload();
    },

    showDashboard() {
        // Schließe alle Modals
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('settings-btn').style.display = 'block';
        
        const header = document.getElementById('user-info');
        header.innerHTML = `Hi, <strong>${this.user.name}</strong>`;
        
        const container = document.getElementById('app-container');
        
        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="tile" onclick="App.loadModule('todo')"><span>📌</span><h3>To-Dos</h3></div>
                <div class="tile" onclick="App.loadModule('cleaning')"><span>🧹</span><h3>Putzplan</h3></div>
                <div class="tile" onclick="App.loadModule('shopping')"><span>🛒</span><h3>Einkauf</h3></div>
                <div class="tile" onclick="App.loadModule('voting')"><span>🗳️</span><h3>Votes</h3></div>
                <div class="tile" onclick="App.loadModule('soda')"><span>💧</span><h3>Soda</h3></div>
                <div class="tile wide" onclick="App.loadModule('ranking')">
                    <div style="display:flex; align-items:center; width:100%; justify-content:space-between;">
                        <div><span>🏆</span><h3 style="display:inline; margin-left:10px;">Ranking</h3></div>
                        <small style="color:var(--secondary)">Details ></small>
                    </div>
                </div>
            </div>
            <div style="padding: 15px;">
                <h3 style="margin-bottom:10px; color:var(--text-muted);">Kalender</h3>
                <div id="calendar-wrapper"></div>
            </div>
        `;
        
        if(typeof CalendarModule !== 'undefined') CalendarModule.init('calendar-wrapper');
    },

    loadModule(moduleName) {
        document.getElementById('settings-btn').style.display = 'none';
        const container = document.getElementById('app-container');
        
        // ZURÜCK BUTTON FIX: Mehr Padding, Flexbox Zentrierung, Klickbarer Bereich
        const shell = (title, id) => `
            <div class="module-container">
                <div style="padding-bottom: 15px;">
                    <button class="back-btn" onclick="App.showDashboard()">
                        <span style="font-size:1.5rem; margin-right:5px;">❮</span> Zurück
                    </button>
                </div>
                <h2 style="margin-bottom:15px;">${title}</h2>
                <div id="${id}">Lade...</div>
            </div>
        `;

        if(moduleName === 'todo') { container.innerHTML = shell('Aufgaben', 'task-cont'); TasksModule.init('todo', 'task-cont'); } 
        else if (moduleName === 'cleaning') { container.innerHTML = shell('Putzplan', 'task-cont'); TasksModule.init('cleaning', 'task-cont'); }
        else if (moduleName === 'shopping') { container.innerHTML = shell('Einkauf', 'shop-cont'); ShoppingModule.init('shop-cont'); }
        else if (moduleName === 'voting') { container.innerHTML = shell('Abstimmung', 'vote-cont'); VotingModule.init('vote-cont'); }
        else if (moduleName === 'ranking') { container.innerHTML = shell('Ranking Details', 'rank-cont'); TasksModule.initRanking('rank-cont'); }
        else if (moduleName === 'soda') { container.innerHTML = shell('SodaStream', 'soda-cont'); SodaModule.init('soda-cont'); }
    },

    toggleSettings() {
        const modal = document.getElementById('settings-modal');
        modal.style.display = 'flex';
        
        // Checkbox Status setzen
        const cb = document.getElementById('sett-notif');
        cb.checked = localStorage.getItem('wg_notif_enabled') === 'true';
    },

    toggleNotifications() {
        const cb = document.getElementById('sett-notif');
        const isEnabled = cb.checked;
        
        // Speichern
        localStorage.setItem('wg_notif_enabled', isEnabled);

        if (isEnabled && "Notification" in window) {
            Notification.requestPermission().then(perm => {
                if (perm === "granted") new Notification("Benachrichtigungen aktiviert!");
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
