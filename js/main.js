const App = {
    user: null,
    
    tiles: [
        { id: 'todo', icon: '📌', title: 'To-Dos', wide: false },
        { id: 'cleaning', icon: '🧹', title: 'Putzplan', wide: false },
        { id: 'shopping', icon: '🛒', title: 'Einkauf', wide: false },
        { id: 'finance', icon: '💸', title: 'Finanzen', wide: false },
        { id: 'voting', icon: '🗳️', title: 'Votes', wide: false },
        { id: 'soda', icon: '💧', title: 'Soda', wide: false },
        { id: 'train', icon: '🚋', title: 'Bahn', wide: false },
        { id: 'guestbook', icon: '📖', title: 'Gästebuch', wide: false },
        { id: 'ranking', icon: '🏆', title: 'Ranking', wide: true }
    ],

    init() {
        window.App = this; 
        
        const loginBtn = document.getElementById('login-btn');
        if(loginBtn) loginBtn.addEventListener('click', () => this.login());

        const guestBtn = document.getElementById('guest-btn');
        if(guestBtn) guestBtn.addEventListener('click', () => {
            this.user = { name: "Gast", role: "guest" }; 
            this.loadModule('guestbook_public');
        });
        
        const savedUser = localStorage.getItem('wg_user');
        if (savedUser) {
            try { 
                this.user = JSON.parse(savedUser); 
                // Gäste werden beim Neuladen nicht automatisch eingeloggt
                if(this.user.role === 'guest') {
                    this.logout();
                } else {
                    this.showDashboard(); 
                }
            } catch (e) { 
                localStorage.removeItem('wg_user'); 
            }
        }
    },

    async login() {
        const name = document.getElementById('login-name').value.trim();
        const pin = document.getElementById('login-pin').value.trim();
        if (!name || !pin) return;
        
        const result = await API.post('login', { name, pin });
        if (result.status === 'success') {
            this.user = { name: result.user, role: result.role };
            localStorage.setItem('wg_user', JSON.stringify(this.user));
            this.showDashboard();
        } else {
            document.getElementById('login-msg').innerText = result.message || "Login fehlgeschlagen";
        }
    },

    // Intelligente Zurück-Funktion
    goBack() {
        if (this.user && this.user.role === 'guest') {
            this.logout(); // Gäste gehen immer zurück zum Login
        } else {
            this.showDashboard(); // Bewohner gehen zum Dashboard
        }
    },

    showDashboard() {
        // SICHERHEITS-CHECK: Gäste dürfen das Dashboard nicht sehen
        if (!this.user || this.user.role === 'guest') {
            this.logout();
            return;
        }

        document.getElementById('nav-back-btn').style.display = 'none';
        document.getElementById('settings-btn').style.display = 'block';
        
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `Hi, <strong>${this.user.name}</strong>`;
        }
        
        const c = document.getElementById('app-container');
        let tilesHtml = "";
        this.tiles.forEach(tile => {
            tilesHtml += `
                <div class="tile ${tile.wide ? 'wide' : ''}" onclick="window.App.loadModule('${tile.id}')">
                    <span>${tile.icon}</span>
                    <h3>${tile.title}</h3>
                </div>`;
        });

        c.innerHTML = `
            <div class="dashboard-grid">${tilesHtml}</div>
            <div style="padding:15px;"><div id="calendar-wrapper"></div></div>
        `;
        
        if(typeof CalendarModule !== 'undefined') CalendarModule.init('calendar-wrapper');
    },

    loadModule(moduleName) {
        // SICHERHEITS-CHECK: Gäste dürfen NUR das öffentliche Gästebuch laden
        if (this.user && this.user.role === 'guest' && moduleName !== 'guestbook_public') {
            this.logout();
            return;
        }

        const container = document.getElementById('app-container');
        document.getElementById('nav-back-btn').style.display = 'block';
        document.getElementById('settings-btn').style.display = 'none';

        const shell = (t, id) => `
            <div class="module-container">
                <h2 style="margin-top:0; color:var(--text-muted); font-size:1rem; margin-bottom:20px;">${t}</h2>
                <div id="${id}">Lade...</div>
            </div>`;

        if(moduleName === 'guestbook' || moduleName === 'guestbook_public') {
            const isPublic = (moduleName === 'guestbook_public');
            container.innerHTML = shell('Gästebuch', 'gb-cont');
            GuestbookModule.init('gb-cont', isPublic);
        }
        else if(moduleName === 'finance') { container.innerHTML = shell('Finanzen', 'fin-cont'); FinanceModule.init('fin-cont'); }
        else if(moduleName === 'todo') { container.innerHTML = shell('To-Dos', 'task-cont'); TasksModule.init('todo', 'task-cont'); }
        else if(moduleName === 'cleaning') { container.innerHTML = shell('Putzplan', 'task-cont'); TasksModule.init('cleaning', 'task-cont'); }
        else if(moduleName === 'shopping') { container.innerHTML = shell('Einkauf', 'shop-cont'); ShoppingModule.init('shop-cont'); }
        else if(moduleName === 'voting') { container.innerHTML = shell('Abstimmung', 'vote-cont'); VotingModule.init('vote-cont'); }
        else if(moduleName === 'ranking') { container.innerHTML = shell('Ranking', 'rank-cont'); TasksModule.initRanking('rank-cont'); }
        else if(moduleName === 'soda') { container.innerHTML = shell('SodaStream', 'soda-cont'); SodaModule.init('soda-cont'); }
        else if(moduleName === 'train') { container.innerHTML = shell('Bahn', 'train-cont'); TrainModule.init('train-cont'); }
    },

    async testPush() {
        const statusEl = document.getElementById('test-status');
        if(!statusEl) return;
        statusEl.innerText = "Sende...";
        const result = await API.post('test_push');
        statusEl.innerText = result.status === 'success' ? "Gesendet!" : "Fehler";
    },

    toggleSettings() {
        document.getElementById('settings-modal').style.display = 'flex';
    },

    logout() {
        this.user = null;
        localStorage.removeItem('wg_user');
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
