const ShoppingModule = {
    items: [],
    clickTimer: {},

    async init(cId) {
        const container = document.getElementById(cId);
        container.innerHTML = `
            <div class="add-box" style="background:var(--card-bg); padding:15px; border-radius:10px; margin-bottom:20px; display:flex; gap:10px;">
                <input type="text" id="shop-input" placeholder="Was fehlt?" style="margin:0;">
                <button id="btn-add-shop" class="primary" style="width:auto; margin:0;">+</button>
            </div>
            <div id="shopping-list">Lade...</div>
        `;
        
        // EVENT LISTENER
        document.getElementById('btn-add-shop').addEventListener('click', () => this.addItem());

        const listDiv = document.getElementById('shopping-list');
        listDiv.addEventListener('click', (e) => {
            // A. Edit Text
            const textTarget = e.target.closest('.shop-clickable-text');
            if (textTarget) {
                const id = textTarget.dataset.id;
                this.openEdit(id);
                return;
            }
            // B. Check Button
            const checkBtn = e.target.closest('.check-btn');
            if (checkBtn) {
                const id = checkBtn.id.replace('shop-btn-', '');
                this.handleCheck(id);
            }
        });

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
                    <div class="shop-clickable-text" data-id="${item.id}" style="display:flex; flex-direction:column; flex:1; cursor:pointer;">
                        <span style="font-weight:500;">${item.item}</span>
                    </div>
                    <div style="display:flex; gap:5px; align-items:center;">
                        <button id="shop-btn-${item.id}" class="check-btn">✔</button>
                    </div>
                </div>`;
        });
    },

    // --- DYNAMISCHES EDIT MODAL ---
    openEdit(id) {
        // ID Typ-Sicherer Vergleich
        const item = this.items.find(i => i.id == id);
        if(!item) return;

        // Wir nutzen das gleiche JS-generierte Modal wie bei Tasks, falls vorhanden, sonst bauen wir es
        let modal = document.getElementById('js-edit-modal');
        if (!modal) {
            // Falls TasksModule das Modal noch nicht gebaut hat -> hier bauen wir es
            modal = document.createElement('div');
            modal.id = 'js-edit-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <button class="close-modal-x">&times;</button>
                    <h3>Bearbeiten</h3>
                    <div style="margin-bottom:15px;">
                        <label style="display:block; font-size:0.8rem; color:#888; margin-bottom:5px;">Titel</label>
                        <input type="text" id="js-edit-title" style="width:100%;">
                    </div>
                    <div id="js-edit-points-wrap" style="margin-bottom:15px;">
                        <label style="display:block; font-size:0.8rem; color:#888; margin-bottom:5px;">Punkte</label>
                        <input type="number" id="js-edit-points" style="width:100%;">
                    </div>
                    <button id="js-edit-save" class="primary">Speichern</button>
                </div>`;
            document.body.appendChild(modal);
            modal.querySelector('.close-modal-x').onclick = () => modal.style.display = 'none';
        }

        document.getElementById('js-edit-title').value = item.item;
        document.getElementById('js-edit-points-wrap').style.display = 'none'; // Keine Punkte

        const saveBtn = document.getElementById('js-edit-save');
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.addEventListener('click', () => this.saveEdit(id));

        modal.style.display = 'flex';
    },

    async saveEdit(id) {
        const newTitle = document.getElementById('js-edit-title').value;
        if(!newTitle) return;

        document.getElementById('js-edit-modal').style.display = 'none';

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
        if(row) { 
            row.style.transition = "all 0.5s ease"; 
            row.style.opacity = "0"; 
            row.style.transform = "translateX(50px)"; 
            setTimeout(() => row.remove(), 500); 
        }
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

window.ShoppingModule = ShoppingModule;
