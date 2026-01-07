const App = {
    user: null,

    init() {
        console.log("App initialisiert");

        // Service Worker erst später aktivieren, wenn alles läuft
        if ('serviceWorker' in navigator) {
            // navigator.serviceWorker.register('sw.js');
        }
        
        // Auto-Login prüfen (falls User schon mal da war)
        const savedUser = localStorage.getItem('wg_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
                this.showInterface();
            } catch (e) {
                console.error("Gespeicherte User-Daten fehlerhaft", e);
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
        
        // Anfrage an Google Sheet senden
        const result = await API.post('login', { name, pin });

        if (result.status === 'success') {
            this.user = { name: result.user, role: result.role };
            // User im Browser speichern
            localStorage.setItem('wg_user', JSON.stringify(this.user));
            
            msg.textContent = "";
            this.showInterface();
        } else {
            msg.textContent = result.message || "Login fehlgeschlagen. Falsche Daten?";
        }
    },

    showInterface() {
        // Login Screen ausblenden
        document.getElementById('login-screen').style.display = 'none';
        
        // Navigation einblenden
        document.getElementById('main-nav').style.display = 'flex';
        
        // Header Info (Name anzeigen)
        const userInfo = document.getElementById('user-info');
        userInfo.textContent = `Hallo, ${this.user.name} (${this.user.role})`;
        userInfo.style.display = 'block';
        
        // Start-Modul laden (Standard: Kalender/Dashboard)
        this.loadModule('dashboard');
    },

    loadModule(moduleName) {
        console.log("Lade Modul:", moduleName);
        
        // Hier passiert die Magie: Wir rufen die .init() Funktion der Module auf
        
        if(moduleName === 'dashboard') {
            // Lädt das Kalender Modul
            if (typeof CalendarModule !== 'undefined') {
                CalendarModule.init();
            } else {
                console.error("FEHLER: CalendarModule nicht gefunden!");
            }
        } 
        else if (moduleName === 'cleaning') {
             // Lädt das Tasks Modul und wechselt zum Putz-Tab
             if (typeof TasksModule !== 'undefined') {
                 TasksModule.init().then(() => {
                     // Kleiner Trick: Kurz warten, damit alles geladen ist, dann Tab wechseln
                     setTimeout(() => TasksModule.switchTab('cleaning'), 50);
                 });
             } else {
                 console.error("FEHLER: TasksModule nicht gefunden!");
             }
        } 
        else if (moduleName === 'shopping') {
            // Lädt das Shopping Modul
            if (typeof ShoppingModule !== 'undefined') {
                ShoppingModule.init();
            } else {
                 console.error("FEHLER: ShoppingModule nicht gefunden!");
            }
        }
    }
};

// Startet die App, sobald die Seite geladen ist
document.addEventListener('DOMContentLoaded', () => App.init());
