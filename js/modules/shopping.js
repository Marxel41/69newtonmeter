const ShoppingModule = {
    items: [],

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
    // ... REST BLEIBT GLEICH WIE VORHER ...
    // Nur sicherstellen, dass load() und render() die gleichen IDs nutzen
    async load() {
        const result = await API.post('read', { sheet: 'Shopping', _t: new Date().getTime() });
        if (result.status === 'success') {
            this.items = result.data.filter(i => i.status === 'open');
            this.render();
        }
    },
    render() {
        const list = document.getElementById('shopping-list');
        list.innerHTML = "";
        if (this.items.length === 0) { list.innerHTML = "<p style='text-align:center;'>Leer.</p>"; return; }
        this.items.forEach(item => {
            list.innerHTML += `
                <div class="list-item">
                    <span>${item.item} <small style='color:var(--text-muted)'>(${item.added_by})</small></span>
                    <button class="check-btn" onclick="ShoppingModule.finishItem('${item.id}')">✔</button>
                </div>`;
        });
    },
    async addItem() {
        const val = document.getElementById('shop-input').value;
        if(!val) return;
        await API.post('create', { sheet: 'Shopping', payload: JSON.stringify({item: val, status: 'open', added_by: App.user.name}) });
        document.getElementById('shop-input').value = "";
        await this.load();
    },
    async finishItem(id) {
        await API.post('update', { sheet: 'Shopping', id: id, updates: JSON.stringify({ status: 'done' }) });
        await this.load();
    }
};
