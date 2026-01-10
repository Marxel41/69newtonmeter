const TrainModule = {
    // Wir speichern die IDs, damit wir nicht jedes Mal suchen müssen
    stops: {
        origin: localStorage.getItem('wg_station_origin_id'),
        dhbw: localStorage.getItem('wg_station_dhbw_id'),
        hka: localStorage.getItem('wg_station_hka_id')
    },
    // Standard-Ziel: DHBW
    currentDest: 'dhbw', 

    async init(cId) {
        const container = document.getElementById(cId);
        if(!container) return;

        // Grundgerüst rendern
        container.innerHTML = `
            <div style="text-align:center; margin-bottom:15px;">
                <div style="background:var(--card-bg); border-radius:12px; padding:5px; display:inline-flex; gap:5px;">
                    <button id="btn-dhbw" onclick="TrainModule.switchDest('dhbw')" style="background:var(--secondary); color:black; border:none; padding:8px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">DHBW</button>
                    <button id="btn-hka" onclick="TrainModule.switchDest('hka')" style="background:transparent; color:var(--text-muted); border:none; padding:8px 15px; border-radius:8px; cursor:pointer;">HKA</button>
                </div>
                <div style="margin-top:10px; font-size:0.9rem; color:var(--text-muted);">
                    Start: <strong>Werderstraße</strong>
                </div>
            </div>
            <div id="train-list" style="min-height:100px;">Lade Verbindungen...</div>
            <div style="text-align:center; margin-top:15px;">
                <button onclick="TrainModule.resetSetup()" style="font-size:0.8rem; color:#666; background:none; border:none; text-decoration:underline; cursor:pointer;">Stationen neu suchen</button>
            </div>
        `;

        await this.checkSetup();
    },

    async checkSetup() {
        const list = document.getElementById('train-list');
        
        // Wenn IDs fehlen, suchen wir sie einmalig
        if (!this.stops.origin || !this.stops.dhbw || !this.stops.hka) {
            list.innerHTML = "<p style='text-align:center; color:#888;'>Einrichtung: Suche Stationen...</p>";
            try {
                // Parallel suchen
                const [s1, s2, s3] = await Promise.all([
                    this.findStation("Karlsruhe Werderstraße"),
                    this.findStation("Karlsruhe Erzbergerstraße"), // DHBW Haltestelle
                    this.findStation("Karlsruhe Europaplatz")      // HKA Haltestelle (oder Moltkestr)
                ]);

                if (s1 && s2 && s3) {
                    this.stops = { origin: s1.id, dhbw: s2.id, hka: s3.id };
                    localStorage.setItem('wg_station_origin_id', s1.id);
                    localStorage.setItem('wg_station_dhbw_id', s2.id);
                    localStorage.setItem('wg_station_hka_id', s3.id);
                    // Namen loggen zur Kontrolle
                    console.log("Setup fertig:", s1.name, s2.name, s3.name);
                } else {
                    list.innerHTML = "<p style='color:var(--danger); text-align:center;'>Konnte Haltestellen nicht finden. Prüfe Internet.</p>";
                    return;
                }
            } catch (e) {
                list.innerHTML = "<p style='color:var(--danger); text-align:center;'>API Fehler bei Einrichtung.</p>";
                return;
            }
        }
        
        // Wenn Setup ok, Verbindungen laden
        this.loadJourneys();
    },

    async findStation(query) {
        const url = `https://v6.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=1`;
        const res = await fetch(url);
        const data = await res.json();
        return data[0] ? { id: data[0].id, name: data[0].name } : null;
    },

    switchDest(target) {
        this.currentDest = target;
        
        // Buttons stylen
        const btnDHBW = document.getElementById('btn-dhbw');
        const btnHKA = document.getElementById('btn-hka');
        
        if (target === 'dhbw') {
            btnDHBW.style.background = 'var(--secondary)';
            btnDHBW.style.color = 'black';
            btnDHBW.style.fontWeight = 'bold';
            btnHKA.style.background = 'transparent';
            btnHKA.style.color = 'var(--text-muted)';
            btnHKA.style.fontWeight = 'normal';
        } else {
            btnHKA.style.background = 'var(--secondary)';
            btnHKA.style.color = 'black';
            btnHKA.style.fontWeight = 'bold';
            btnDHBW.style.background = 'transparent';
            btnDHBW.style.color = 'var(--text-muted)';
            btnDHBW.style.fontWeight = 'normal';
        }
        
        this.loadJourneys();
    },

    async loadJourneys() {
        const list = document.getElementById('train-list');
        list.innerHTML = "<p style='text-align:center; color:#888;'>Suche Verbindungen...</p>";

        const destID = this.currentDest === 'dhbw' ? this.stops.dhbw : this.stops.hka;
        
        try {
            // Journeys API: Von A nach B
            const url = `https://v6.db.transport.rest/journeys?from=${this.stops.origin}&to=${destID}&results=4`;
            const response = await fetch(url);
            const data = await response.json();

            list.innerHTML = "";
            
            if (!data.journeys || data.journeys.length === 0) {
                list.innerHTML = "<p style='text-align:center;'>Keine Verbindung gefunden.</p>";
                return;
            }

            data.journeys.forEach(trip => {
                const leg = trip.legs[0]; // Erste Teilstrecke meist ausreichend
                const depTime = new Date(leg.departure);
                const arrTime = new Date(leg.arrival);
                
                // Dauer berechnen
                const duration = Math.round((arrTime - depTime) / 60000);
                
                // Zeit bis Abfahrt
                const now = new Date();
                const minutesToDep = Math.floor((depTime - now) / 60000);
                
                if (minutesToDep < 0) return; // Schon weg

                const timeStr = depTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const lineName = leg.line ? leg.line.name : '?';
                
                // Ampel Farben
                let badgeColor = '#333';
                if (minutesToDep <= 2) badgeColor = 'var(--danger)'; // Lauf!
                else if (minutesToDep <= 5) badgeColor = 'var(--warn)'; // Beeil dich
                else badgeColor = 'var(--secondary)'; // Entspannt

                list.innerHTML += `
                    <div class="list-item" style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="background:#333; color:white; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                                ${lineName}
                            </div>
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-weight:bold; font-size:1.1rem;">${timeStr}</span>
                                <small style="color:var(--text-muted);">Ankunft ${arrTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} (${duration} min)</small>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <span style="background:${badgeColor}; color:black; padding:5px 10px; border-radius:15px; font-weight:bold; font-size:0.9rem;">
                                ${minutesToDep === 0 ? 'Jetzt' : minutesToDep + ' min'}
                            </span>
                        </div>
                    </div>
                `;
            });

        } catch (e) {
            console.error(e);
            list.innerHTML = "<p style='color:var(--danger); text-align:center;'>Verbindungsfehler zur Bahn-API.</p>";
        }
    },

    resetStation() {
        localStorage.removeItem('wg_station_origin_id');
        this.stops = { origin: null, dhbw: null, hka: null };
        this.init(document.getElementById('train-list').parentElement.parentElement.id);
    },
    
    resetSetup() {
        if(confirm("Alle gespeicherten Haltestellen löschen und neu suchen?")) {
            localStorage.removeItem('wg_station_origin_id');
            localStorage.removeItem('wg_station_dhbw_id');
            localStorage.removeItem('wg_station_hka_id');
            this.stops = { origin: null, dhbw: null, hka: null };
            this.init('train-cont');
        }
    }
};
