const SodaModule = {
    count: 0,
    startDate: null,

    async init(cId) {
        const container = document.getElementById(cId);
        container.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:var(--text-muted);">Aktuelle Flasche</h3>
                <div class="soda-counter" id="soda-val">0</div>
                <div class="soda-controls">
                    <button class="soda-btn btn-dec" onclick="SodaModule.update('dec')">-</button>
                    <button class="soda-btn btn-inc" onclick="SodaModule.update('inc')">+</button>
                </div>
                
                <div style="margin-top:40px;">
                    <button class="primary" style="background:#333; color:var(--text-muted);" onclick="SodaModule.finish()">Zylinder leer & Reset</button>
                </div>
                <p id="soda-info" style="margin-top:15px; font-size:0.8rem; color:var(--text-muted);">Startdatum: Lade...</p>
            </div>
        `;
        await this.loadState();
    },

    async loadState() {
        const result = await API.post('read', { sheet: 'SodaState', _t: new Date().getTime() });
        if(result.status === 'success') {
            // Wir nehmen an Zeile 1=Header, 2=Count, 3=Date
            const countRow = result.data.find(r => r.key === 'count');
            const dateRow = result.data.find(r => r.key === 'start_date');
            
            this.count = parseInt(countRow ? countRow.value : 0);
            this.startDate = dateRow ? dateRow.value : 'Unbekannt';
            
            this.updateUI();
        }
    },

    updateUI() {
        document.getElementById('soda-val').innerText = this.count;
        const d = new Date(this.startDate);
        const dateStr = !isNaN(d.getTime()) ? `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}` : '-';
        document.getElementById('soda-info').innerText = `Gestartet am: ${dateStr}`;
    },

    async update(mode) {
        // Optimistic UI
        if(mode === 'inc') this.count++;
        if(mode === 'dec' && this.count > 0) this.count--;
        this.updateUI();

        // Backend Update
        await API.post('soda_update', { mode: mode });
    },

    async finish() {
        if(!confirm("Ist der Zylinder wirklich leer? Dies speichert die Statistik und setzt den Zähler auf 0.")) return;
        
        const result = await API.post('soda_update', { mode: 'reset' });
        if(result.status === 'success') {
            this.count = 0;
            this.startDate = new Date().toISOString(); // Ca. jetzt
            this.updateUI();
            alert("Reset erfolgreich! Statistik gespeichert.");
        }
    }
};
