const App = {
    user: null,
    editMode: false,
    swapSource: null,

    // Konfiguration aller Kacheln
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
        
        if(typeof GuestbookModule !== 'undefined') {
            GuestbookModule.init('guest-view', true);
        }
    },

    logout() { localStorage.removeItem('wg_user'); location.reload(); },

    // --- DASHBOARD & SORTIERUNG LOGIK ---

    getTileOrder() {
        const stored = localStorage.getItem('wg_tile_order');
        if (stored) return JSON.parse(stored);
        return this.tiles.map(t => t.id);
    },

    saveTileOrder(order) {
        localStorage.setItem('wg_tile_order', JSON.stringify(order));
    },

    toggleEditMode() {
        this.editMode = !this.editMode;
        this.swapSource = null;
        this.showDashboard();
    },

    handleTileClick(id) {
        // Modus 1: Normal -> Öffnen
        if (!this.editMode) {
            this.loadModule(id);
            return;
        }

        // Modus 2: Edit -> Tauschen
        if (!this.swapSource) {
            this.swapSource = id; // Erste Wahl
            this.showDashboard();
        } else {
            // Zweite Wahl -> Tausch
            const currentOrder = this.getTileOrder();
            const idx1 = currentOrder.indexOf(this.swapSource);
            const idx2 = currentOrder.indexOf(id);

            if (idx1 > -1 && idx2 > -1) {
                [currentOrder[idx1], currentOrder[idx2]] = [currentOrder[idx2], currentOrder[idx1]];
                this.saveTileOrder(currentOrder);
            }
            
            this.swapSource = null;
            this.showDashboard();
        }
    },

    showDashboard() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) loginScreen.style.display = 'none';
        
        // Header Reset
        const backBtn = document.getElementById('nav-back-btn');
        if(backBtn) { backBtn.style.display = 'none'; backBtn.onclick = () => this.showDashboard(); }
        const setBtn = document.getElementById('settings-btn');
        if(setBtn) setBtn.style.display = 'block';
        
        const title = document.getElementById('app-title');
        if(title) title.innerText = "WG Hub";
        
        const userInfo = document.getElementById('user-info');
        if (userInfo && this.user) userInfo.innerHTML = `Hi, <strong>${this.user.name}</strong>`;
        
        const c = document.getElementById('app-container');
        
        // Sortierung anwenden
        const order = this.getTileOrder();
        const sortedTiles = this.tiles.slice().sort((a, b) => {
            let idxA = order.indexOf(a.id);
            let idxB = order.indexOf(b.id);
            if(idxA === -1) idxA = 999;
            if(idxB === -1) idxB = 999;
            return idxA - idxB;
        });

        // HTML generieren
        let tilesHtml = "";
        sortedTiles.forEach(tile => {
            const isSelected = this.swapSource === tile.id;
            const editClass = this.editMode ? (isSelected ? 'tile-selected' : 'tile-edit') : '';
            
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
        // Header anpassen
        const backBtn = document.getElementById('nav-back-btn');
        if(backBtn) backBtn.style.display = 'block';
        const setBtn = document.getElementById('settings-btn');
        if(setBtn) setBtn.style.display = 'none';
        
        // Titel setzen (Fallback auf Modul ID falls Name nicht gefunden)
        const activeTile = this.tiles.find(t => t.id === moduleName);
        const titleText = activeTile ? activeTile.title : 'Modul';
        const titleEl = document.getElementById('app-title');
        if(titleEl) titleEl.innerText = titleText;

        const container = document.getElementById('app-container');
        
        const headerStyle = "display: flex; align-items: center; padding: 15px; background: #1f1f1f; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 20000;";
        const btnStyle = "background: none; border: none; color: #bb86fc; font-size: 1.1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; padding: 5px 10px 5px 0; pointer-events: auto;";
        
        const shell = (t, id) => `
            <div style="${headerStyle}">
                <button onclick="window.App.showDashboard()" style="${btnStyle}">
                    <span style="font-size: 1.4rem; margin-right: 8px;">❮</span> Startseite
                </button>
                <span style="margin-left: 15px; color: #888; border-left: 1px solid #555; padding-left: 15px;">${t}</span>
            </div>
            <div class="module-container" style="padding-top: 10px;">
                <div id="${id}">Lade...</div>
            </div>
        `;

        if(moduleName === 'finance') { container.innerHTML = shell('WG Finanzen', 'fin-cont'); FinanceModule.init('fin-cont'); }
        else if(moduleName === 'todo') { container.innerHTML = shell('Aufgaben', 'task-cont'); TasksModule.init('todo', 'task-cont'); } 
        else if(moduleName === 'cleaning') { container.innerHTML = shell('Putzplan', 'task-cont'); TasksModule.init('cleaning', 'task-cont'); }
        else if(moduleName === 'shopping') { container.innerHTML = shell('Einkauf', 'shop-cont'); ShoppingModule.init('shop-cont'); }
        else if(moduleName === 'voting') { container.innerHTML = shell('Abstimmung', 'vote-cont'); VotingModule.init('vote-cont'); }
        else if(moduleName === 'ranking') { container.innerHTML = shell('Ranking', 'rank-cont'); TasksModule.initRanking('rank-cont'); }
        else if(moduleName === 'soda') { container.innerHTML = shell('SodaStream', 'soda-cont'); SodaModule.init('soda-cont'); }
        else if(moduleName === 'train') { container.innerHTML = shell('Bahn', 'train-cont'); TrainModule.init('train-cont'); }
        else if(moduleName === 'guestbook') { 
            container.innerHTML = shell('Gästebuch', 'gb-cont'); 
            GuestbookModule.init('gb-cont', false); 
        }
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
