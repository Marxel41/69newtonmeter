const TrainModule = {
    // Konfiguration: Primäre Namen + Fallbacks falls die API zickt
    config: {
        origin: ["Karlsruhe Werderstraße", "Werderstraße, Karlsruhe", "Karlsruhe Werderstr."],
        dhbw: ["Karlsruhe Erzbergerstraße", "Erzbergerstraße, Karlsruhe", "Karlsruhe Duale Hochschule"], 
        hka: ["Karlsruhe Europaplatz/Postgalerie", "Europaplatz, Karlsruhe", "Karlsruhe Kunstakademie", "Mühlburger Tor, Karlsruhe"]
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

        // UI Aufbau
        container.innerHTML = `
            <div style="text-align:center; padding-bottom:15px; margin-bottom:15px; border-bottom:1px solid #333;">
                <div style="margin-bottom:15px; font-size:0.9rem; color:var(--text-muted);">
                    Start2: <strong style="color:var(--text-main);">Werderstraße</strong>
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
                <button onclick="TrainModule.forceReset()" style="color:#555; background:none; border:none; text-decoration:underline; cursor:pointer; font-size:0.8rem;">Setup Reset</button>
            </div>
        `;

        this.updateButtons();

        // Check: Haben wir gültige IDs? Wenn nein -> Automatisch suchen
        if (!this.isValid(this.stops.origin) || !this.isValid(this.stops.dhbw) || !this.isValid(this.stops.hka)) {
            await this.resolveStations();
        } else {
            this.loadJourneys();
        }
    },

    isValid(id) {
        return id && id !== "undefined" && id !== "null" && id.length > 0;
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

    // Diese Funktion repariert die IDs automatisch im Hintergrund
    async resolveStations() {
        const list = document.getElementById('train-list');
        list.innerHTML = "<p style='text-align:center; color:#888;'>Suche Haltestellen IDs...</p>";

        // Helper: Probiert Liste von Namen durch
        const findBest = async (queries) => {
            for (let q of queries) {
                const id = await this.findStation(q);
                if (id) return id;
            }
            return null;
        };

        try {
            // Parallelsuche nach den exakten Namen und Fallbacks
            const [s1, s2, s3] = await Promise.all([
                findBest(this.config.origin),
                findBest(this.config.dhbw),
                findBest(this.config.hka)
            ]);

            if (s1 && s2 && s3) {
                // Speichern
                this.stops = { origin: s1.id, dhbw: s2.id, hka: s3.id };
                localStorage.setItem('wg_station_origin_id', s1.id);
                localStorage.setItem('wg_station_dhbw_id', s2.id);
                localStorage.setItem('wg_station_hka_id', s3.id);
                
                // Namen der gefundenen Stationen anzeigen (Debug/Info)
                console.log("Found:", s1.name, s2.name, s3.name);
                
                // Sofort laden
                this.loadJourneys();
            } else {
                let msg = "";
                if(!s1) msg += "Werderstraße nicht gefunden. ";
                if(!s2) msg += "DHBW nicht gefunden. ";
                if(!s3) msg += "HKA nicht gefunden. ";
                list.innerHTML = `<div style='text-align:center; color:var(--danger); padding:20px;'>Setup fehlgeschlagen.<br><small>${msg}</small><br><button class='primary' style='margin-top:10px; width:auto;' onclick='TrainModule.forceReset()'>Neu versuchen</button></div>`;
            }
        } catch (e) {
            list.innerHTML = `<p style='text-align:center; color:var(--danger);'>Verbindungsfehler: ${e.message}</p>`;
        }
    },

    async findStation(query) {
        try {
            // results=5 um Chance zu erhöhen, fuzzy für ungenaue Namen
            const url = `https://v6.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=5&fuzzy=true`;
            const res = await fetch(url);
            const data = await res.json();
            
            // Suche ersten echten Stop
            const station = data.find(loc => loc.type === 'station' || loc.type === 'stop');
            return station ? { id: station.id, name: station.name } : null;
        } catch(e) { 
            return null; 
        }
    },

    async loadJourneys() {
        const list = document.getElementById('train-list');
        if(!list) return;
        
        list.innerHTML = "<p style='text-align:center; color:#888;'>Suche nächste Bahn...</p>";

        const destID = this.currentDest === 'dhbw' ? this.stops.dhbw : this.stops.hka;
        
        // Sicherheitscheck
        if(!this.isValid(this.stops.origin) || !this.isValid(destID)) {
            this.forceReset("Ungültige Station-IDs.");
            return;
        }
        
        try {
            // Wir suchen Verbindungen ab JETZT, transfers=1 erlaubt umsteigen
            const url = `https://v6.db.transport.rest/journeys?from=${this.stops.origin}&to=${destID}&results=4&transfers=1`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
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
                
                // Ampel Farben
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
            console.error(e);
            list.innerHTML = `<p style='text-align:center; color:var(--danger);'>API Fehler.</p>`;
        }
    },
    
    forceReset(msg) {
        if(msg) alert(msg);
        localStorage.removeItem('wg_station_origin_id');
        localStorage.removeItem('wg_station_dhbw_id');
        localStorage.removeItem('wg_station_hka_id');
        this.stops = { origin: null, dhbw: null, hka: null };
        this.init(document.getElementById('train-list').parentElement.parentElement.id);
    }
};
