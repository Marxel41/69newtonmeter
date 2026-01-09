// ... (Anfang bleibt gleich) ...

    loadModule(moduleName) {
        // ... (Header Logic) ...
        const sBtn = document.getElementById('settings-btn');
        if(sBtn) sBtn.style.display = 'none';
        
        const container = document.getElementById('app-container');
        
        // STANDARD Header für normale Module
        const shell = (title, id) => `
            <div style="display: flex; align-items: center; padding: 15px; background: #1f1f1f; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 10000;">
                <button onclick="window.App.showDashboard()" style="background: none; border: none; color: #bb86fc; font-size: 1.1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; padding: 5px 10px 5px 0;">
                    <span style="font-size: 1.4rem; margin-right: 8px;">❮</span> Startseite
                </button>
                <span style="margin-left: 15px; color: #888; border-left: 1px solid #555; padding-left: 15px;">${title}</span>
            </div>
            <div class="module-container" style="padding-top: 10px;">
                <div id="${id}">Lade...</div>
            </div>
        `;

        // SPEZIAL Header für Gästebuch (da es eigenes Design hat)
        // Wir setzen hier KEINEN container wrapper mit padding, damit der Gradient voll wirkt
        if(moduleName === 'guestbook') {
            container.innerHTML = `
                <div style="position: absolute; top: 15px; left: 15px; z-index: 10001;">
                    <button onclick="window.App.showDashboard()" style="background: rgba(0,0,0,0.3); border: 1px solid white; color: white; padding: 8px 15px; border-radius: 20px; cursor: pointer; backdrop-filter: blur(5px);">
                        ❮ Zurück
                    </button>
                </div>
                <div id="gb-cont"></div>
            `;
            GuestbookModule.init('gb-cont');
            return;
        }

        if(moduleName === 'todo') { container.innerHTML = shell('Aufgaben', 'task-cont'); TasksModule.init('todo', 'task-cont'); } 
        // ... (restliche Module wie gehabt) ...
        else if (moduleName === 'cleaning') { container.innerHTML = shell('Putzplan', 'task-cont'); TasksModule.init('cleaning', 'task-cont'); }
        else if (moduleName === 'shopping') { container.innerHTML = shell('Einkauf', 'shop-cont'); ShoppingModule.init('shop-cont'); }
        else if (moduleName === 'voting') { container.innerHTML = shell('Abstimmung', 'vote-cont'); VotingModule.init('vote-cont'); }
        else if (moduleName === 'ranking') { container.innerHTML = shell('Ranking', 'rank-cont'); TasksModule.initRanking('rank-cont'); }
        else if (moduleName === 'soda') { container.innerHTML = shell('SodaStream', 'soda-cont'); SodaModule.init('soda-cont'); }
    },

    // GAST MODUS (Public)
    enterGuestMode() {
        document.getElementById('login-screen').style.display = 'none';
        const container = document.getElementById('app-container');
        
        container.innerHTML = `
            <div style="position: absolute; top: 15px; left: 15px; z-index: 10001;">
                <button onclick="location.reload()" style="background: rgba(0,0,0,0.3); border: 1px solid white; color: white; padding: 8px 15px; border-radius: 20px; cursor: pointer; backdrop-filter: blur(5px);">
                    ❮ Zum Login
                </button>
            </div>
            <div id="guest-view"></div>
        `;
        
        if(typeof GuestbookModule !== 'undefined') {
            GuestbookModule.init('guest-view');
        }
    },
    
    // ... (Rest von main.js bleibt gleich) ...
