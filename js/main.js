const App = {
    user: null,

    init() {
        console.log("App initialisiert");

        // Service Worker registrieren (wenn vorhanden)
        if ('serviceWorker' in navigator) {
            // navigator.serviceWorker.register('sw.js');
        }
        
        // Auto-Login prüfen
        const savedUser = localStorage.getItem('wg_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
                this.showInterface();
            } catch (e) {
                console.error("User Daten defekt", e);
                localStorage.removeItem('wg_user');
            }
        }
    },

    async login() {
        const nameInput = document.getElementById('login-name');
        const pinInput = document.getElementById('login-pin');
        const msg = document.getElementById('login-msg');

        const name = nameInput.value.trim();
        const pin = pinInput.value.trim();

        if (!name || !pin) {
            msg.textContent = "Bitte Name und PIN eingeben.";
            return;
        }

        msg.textContent = "Verbinde...";
        
        const result = await API.post('login', { name, pin });

        if (result.status === 'success') {
            this.user = { name: result.user, role: result.role };
            localStorage.setItem('wg_user', JSON.stringify(this.user));
            
            msg.textContent = "";
            this.showInterface();
        } else {
            msg.textContent = result.message || "Login fehlgeschlagen.";
        }
    },

    showInterface() {
        // Login Screen ausblenden
        document.getElementById('login-screen').style.display = 'none';
        
        // Navigation einblenden
        document.getElementById('main-nav').style.display = 'flex';
        
        // Header Info
        const userInfo = document.getElementById('user-info');
        userInfo.textContent = `Hallo, ${this.user.name} (${this.user.role})`;
        userInfo.style.display = 'block';
        
        // Start-Modul laden (Dashboard/Kalender)
        this.loadModule('dashboard');
    },

    loadModule(moduleName) {
        // Navigation Buttons optisch (optional könnte man hier 'active' Klassen setzen)
        
        if(moduleName === 'dashboard') {
            // Lädt das Kalender Modul
            if (typeof CalendarModule !== 'undefined') {
                CalendarModule.init();
            }
        } 
        else if (moduleName === 'cleaning') {
             // Lädt das Tasks Modul und wechselt zum Putz-Tab
             if (typeof TasksModule !== 'undefined') {
                 TasksModule.init().then(() => {
                     // Kleiner Timeout damit das DOM sicher bereit ist
                     setTimeout(() => TasksModule.switchTab('cleaning'), 50);
                 });
             }
        } 
        else if (moduleName === 'shopping') {
            // Lädt das Shopping Modul
            if (typeof ShoppingModule !== 'undefined') {
                ShoppingModule.init();
            }
        }
    }
};

// Startet die App
document.addEventListener('DOMContentLoaded', () => App.init());
