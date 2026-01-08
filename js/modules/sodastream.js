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
        try {
            const result = await API.post('read', { sheet: 'SodaState', _t: new Date().getTime() });
            if(result.status === 'success') {
                const countRow = result.data.find(r => r.key === 'count');
                const dateRow = result.data.find(r => r.key === 'start_date');
                
                this.count = parseInt(countRow ? countRow.value : 0);
                this.startDate = dateRow ? dateRow.value : null;
                
                this.updateUI();
            }
        } catch (e) {
            console.error("Ladefehler Soda:", e);
        }
    },

    updateUI() {
        const elVal = document.getElementById('soda-val');
        const elInfo = document.getElementById('soda-info');
        if(elVal) elVal.innerText = this.count;
        
        if(elInfo) {
            if (this.startDate) {
                const d = new Date(this.startDate);
                const dateStr = !isNaN(d.getTime()) ? `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}` : '-';
                elInfo.innerText = `Gestartet am: ${dateStr}`;
            } else {
                elInfo.innerText = "Startdatum unbekannt";
            }
        }
    },

    async update(mode) {
        if(mode === 'inc') this.count++;
        if(mode === 'dec' && this.count > 0) this.count--;
        this.updateUI();

        // Im Hintergrund speichern
        await API.post('soda_update', { mode: mode });
    },

    async finish() {
        if(!confirm("Ist der Zylinder wirklich leer?\nDies speichert die Statistik und setzt den Zähler auf 0.")) return;
        
        const btn = document.querySelector('.soda-counter + .soda-controls + div button');
        if(btn) {
            btn.innerText = "Speichere...";
            btn.disabled = true;
        }

        try {
            const result = await API.post('soda_update', { mode: 'reset' });
            
            if(result.status === 'success') {
                this.count = 0;
                this.startDate = new Date().toISOString();
                this.updateUI();
                alert("Reset erfolgreich! Neuer Zylinder gestartet.");
            } else {
                alert("Fehler beim Speichern: " + (result.message || "Unbekannt"));
            }
        } catch (e) {
            alert("Verbindungsfehler: " + e.message);
        } finally {
            if(btn) {
                btn.innerText = "Zylinder leer & Reset";
                btn.disabled = false;
            }
        }
    }
};
