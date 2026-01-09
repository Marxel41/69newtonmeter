const App = {
    user: null,

    init() {
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
        // Alles ausblenden
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        document.getElementById('login-screen').style.display = 'none';
        
        // Header anpassen (Auf Dashboard zeigen wir das Zahnrad)
        const settingsBtn = document.getElementById('settings-btn');
        if(settingsBtn) settingsBtn.style.display = 'block';
        
        const userInfo = document.getElementById('user-info');
        if(userInfo) userInfo.innerHTML = `Hi, <strong>${this.user.name}</strong>`;
        
        const container = document.getElementById('app-container');
        
        // Dashboard Kacheln
        container.innerHTML = `
            <div class="dashboard-grid">
                <div class="tile" onclick="App.loadModule('todo')"><span>📌</span><h3>To-Dos</h3></div>
                <div class="tile" onclick="App.loadModule('cleaning')"><span>🧹</span><h3>Putzplan</h3></div>
                <div class="tile" onclick="App.loadModule('shopping')"><span>🛒</span><h3>Einkauf</h3></div>
                <div class="tile" onclick="App.loadModule('voting')"><span>🗳️</span><h3>Votes</h3></div>
                <div class="tile" onclick="App.loadModule('soda')"><span>💧</span><h3>Soda</h3></div>
                <div class="tile wide" onclick="App.loadModule('ranking')">
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
        // Settings Button im Modul ausblenden
        const settingsBtn = document.getElementById('settings-btn');
        if(settingsBtn) settingsBtn.style.display = 'none';
        
        const container = document.getElementById('app-container');
        
        // WICHTIG: Hier bauen wir den Zurück-Button direkt mit "Inline Styles" ein.
        // Das garantiert, dass er sichtbar und klickbar ist, egal was die style.css sagt.
        const headerStyle = "display: flex; align-items: center; padding: 15px; background: #1f1f1f; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 10000;";
        const btnStyle = "background: none; border: none; color: #bb86fc; font-size: 1.1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; padding: 5px 10px 5px 0;";
        
        const shell = (title, id) => `
            <div style="${headerStyle}">
                <button onclick="App.showDashboard()" style="${btnStyle}">
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
            TasksModule.init('todo', 'task-cont'); 
        } 
        else if (moduleName === 'cleaning') { 
            container.innerHTML = shell('Putzplan', 'task-cont'); 
            TasksModule.init('cleaning', 'task-cont'); 
        }
        else if (moduleName === 'shopping') { 
            container.innerHTML = shell('Einkauf', 'shop-cont'); 
            ShoppingModule.init('shop-cont'); 
        }
        else if (moduleName === 'voting') { 
            container.innerHTML = shell('Abstimmung', 'vote-cont'); 
            VotingModule.init('vote-cont'); 
        }
        else if (moduleName === 'ranking') { 
            container.innerHTML = shell('Ranking', 'rank-cont'); 
            TasksModule.initRanking('rank-cont'); 
        }
        else if (moduleName === 'soda') { 
            container.innerHTML = shell('SodaStream', 'soda-cont'); 
            SodaModule.init('soda-cont'); 
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

document.addEventListener('DOMContentLoaded', () => App.init());
