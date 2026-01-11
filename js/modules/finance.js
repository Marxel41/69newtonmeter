const FinanceModule = {
    transactions: [],
    users: [], 
    balances: {}, 
    
    // ==========================================
    // 🔧 HARDCODED FIXKOSTEN (HIER ÄNDERN!)
    // ==========================================
    fixedCosts: {
        rent: 1200,       // Miete (Gesamt)
        utilities: 300,  // Nebenkosten
        internet: 19,   // Internet
        power: 82       // Strom
    },
    // ==========================================

    currentView: 'split', // 'split' oder 'stats'
    cId: null,

    async init(cId) {
        this.cId = cId;
        const container = document.getElementById(cId);
        if(!container) return;
        
        // Check: Gibt es lokale Änderungen?
        const savedFixed = localStorage.getItem('wg_finance_fixed');
        if(savedFixed) {
            try { this.fixedCosts = JSON.parse(savedFixed); } catch(e){}
        }

        this.renderShell();
        await this.load();

        // --- EVENT DELEGATION FÜR DEN VERLAUF ---
        // Wir fangen Klicks auf dem Haupt-Container ab
        container.addEventListener('click', (e) => {
            const item = e.target.closest('.finance-item-clickable');
            if (item) {
                const id = item.dataset.id;
                this.openEdit(id);
            }
        });
    },

    renderShell() {
        const container = document.getElementById(this.cId);
        if(!container) return;
        
        container.innerHTML = `
            <div style="display:flex; justify-content:center; gap:10px; margin-bottom:20px;">
                <button onclick="window.FinanceModule.switchView('split')" id="btn-view-split" style="flex:1; padding:8px; border-radius:8px; border:1px solid #444; background:${this.currentView === 'split' ? 'var(--primary)' : 'transparent'}; color:${this.currentView === 'split' ? 'black' : 'var(--text-muted)'}; cursor:pointer;">Abrechnung</button>
                <button onclick="window.FinanceModule.switchView('stats')" id="btn-view-stats" style="flex:1; padding:8px; border-radius:8px; border:1px solid #444; background:${this.currentView === 'stats' ? 'var(--primary)' : 'transparent'}; color:${this.currentView === 'stats' ? 'black' : 'var(--text-muted)'}; cursor:pointer;">Monatsübersicht</button>
            </div>
            <div id="finance-content"></div>
        `;
    },

    switchView(view) {
        this.currentView = view;
        this.renderShell(); 
        if (view === 'split') this.renderSplitView();
        else this.renderStatsView();
    },

    async load() {
        const result = await API.post('read', { sheet: 'Finance', _t: Date.now() });
        
        if (result.status === 'success') {
            this.transactions = result.data;
            this.users = result.users || []; 
            if(this.users.length === 0) this.users = [App.user.name]; 

            this.calculateDebts();
            
            if (this.currentView === 'split') this.renderSplitView();
            else this.renderStatsView();
        } else {
            const el = document.getElementById('finance-content');
            if(el) el.innerHTML = "Fehler beim Laden.";
        }
    },

    // --- VIEW 1: SPLITWISE ---
    renderSplitView() {
        const container = document.getElementById('finance-content');
        if(!container) return;

        container.innerHTML = `
            <div class="add-box" style="background:var(--card-bg); padding:20px; border-radius:12px; margin-bottom:20px; text-align:center;">
                <h3 style="margin-top:0; color:var(--text-muted);">Dein Stand</h3>
                <div id="my-balance-display" style="font-size:2.5rem; font-weight:bold; margin:10px 0;">-- €</div>
                <div id="debt-summary" style="font-size:0.9rem; color:#888; margin-bottom:15px;"></div>
                
                <div style="display:flex; gap:10px;">
                    <button class="primary" onclick="window.FinanceModule.showAddExpense()" style="background:var(--danger); color:white;">💸 Ausgabe</button>
                    <button class="primary" onclick="window.FinanceModule.showSettleUp()" style="background:var(--secondary); color:black;">🤝 Begleichen</button>
                </div>
            </div>

            <h3 style="color:var(--text-muted); font-size:0.9rem; margin-bottom:10px;">Verlauf (Klicken zum Bearbeiten)</h3>
            <div id="finance-list"></div>
        `;
        
        this.renderOverview();
        this.renderHistory();
    },

    // --- VIEW 2: MONATSÜBERSICHT ---
    renderStatsView() {
        const container = document.getElementById('finance-content');
        if(!container) return;
        
        container.innerHTML = `
            <div style="text-align:right; margin-bottom:10px;">
                <button onclick="window.FinanceModule.showFixedCostSettings()" style="background:transparent; border:1px solid #555; color:var(--text-muted); font-size:0.8rem; padding:5px 10px; border-radius:15px; cursor:pointer;">⚙️ Werte anpassen</button>
            </div>
            <div id="stats-list"></div>
        `;

        const monthlyData = {}; 

        this.transactions.forEach(t => {
            if (t.type === 'expense') {
                const date = new Date(t.date);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!monthlyData[key]) monthlyData[key] = 0;
                monthlyData[key] += parseFloat(t.amount);
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort().reverse();
        const listDiv = document.getElementById('stats-list');

        if (sortedMonths.length === 0) {
            listDiv.innerHTML = "<p style='text-align:center; color:#666;'>Noch keine Ausgaben vorhanden.</p>";
            return;
        }

        sortedMonths.forEach(monthKey => {
            const variableCosts = monthlyData[monthKey];
            const fixedSum = this.fixedCosts.rent + this.fixedCosts.utilities + this.fixedCosts.internet + this.fixedCosts.power;
            const total = variableCosts + fixedSum;
            
            const [y, m] = monthKey.split('-');
            const monthName = new Date(y, m - 1).toLocaleString('de-DE', { month: 'long', year: 'numeric' });

            listDiv.innerHTML += `
                <div class="list-item" style="display:block; cursor:pointer;" onclick="window.FinanceModule.toggleMonthDetails('${monthKey}')">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>${monthName}</strong>
                        <span style="font-weight:bold;">${total.toFixed(2)} €</span>
                    </div>
                    <div id="details-${monthKey}" style="display:none; margin-top:15px; border-top:1px solid #333; padding-top:15px;">
                        ${this.generatePieChartHTML(variableCosts)}
                    </div>
                </div>
            `;
        });
    },

    toggleMonthDetails(id) {
        const el = document.getElementById(`details-${id}`);
        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    },

    generatePieChartHTML(variableCosts) {
        const data = [
            { label: 'Miete', value: this.fixedCosts.rent, color: '#FF6384' },
            { label: 'Nebenk', value: this.fixedCosts.utilities, color: '#36A2EB' },
            { label: 'Netz', value: this.fixedCosts.internet, color: '#FFCE56' },
            { label: 'Strom', value: this.fixedCosts.power, color: '#4BC0C0' },
            { label: 'Sonstiges', value: variableCosts, color: '#9966FF' }
        ];

        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) return "Keine Daten";

        let currentDeg = 0;
        const gradientParts = data.map(item => {
            const deg = (item.value / total) * 360;
            const part = `${item.color} ${currentDeg}deg ${currentDeg + deg}deg`;
            currentDeg += deg;
            return part;
        });

        const legendHtml = data.map(item => `
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span style="display:flex; align-items:center;">
                    <span style="width:8px; height:8px; background:${item.color}; display:inline-block; margin-right:5px; border-radius:2px;"></span>
                    ${item.label}
                </span>
                <span>${item.value.toFixed(0)} €</span>
            </div>
        `).join('');

        return `
            <div style="display:flex; align-items:center; gap:15px; flex-wrap:wrap; justify-content:center;">
                <div style="width: 140px; height: 140px; border-radius: 50%; background: conic-gradient(${gradientParts.join(', ')}); margin: 0 auto;"></div>
                <div style="flex:1; min-width:130px;">${legendHtml}</div>
            </div>
        `;
    },

    showFixedCostSettings() {
        const modal = document.getElementById('finance-modal');
        if(!modal) return;
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal-x" onclick="document.getElementById('finance-modal').style.display='none'">&times;</button>
                <h3>Fixkosten (Lokal)</h3>
                <label style="font-size:0.8rem;">Miete</label>
                <input type="number" id="fc-rent" value="${this.fixedCosts.rent}">
                <label style="font-size:0.8rem;">Nebenkosten</label>
                <input type="number" id="fc-util" value="${this.fixedCosts.utilities}">
                <label style="font-size:0.8rem;">Internet</label>
                <input type="number" id="fc-net" value="${this.fixedCosts.internet}">
                <label style="font-size:0.8rem;">Strom</label>
                <input type="number" id="fc-pow" value="${this.fixedCosts.power}">
                <button class="primary" onclick="window.FinanceModule.saveFixedCosts()">Speichern</button>
            </div>`;
        modal.style.display = 'flex';
    },

    saveFixedCosts() {
        this.fixedCosts = {
            rent: parseFloat(document.getElementById('fc-rent').value) || 0,
            utilities: parseFloat(document.getElementById('fc-util').value) || 0,
            internet: parseFloat(document.getElementById('fc-net').value) || 0,
            power: parseFloat(document.getElementById('fc-pow').value) || 0
        };
        localStorage.setItem('wg_finance_fixed', JSON.stringify(this.fixedCosts));
        document.getElementById('finance-modal').style.display = 'none';
        this.renderStatsView(); 
    },

    calculateDebts() {
        let bal = {};
        this.users.forEach(u => bal[u] = 0);

        this.transactions.forEach(t => {
            const amount = parseFloat(t.amount);
            const payer = t.payer;

            if (t.type === 'expense') {
                const splitAmount = amount / this.users.length;
                if (!bal[payer]) bal[payer] = 0;
                bal[payer] += amount;
                this.users.forEach(u => {
                    if (!bal[u]) bal[u] = 0;
                    bal[u] -= splitAmount;
                });
            } 
            else if (t.type === 'payment') {
                const recipient = t.recipient;
                if (!bal[payer]) bal[payer] = 0;
                bal[payer] += amount;
                if (!bal[recipient]) bal[recipient] = 0;
                bal[recipient] -= amount;
            }
        });

        this.balances = bal;
        if (this.currentView === 'split') this.renderOverview();
    },

    renderOverview() {
        const myName = App.user.name;
        const myBal = this.balances[myName] || 0;
        const displayEl = document.getElementById('my-balance-display');
        const summaryEl = document.getElementById('debt-summary');

        if(displayEl) {
            const color = myBal >= 0 ? 'var(--secondary)' : 'var(--danger)';
            const prefix = myBal >= 0 ? '+' : '';
            displayEl.style.color = color;
            displayEl.innerText = `${prefix}${myBal.toFixed(2)} €`;
        }

        if(summaryEl) {
            let summaryHtml = "";
            const sortedUsers = Object.keys(this.balances).sort((a,b) => this.balances[b] - this.balances[a]);

            sortedUsers.forEach(u => {
                if (u === myName) return; 
                const val = this.balances[u];
                if (Math.abs(val) < 0.01) return; 

                const uColor = val >= 0 ? 'var(--secondary)' : 'var(--danger)';
                summaryHtml += `<div style="display:flex; justify-content:space-between; margin-top:5px;">
                    <span>${u}</span>
                    <span style="color:${uColor}">${val.toFixed(2)} €</span>
                </div>`;
            });
            summaryEl.innerHTML = summaryHtml || "Alle sind quitt! 🎉";
        }
    },

    renderHistory() {
        const list = document.getElementById('finance-list');
        if(!list) return;
        list.innerHTML = "";
        const history = [...this.transactions].reverse();

        history.forEach(t => {
            const isExpense = t.type === 'expense';
            const icon = isExpense ? '💸' : '🤝';
            const amountClass = isExpense ? 'color:var(--text-main)' : 'color:var(--secondary)';
            let dateStr = "";
            try { dateStr = new Date(t.date).toLocaleDateString(); } catch(e){}

            let details = isExpense ? `bezahlt von <strong>${t.payer}</strong>` : `<strong>${t.payer}</strong> ➔ <strong>${t.recipient}</strong>`;

            // FIX: Klasse 'finance-item-clickable' und 'data-id' für Event Delegation
            list.innerHTML += `
                <div class="list-item finance-item-clickable" data-id="${t.id}" style="cursor:pointer;">
                    <div style="display:flex; align-items:center; gap:10px; pointer-events:none;">
                        <span style="font-size:1.5rem;">${icon}</span>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-weight:bold;">${t.description}</span>
                            <small style="color:var(--text-muted);">${details} • ${dateStr}</small>
                        </div>
                    </div>
                    <div style="font-weight:bold; ${amountClass}; pointer-events:none;">
                        ${parseFloat(t.amount).toFixed(2)} €
                    </div>
                </div>
            `;
        });
    },

    // --- BEARBEITEN LOGIK ---
    openEdit(id) {
        // ID Typ-tolerant vergleichen
        const t = this.transactions.find(trans => trans.id == id);
        if(!t) return;

        let modal = document.getElementById('js-edit-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'js-edit-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <button class="close-modal-x">&times;</button>
                    <h3>Bearbeiten</h3>
                    <div style="margin-bottom:15px;">
                        <label id="lbl-edit-title" style="display:block; font-size:0.8rem; color:#888; margin-bottom:5px;">Titel</label>
                        <input type="text" id="js-edit-title" style="width:100%;">
                    </div>
                    <div id="js-edit-points-wrap" style="margin-bottom:15px;">
                        <label id="lbl-edit-points" style="display:block; font-size:0.8rem; color:#888; margin-bottom:5px;">Betrag (€)</label>
                        <input type="number" id="js-edit-points" style="width:100%;" step="0.01">
                    </div>
                    <button id="js-edit-save" class="primary">Speichern</button>
                </div>`;
            document.body.appendChild(modal);
            modal.querySelector('.close-modal-x').onclick = () => modal.style.display = 'none';
        }

        // Labels für Finanzen anpassen
        document.getElementById('lbl-edit-title').innerText = "Beschreibung";
        document.getElementById('js-edit-title').value = t.description;
        document.getElementById('js-edit-points').value = t.amount;

        const saveBtn = document.getElementById('js-edit-save');
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        
        newBtn.addEventListener('click', () => this.saveEdit(id));

        modal.style.display = 'flex';
    },

    async saveEdit(id) {
        const newDesc = document.getElementById('js-edit-title').value;
        const newAmount = document.getElementById('js-edit-points').value;

        if(!newDesc || !newAmount) return;

        document.getElementById('js-edit-modal').style.display = 'none';

        // Optimistic UI Update
        const t = this.transactions.find(trans => trans.id == id);
        if(t) {
            t.description = newDesc;
            t.amount = newAmount;
            this.calculateDebts();
            if (this.currentView === 'split') this.renderHistory();
        }

        await API.post('update', { 
            sheet: 'Finance', 
            id: id, 
            updates: JSON.stringify({ description: newDesc, amount: newAmount }) 
        });
        
        await this.load();
    },

    showAddExpense() {
        const modal = document.getElementById('finance-modal');
        if(!modal) return;
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal-x" onclick="document.getElementById('finance-modal').style.display='none'">&times;</button>
                <h3>Ausgabe hinzufügen</h3>
                <input type="number" id="fin-amount" placeholder="Betrag (z.B. 12.50)" step="0.01">
                <input type="text" id="fin-desc" placeholder="Wofür? (z.B. Pizza)">
                <button class="primary" onclick="window.FinanceModule.saveTransaction('expense')">Speichern</button>
            </div>`;
        modal.style.display = 'flex';
    },

    async showSettleUp() {
        const modal = document.getElementById('finance-modal');
        if(!modal) return;
        modal.innerHTML = `<div class="modal-content" style="text-align:center;"><h3>Lade...</h3><div style="margin:20px;">⏳</div></div>`;
        modal.style.display = 'flex';

        await this.load();

        const myName = App.user.name;
        const myBalance = this.balances[myName] || 0;
        let contentHtml = "";

        if (myBalance >= -0.01) {
            contentHtml = `
                <button class="close-modal-x" onclick="document.getElementById('finance-modal').style.display='none'">&times;</button>
                <h3>Alles gut!</h3>
                <p style="text-align:center; margin:20px 0; color:var(--secondary);">Du bist schuldenfrei.<br>🎉</p>
                <button class="primary" onclick="document.getElementById('finance-modal').style.display='none'">Schließen</button>
            `;
        } else {
            let creditors = [];
            for (const [user, amount] of Object.entries(this.balances)) {
                if (amount > 0.01 && user !== myName) creditors.push({ user, amount });
            }
            creditors.sort((a, b) => b.amount - a.amount);

            if (creditors.length === 0) {
                contentHtml = `<p>Fehler: Ungleichgewicht im System.</p>`;
            } else {
                const target = creditors[0];
                const payAmount = Math.min(Math.abs(myBalance), target.amount).toFixed(2);

                contentHtml = `
                    <button class="close-modal-x" onclick="document.getElementById('finance-modal').style.display='none'">&times;</button>
                    <h3>Schulden begleichen</h3>
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; text-align:center; margin-bottom:20px;">
                        <p style="margin:0; color:#888; font-size:0.9rem;">Überweise an</p>
                        <h2 style="margin:5px 0; color:var(--text-main);">${target.user}</h2>
                        <div style="font-size:2.5rem; font-weight:bold; color:var(--secondary); margin:10px 0;">${payAmount} €</div>
                    </div>
                    <input type="hidden" id="fin-recipient" value="${target.user}">
                    <input type="hidden" id="fin-amount" value="${payAmount}">
                    <input type="hidden" id="fin-desc" value="Rückzahlung">
                    <button class="primary" style="background:var(--secondary); color:black; font-weight:bold;" onclick="window.FinanceModule.saveTransaction('payment')">Betrag ausgeglichen</button>
                `;
            }
        }
        modal.innerHTML = `<div class="modal-content">${contentHtml}</div>`;
    },

    async saveTransaction(type) {
        const amount = document.getElementById('fin-amount').value;
        const desc = document.getElementById('fin-desc').value;
        const recipient = type === 'payment' ? document.getElementById('fin-recipient').value : '';

        if (!amount || !desc) { alert("Bitte Betrag eingeben"); return; }

        document.getElementById('finance-modal').style.display = 'none';
        
        const payload = {
            date: new Date().toISOString(),
            type: type,
            payer: App.user.name,
            amount: amount,
            description: desc,
            recipient: recipient
        };

        this.transactions.push(payload);
        this.calculateDebts();
        if (this.currentView === 'split') this.renderHistory();
        else this.renderStatsView();

        await API.post('create', { sheet: 'Finance', payload: JSON.stringify(payload) });
        await this.load();
    }
};

window.FinanceModule = FinanceModule;
