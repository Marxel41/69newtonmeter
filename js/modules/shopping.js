const ShoppingModule = {
    items: [],

    async init() {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="module-header">
                <h2>🛒 Einkaufsliste</h2>
                <div class="add-box">
                    <input type="text" id="shop-input" placeholder="Was fehlt?">
                    <button class="primary" onclick="ShoppingModule.addItem()">+</button>
                </div>
            </div>
            <div id="shopping-list" class="list-container">Lade...</div>
        `;
        await this.load();
    },

    async load() {
        const result = await API.post('read', { sheet: 'Shopping' });
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
            list.innerHTML = "<p class='empty-msg' style='text-align:center;'>Alles da!</p>";
            return;
        }

        this.items.forEach(item => {
            list.innerHTML += `
                <div class="list-item">
                    <span>${item.item} <small>(${item.added_by})</small></span>
                    <button class="check-btn" onclick="ShoppingModule.finishItem('${item.id}')">✔</button>
                </div>`;
        });
    },

    async addItem() {
        const input = document.getElementById('shop-input');
        const text = input.value;
        if(!text) return;
        input.value = "Speichert...";

        await API.post('create', { sheet: 'Shopping', payload: JSON.stringify({item: text, status: 'open', added_by: App.user.name}) });
        input.value = "";
        await this.load();
    },

    async finishItem(id) {
        await API.post('update', { sheet: 'Shopping', id: id, updates: JSON.stringify({ status: 'done' }) });
        await this.load();
    }
};
