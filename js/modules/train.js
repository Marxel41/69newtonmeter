const TrainModule = {
    stops: {
        origin: localStorage.getItem('wg_station_origin_id'),
        dhbw: localStorage.getItem('wg_station_dhbw_id'),
        hka: localStorage.getItem('wg_station_hka_id')
    },
    currentDest: 'dhbw', 

    async init(cId) {
        const container = document.getElementById(cId);
        if(!container) return;

        container.innerHTML = `
            <div style="text-align:center; margin-bottom:15px;">
                <div style="background:var(--card-bg); border-radius:12px; padding:5px; display:inline-flex; gap:5px;">
                    <button id="btn-dhbw" onclick="TrainModule.switchDest('dhbw')" style="background:var(--secondary); color:black; border:none; padding:8px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">DHBW</button>
                    <button id="btn-hka" onclick="TrainModule.switchDest('hka')" style="background:transparent; color:var(--text-muted); border:none; padding:8px 15px; border-radius:8px; cursor:pointer;">HKA</button>
                </div>
                <div style="margin-top:10px; font-size:0.9rem; color:var(--text-muted);">
                    Start: <strong id="start-name">Werderstraße</strong>
                </div>
            </div>
            <div id="train-list" style="min-height:100px;">Lade Verbindungen...</div>
            <div style="text-align:center; margin-top:20px;">
                <button onclick="TrainModule.resetSetup()" style="font-size:0.8rem; color:#666; background:none; border:none; text-decoration:underline; cursor:pointer;">Reset Stationen</button>
            </div>
        `;

        await this.checkSetup();
    },

    async checkSetup() {
        const list = document.getElementById('train-list');
        
        // Wenn keine IDs da sind, suchen wir sie einmalig automatisch
        if (!this.stops.origin || !this.stops.dhbw) {
            list.innerHTML = "<p style='text-align:center; color:#888;'>Einrichtung: Suche Haltestellen...</p>";
            try {
                // Wir suchen die spezifischen Haltestellen für Karlsruhe
                const s1 = await this.findStation("Karlsruhe Werderstraße");
                const s2 = await this.findStation("Karlsruhe Erzbergerstraße"); // DHBW
                const s3 = await this.findStation("Karlsruhe Europaplatz"); // HKA

                if (s1 && s2) {
                    this.stops = { origin: s1.id, dhbw: s2.id, hka: s3 ? s3.id : null };
                    localStorage.setItem('wg_station_origin_id', s1.id);
                    localStorage.setItem('wg_station_dhbw_id', s2.id);
                    if(s3) localStorage.setItem('wg_station_hka_id', s3.id);
                    
                    this.loadJourneys();
                } else {
                    list.innerHTML = "<p style='color:var(--danger); text-align:center;'>Fehler: Konnte Haltestellen nicht finden.</p>";
                }
            } catch (e) {
                list.innerHTML = "<p style='color:var(--danger); text-align:center;'>Verbindungsfehler bei Einrichtung.</p>";
            }
        } else {
            this.loadJourneys();
        }
    },

    async findStation(query) {
        try {
            const url = `https://v6.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=1`;
            const res = await fetch(url);
            const data = await res.json();
            return data[0] ? { id: data[0].id, name: data[0].name } : null;
        } catch(e) { return null; }
    },

    switchDest(target) {
        this.currentDest = target;
        
        // UI Update
        document.getElementById('btn-dhbw').style.background = target==='dhbw' ? 'var(--secondary)' : 'transparent';
        document.getElementById('btn-dhbw').style.color = target==='dhbw' ? 'black' : 'var(--text-muted)';
        
        document.getElementById('btn-hka').style.background = target==='hka' ? 'var(--secondary)' : 'transparent';
        document.getElementById('btn-hka').style.color = target==='hka' ? 'black' : 'var(--text-muted)';
        
        this.loadJourneys();
    },

    async loadJourneys() {
        const list = document.getElementById('train-list');
        const destID = this.currentDest === 'dhbw' ? this.stops.dhbw : this.stops.hka;
        
        if(!destID) {
            list.innerHTML = "<p style='text-align:center;'>Ziel nicht gefunden. Bitte Reset drücken.</p>";
            return;
        }

        list.innerHTML = "<p style='text-align:center; color:#888;'>Suche...</p>";
        
        try {
            const url = `https://v6.db.transport.rest/journeys?from=${this.stops.origin}&to=${destID}&results=4`;
            const response = await fetch(url);
            const data = await response.json();

            list.innerHTML = "";
            
            if (!data.journeys || data.journeys.length === 0) {
                list.innerHTML = "<p style='text-align:center;'>Keine Verbindung gefunden.</p>";
                return;
            }

            data.journeys.forEach(trip => {
                const leg = trip.legs[0]; 
                const depTime = new Date(leg.departure);
                const arrTime = new Date(leg.arrival);
                
                const now = new Date();
                const minutesToDep = Math.floor((depTime - now) / 60000);
                
                if (minutesToDep < -1) return; 

                const timeStr = depTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const lineName = leg.line ? leg.line.name : '?';
                
                let badgeColor = '#333';
                let textColor = 'white';
                
                if (minutesToDep <= 2) { badgeColor = 'var(--danger)'; textColor='white'; }
                else if (minutesToDep <= 6) { badgeColor = 'var(--warn)'; textColor='black'; }
                else { badgeColor = 'var(--secondary)'; textColor='black'; }

                list.innerHTML += `
                    <div class="list-item" style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="background:#333; color:white; width:45px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:0.9rem;">
                                ${lineName}
                            </div>
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-weight:bold; font-size:1.1rem;">${timeStr}</span>
                                <small style="color:var(--text-muted);">Ankunft ${arrTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</small>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <span style="background:${badgeColor}; color:${textColor}; padding:5px 10px; border-radius:15px; font-weight:bold; font-size:0.9rem;">
                                ${minutesToDep <= 0 ? 'Jetzt' : minutesToDep + ' min'}
                            </span>
                        </div>
                    </div>
                `;
            });

        } catch (e) {
            list.innerHTML = "<p style='color:var(--danger); text-align:center;'>Verbindungsfehler zur Bahn.</p>";
        }
    },
    
    resetSetup() {
        if(confirm("Reset?")) {
            localStorage.removeItem('wg_station_origin_id');
            localStorage.removeItem('wg_station_dhbw_id');
            localStorage.removeItem('wg_station_hka_id');
            this.stops = { origin: null, dhbw: null, hka: null };
            this.init('module-content');
        }
    }
};
