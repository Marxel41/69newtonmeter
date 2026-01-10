const TrainModule = {
    // Default Namen für die Inputs
    defaults: {
        origin: "Karlsruhe Werderstraße",
        dhbw: "Karlsruhe Erzbergerstraße", // Offizieller Name
        hka: "Karlsruhe Europaplatz"
    },

    stops: {
        origin: localStorage.getItem('wg_station_origin_id'),
        dhbw: localStorage.getItem('wg_station_dhbw_id'),
        hka: localStorage.getItem('wg_station_hka_id')
    },
    
    currentDest: 'dhbw', 

    async init(cId) {
        const container = document.getElementById(cId);
        if(!container) return;

        // Wenn noch keine Stationen konfiguriert sind -> Setup Modus
        if (!this.isValid(this.stops.origin) || !this.isValid(this.stops.dhbw) || !this.isValid(this.stops.hka)) {
            this.renderSetup(container);
        } else {
            this.renderView(container);
        }
    },

    isValid(id) {
        return id && id !== "undefined" && id !== "null" && id.length > 0;
    },

    // --- VIEW 1: SETUP ---
    renderSetup(container) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h3 style="color:var(--text-main); margin-bottom:10px;">Bahn Konfiguration</h3>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">
                    Die automatische Suche war nicht erfolgreich.<br>
                    Bitte bestätige die Haltestellen:
                </p>

                <div style="text-align:left; margin-bottom:15px;">
                    <label style="font-size:0.8rem; color:#888;">Start3 (Zuhause)</label>
                    <input type="text" id="setup-origin" value="${this.defaults.origin}">
                </div>

                <div style="text-align:left; margin-bottom:15px;">
                    <label style="font-size:0.8rem; color:#888;">Ziel 1 (DHBW)</label>
                    <input type="text" id="setup-dhbw" value="${this.defaults.dhbw}">
                </div>

                <div style="text-align:left; margin-bottom:20px;">
                    <label style="font-size:0.8rem; color:#888;">Ziel 2 (HKA)</label>
                    <input type="text" id="setup-hka" value="${this.defaults.hka}">
                </div>

                <button class="primary" onclick="TrainModule.runSetup()">Stationen suchen & speichern</button>
                <div id="setup-status" style="margin-top:10px; font-size:0.9rem;"></div>
            </div>
        `;
    },

    async runSetup() {
        const status = document.getElementById('setup-status');
        const originName = document.getElementById('setup-origin').value;
        const dhbwName = document.getElementById('setup-dhbw').value;
        const hkaName = document.getElementById('setup-hka').value;

        status.innerHTML = "<span style='color:var(--secondary);'>Suche läuft...</span>";
        
        try {
            const [s1, s2, s3] = await Promise.all([
                this.findStation(originName),
                this.findStation(dhbwName),
                this.findStation(hkaName)
            ]);

            if (!s1) { status.innerHTML = `<span style='color:var(--danger);'>Start "${originName}" nicht gefunden.</span>`; return; }
            if (!s2) { status.innerHTML = `<span style='color:var(--danger);'>Ziel 1 "${dhbwName}" nicht gefunden.</span>`; return; }
            if (!s3) { status.innerHTML = `<span style='color:var(--danger);'>Ziel 2 "${hkaName}" nicht gefunden.</span>`; return; }

            // Speichern
            this.stops = { origin: s1.id, dhbw: s2.id, hka: s3.id };
            localStorage.setItem('wg_station_origin_id', s1.id);
            localStorage.setItem('wg_station_dhbw_id', s2.id);
            localStorage.setItem('wg_station_hka_id', s3.id);
            
            // Namen merken für Anzeige
            localStorage.setItem('wg_station_origin_name', s1.name);

            status.innerHTML = "<span style='color:var(--secondary);'>Gefunden! Lade...</span>";
            setTimeout(() => this.init(document.getElementById('train-cont').id), 1000); // Reload Module

        } catch (e) {
            status.innerHTML = `<span style='color:var(--danger);'>API Fehler: ${e.message}</span>`;
        }
    },

    async findStation(query) {
        // Wir nutzen den 'stations' endpoint für klarere Ergebnisse, fallback auf locations
        // Versuch 1: Exact Match Suche
        const url = `https://v6.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=3&poi=false&addresses=false`;
        const res = await fetch(url);
        const data = await res.json();
        return data.find(x => x.type === 'station' || x.type === 'stop') || null;
    },

    // --- VIEW 2: ABFAHRTEN ---
    renderView(container) {
        const startName = localStorage.getItem('wg_station_origin_name') || "Werderstraße";
        
        container.innerHTML = `
            <div style="text-align:center; padding-bottom:15px; margin-bottom:15px; border-bottom:1px solid #333;">
                <div style="margin-bottom:15px; font-size:0.9rem; color:var(--text-muted);">
                    Start: <strong style="color:var(--text-main);">${startName}</strong>
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
                if (minutesToDep < -1) return; 

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
        this.stops = { origin: null, dhbw: null, hka: null };
        this.init(document.getElementById('train-list').parentElement.parentElement.id);
    }
};
