const TrainModule = {
    stops: {
        origin: localStorage.getItem('wg_station_origin_id'),
        dhbw: localStorage.getItem('wg_station_dhbw_id'),
        hka: localStorage.getItem('wg_station_hka_id')
    },
    names: {
        origin: localStorage.getItem('wg_station_origin_name') || 'Start',
        dhbw: localStorage.getItem('wg_station_dhbw_name') || 'DHBW',
        hka: localStorage.getItem('wg_station_hka_name') || 'HKA'
    },
    currentDest: 'dhbw', 

    async init(cId) {
        const container = document.getElementById(cId);
        if(!container) return;

        // Wenn noch nicht alles konfiguriert ist, zeigen wir das Setup
        if (!this.stops.origin || !this.stops.dhbw || !this.stops.hka) {
            this.renderSetup(container);
        } else {
            this.renderView(container);
        }
    },

    // --- VIEW 1: MANUELLES SETUP ---
    renderSetup(container) {
        container.innerHTML = `
            <div style="padding: 10px;">
                <h3 style="color:var(--text-main); margin-bottom:10px; text-align:center;">Bahn Einrichtung</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; text-align:center; margin-bottom:20px;">
                    Suche deine Haltestellen (z.B. "Werderstraße").
                </p>

                <!-- STATUS ANZEIGE -->
                <div style="background:var(--card-bg); padding:10px; border-radius:8px; margin-bottom:20px; font-size:0.85rem;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span>🏠 Start:</span> 
                        <strong style="color:${this.stops.origin ? 'var(--secondary)' : 'var(--danger)'}">${this.names.origin}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span>🎓 DHBW:</span> 
                        <strong style="color:${this.stops.dhbw ? 'var(--secondary)' : 'var(--danger)'}">${this.names.dhbw}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span>🏛️ HKAA:</span> 
                        <strong style="color:${this.stops.hka ? 'var(--secondary)' : 'var(--danger)'}">${this.names.hka}</strong>
                    </div>
                </div>

                <!-- SUCHE -->
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <input type="text" id="setup-search" placeholder="Station eingeben..." style="margin:0;">
                    <button class="primary" onclick="TrainModule.searchAPI()" style="width:auto; margin:0;">🔍</button>
                </div>
                
                <div id="setup-results"></div>

                <!-- FERTIG BUTTON -->
                <button id="btn-finish-setup" class="primary" onclick="TrainModule.finishSetup()" style="margin-top:20px; display:${(this.stops.origin && this.stops.dhbw && this.stops.hka) ? 'block' : 'none'}">
                    Speichern & Fertig
                </button>
            </div>
        `;
    },

    async searchAPI() {
        const query = document.getElementById('setup-search').value;
        const resDiv = document.getElementById('setup-results');
        
        if(!query) return;
        resDiv.innerHTML = "<p style='text-align:center; color:#888;'>Suche...</p>";

        try {
            // FIX: Wir entfernen alle Filter wie poi=false um maximale Ergebnisse zu bekommen
            // und erhöhen das Limit auf 20.
            const url = `https://v6.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=20`;
            const res = await fetch(url);
            const data = await res.json();

            resDiv.innerHTML = "";
            if(data.length === 0) {
                resDiv.innerHTML = "<p style='text-align:center;'>Nichts gefunden.</p>";
                return;
            }

            data.forEach(stop => {
                // Wir zeigen alles an was technisch eine Station ist
                if(stop.type === 'stop' || stop.type === 'station') {
                    resDiv.innerHTML += `
                        <div style="background:#333; padding:10px; border-radius:8px; margin-bottom:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div style="font-weight:bold; color:white;">${stop.name}</div>
                                <div style="font-size:0.7rem; color:#888;">ID: ${stop.id}</div>
                            </div>
                            <div style="display:flex; gap:5px; margin-top:8px;">
                                <button onclick="TrainModule.assign('${stop.id}', '${stop.name}', 'origin')" style="flex:1; padding:8px 5px; font-size:0.7rem; cursor:pointer; background:#444; color:white; border:1px solid #555; border-radius:4px;">Als Start</button>
                                <button onclick="TrainModule.assign('${stop.id}', '${stop.name}', 'dhbw')" style="flex:1; padding:8px 5px; font-size:0.7rem; cursor:pointer; background:#444; color:white; border:1px solid #555; border-radius:4px;">Als DHBW</button>
                                <button onclick="TrainModule.assign('${stop.id}', '${stop.name}', 'hka')" style="flex:1; padding:8px 5px; font-size:0.7rem; cursor:pointer; background:#444; color:white; border:1px solid #555; border-radius:4px;">Als HKA</button>
                            </div>
                        </div>
                    `;
                }
            });

        } catch(e) {
            resDiv.innerHTML = `<p style='color:var(--danger); text-align:center;'>API Fehler: ${e.message}</p>`;
        }
    },

    assign(id, name, type) {
        this.stops[type] = id;
        this.names[type] = name;
        
        localStorage.setItem(`wg_station_${type}_id`, id);
        localStorage.setItem(`wg_station_${type}_name`, name);
        
        // UI Update (Reload Setup View)
        this.init(document.getElementById('train-list') ? document.getElementById('train-list').parentElement.parentElement.id : 'train-cont');
    },

    finishSetup() {
        // UI neu laden -> springt in renderView
        this.init(document.getElementById('setup-results').parentElement.parentElement.id);
    },

    // --- VIEW 2: ABFAHRTEN (Normaler Modus) ---
    renderView(container) {
        container.innerHTML = `
            <div style="text-align:center; padding-bottom:15px; margin-bottom:15px; border-bottom:1px solid #333;">
                <div style="margin-bottom:15px; font-size:0.9rem; color:var(--text-muted);">
                    Start: <strong style="color:var(--text-main);">${this.names.origin}</strong>
                </div>
                
                <div style="background:var(--card-bg); border:1px solid #333; border-radius:12px; padding:5px; display:inline-flex; gap:5px;">
                    <button id="btn-dhbw" onclick="TrainModule.switchDest('dhbw')" style="background:var(--secondary); color:black; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer; transition:all 0.2s;">DHBW</button>
                    <button id="btn-hka" onclick="TrainModule.switchDest('hka')" style="background:transparent; color:var(--text-muted); border:none; padding:10px 20px; border-radius:8px; cursor:pointer; transition:all 0.2s;">HKA</button>
                </div>
            </div>
            
            <div id="train-list" style="min-height:200px;">
                <p style="text-align:center; color:#666; margin-top:20px;">Lade Verbindungen...</p>
            </div>
            
            <div style="text-align:center; margin-top:20px; padding-top:10px; border-top:1px solid #333;">
                <button onclick="TrainModule.forceReset()" style="color:#555; background:none; border:none; text-decoration:underline; cursor:pointer; font-size:0.8rem;">Konfiguration ändern</button>
            </div>
        `;
        
        this.updateButtons();
        this.loadJourneys();
    },

    updateButtons() {
        const btnDHBW = document.getElementById('btn-dhbw');
        const btnHKA = document.getElementById('btn-hka');
        if(!btnDHBW || !btnHKA) return;

        if (this.currentDest === 'dhbw') {
            btnDHBW.style.background = 'var(--secondary)';
            btnDHBW.style.color = 'black';
            btnHKA.style.background = 'transparent';
            btnHKA.style.color = 'var(--text-muted)';
        } else {
            btnHKA.style.background = 'var(--secondary)';
            btnHKA.style.color = 'black';
            btnDHBW.style.background = 'transparent';
            btnDHBW.style.color = 'var(--text-muted)';
        }
    },

    switchDest(target) {
        this.currentDest = target;
        this.updateButtons();
        this.loadJourneys();
    },

    async loadJourneys() {
        const list = document.getElementById('train-list');
        const destID = this.currentDest === 'dhbw' ? this.stops.dhbw : this.stops.hka;
        
        try {
            const url = `https://v6.db.transport.rest/journeys?from=${this.stops.origin}&to=${destID}&results=4&transfers=1`;
            const response = await fetch(url);
            const data = await response.json();

            list.innerHTML = "";
            
            if (!data.journeys || data.journeys.length === 0) {
                list.innerHTML = `<p style='text-align:center; padding:20px;'>Keine Verbindung gefunden.</p>`;
                return;
            }

            data.journeys.forEach(trip => {
                const leg = trip.legs[0]; 
                if(!leg) return;

                const depTime = new Date(leg.departure);
                const arrTime = new Date(leg.arrival);
                const now = new Date();
                
                const minutesToDep = Math.floor((depTime - now) / 60000);
                if (minutesToDep < -5) return; // Zu alt

                const timeStr = depTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const lineName = leg.line && leg.line.name ? leg.line.name : 'Bahn';
                const direction = leg.direction || 'Richtung ?';
                
                let badgeColor = '#333';
                let badgeText = 'white';
                let statusText = minutesToDep + "'";
                
                if (minutesToDep <= 0) { badgeColor = '#555'; statusText = "Weg"; }
                else if (minutesToDep <= 3) { badgeColor = 'var(--danger)'; statusText = "Lauf!"; }
                else if (minutesToDep <= 7) { badgeColor = 'var(--warn)'; badgeText='black'; statusText = minutesToDep + " min"; }
                else { badgeColor = 'var(--secondary)'; badgeText='black'; statusText = minutesToDep + " min"; }

                list.innerHTML += `
                    <div class="list-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
                        <div style="display:flex; align-items:center; gap:15px; overflow:hidden;">
                            <div style="background:#333; color:white; min-width:45px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1rem;">
                                ${lineName}
                            </div>
                            <div style="display:flex; flex-direction:column; overflow:hidden;">
                                <span style="font-weight:bold; font-size:1.1rem; white-space:nowrap;">${timeStr}</span>
                                <small style="color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${direction}
                                </small>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <span style="background:${badgeColor}; color:${badgeText}; padding:6px 12px; border-radius:15px; font-weight:bold; font-size:0.9rem; display:inline-block; min-width:60px; text-align:center;">
                                ${statusText}
                            </span>
                        </div>
                    </div>
                `;
            });

        } catch (e) {
            list.innerHTML = `<p style='text-align:center; color:var(--danger);'>API Fehler.</p>`;
        }
    },
    
    forceReset() {
        localStorage.removeItem('wg_station_origin_id');
        localStorage.removeItem('wg_station_dhbw_id');
        localStorage.removeItem('wg_station_hka_id');
        localStorage.removeItem('wg_station_origin_name');
        localStorage.removeItem('wg_station_dhbw_name');
        localStorage.removeItem('wg_station_hka_name');
        this.stops = { origin: null, dhbw: null, hka: null };
        this.names = { origin: 'Start', dhbw: 'DHBW', hka: 'HKA' };
        
        // Reload Container
        const cont = document.getElementById('train-list') ? document.getElementById('train-list').parentElement.parentElement : document.getElementById('train-cont');
        if(cont) this.init(cont.id);
    }
};
