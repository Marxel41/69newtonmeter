const SodaModule = {
    count: 0,
    startDate: null,

    async init(cId) {
        const container = document.getElementById(cId);
        container.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:var(--text-muted);">Aktuelle Flasche</h3>
                <div class="soda-counter" id="soda-val">?</div>
                <div class="soda-controls">
                    <button class="soda-btn btn-dec" onclick="SodaModule.update('dec')">-</button>
                    <button class="soda-btn btn-inc" onclick="SodaModule.update('inc')">+</button>
                </div>
                <div style="margin-top:40px;">
                    <button class="primary" style="background:#333; color:var(--text-muted);" onclick="SodaModule.finish()">Zylinder leer & Reset</button>
                </div>
                <p id="soda-info" style="margin-top:15px; font-size:0.8rem; color:var(--text-muted);">Lade...</p>
                
                <h4 style="margin-top:30px; border-top:1px solid #333; padding-top:20px;">Historie</h4>
                <div id="soda-history" style="text-align:left; font-size:0.9rem;"></div>
            </div>
        `;
        await this.loadState();
    },

    async loadState() {
        // Lade Status UND Historie (wir nutzen 'read' für Log)
        const p1 = API.post('read', { sheet: 'SodaState', _t: Date.now() });
        const p2 = API.post('read', { sheet: 'SodaLog', _t: Date.now() }).catch(() => ({status:'error'})); // Fehler abfangen falls Tab fehlt
        
        const [r1, r2] = await Promise.all([p1, p2]);

        if(r1.status === 'success') {
            const countRow = r1.data.find(r => r.key === 'count');
            const dateRow = r1.data.find(r => r.key === 'start_date');
            
            this.count = parseInt(countRow ? countRow.value : 0);
            this.startDate = dateRow ? dateRow.value : null;
            this.updateUI();
        }
        
        // Historie rendern
        const hDiv = document.getElementById('soda-history');
        if(r2.status === 'success' && r2.data.length > 0) {
            hDiv.innerHTML = "";
            // Neueste zuerst
            r2.data.reverse().forEach(row => {
                // row keys: date, days, liters, cost (lowercase im Backend Mapping prüfen)
                // Backend gibt array von objects zurück
                const d = new Date(row.date);
                const dStr = !isNaN(d) ? d.toLocaleDateString() : 'Datum?';
                hDiv.innerHTML += `
                    <div style="padding:8px 0; border-bottom:1px solid #333; display:flex; justify-content:space-between;">
                        <span>${dStr} (${row.days} Tage)</span>
                        <span>${row.liters}L / ${row.cost || '?'}€</span>
                    </div>`;
            });
        } else {
            hDiv.innerHTML = "<p style='color:#666; text-align:center;'>Noch keine Einträge.</p>";
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

    async update(mode) {
        if(mode === 'inc') this.count++;
        if(mode === 'dec' && this.count > 0) this.count--;
        this.updateUI();
        await API.post('soda_update', { mode: mode });
    },

    async finish() {
        if(!confirm("Wirklich resetten?")) return;
        const result = await API.post('soda_update', { mode: 'reset' });
        if(result.status === 'success') {
            this.count = 0;
            this.startDate = new Date().toISOString();
            this.updateUI();
            await this.loadState(); // Historie neu laden
        } else {
            alert("Reset Fehler: " + result.message);
        }
    }
};
