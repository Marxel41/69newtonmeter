const App = {
    user: null,

    init() {
        console.log("App gestartet");

        // Service Worker für spätere App-Installation
        if ('serviceWorker' in navigator) {
            // navigator.serviceWorker.register('sw.js'); // Erst aktivieren, wenn wir sw.js haben
        }
        
        // Prüfen, ob der User schon eingeloggt war (im Speicher des Browsers)
        const savedUser = localStorage.getItem('wg_user');
        if (savedUser) {
            this.user = JSON.parse(savedUser);
            this.showInterface();
        }
    },

    async login() {
        const nameInput = document.getElementById('login-name');
        const pinInput = document.getElementById('login-pin');
        const msg = document.getElementById('login-msg');

        const name = nameInput.value;
        const pin = pinInput.value;

        if (!name || !pin) {
            msg.textContent = "Bitte Name und PIN eingeben.";
            return;
        }

        msg.textContent = "Lade...";
        msg.style.color = "#666";

        // Anfrage an Google Sheet
        const result = await API.post('login', { name, pin });

        if (result.status === 'success') {
            // Erfolgreich eingeloggt
            this.user = { name: result.user, role: result.role };
            // User im Browser speichern, damit man nicht jedes Mal neu einloggen muss
            localStorage.setItem('wg_user', JSON.stringify(this.user));
            
            msg.textContent = "";
            this.showInterface();
        } else {
            // Fehler
            msg.style.color = "red";
            msg.textContent = result.message || "Falsche Daten";
        }
    },

    showInterface() {
        // Login ausblenden
        document.getElementById('login-screen').style.display = 'none';
        
        // Navigation einblenden
        document.getElementById('main-nav').style.display = 'flex';
        
        // User Info Header
        const userInfo = document.getElementById('user-info');
        userInfo.textContent = `Hallo, ${this.user.name}`;
        userInfo.style.display = 'block';
        
        // Standardmäßig das Dashboard (Kalender) laden
        this.loadModule('dashboard');
    },

    loadModule(moduleName) {
        const container = document.getElementById('app-container');
        
        // Hier entscheiden wir, welches Modul geladen wird
        if(moduleName === 'dashboard') {
            // Wir prüfen sicherheitshalber, ob das Modul geladen ist
            if (typeof CalendarModule !== 'undefined') {
                CalendarModule.init();
            } else {
                container.innerHTML = "<p>Fehler: Kalender-Modul nicht gefunden.</p>";
            }
        } 
        else if (moduleName === 'cleaning') {
             container.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h3>Putzplan</h3>
                    <p>Dieses Modul kommt als nächstes!</p>
                </div>`;
        } 
        else if (moduleName === 'shopping') {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h3>Einkaufsliste</h3>
                    <p>Noch nicht implementiert.</p>
                </div>`;
        }
    }
};

// Startet die App, sobald die Seite geladen ist
document.addEventListener('DOMContentLoaded', () => App.init());
