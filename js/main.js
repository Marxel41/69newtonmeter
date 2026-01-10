// Wir definieren App direkt global
window.App = {
const App = {
user: null,

init() {
        window.App = this; 
        
const loginBtn = document.getElementById('login-btn');
if(loginBtn) loginBtn.addEventListener('click', () => this.login());

@@ -25,60 +26,49 @@ window.App = {
async login() {
const nameInput = document.getElementById('login-name');
const pinInput = document.getElementById('login-pin');
        
if (!nameInput || !pinInput) return;
        const name = nameInput.value.trim();
        const pin = pinInput.value.trim();
        
        if (!name || !pin) { alert("Bitte Name und PIN eingeben."); return; }

        const msg = document.getElementById('login-msg');
        if(msg) msg.innerText = "Verbinde...";
        
        const result = await API.post('login', { name, pin });
        const result = await API.post('login', { name: nameInput.value, pin: pinInput.value });
if (result.status === 'success') {
this.user = { name: result.user, role: result.role };
localStorage.setItem('wg_user', JSON.stringify(this.user));
            if(msg) msg.innerText = "";
this.showDashboard();
} else {
            if(msg) msg.innerText = result.message || "Fehler";
            alert(result.message);
}
},

enterGuestMode() {
        document.getElementById('login-screen').style.display = 'none';
        const container = document.getElementById('app-container');
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) loginScreen.style.display = 'none';
        
        // Header für Gäste anpassen
        document.getElementById('nav-back-btn').style.display = 'block';
        // Spezial-Funktion für Zurück im Gast-Modus (Reload)
        document.getElementById('nav-back-btn').onclick = () => location.reload();

        // Header für Gäste
        const headerStyle = "display: flex; align-items: center; padding: 15px; background: #1f1f1f; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 20000;";
        const btnStyle = "background: none; border: none; color: #bb86fc; font-size: 1.1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; padding: 5px 10px 5px 0; pointer-events: auto;";
        document.getElementById('app-title').innerText = "Gästebuch";
        document.getElementById('settings-btn').style.display = 'none';

        container.innerHTML = `
            <div style="${headerStyle}">
                <button onclick="location.reload()" style="${btnStyle}">
                    <span style="font-size: 1.4rem; margin-right: 8px;">❮</span> Zum Login
                </button>
                <span style="margin-left: 15px; color: #888;">Gästebuch</span>
            </div>
            <div class="module-container" style="padding-top: 10px;">
                <div id="guest-view">Lade...</div>
            </div>
        `;
        const container = document.getElementById('app-container');
        container.innerHTML = `<div id="guest-view">Lade...</div>`;

        if(typeof GuestbookModule !== 'undefined') {
            GuestbookModule.init('guest-view', true);
        }
        if(typeof GuestbookModule !== 'undefined') GuestbookModule.init('guest-view', true);
},

logout() { localStorage.removeItem('wg_user'); location.reload(); },

showDashboard() {
document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        document.getElementById('login-screen').style.display = 'none';

        const sBtn = document.getElementById('settings-btn');
        if(sBtn) sBtn.style.display = 'block';
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) loginScreen.style.display = 'none';
        
        // HEADER RESET
        document.getElementById('nav-back-btn').style.display = 'none';
        document.getElementById('nav-back-btn').onclick = () => this.showDashboard(); // Reset Action
        document.getElementById('settings-btn').style.display = 'block';
        document.getElementById('app-title').innerText = "WG Hub";

const userInfo = document.getElementById('user-info');
if (userInfo && this.user) userInfo.innerHTML = `Hi, <strong>${this.user.name}</strong>`;
@@ -92,7 +82,6 @@ window.App = {
               <div class="tile" onclick="window.App.loadModule('voting')"><span>🗳️</span><h3>Votes</h3></div>
               <div class="tile" onclick="window.App.loadModule('soda')"><span>💧</span><h3>Soda</h3></div>
               <div class="tile" onclick="window.App.loadModule('train')"><span>🚋</span><h3>Bahn</h3></div>
                
               <div class="tile" onclick="window.App.loadModule('guestbook')"><span>📖</span><h3>Gästebuch</h3></div>
               
               <div class="tile wide" onclick="window.App.loadModule('ranking')">
@@ -109,39 +98,37 @@ window.App = {
},

loadModule(moduleName) {
        const sBtn = document.getElementById('settings-btn');
        if(sBtn) sBtn.style.display = 'none';
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
        
        // STANDARD Header für ALLE Module
        // WICHTIG: window.App.showDashboard() wird direkt aufgerufen.
        const headerStyle = "display: flex; align-items: center; padding: 15px; background: #1f1f1f; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 20000;";
        const btnStyle = "background: none; border: none; color: #bb86fc; font-size: 1.1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; padding: 5px 10px 5px 0; pointer-events: auto;";
        
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
        // Container leeren und ID für Modul bereitstellen
        container.innerHTML = `<div id="module-content" style="padding:10px;">Lade...</div>`;

        if(moduleName === 'todo') { container.innerHTML = shell('Aufgaben', 'task-cont'); TasksModule.init('todo', 'task-cont'); } 
        else if (moduleName === 'cleaning') { container.innerHTML = shell('Putzplan', 'task-cont'); TasksModule.init('cleaning', 'task-cont'); }
        else if (moduleName === 'shopping') { container.innerHTML = shell('Einkauf', 'shop-cont'); ShoppingModule.init('shop-cont'); }
        else if (moduleName === 'voting') { container.innerHTML = shell('Abstimmung', 'vote-cont'); VotingModule.init('vote-cont'); }
        else if (moduleName === 'ranking') { container.innerHTML = shell('Ranking', 'rank-cont'); TasksModule.initRanking('rank-cont'); }
        else if (moduleName === 'soda') { container.innerHTML = shell('SodaStream', 'soda-cont'); SodaModule.init('soda-cont'); }
        else if (moduleName === 'train') { container.innerHTML = shell('Bahn', 'train-cont'); TrainModule.init('train-cont'); }
        else if (moduleName === 'guestbook') { 
            container.innerHTML = shell('Gästebuch', 'gb-cont'); 
            GuestbookModule.init('gb-cont', false); 
        }
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
@@ -155,4 +142,4 @@ window.App = {
}
};

document.addEventListener('DOMContentLoaded', () => window.App.init());
document.addEventListener('DOMContentLoaded', () => App.init());

    showDashboard() {
        // ... (Reset Logik bleibt) ...
        
        const c = document.getElementById('app-container');
        c.innerHTML = `
            <div class="dashboard-grid">
                <div class="tile" onclick="window.App.loadModule('finance')"><span>💸</span><h3>Finanzen</h3></div> <!-- NEU -->
                <div class="tile" onclick="window.App.loadModule('todo')"><span>📌</span><h3>To-Dos</h3></div>
                <div class="tile" onclick="window.App.loadModule('cleaning')"><span>🧹</span><h3>Putzplan</h3></div>
                <div class="tile" onclick="window.App.loadModule('shopping')"><span>🛒</span><h3>Einkauf</h3></div>
                <div class="tile" onclick="window.App.loadModule('soda')"><span>💧</span><h3>Soda</h3></div>
                <div class="tile" onclick="window.App.loadModule('train')"><span>🚋</span><h3>Bahn</h3></div>
                
                <div class="tile" onclick="window.App.loadModule('guestbook')"><span>📖</span><h3>Gästebuch</h3></div>
                
                <div class="tile" onclick="window.App.loadModule('ranking')"><span>🏆</span><h3>Ranking</h3></div>
                <div class="tile" onclick="window.App.loadModule('voting')"><span>🗳️</span><h3>Votes</h3></div>
            </div>
            <div style="padding:15px;"><div id="calendar-wrapper"></div></div>
        `;
        
        if(typeof CalendarModule !== 'undefined') CalendarModule.init('calendar-wrapper');
    },

    loadModule(moduleName) {
        // ... (Header Logik bleibt) ...
        
        // Modul Switcher
        if(moduleName === 'finance') { 
            container.innerHTML = shell('WG Finanzen', 'fin-cont'); 
            FinanceModule.init('fin-cont'); 
        }
        else if(moduleName === 'todo') { container.innerHTML = shell('Aufgaben', 'task-cont'); TasksModule.init('todo', 'task-cont'); } 
        // ... (Rest bleibt gleich) ...
        else if(moduleName === 'train') { container.innerHTML = shell('Bahn', 'train-cont'); TrainModule.init('train-cont'); }
        // ...
    },
    
// ...
