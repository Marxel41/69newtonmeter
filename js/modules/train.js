const TrainModule = {
    stationId: localStorage.getItem('wg_train_station_id') || null,
    stationName: localStorage.getItem('wg_train_station_name') || null,

    async init(cId) {
        const container = document.getElementById(cId);
        if(!container) return;

        // Header Bereich (Suche oder Anzeige der gewählten Station)
        let headerContent = '';
        
        if (this.stationName) {
            headerContent = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0; color:var(--secondary);">${this.stationName}</h3>
                    <button onclick="TrainModule.resetStation()" style="background:transparent; border:1px solid #555; color:#aaa; padding:5px 10px; border-radius:15px; cursor:pointer; font-size:0.8rem;">Ändern</button>
                </div>
                <div id="train-list">Lade Abfahrten...</div>
            `;
        } else {
            headerContent = `
                <div class="add-box" style="background:var(--card-bg); padding:15px; border-radius:10px; margin-bottom:20px;">
                    <h3 style="margin-top:0; color:var(--text-muted); margin-bottom:10px;">Haltestelle einrichten</h3>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="train-search" placeholder="z.B. Werderstraße" style="margin:0;">
                        <button class="primary" onclick="TrainModule.search()" style="width:auto; margin:0;">🔍</button>
                    </div>
                </div>
                <div id="train-list"></div>
            `;
        }

        container.innerHTML = headerContent;
        
        // Wenn Station vorhanden, direkt laden
        if (this.stationId) {
            await this.loadDepartures();
        }
    },

    async search() {
        const query = document.getElementById('train-search').value;
        if(!query) return;
        
        const list = document.getElementById('train-list');
        list.innerHTML = "<p style='color:#888; text-align:center;'>Suche...</p>";
        
        try {
            // Freie API Suche
            const response = await fetch(`https://v6.db.transport.rest/locations?query=${encodeURIComponent(query)}&results=5`);
            const data = await response.json();
            
            list.innerHTML = "";
            if(data.length === 0) {
                list.innerHTML = "<p style='text-align:center;'>Keine Station gefunden.</p>";
                return;
            }
            
            data.forEach(stop => {
                if(stop.type === 'stop' || stop.type === 'station') {
                    list.innerHTML += `
                        <div class="list-item" onclick="TrainModule.selectStation('${stop.id}', '${stop.name}')" style="cursor:pointer;">
                            <strong>🚊 ${stop.name}</strong>
                        </div>
                    `;
                }
            });
        } catch(e) {
            list.innerHTML = "<p style='color:var(--danger); text-align:center;'>Fehler bei der Suche.</p>";
        }
    },

    selectStation(id, name) {
        this.stationId = id;
        this.stationName = name;
        localStorage.setItem('wg_train_station_id', id);
        localStorage.setItem('wg_train_station_name', name);
        // UI neu laden
        this.init(document.getElementById('train-list').parentElement.id); 
    },

    resetStation() {
        if(!confirm("Haltestelle ändern?")) return;
        this.stationId = null;
        this.stationName = null;
        localStorage.removeItem('wg_train_station_id');
        localStorage.removeItem('wg_train_station_name');
        // UI neu laden
        this.init(document.getElementById('train-list').parentElement.id);
    },

    async loadDepartures() {
        const list = document.getElementById('train-list');
        
        try {
            // Abfahrten für die nächsten 60 Minuten
            const response = await fetch(`https://v6.db.transport.rest/stops/${this.stationId}/departures?results=15&duration=60`);
            const data = await response.json();
            
            list.innerHTML = `<div style="text-align:right; margin-bottom:10px;"><button onclick="TrainModule.loadDepartures()" style="background:transparent; border:none; color:var(--primary); cursor:pointer; font-size:0.9rem;">↻ Aktualisieren</button></div>`;
            
            if(!data.departures || data.departures.length === 0) {
                list.innerHTML += "<p style='text-align:center; color:#888;'>Keine Abfahrten in nächster Zeit.</p>";
                return;
            }

            data.departures.forEach(dep => {
                const time = new Date(dep.when || dep.plannedWhen);
                const now = new Date();
                const diffMins = Math.floor((time - now) / 60000);
                
                // Nur anzeigen wenn in der Zukunft oder gerade eben weg
                if(diffMins < -2) return;

                let timeString = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                // Farben für Dringlichkeit
                let badgeColor = 'var(--secondary)'; // Grün/Türkis
                let textColor = 'black';
                
                if(diffMins <= 0) { badgeColor = '#555'; textColor='white'; } // Jetzt
                else if(diffMins <= 3) { badgeColor = 'var(--danger)'; textColor='white'; } // Rot (Renn!)
                else if(diffMins <= 8) { badgeColor = 'var(--warn)'; textColor='black'; } // Gelb (Beeil dich)

                const lineName = dep.line && dep.line.name ? dep.line.name : '?';
                const typeIcon = dep.line && dep.line.productName === 'Tram' ? '🚋' : '🚌';
                
                // Verspätungs-Check
                let delayInfo = "";
                if(dep.delay && dep.delay > 60) {
                    const delayMin = Math.floor(dep.delay / 60);
                    delayInfo = `<span style="color:var(--danger); font-size:0.8rem; margin-left:5px;">+${delayMin}'</span>`;
                }

                list.innerHTML += `
                    <div class="list-item" style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                            <span style="background:#333; color:white; padding:4px 8px; border-radius:6px; font-weight:bold; font-size:0.9rem; min-width:35px; text-align:center;">
                                ${lineName}
                            </span>
                            <div style="display:flex; flex-direction:column; overflow:hidden;">
                                <span style="font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${dep.direction}</span>
                                <small style="color:var(--text-muted);">${timeString} ${delayInfo}</small>
                            </div>
                        </div>
                        <div style="text-align:right; min-width:60px;">
                            <span style="background:${badgeColor}; color:${textColor}; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:0.85rem;">
                                ${diffMins <= 0 ? 'Jetzt' : diffMins + ' min'}
                            </span>
                        </div>
                    </div>
                `;
            });
        } catch(e) {
            list.innerHTML = "<p style='color:var(--danger); text-align:center;'>Fehler beim Laden der Abfahrten.</p>";
        }
    }
};
