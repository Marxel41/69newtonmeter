// ... (Anfang bleibt gleich) ...

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
