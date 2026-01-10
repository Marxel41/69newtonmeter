const ShoppingModule = {
    items: [],
    clickTimer: {}, // Timer für Doppelklicks

    async init(cId) {
        const container = document.getElementById(cId);
        container.innerHTML = `
            <div class="add-box" style="background:var(--card-bg); padding:15px; border-radius:10px; margin-bottom:20px; display:flex; gap:10px;">
                <input type="text" id="shop-input" placeholder="Was fehlt?" style="margin:0;">
                <button class="primary" onclick="ShoppingModule.addItem()" style="width:auto; margin:0;">+</button>
            </div>
            <div id="shopping-list">Lade...</div>
        `;
        await this.load();
    },

    async load() {
        // Cache-Buster gegen alte Daten
        const result = await API.post('read', { sheet: 'Shopping', _t: Date.now() });
        if (result.status === 'success') {
            // Nur offene Items
            this.items = result.data.filter(i => i.status === 'open');
            this.render();
        } else {
            document.getElementById('shopping-list').innerHTML = "Fehler: " + result.message;
        }
    },

    render() {
        const list = document.getElementById('shopping-list');
        list.innerHTML = "";
        
        if (this.items.length === 0) {
            list.innerHTML = "<p class='empty-msg' style='text-align:center; color:var(--text-muted);'>Alles da! Kühlschrank ist voll.</p>";
            return;
        }

        this.items.forEach(item => {
            // Wir brauchen IDs für die Animation (shop-row-...)
            list.innerHTML += `
                <div class="list-item" id="shop-row-${item.id}">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:500;">${item.item}</span>
                        <small style='color:var(--text-muted)'>Hinzugefügt von ${item.added_by}</small>
                    </div>
                    <!-- Gleiche Button-Logik wie bei Tasks -->
                    <button id="shop-btn-${item.id}" class="check-btn" onclick="ShoppingModule.handleCheck('${item.id}')">✔</button>
                </div>`;
        });
    },

    // --- NEUE LOGIK (Kopie aus Tasks) ---
    handleCheck(id) {
        const btn = document.getElementById(`shop-btn-${id}`);
        if(!btn) return;

        // Status prüfen
        if (btn.classList.contains('confirm-wait')) {
            // ZWEITER KLICK -> SOFORT WEG
            this.finishItemOptimistic(id);
        } else {
            // ERSTER KLICK -> WARNUNG (Gelb)
            btn.classList.add('confirm-wait');
            btn.innerHTML = "✖"; // Kreuz zum Bestätigen/Abbrechen
            
            // Timer für Reset (3 Sekunden)
            this.clickTimer[id] = setTimeout(() => {
                btn.classList.remove('confirm-wait');
                btn.innerHTML = "✔";
                delete ShoppingModule.clickTimer[id];
            }, 3000);
        }
    },

    async finishItemOptimistic(id) {
        // UI SOFORT aktualisieren (nicht warten)
        const row = document.getElementById(`shop-row-${id}`);
        if(row) {
            row.style.transition = "all 0.5s ease";
            row.style.opacity = "0";
            row.style.transform = "translateX(50px)";
            setTimeout(() => row.remove(), 500); // DOM entfernen
        }

        // Timer löschen
        if(this.clickTimer[id]) clearTimeout(this.clickTimer[id]);

        // API Call im Hintergrund
        await API.post('update', { 
            sheet: 'Shopping', 
            id: id, 
            updates: JSON.stringify({ status: 'done' }) 
        });
        
        // Kein Reload nötig, User sieht Feedback sofort
    },

    async addItem() {
        const input = document.getElementById('shop-input');
        const text = input.value;
        if(!text) return;

        // Feedback beim Adden (hier kein Optimistic UI da ID fehlt)
        const btn = document.querySelector('.add-box button');
        btn.innerText = "⏳";
        btn.disabled = true;

        await API.post('create', { sheet: 'Shopping', payload: JSON.stringify({item: text, status: 'open', added_by: App.user.name}) });
        
        input.value = "";
        btn.innerText = "+";
        btn.disabled = false;
        
        await this.load();
    }
};
