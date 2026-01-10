const TrainModule = {
    // Gespeicherte IDs oder null
    stops: {
        origin: localStorage.getItem('wg_station_origin_id'),
        dhbw: localStorage.getItem('wg_station_dhbw_id'),
        hka: localStorage.getItem('wg_station_hka_id')
    },
    // Standard: DHBW
    currentDest: 'dhbw', 

    async init(cId) {
        const container = document.getElementById(cId);
        if(!container) return;

        // UI Aufbau
        container.innerHTML = `
            <div style="text-align:center; padding-bottom:15px; margin-bottom:15px; border-bottom:1px solid #333;">
                <div style="margin-bottom:15px; font-size:0.9rem; color:var(--text-muted);">
                    Start: <strong style="color:var(--text-main);">Werderstraße</strong>
                </div>
                
                <div style="background:var(--card-bg); border:1px solid #333; border-radius:12px; padding:5px; display:inline-flex; gap:5px;">
                    <button id="btn-dhbw" onclick="TrainModule.switchDest('dhbw')" style="background:var(--secondary); color:black; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer; transition:all 0.2s;">DHBW</button>
                    <button id="btn-hka" onclick="TrainModule.switchDest('hka')" style="background:transparent; color:var(--text-muted); border:none; padding:10px 20px; border-radius:8px; cursor:pointer; transition:all 0.2s;">HKA</button>
                </div>
            </div>
            
            <div id="train-list" style="min-height:200px;">
                <p style="text-align:center; color:#666; margin-top:20px;">Lade Verbindungen...</p>
            </div>
            
            <div style="text-align:center; margin-top:20px; border-top:1px solid #333; padding-top:10px;">
                <button onclick="TrainModule.resetSetup()" style="font-size:0.8rem; color:#555; background:none; border:none; text-decoration:underline; cursor:pointer;">Haltestellen neu suchen</button>
            </div>
        `;

        // Style für aktiven Button setzen
        this.updateButtons();

        // Prüfen ob wir startklar sind
        if (!this.stops.origin || !this.stops.dhbw || !this.stops.hka) {
            await this.performAutoSetup();
        } else {
            this.loadJourneys();
        }
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

    async performAutoSetup() {
        const list = document.getElementById('train-list');
        list.innerHTML = "<p style='text-align:center; color:#888;'>Richte Haltestellen ein...</p>";

        try {
            // Wir suchen gezielt nach den Karlsruher Haltestellen mit den korrekten Namen
            const [s1, s2, s3] = await Promise.all([
                this.findStation("Karlsruhe Werderstraße"),
                this.findStation("Karlsruhe Duale Hochschule"), // DHBW
                this.findStation("Karlsruhe Kunstakademie / Hochschule") // HKA
            ]);

            if (s1 && s2 && s3) {
                this.stops = { origin: s1.id, dhbw: s2.id, hka: s3.id };
                localStorage.setItem('wg_station_origin_id', s1.id);
                localStorage.setItem('wg_station_dhbw_id', s2.id);
                localStorage.setItem('wg_station_hka_id', s3.id);
                this.loadJourneys();
            } else {
                list.innerHTML = "<p style='color:var(--danger); text-align:center;'>Konnte Haltestellen nicht automatisch finden.<br><button onclick='TrainModule.performAutoSetup()' class='primary' style='margin-top:10px; width:auto;'>Nochmal versuchen</button></p>";
            }
        } catch (e) {
            list.innerHTML = "<p style='color:var(--danger); text-align:center;'>Verbindungsfehler bei der Einrichtung.</p>";
        }
    },

    async findStation(query) {
        try {
            const url = `https://v6.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=1`;
            const res = await fetch(url);
            const data = await res.json();
            // Wir nehmen das erste Ergebnis, falls vorhanden
            return data[0] ? { id: data[0].id, name: data[0].name } : null;
        } catch(e) { return null; }
    },

    async loadJourneys() {
        const list = document.getElementById('train-list');
        if(!list) return;
        
        list.innerHTML = "<p style='text-align:center; color:#888;'>Suche nächste Bahn...</p>";

        const destID = this.currentDest === 'dhbw' ? this.stops.dhbw : this.stops.hka;
        
        if(!this.stops.origin || !destID) {
            list.innerHTML = "<p style='text-align:center; color:#888;'>Haltestellen fehlen. Bitte Reset drücken.</p>";
            return;
        }
        
        try {
            // Wir suchen Verbindungen ab JETZT
            const url = `https://v6.db.transport.rest/journeys?from=${this.stops.origin}&to=${destID}&results=4`;
            const response = await fetch(url);
            const data = await response.json();

            list.innerHTML = "";
            
            if (!data.journeys || data.journeys.length === 0) {
                list.innerHTML = "<p style='text-align:center;'>Keine Verbindung gefunden.</p>";
                return;
            }

            data.journeys.forEach(trip => {
                // Wir betrachten nur den ersten Abschnitt (Leg), da es meist Direktverbindungen in KA sind
                const leg = trip.legs[0]; 
                if(!leg) return;

                const depTime = new Date(leg.departure);
                const arrTime = new Date(leg.arrival);
                const now = new Date();
                
                // Minuten bis Abfahrt
                const minutesToDep = Math.floor((depTime - now) / 60000);
                
                // Abgefahrene Bahnen ignorieren (Toleranz -1 Min)
                if (minutesToDep < -1) return; 

                const timeStr = depTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const arrStr = arrTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const lineName = leg.line && leg.line.name ? leg.line.name : 'Bahn';
                const direction = leg.direction || 'Richtung ?';
                
                // Farb-Logik
                let badgeColor = '#333';
                let badgeText = 'white';
                
                if (minutesToDep <= 0) { badgeColor = '#555'; } // Jetzt/Weg
                else if (minutesToDep <= 3) { badgeColor = 'var(--danger)'; } // Lauf!
                else if (minutesToDep <= 7) { badgeColor = 'var(--warn)'; badgeText='black'; } // Bald
                else { badgeColor = 'var(--secondary)'; badgeText='black'; } // Zeit

                list.innerHTML += `
                    <div class="list-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px;">
                        <div style="display:flex; align-items:center; gap:15px; overflow:hidden;">
                            <div style="background:#333; color:white; min-width:45px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1rem;">
                                ${lineName}
                            </div>
                            <div style="display:flex; flex-direction:column; overflow:hidden;">
                                <span style="font-weight:bold; font-size:1.1rem; white-space:nowrap;">${timeStr}</span>
                                <small style="color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    an ${arrStr} • ${direction}
                                </small>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <span style="background:${badgeColor}; color:${badgeText}; padding:6px 12px; border-radius:15px; font-weight:bold; font-size:0.9rem; display:inline-block; min-width:50px; text-align:center;">
                                ${minutesToDep <= 0 ? 'Run' : minutesToDep + '\''}
                            </span>
                        </div>
                    </div>
                `;
            });
            
            // Wenn nach Filterung leer
            if(list.innerHTML === "") {
                list.innerHTML = "<p style='text-align:center;'>Keine Abfahrten in den nächsten Minuten.</p>";
            }

        } catch (e) {
            console.error(e);
            list.innerHTML = "<p style='color:var(--danger); text-align:center;'>Verbindung zur Bahn-API fehlgeschlagen.</p>";
        }
    },
    
    resetSetup() {
        if(confirm("Haltestellen neu suchen?")) {
            localStorage.removeItem('wg_station_origin_id');
            localStorage.removeItem('wg_station_dhbw_id');
            localStorage.removeItem('wg_station_hka_id');
            this.stops = { origin: null, dhbw: null, hka: null };
            // Neu initialisieren
            this.init(document.getElementById('train-list').parentElement.parentElement.id);
        }
    }
};
