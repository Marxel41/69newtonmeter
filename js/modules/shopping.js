const ShoppingModule = {
    items: [],
    clickTimer: {},

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
        const result = await API.post('read', { sheet: 'Shopping', _t: Date.now() });
        if (result.status === 'success') {
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
            list.innerHTML += `
                <div class="list-item" id="shop-row-${item.id}">
                    <div style="display:flex; flex-direction:column; flex:1;">
                        <span style="font-weight:500;">${item.item}</span>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button class="icon-btn-small" onclick="window.ShoppingModule.openEdit('${item.id}')">✏️</button>
                        <button id="shop-btn-${item.id}" class="check-btn" onclick="window.ShoppingModule.handleCheck('${item.id}')">✔</button>
                    </div>
                </div>`;
        });
    },

    openEdit(id) {
        const item = this.items.find(i => i.id === id);
        if(!item) return;

        const modal = document.getElementById('edit-modal');
        modal.style.display = 'flex';
        document.getElementById('edit-title').value = item.item;
        const pWrap = document.getElementById('edit-points-wrapper');
        if(pWrap) pWrap.style.display = 'none'; // Keine Punkte
        
        const saveBtn = document.getElementById('edit-save-btn');
        saveBtn.onclick = () => this.saveEdit(id);
    },

    async saveEdit(id) {
        const newTitle = document.getElementById('edit-title').value;
        if(!newTitle) return;

        document.getElementById('edit-modal').style.display = 'none';

        // Optimistic
        const row = document.getElementById(`shop-row-${id}`);
        if(row) row.querySelector('span').innerText = newTitle;

        await API.post('update', { 
            sheet: 'Shopping', 
            id: id, 
            updates: JSON.stringify({ item: newTitle }) 
        });
        
        await this.load();
    },

    // ... (Restliche Funktionen: handleCheck, finishItemOptimistic, addItem wie gehabt) ...
    handleCheck(id) { /* ... */ },
    async finishItemOptimistic(id) { /* ... */ },
    async addItem() { /* ... */ }
};

// GLOBAL MACHEN!
window.ShoppingModule = ShoppingModule;
