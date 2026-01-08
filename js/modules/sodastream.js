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
            </div>
        `;
        await this.loadState();
    },

    async loadState() {
        const result = await API.post('read', { sheet: 'SodaState', _t: Date.now() });
        if(result.status === 'success') {
            const countRow = result.data.find(r => r.key === 'count');
            const dateRow = result.data.find(r => r.key === 'start_date');
            
            this.count = parseInt(countRow ? countRow.value : 0);
            this.startDate = dateRow ? dateRow.value : null;
            this.updateUI();
        } else {
            document.getElementById('soda-info').innerText = "Fehler: Tabelle SodaState existiert nicht?";
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
        // Optimistic
        if(mode === 'inc') this.count++;
        if(mode === 'dec' && this.count > 0) this.count--;
        this.updateUI();

        const result = await API.post('soda_update', { mode: mode });
        // Falls Fehler (z.B. Backend kennt 'soda_update' nicht)
        if(result.status === 'error' && result.message.includes('Unbekannte Action')) {
            alert("FEHLER: Dein Google Backend Code ist noch ALT. Bitte 'Neue Version' deployen!");
        }
    },

    async finish() {
        if(!confirm("Wirklich resetten?")) return;
        
        const result = await API.post('soda_update', { mode: 'reset' });
        
        if(result.status === 'success') {
            this.count = 0;
            this.startDate = new Date().toISOString();
            this.updateUI();
        } else {
            alert("Reset Fehler: " + result.message);
        }
    }
};
