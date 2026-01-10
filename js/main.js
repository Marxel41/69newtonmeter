const App = {
    user: null,

    init() {
        window.App = this; 
        
        const loginBtn = document.getElementById('login-btn');
        if(loginBtn) loginBtn.addEventListener('click', () => this.login());
        
        const guestBtn = document.getElementById('guest-btn');
        if(guestBtn) guestBtn.addEventListener('click', () => this.enterGuestMode());

        const cb = document.querySelector('#settings-modal input[type="checkbox"]');
        if(cb) {
            cb.checked = (localStorage.getItem('wg_notif_enabled') === 'true');
            cb.addEventListener('change', () => this.toggleNotifications());
        }

        const savedUser = localStorage.getItem('wg_user');
        if (savedUser) {
            try { this.user = JSON.parse(savedUser); this.showDashboard(); } 
            catch (e) { localStorage.removeItem('wg_user'); }
        }
    },

    async login() {
        const nameInput = document.getElementById('login-name');
        const pinInput = document.getElementById('login-pin');
        if (!nameInput || !pinInput) return;
        
        const result = await API.post('login', { name: nameInput.value, pin: pinInput.value });
        if (result.status === 'success') {
            this.user = { name: result.user, role: result.role };
            localStorage.setItem('wg_user', JSON.stringify(this.user));
            this.showDashboard();
        } else {
            alert(result.message);
        }
    },

    enterGuestMode() {
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) loginScreen.style.display = 'none';
        
        // Header für Gäste anpassen
        document.getElementById('nav-back-btn').style.display = 'block';
        // Spezial-Funktion für Zurück im Gast-Modus (Reload)
        document.getElementById('nav-back-btn').onclick = () => location.reload();
        
        document.getElementById('app-title').innerText = "Gästebuch";
        document.getElementById('settings-btn').style.display = 'none';

        const container = document.getElementById('app-container');
        container.innerHTML = `<div id="guest-view">Lade...</div>`;
        
        if(typeof GuestbookModule !== 'undefined') GuestbookModule.init('guest-view', true);
    },

    logout() { localStorage.removeItem('wg_user'); location.reload(); },

    showDashboard() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) loginScreen.style.display = 'none';
        
        // HEADER RESET
        document.getElementById('nav-back-btn').style.display = 'none';
        document.getElementById('nav-back-btn').onclick = () => this.showDashboard(); // Reset Action
        document.getElementById('settings-btn').style.display = 'block';
        document.getElementById('app-title').innerText = "WG Hub";
        
        const userInfo = document.getElementById('user-info');
        if (userInfo && this.user) userInfo.innerHTML = `Hi, <strong>${this.user.name}</strong>`;
        
        const c = document.getElementById('app-container');
        c.innerHTML = `
            <div class="dashboard-grid">
                <div class="tile" onclick="window.App.loadModule('todo')"><span>📌</span><h3>To-Dos</h3></div>
                <div class="tile" onclick="window.App.loadModule('cleaning')"><span>🧹</span><h3>Putzplan</h3></div>
                <div class="tile" onclick="window.App.loadModule('shopping')"><span>🛒</span><h3>Einkauf</h3></div>
                <div class="tile" onclick="window.App.loadModule('voting')"><span>🗳️</span><h3>Votes</h3></div>
                <div class="tile" onclick="window.App.loadModule('soda')"><span>💧</span><h3>Soda</h3></div>
                <div class="tile" onclick="window.App.loadModule('train')"><span>🚋</span><h3>Bahn</h3></div>
                <div class="tile" onclick="window.App.loadModule('guestbook')"><span>📖</span><h3>Gästebuch</h3></div>
                
                <div class="tile wide" onclick="window.App.loadModule('ranking')">
                    <div style="display:flex;width:100%;justify-content:space-between;align-items:center;">
                         <div style="display:flex;align-items:center;"><span>🏆</span><h3 style="margin-left:10px;">Ranking</h3></div>
                         <small style="color:#03dac6">Details ></small>
                    </div>
                </div>
            </div>
            <div style="padding:15px;"><div id="calendar-wrapper"></div></div>
        `;
        
        if(typeof CalendarModule !== 'undefined') CalendarModule.init('calendar-wrapper');
    },

    loadModule(moduleName) {
        // HEADER UPDATEN
        document.getElementById('nav-back-btn').style.display = 'block';
        document.getElementById('settings-btn').style.display = 'none';
        
        const titles = {
            'todo': 'Aufgaben',
            'cleaning': 'Putzplan',
            'shopping': 'Einkauf',
            'voting': 'Abstimmung',
            'ranking': 'Ranking',
            'soda': 'SodaStream',
            'train': 'Abfahrten',
            'guestbook': 'Gästebuch'
        };
        document.getElementById('app-title').innerText = titles[moduleName] || 'Modul';

        const container = document.getElementById('app-container');
        // Container leeren und ID für Modul bereitstellen
        container.innerHTML = `<div id="module-content" style="padding:10px;">Lade...</div>`;

        // Modul starten
        const targetId = 'module-content';
        
        if(moduleName === 'todo') TasksModule.init('todo', targetId);
        else if(moduleName === 'cleaning') TasksModule.init('cleaning', targetId);
        else if(moduleName === 'shopping') ShoppingModule.init(targetId);
        else if(moduleName === 'voting') VotingModule.init(targetId);
        else if(moduleName === 'ranking') TasksModule.initRanking(targetId);
        else if(moduleName === 'soda') SodaModule.init(targetId);
        else if(moduleName === 'train') TrainModule.init(targetId);
        else if(moduleName === 'guestbook') GuestbookModule.init(targetId, false);
    },
    
    toggleSettings() {
        const modal = document.getElementById('settings-modal');
        if(modal) modal.style.display = 'flex';
    },

    toggleNotifications() {
        const cb = document.querySelector('#settings-modal input[type="checkbox"]');
        if(cb) localStorage.setItem('wg_notif_enabled', cb.checked);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
