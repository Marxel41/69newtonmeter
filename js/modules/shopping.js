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
                        <button class="icon-btn-small" onclick="ShoppingModule.openEdit('${item.id}')">✏️</button>
                        <button id="shop-btn-${item.id}" class="check-btn" onclick="ShoppingModule.handleCheck('${item.id}')">✔</button>
                    </div>
                </div>`;
        });
    },

    // --- EDIT LOGIK ---
    openEdit(id) {
        const item = this.items.find(i => i.id === id);
        if(!item) return;

        document.getElementById('edit-modal').style.display = 'flex';
        document.getElementById('edit-title').value = item.item;
        document.getElementById('edit-points-wrapper').style.display = 'none'; // Keine Punkte bei Einkauf
        
        const saveBtn = document.getElementById('edit-save-btn');
        saveBtn.onclick = () => this.saveEdit(id);
    },

    async saveEdit(id) {
        const newTitle = document.getElementById('edit-title').value;
        if(!newTitle) return;

        document.getElementById('edit-modal').style.display = 'none';

        // Optimistic UI
        const row = document.getElementById(`shop-row-${id}`);
        if(row) {
            const titleEl = row.querySelector('span');
            if(titleEl) titleEl.innerText = newTitle;
        }

        await API.post('update', { 
            sheet: 'Shopping', 
            id: id, 
            updates: JSON.stringify({ item: newTitle }) 
        });
        
        await this.load();
    },

    handleCheck(id) {
        const btn = document.getElementById(`shop-btn-${id}`);
        if(!btn) return;

        if (btn.classList.contains('confirm-wait')) {
            this.finishItemOptimistic(id);
        } else {
            btn.classList.add('confirm-wait');
            btn.innerHTML = "✖";
            this.clickTimer[id] = setTimeout(() => {
                btn.classList.remove('confirm-wait');
                btn.innerHTML = "✔";
                delete ShoppingModule.clickTimer[id];
            }, 3000);
        }
    },

    async finishItemOptimistic(id) {
        const row = document.getElementById(`shop-row-${id}`);
        if(row) { row.style.transition = "all 0.5s ease"; row.style.opacity = "0"; row.style.transform = "translateX(50px)"; setTimeout(() => row.remove(), 500); }
        if(this.clickTimer[id]) clearTimeout(this.clickTimer[id]);
        await API.post('update', { sheet: 'Shopping', id: id, updates: JSON.stringify({ status: 'done' }) });
    },

    async addItem() {
        const input = document.getElementById('shop-input');
        const text = input.value;
        if(!text) return;
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
