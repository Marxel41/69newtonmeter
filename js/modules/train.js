const TrainModule = {
    // Speicherstruktur für die 3 wichtigen Stationen
    stations: {
        origin: { id: localStorage.getItem('wg_train_origin_id'), name: localStorage.getItem('wg_train_origin_name') },
        dest1:  { id: localStorage.getItem('wg_train_dest1_id'),  name: localStorage.getItem('wg_train_dest1_name') }, // DHBW
        dest2:  { id: localStorage.getItem('wg_train_dest2_id'),  name: localStorage.getItem('wg_train_dest2_name') }  // HKA
    },
    
    // Aktuell ausgewähltes Ziel für die Anzeige (dest1 oder dest2)
    currentViewDest: 'dest1',

    async init(cId) {
        const container = document.getElementById(cId);
        if(!container) return;

        // Entscheidung: Haben wir alle IDs? Wenn nein -> Setup
        if (!this.stations.origin.id || !this.stations.dest1.id || !this.stations.dest2.id) {
            this.renderSetup(container);
        } else {
            this.renderView(container);
        }
    },

    // --- VIEW 1: SETUP (DIE INTERAKTIVE SUCHE) ---
    renderSetup(container) {
        container.innerHTML = `
            <div style="padding: 10px;">
                <h3 style="color:var(--text-main); margin-bottom:15px; text-align:center;">Haltestellen einrichten</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; text-align:center; margin-bottom:20px;">
                    Bitte suche und wähle die korrekten Stationen aus der Liste aus.
                </p>

                <!-- 1. START (WERDERSTR) -->
                ${this.renderStationSlot('origin', 'Start (Zuhause)', this.stations.origin)}
                
                <!-- 2. ZIEL 1 (DHBW) -->
                ${this.renderStationSlot('dest1', 'Ziel 1 (DHBW)', this.stations.dest1)}
                
                <!-- 3. ZIEL 2 (HKA) -->
                ${this.renderStationSlot('dest2', 'Ziel 2 (HKA)', this.stations.dest2)}

                <!-- FERTIG BUTTON -->
                <div style="text-align:center; margin-top:20px;">
                    <button id="btn-finish" class="primary" onclick="TrainModule.finishSetup()" 
                        style="display:${(this.stations.origin.id && this.stations.dest1.id && this.stations.dest2.id) ? 'block' : 'none'}">
                        Speichern & Fertig
                    </button>
                </div>

                <!-- SUCHERGEBNISSE MODAL (Inline) -->
                <div id="search-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:10000; padding:20px; box-sizing:border-box; overflow-y:auto;">
                    <div style="background:var(--card-bg); padding:20px; border-radius:12px; max-width:500px; margin:20px auto;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <h3 style="margin:0;">Station suchen</h3>
                            <button onclick="document.getElementById('search-overlay').style.display='none'" style="background:none; border:none; font-size:1.5rem; color:#fff; cursor:pointer;">&times;</button>
                        </div>
                        <div style="display:flex; gap:10px; margin-bottom:15px;">
                            <input type="text" id="api-search-input" placeholder="z.B. Werderstraße" style="margin:0;">
                            <button class="primary" onclick="TrainModule.performSearch()" style="width:auto; margin:0;">🔍</button>
                        </div>
                        <div id="api-results-list"></div>
                    </div>
                </div>
            </div>
        `;
    },

    renderStationSlot(key, label, data) {
        const isSet = data.id && data.name;
        const statusColor = isSet ? 'var(--secondary)' : 'var(--danger)';
        const statusText = isSet ? data.name : 'Nicht konfiguriert';
        
        return `
            <div style="background:var(--card-bg); padding:15px; border-radius:10px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:3px;">${label}</div>
                    <div style="font-weight:bold; color:${statusColor};">${statusText}</div>
                </div>
                <button onclick="TrainModule.openSearch('${key}')" style="background:#333; border:1px solid #555; color:white; padding:8px 12px; border-radius:6px; cursor:pointer;">
                    ${isSet ? 'Ändern' : 'Suchen'}
                </button>
            </div>
        `;
    },

    // --- SUCH LOGIK ---
    activeSearchKey: null,

    openSearch(key) {
        this.activeSearchKey = key;
        document.getElementById('search-overlay').style.display = 'block';
        document.getElementById('api-results-list').innerHTML = '';
        document.getElementById('api-search-input').value = '';
        document.getElementById('api-search-input').focus();
    },

    async performSearch() {
        const query = document.getElementById('api-search-input').value;
        const list = document.getElementById('api-results-list');
        
        if(!query) return;
        list.innerHTML = "<p style='text-align:center; color:#888;'>Frage Bahn API...</p>";

        try {
            // Wir suchen nach 'stations' (Haltestellen)
            const url = `https://v6.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=10&poi=false&addresses=false`;
            const res = await fetch(url);
            const data = await res.json();

            list.innerHTML = "";
            if(data.length === 0) {
                list.innerHTML = "<p style='text-align:center;'>Nichts gefunden.</p>";
                return;
            }

            data.forEach(stop => {
                if(stop.type === 'stop' || stop.type === 'station') {
                    list.innerHTML += `
                        <div onclick="TrainModule.selectResult('${stop.id}', '${stop.name}')" 
                             style="background:#222; padding:12px; border-radius:8px; margin-bottom:8px; cursor:pointer; border:1px solid #333; transition:background 0.2s;">
                            <div style="font-weight:bold; color:white;">${stop.name}</div>
                            <div style="font-size:0.7rem; color:#888;">ID: ${stop.id}</div>
                        </div>
                    `;
                }
            });
        } catch(e) {
            list.innerHTML = `<p style='color:var(--danger); text-align:center;'>Fehler: ${e.message}</p>`;
        }
    },

    selectResult(id, name) {
        // Daten speichern
        this.stations[this.activeSearchKey] = { id: id, name: name };
        localStorage.setItem(`wg_train_${this.activeSearchKey}_id`, id);
        localStorage.setItem(`wg_train_${this.activeSearchKey}_name`, name);

        // Overlay zu, Setup neu rendern
        document.getElementById('search-overlay').style.display = 'none';
        
        // Setup View aktualisieren
        this.init(document.getElementById('train-cont').id);
    },

    finishSetup() {
        // In die normale Ansicht wechseln
        this.init(document.getElementById('train-cont').id);
    },

    // --- VIEW 2: ABFAHRT MONITOR ---
    renderView(container) {
        container.innerHTML = `
            <div style="text-align:center; padding-bottom:15px; margin-bottom:15px; border-bottom:1px solid #333;">
                <div style="margin-bottom:15px; font-size:0.9rem; color:var(--text-muted);">
                    Start: <strong style="color:var(--text-main);">${this.stations.origin.name}</strong>
                </div>
                
                <div style="background:var(--card-bg); border:1px solid #333; border-radius:12px; padding:5px; display:inline-flex; gap:5px;">
                    <button id="btn-dest1" onclick="TrainModule.switchDest('dest1')" style="transition:all 0.2s; padding:10px 20px; border-radius:8px; cursor:pointer;">DHBW</button>
                    <button id="btn-dest2" onclick="TrainModule.switchDest('dest2')" style="transition:all 0.2s; padding:10px 20px; border-radius:8px; cursor:pointer;">HKA</button>
                </div>
            </div>
            
            <div id="train-list" style="min-height:200px;">
                <p style="text-align:center; color:#666; margin-top:20px;">Lade Verbindungen...</p>
            </div>
            
            <div style="text-align:center; margin-top:20px; padding-top:10px; border-top:1px solid #333;">
                <button onclick="TrainModule.forceReset()" style="color:#555; background:none; border:none; text-decoration:underline; cursor:pointer; font-size:0.8rem;">Haltestellen ändern</button>
            </div>
        `;
        
        this.updateTabStyles();
        this.loadJourneys();
    },

    switchDest(targetKey) {
        this.currentViewDest = targetKey;
        this.updateTabStyles();
        this.loadJourneys();
    },

    updateTabStyles() {
        const btn1 = document.getElementById('btn-dest1');
        const btn2 = document.getElementById('btn-dest2');
        if(!btn1 || !btn2) return;

        // Reset
        const inactive = "background:transparent; color:var(--text-muted); border:none; font-weight:normal;";
        const active = "background:var(--secondary); color:black; border:none; font-weight:bold;";

        btn1.style.cssText += (this.currentViewDest === 'dest1' ? active : inactive);
        btn2.style.cssText += (this.currentViewDest === 'dest2' ? active : inactive);
    },

    async loadJourneys() {
        const list = document.getElementById('train-list');
        const destObj = this.stations[this.currentViewDest];
        
        // Lade-Animation
        list.innerHTML = "<p style='text-align:center; color:#888;'>Suche Verbindung...</p>";

        try {
            const url = `https://v6.db.transport.rest/journeys?from=${this.stations.origin.id}&to=${destObj.id}&results=4&transfers=1`;
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
                if (minutesToDep < -1) return; // Zu alt

                const timeStr = depTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const lineName = leg.line && leg.line.name ? leg.line.name : 'Bahn';
                const direction = leg.direction || 'Richtung ?';
                
                // Styles
                let badgeStyle = "background:var(--secondary); color:black;";
                let statusText = minutesToDep + " min";
                
                if (minutesToDep <= 0) { badgeStyle = "background:#555; color:white;"; statusText = "Weg"; }
                else if (minutesToDep <= 3) { badgeStyle = "background:var(--danger); color:white;"; statusText = "Lauf!"; }
                else if (minutesToDep <= 7) { badgeStyle = "background:var(--warn); color:black;"; }

                list.innerHTML += `
                    <div class="list-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
                        <div style="display:flex; align-items:center; gap:15px; overflow:hidden;">
                            <div style="background:#333; color:white; min-width:45px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.9rem;">
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
                            <span style="${badgeStyle} padding:6px 12px; border-radius:15px; font-weight:bold; font-size:0.9rem; display:inline-block; min-width:60px; text-align:center;">
                                ${statusText}
                            </span>
                        </div>
                    </div>
                `;
            });

        } catch (e) {
            list.innerHTML = `<p style='text-align:center; color:var(--danger);'>API Fehler: ${e.message}</p>`;
        }
    },

    forceReset() {
        localStorage.removeItem('wg_train_origin_id'); localStorage.removeItem('wg_train_origin_name');
        localStorage.removeItem('wg_train_dest1_id');  localStorage.removeItem('wg_train_dest1_name');
        localStorage.removeItem('wg_train_dest2_id');  localStorage.removeItem('wg_train_dest2_name');
        
        this.stations = { origin: {}, dest1: {}, dest2: {} };
        this.init('train-cont');
    }
};
