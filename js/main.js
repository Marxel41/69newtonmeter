const App = {
    user: null,

    init() {
        // App global verfügbar machen, damit onclick im HTML sicher funktioniert
        window.App = this; 

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

        const name = nameInput.value;
        const pin = pinInput.value;
        
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

    logout() { 
        localStorage.removeItem('wg_user'); 
        location.reload(); 
    },

    showDashboard() {
        console.log("Zeige Dashboard..."); // Debugging

        // Alles ausblenden
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) loginScreen.style.display = 'none';
        
        // Header anpassen (Auf Dashboard zeigen wir das Zahnrad)
        const settingsBtn = document.getElementById('settings-btn');
        if(settingsBtn) settingsBtn.style.display = 'block';
        
        // Zurück-Button im Header ausblenden (falls er da war)
        const navBackBtn = document.getElementById('nav-back-btn');
        if(navBackBtn) navBackBtn.style.display = 'none';

        const userInfo = document.getElementById('user-info');
        if(userInfo && this.user) userInfo.innerHTML = `Hi, <strong>${this.user.name}</strong>`;
        
        const container = document.getElementById('app-container');
        if(!container) return;
        
        // Dashboard Kacheln rendern
        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="tile" onclick="window.App.loadModule('todo')"><span>📌</span><h3>To-Dos</h3></div>
                <div class="tile" onclick="window.App.loadModule('cleaning')"><span>🧹</span><h3>Putzplan</h3></div>
                <div class="tile" onclick="window.App.loadModule('shopping')"><span>🛒</span><h3>Einkauf</h3></div>
                <div class="tile" onclick="window.App.loadModule('voting')"><span>🗳️</span><h3>Votes</h3></div>
                <div class="tile" onclick="window.App.loadModule('soda')"><span>💧</span><h3>Soda</h3></div>
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
        console.log("Lade Modul: " + moduleName);

        // Settings Button im Modul ausblenden
        const settingsBtn = document.getElementById('settings-btn');
        if(settingsBtn) settingsBtn.style.display = 'none';
        
        const container = document.getElementById('app-container');
        
        // WICHTIG: Hier bauen wir den Zurück-Button direkt mit "Inline Styles" ein.
        // window.App.showDashboard() stellt sicher, dass die Funktion gefunden wird.
        const headerStyle = "display: flex; align-items: center; padding: 15px; background: #1f1f1f; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 10000;";
        const btnStyle = "background: none; border: none; color: #bb86fc; font-size: 1.1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; padding: 10px 20px 10px 0;";
        
        const shell = (title, id) => `
            <div style="${headerStyle}">
                <button onclick="window.App.showDashboard()" style="${btnStyle}">
                    <span style="font-size: 1.4rem; margin-right: 8px;">❮</span> Startseite
                </button>
                <span style="margin-left: 15px; color: #888; border-left: 1px solid #555; padding-left: 15px;">${title}</span>
            </div>
            <div class="module-container" style="padding-top: 10px;">
                <div id="${id}">Lade...</div>
            </div>
        `;

        if(moduleName === 'todo') { 
            container.innerHTML = shell('Aufgaben', 'task-cont'); 
            if(typeof TasksModule !== 'undefined') TasksModule.init('todo', 'task-cont'); 
        } 
        else if (moduleName === 'cleaning') { 
            container.innerHTML = shell('Putzplan', 'task-cont'); 
            if(typeof TasksModule !== 'undefined') TasksModule.init('cleaning', 'task-cont'); 
        }
        else if (moduleName === 'shopping') { 
            container.innerHTML = shell('Einkauf', 'shop-cont'); 
            if(typeof ShoppingModule !== 'undefined') ShoppingModule.init('shop-cont'); 
        }
        else if (moduleName === 'voting') { 
            container.innerHTML = shell('Abstimmung', 'vote-cont'); 
            if(typeof VotingModule !== 'undefined') VotingModule.init('vote-cont'); 
        }
        else if (moduleName === 'ranking') { 
            container.innerHTML = shell('Ranking', 'rank-cont'); 
            if(typeof TasksModule !== 'undefined') TasksModule.initRanking('rank-cont'); 
        }
        else if (moduleName === 'soda') { 
            container.innerHTML = shell('SodaStream', 'soda-cont'); 
            if(typeof SodaModule !== 'undefined') SodaModule.init('soda-cont'); 
        }
    },
    
    toggleSettings() {
        const modal = document.getElementById('settings-modal');
        if(modal) {
            modal.style.display = 'flex';
            const cb = document.querySelector('#settings-modal input[type="checkbox"]');
            if(cb) cb.checked = (localStorage.getItem('wg_notif_enabled') === 'true');
        }
    },

    toggleNotifications() {
        const cb = document.querySelector('#settings-modal input[type="checkbox"]');
        if(cb) localStorage.setItem('wg_notif_enabled', cb.checked);
    }
};

// Initialisierung
document.addEventListener('DOMContentLoaded', () => App.init());
