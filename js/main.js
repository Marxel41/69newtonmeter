const App = {
    user: null,

    init() {
        console.log("App startet...");
        const savedUser = localStorage.getItem('wg_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
                this.showInterface();
            } catch (e) {
                localStorage.removeItem('wg_user');
            }
        }
    },

    async login() {
        const name = document.getElementById('login-name').value.trim();
        const pin = document.getElementById('login-pin').value.trim();
        const msg = document.getElementById('login-msg');

        if (!name || !pin) {
            msg.textContent = "Bitte alles ausfüllen.";
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
            msg.textContent = result.message || "Fehler beim Login";
        }
    },

    showInterface() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('user-info').textContent = `Hallo, ${this.user.name} (${this.user.role})`;
        document.getElementById('user-info').style.display = 'block';
        this.loadModule('dashboard');
    },

    loadModule(moduleName) {
        console.log("Lade Modul:", moduleName);
        
        if(moduleName === 'dashboard') {
            if(typeof CalendarModule !== 'undefined') CalendarModule.init();
        } 
        else if (moduleName === 'cleaning') {
             if(typeof TasksModule !== 'undefined') {
                 TasksModule.init().then(() => {
                     setTimeout(() => TasksModule.switchTab('cleaning'), 100);
                 });
             }
        } 
        else if (moduleName === 'shopping') {
            if(typeof ShoppingModule !== 'undefined') ShoppingModule.init();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
