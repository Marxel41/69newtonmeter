const App = {
    user: null,
    editMode: false,
    swapSource: null,

    // Definition aller verfügbaren Kacheln
    tiles: [
        { id: 'todo', icon: '📌', title: 'To-Dos', wide: false },
        { id: 'cleaning', icon: '🧹', title: 'Putzplan', wide: false },
        { id: 'shopping', icon: '🛒', title: 'Einkauf', wide: false },
        { id: 'finance', icon: '💸', title: 'Finanzen', wide: false },
        { id: 'voting', icon: '🗳️', title: 'Votes', wide: false },
        { id: 'soda', icon: '💧', title: 'Soda', wide: false },
        { id: 'train', icon: '🚋', title: 'Bahn', wide: false },
        { id: 'guestbook', icon: '📖', title: 'Gästebuch', wide: false },
        { id: 'ranking', icon: '🏆', title: 'Ranking', wide: true, subtitle: 'Details >' }
    ],

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
        const name = nameInput.value.trim();
        const pin = pinInput.value.trim();
        
        if (!name || !pin) { alert("Bitte Name und PIN eingeben."); return; }
        
        const msg = document.getElementById('login-msg');
        if(msg) msg.innerText = "Verbinde...";
        
        const result = await API.post('login', { name, pin });
        if (result.status === 'success') {
            this.user = { name: result.user, role: result.role };
            localStorage.setItem('wg_user', JSON.stringify(this.user));
            if(msg) msg.innerText = "";
            this.showDashboard();
        } else {
            if(msg) msg.innerText = result.message || "Fehler";
        }
    },

    enterGuestMode() {
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) loginScreen.style.display = 'none';
        
        const container = document.getElementById('app-container');
        const headerStyle = "display: flex; align-items: center; padding: 15px; background: #1f1f1f; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 20000;";
        const btnStyle = "background: none; border: none; color: #bb86fc; font-size: 1.1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; padding: 5px 10px 5px 0; pointer-events: auto;";

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
        
        if(typeof GuestbookModule !== 'undefined') GuestbookModule.init('guest-view', true);
    },

    logout() { localStorage.removeItem('wg_user'); location.reload(); },

    // --- DASHBOARD LOGIK ---

    getTileOrder() {
        const stored = localStorage.getItem('wg_tile_order');
        if (stored) return JSON.parse(stored);
        // Default Reihenfolge = Reihenfolge im Array
        return this.tiles.map(t => t.id);
    },

    saveTileOrder(order) {
        localStorage.setItem('wg_tile_order', JSON.stringify(order));
    },

    toggleEditMode() {
        this.editMode = !this.editMode;
        this.swapSource = null; // Reset selection
        this.showDashboard(); // Neu rendern mit Edit-Styles
    },

    handleTileClick(id) {
        // Modus 1: Normaler Klick -> Modul öffnen
        if (!this.editMode) {
            this.loadModule(id);
            return;
        }

        // Modus 2: Edit Modus -> Tauschen
        if (!this.swapSource) {
            // Erste Kachel auswählen
            this.swapSource = id;
            this.showDashboard(); // UI Update um Auswahl anzuzeigen
        } else {
            // Zweite Kachel gewählt -> Tauschen!
            const currentOrder = this.getTileOrder();
            const idx1 = currentOrder.indexOf(this.swapSource);
            const idx2 = currentOrder.indexOf(id);

            if (idx1 > -1 && idx2 > -1) {
                // Swap im Array
                [currentOrder[idx1], currentOrder[idx2]] = [currentOrder[idx2], currentOrder[idx1]];
                this.saveTileOrder(currentOrder);
            }
            
            this.swapSource = null;
            this.showDashboard();
        }
    },

    showDashboard() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('nav-back-btn').style.display = 'none';
        document.getElementById('settings-btn').style.display = 'block';
        document.getElementById('app-title').innerText = "WG Hub";
        
        const userInfo = document.getElementById('user-info');
        if (userInfo && this.user) userInfo.innerHTML = `Hi, <strong>${this.user.name}</strong>`;
        
        const c = document.getElementById('app-container');
        
        // Reihenfolge laden
        const order = this.getTileOrder();
        
        // Tiles sortieren
        const sortedTiles = this.tiles.slice().sort((a, b) => {
            let idxA = order.indexOf(a.id);
            let idxB = order.indexOf(b.id);
            // Neue Tiles ans Ende falls nicht in gespeicherter Order
            if(idxA === -1) idxA = 999; 
            if(idxB === -1) idxB = 999;
            return idxA - idxB;
        });

        // HTML Generieren
        let tilesHtml = "";
        sortedTiles.forEach(tile => {
            const isSelected = this.swapSource === tile.id;
            const editClass = this.editMode ? (isSelected ? 'tile-selected' : 'tile-edit') : '';
            
            // Inhalt
            let content = "";
            if (tile.wide) {
                content = `
                    <div style="display:flex;width:100%;justify-content:space-between;align-items:center;pointer-events:none;">
                         <div style="display:flex;align-items:center;"><span>${tile.icon}</span><h3 style="margin-left:10px;">${tile.title}</h3></div>
                         <small style="color:#03dac6">${tile.subtitle || ''}</small>
                    </div>`;
            } else {
                content = `<span style="pointer-events:none;">${tile.icon}</span><h3 style="pointer-events:none;">${tile.title}</h3>`;
            }

            tilesHtml += `
                <div class="tile ${tile.wide ? 'wide' : ''} ${editClass}" onclick="window.App.handleTileClick('${tile.id}')">
                    ${content}
                </div>
            `;
        });

        const editBtnText = this.editMode ? "✅ Fertig" : "✎ Anordnen";
        const editBtnStyle = this.editMode ? "color:var(--secondary); border-color:var(--secondary);" : "color:#666; border-color:#444;";

        c.innerHTML = `
            <div style="padding: 0 15px; text-align:right;">
                <button onclick="window.App.toggleEditMode()" style="background:transparent; border:1px solid; border-radius:15px; padding:5px 10px; font-size:0.8rem; cursor:pointer; ${editBtnStyle}">
                    ${editBtnText}
                </button>
            </div>
            <div class="dashboard-grid">
                ${tilesHtml}
            </div>
            <div style="padding:15px;"><div id="calendar-wrapper"></div></div>
        `;
        
        if(typeof CalendarModule !== 'undefined') CalendarModule.init('calendar-wrapper');
    },

    loadModule(moduleName) {
        document.getElementById('nav-back-btn').style.display = 'block';
        document.getElementById('settings-btn').style.display = 'none';
        
        const titles = { 'todo': 'Aufgaben', 'cleaning': 'Putzplan', 'shopping': 'Einkauf', 'finance': 'Finanzen', 'voting': 'Abstimmung', 'ranking': 'Ranking', 'soda': 'SodaStream', 'train': 'Abfahrten', 'guestbook': 'Gästebuch' };
        document.getElementById('app-title').innerText = titles[moduleName] || 'Modul';

        const container = document.getElementById('app-container');
        container.innerHTML = `<div id="module-content" style="padding:10px;">Lade...</div>`;

        const targetId = 'module-content';
        if(moduleName === 'todo') TasksModule.init('todo', targetId);
        else if(moduleName === 'cleaning') TasksModule.init('cleaning', targetId);
        else if(moduleName === 'shopping') ShoppingModule.init(targetId);
        else if(moduleName === 'finance') FinanceModule.init(targetId);
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
