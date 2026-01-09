const SodaModule = {
    count: 0,
    startDate: null,

    async init(cId) {
        const container = document.getElementById(cId);
        container.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:var(--text-muted);">Aktuelle Flasche</h3>
                
                <!-- Loading Platzhalter -->
                <div id="soda-loading" style="margin:40px 0; color:#666;">Verbinde...</div>

                <!-- Inhalt (zuerst unsichtbar) -->
                <div id="soda-content" style="display:none;">
                    <div class="soda-counter" id="soda-val">?</div>
                    <div class="soda-controls">
                        <button id="btn-dec" class="soda-btn btn-dec" onclick="SodaModule.update('dec')">-</button>
                        <button id="btn-inc" class="soda-btn btn-inc" onclick="SodaModule.update('inc')">+</button>
                    </div>
                    <p id="soda-info" style="margin-top:15px; font-size:0.8rem; color:var(--text-muted);"></p>
                    
                    <div style="margin-top:40px;">
                        <button id="btn-reset" class="primary" style="background:#333; color:var(--text-muted);" onclick="SodaModule.finish()">Zylinder leer & Reset</button>
                    </div>
                </div>
                
                <h4 style="margin-top:30px; border-top:1px solid #333; padding-top:20px; text-align:left;">Historie</h4>
                <div id="soda-history" style="text-align:left; font-size:0.9rem;">Lade Historie...</div>
            </div>
        `;
        await this.loadState();
    },

    async loadState() {
        const timestamp = new Date().getTime();
        try {
            const p1 = API.post('read', { sheet: 'SodaState', _t: timestamp });
            const p2 = API.post('read', { sheet: 'SodaLog', _t: timestamp }).catch(e => ({status:'err'}));
            
            const [r1, r2] = await Promise.all([p1, p2]);

            // Status Update
            if(r1.status === 'success') {
                const countRow = r1.data.find(r => r.key === 'count');
                const dateRow = r1.data.find(r => r.key === 'start_date');
                
                this.count = parseInt(countRow ? countRow.value : 0);
                this.startDate = dateRow ? dateRow.value : null;
                
                // UI Freischalten
                document.getElementById('soda-loading').style.display = 'none';
                document.getElementById('soda-content').style.display = 'block';
                this.updateUI();
            } else {
                document.getElementById('soda-loading').innerText = "Fehler: Tabelle SodaState nicht gefunden.";
            }

            // Historie
            const hDiv = document.getElementById('soda-history');
            if(r2.status === 'success' && r2.data.length > 0) {
                hDiv.innerHTML = "";
                r2.data.reverse().forEach(row => {
                    // Datum cleanen
                    let dStr = '-';
                    try { dStr = new Date(row.date).toLocaleDateString(); } catch(e){}
                    
                    hDiv.innerHTML += `
                        <div style="padding:8px 0; border-bottom:1px solid #333; display:flex; justify-content:space-between;">
                            <span>${dStr} <small style="color:#888">(${row.days} Tage)</small></span>
                            <span>${row.liters || '?'}L / ${row.cost || '?'}</span>
                        </div>`;
                });
            } else {
                hDiv.innerHTML = "<p style='color:#666; text-align:center;'>Noch keine Einträge.</p>";
            }

        } catch(e) {
            document.getElementById('soda-loading').innerText = "Verbindungsfehler.";
        }
    },

    updateUI() {
        document.getElementById('soda-val').innerText = this.count;
        if (this.startDate) {
            const d = new Date(this.startDate);
            const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString() : '-';
            document.getElementById('soda-info').innerText = `Gestartet am: ${dateStr}`;
        }
    },

    setLoading(isLoading) {
        document.getElementById('btn-inc').disabled = isLoading;
        document.getElementById('btn-dec').disabled = isLoading;
        document.getElementById('btn-reset').disabled = isLoading;
        if(isLoading) document.getElementById('soda-val').style.opacity = 0.5;
        else document.getElementById('soda-val').style.opacity = 1;
    },

    async update(mode) {
        // Optimistic UI, aber Buttons sperren
        this.setLoading(true);
        
        if(mode === 'inc') this.count++;
        if(mode === 'dec' && this.count > 0) this.count--;
        this.updateUI();

        await API.post('soda_update', { mode: mode });
        this.setLoading(false);
    },

    async finish() {
        if(!confirm("Wirklich resetten?")) return;
        
        this.setLoading(true);
        const result = await API.post('soda_update', { mode: 'reset' });
        
        if(result.status === 'success') {
            this.count = 0;
            this.startDate = new Date().toISOString();
            await this.loadState(); // Alles neu laden für History
        } else {
            alert("Reset fehlgeschlagen: " + result.message);
            this.setLoading(false);
        }
    }
};
