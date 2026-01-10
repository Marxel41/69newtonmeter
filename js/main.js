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

        // Start Notification Loop (läuft im Hintergrund)
        this.startNotificationService();
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
        // Sicherer Check für Login Screen
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

    showDashboard() {
        // Modal-Fenster schließen
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        
        // BUG FIX: Prüfen ob Login-Screen existiert, bevor wir darauf zugreifen
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) loginScreen.style.display = 'none';
        
        const sBtn = document.getElementById('settings-btn');
        if(sBtn) sBtn.style.display = 'block';
        
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
        
        const container = document.getElementById('app-container');
        
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

        if(moduleName === 'todo') { container.innerHTML = shell('Aufgaben', 'task-cont'); TasksModule.init('todo', 'task-cont'); } 
        else if (moduleName === 'cleaning') { container.innerHTML = shell('Putzplan', 'task-cont'); TasksModule.init('cleaning', 'task-cont'); }
        else if (moduleName === 'shopping') { container.innerHTML = shell('Einkauf', 'shop-cont'); ShoppingModule.init('shop-cont'); }
        else if (moduleName === 'voting') { container.innerHTML = shell('Abstimmung', 'vote-cont'); VotingModule.init('vote-cont'); }
        else if (moduleName === 'ranking') { container.innerHTML = shell('Ranking', 'rank-cont'); TasksModule.initRanking('rank-cont'); }
        else if (moduleName === 'soda') { container.innerHTML = shell('SodaStream', 'soda-cont'); SodaModule.init('soda-cont'); }
        else if (moduleName === 'guestbook') { 
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
        if(cb) {
            localStorage.setItem('wg_notif_enabled', cb.checked);
            if (cb.checked && "Notification" in window) Notification.requestPermission();
        }
    },

    // --- NOTIFICATION SERVICE ---
    startNotificationService() {
        // Erster Check nach 5 Sekunden, dann alle 60 Sek
        setTimeout(() => this.checkNotifications(), 5000);
        setInterval(() => this.checkNotifications(), 60000);
    },

    async checkNotifications() {
        if (localStorage.getItem('wg_notif_enabled') !== 'true') return;
        if (Notification.permission !== "granted") return;

        const now = new Date();
        const currentHour = now.getHours();
        const todayStr = now.toISOString().split('T')[0];

        try {
            // Wir machen einen minimalen Abruf aller wichtigen Daten
            const [rTasks, rEvents, rVotes, rGuest] = await Promise.all([
                API.post('read', { sheet: 'Tasks', _t: Date.now() }),
                API.post('read', { sheet: 'Events', _t: Date.now() }),
                API.post('read', { sheet: 'Votes', _t: Date.now() }),
                API.post('read', { sheet: 'Guestbook', _t: Date.now() })
            ]);

            // 1. TASKS (Putz/ToDo) -> Alarm um 10 Uhr
            if (currentHour >= 10 && rTasks.status === 'success') {
                rTasks.data.forEach(t => {
                    // Nur offene Tasks von HEUTE
                    if (t.status === 'open' && t.date === todayStr) {
                        this.sendNotify(`task_${t.id}`, "Aufgabe fällig!", t.title);
                    }
                });
            }

            // 2. EVENTS (Kalender) -> Alarm um 9 Uhr
            if (currentHour >= 9 && rEvents.status === 'success') {
                rEvents.data.forEach(e => {
                    // Wir müssen das Datum-String Problem beachten (schneiden auf YYYY-MM-DD)
                    const eDate = e.date.substring(0, 10);
                    if (eDate === todayStr) {
                        this.sendNotify(`event_${e.date}_${e.title}`, "Heute im Kalender", e.title);
                    }
                });
            }

            // 3. VOTES (Neu) -> Immer
            if (rVotes.status === 'success') {
                // Wir speichern die höchste ID die wir kennen
                const lastSeenVote = parseInt(localStorage.getItem('wg_last_vote_id') || "0");
                let maxId = lastSeenVote;
                
                rVotes.data.forEach(v => {
                    const vId = parseInt(v.id);
                    if (vId > lastSeenVote) {
                        this.sendNotify(`vote_${v.id}`, "Neue Abstimmung!", v.title);
                        if (vId > maxId) maxId = vId;
                    }
                });
                localStorage.setItem('wg_last_vote_id', maxId);
            }

            // 4. GUESTBOOK (Neu) -> Immer
            if (rGuest.status === 'success') {
                // Guestbook hat keine ID spalte, wir nutzen Zeitstempel oder Index
                // Einfachheitshalber nutzen wir die Länge der Liste als Indikator
                const lastCount = parseInt(localStorage.getItem('wg_gb_count') || "0");
                const currentCount = rGuest.data.length;
                
                if (currentCount > lastCount) {
                    const newEntry = rGuest.data[currentCount - 1]; // Letzter Eintrag
                    this.sendNotify(`gb_${currentCount}`, "Neuer Gästebucheintrag", `${newEntry.name} hat geschrieben.`);
                    localStorage.setItem('wg_gb_count', currentCount);
                }
            }

        } catch (e) {
            console.error("Notif Error", e);
        }
    },

    sendNotify(key, title, body) {
        // Prüfen ob diese spezifische Notification heute schon gesendet wurde
        const storageKey = `notif_sent_${key}`;
        if (localStorage.getItem(storageKey)) return;

        new Notification(title, { body: body, icon: 'icon.png' }); // Icon optional
        localStorage.setItem(storageKey, 'true');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
