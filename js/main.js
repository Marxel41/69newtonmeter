const App = {
    user: null,

    init() {
        window.App = this; 
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

    // NEU: Gast Modus (ohne Login)
    enterGuestMode() {
        document.getElementById('login-screen').style.display = 'none';
        const container = document.getElementById('app-container');
        
        // Wir laden das Guestbook Modul direkt in den Container
        // Container leeren und ID bereitstellen
        container.innerHTML = `<div id="guest-view" style="min-height:100vh;"></div>`;
        
        if(typeof GuestbookModule !== 'undefined') {
            GuestbookModule.init('guest-view', true); // true = isPublic
        } else {
            container.innerHTML = "<p style='color:red;padding:20px;'>Fehler: Gästebuch Modul nicht geladen.</p>";
        }
    },

    logout() { localStorage.removeItem('wg_user'); location.reload(); },

    showDashboard() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        document.getElementById('login-screen').style.display = 'none';
        const sBtn = document.getElementById('settings-btn');
        if(sBtn) sBtn.style.display = 'block';
        
        document.getElementById('user-info').innerHTML = `Hi, <strong>${this.user.name}</strong>`;
        
        const c = document.getElementById('app-container');
        c.innerHTML = `
            <div class="dashboard-grid">
                <div class="tile" onclick="window.App.loadModule('todo')"><span>📌</span><h3>To-Dos</h3></div>
                <div class="tile" onclick="window.App.loadModule('cleaning')"><span>🧹</span><h3>Putzplan</h3></div>
                <div class="tile" onclick="window.App.loadModule('shopping')"><span>🛒</span><h3>Einkauf</h3></div>
                <div class="tile" onclick="window.App.loadModule('voting')"><span>🗳️</span><h3>Votes</h3></div>
                <div class="tile" onclick="window.App.loadModule('soda')"><span>💧</span><h3>Soda</h3></div>
                <!-- NEU: Guestbook Tile -->
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
        const sBtn = document.getElementById('settings-btn');
        if(sBtn) sBtn.style.display = 'none';
        
        const c = document.getElementById('app-container');
        
        // Inline Styles für garantierte Sichtbarkeit
        const headerStyle = "display: flex; align-items: center; padding: 15px; background: #1f1f1f; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 10000;";
        const btnStyle = "background: none; border: none; color: #bb86fc; font-size: 1.1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; padding: 5px 10px 5px 0;";
        
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

        if(moduleName === 'todo') { c.innerHTML = shell('Aufgaben', 'task-cont'); TasksModule.init('todo', 'task-cont'); } 
        else if (moduleName === 'cleaning') { c.innerHTML = shell('Putzplan', 'task-cont'); TasksModule.init('cleaning', 'task-cont'); }
        else if (moduleName === 'shopping') { c.innerHTML = shell('Einkauf', 'shop-cont'); ShoppingModule.init('shop-cont'); }
        else if (moduleName === 'voting') { c.innerHTML = shell('Abstimmung', 'vote-cont'); VotingModule.init('vote-cont'); }
        else if (moduleName === 'ranking') { c.innerHTML = shell('Ranking', 'rank-cont'); TasksModule.initRanking('rank-cont'); }
        else if (moduleName === 'soda') { c.innerHTML = shell('SodaStream', 'soda-cont'); SodaModule.init('soda-cont'); }
        else if (moduleName === 'guestbook') { c.innerHTML = shell('Gästebuch', 'gb-cont'); GuestbookModule.init('gb-cont', false); }
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
