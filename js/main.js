const App = {
    user: null,

    init() {
        console.log("App gestartet");
        // Check ob Service Worker registriert werden muss
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
        
        // Prüfen ob User im LocalStorage gespeichert ist
        const savedUser = localStorage.getItem('wg_user');
        if (savedUser) {
            this.user = JSON.parse(savedUser);
            this.showInterface();
        }
    },

    async login() {
        const name = document.getElementById('login-name').value;
        const pin = document.getElementById('login-pin').value;
        const msg = document.getElementById('login-msg');

        msg.textContent = "Lade...";

        const result = await API.post('login', { name, pin });

        if (result.status === 'success') {
            this.user = { name: result.user, role: result.role };
            localStorage.setItem('wg_user', JSON.stringify(this.user));
            this.showInterface();
        } else {
            msg.textContent = result.message;
        }
    },

    showInterface() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('user-info').textContent = `Hallo, ${this.user.name}`;
        document.getElementById('user-info').style.display = 'block';
        
        // Lade standardmäßig das Dashboard
        this.loadModule('dashboard');
    },

    loadModule(moduleName) {
        const container = document.getElementById('app-container');
        container.innerHTML = "<h2>Lade Modul...</h2>";
        
        // Hier werden wir später Logik einbauen, die Inhalte aus den 
        // js/modules/ Ordnern lädt. Fürs erste simulieren wir es:
        
        if(moduleName === 'dashboard') {
            container.innerHTML = `<h3>Aktuelle Übersicht</h3><p>Keine offenen Aufgaben.</p>`;
        } else if (moduleName === 'cleaning') {
             container.innerHTML = `<h3>Putzplan</h3><p>Hier kommt der Plan hin.</p>`;
        } else {
            container.innerHTML = `<h3>${moduleName}</h3><p>Modul noch nicht fertig.</p>`;
        }
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => App.init());
