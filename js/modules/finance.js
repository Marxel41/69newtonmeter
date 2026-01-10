const FinanceModule = {
    transactions: [],
    users: [], 
    balances: {}, 

    async init(cId) {
        const container = document.getElementById(cId);
        
        container.innerHTML = `
            <div class="add-box" style="background:var(--card-bg); padding:20px; border-radius:12px; margin-bottom:20px; text-align:center;">
                <h3 style="margin-top:0; color:var(--text-muted);">Dein Stand</h3>
                <div id="my-balance-display" style="font-size:2.5rem; font-weight:bold; margin:10px 0;">-- €</div>
                <div id="debt-summary" style="font-size:0.9rem; color:#888; margin-bottom:15px;"></div>
                
                <div style="display:flex; gap:10px;">
                    <button class="primary" onclick="FinanceModule.showAddExpense()" style="background:var(--danger); color:white;">💸 Ausgabe</button>
                    <button class="primary" onclick="FinanceModule.showSettleUp()" style="background:var(--secondary); color:black;">🤝 Begleichen</button>
                </div>
            </div>

            <h3 style="color:var(--text-muted); font-size:0.9rem; margin-bottom:10px;">Verlauf</h3>
            <div id="finance-list">Lade Finanzen...</div>
        `;

        await this.load();
    },

    async load() {
        const result = await API.post('read', { sheet: 'Finance', _t: Date.now() });
        
        if (result.status === 'success') {
            this.transactions = result.data;
            this.users = result.users || []; 
            if(this.users.length === 0) this.users = [App.user.name]; 

            this.calculateDebts();
            this.renderHistory();
        } else {
            document.getElementById('finance-list').innerHTML = "Fehler beim Laden.";
        }
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
        this.renderOverview();
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

            let details = "";
            if (isExpense) {
                details = `bezahlt von <strong>${t.payer}</strong>`;
            } else {
                details = `<strong>${t.payer}</strong> ➔ <strong>${t.recipient}</strong>`;
            }

            list.innerHTML += `
                <div class="list-item">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.5rem;">${icon}</span>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-weight:bold;">${t.description}</span>
                            <small style="color:var(--text-muted);">${details} • ${dateStr}</small>
                        </div>
                    </div>
                    <div style="font-weight:bold; ${amountClass};">
                        ${parseFloat(t.amount).toFixed(2)} €
                    </div>
                </div>
            `;
        });
    },

    showAddExpense() {
        const modal = document.getElementById('finance-modal');
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal-x" onclick="document.getElementById('finance-modal').style.display='none'">&times;</button>
                <h3>Ausgabe hinzufügen</h3>
                <input type="number" id="fin-amount" placeholder="Betrag (z.B. 12.50)" step="0.01">
                <input type="text" id="fin-desc" placeholder="Wofür? (z.B. Pizza)">
                <button class="primary" onclick="FinanceModule.saveTransaction('expense')">Speichern</button>
            </div>`;
        modal.style.display = 'flex';
    },

    // --- NEUE INTELLIGENTE BEGLEICHEN-FUNKTION ---
    async showSettleUp() {
        const modal = document.getElementById('finance-modal');
        
        // 1. Lade-Status anzeigen
        modal.innerHTML = `
            <div class="modal-content" style="text-align:center;">
                <h3>Lade aktuelle Schulden...</h3>
                <div style="margin:20px;">⏳</div>
            </div>`;
        modal.style.display = 'flex';

        // 2. Daten frisch vom Server holen (Sicherheit!)
        await this.load();

        const myName = App.user.name;
        const myBalance = this.balances[myName] || 0;

        let contentHtml = "";

        if (myBalance >= -0.01) {
            // Keine Schulden
            contentHtml = `
                <button class="close-modal-x" onclick="document.getElementById('finance-modal').style.display='none'">&times;</button>
                <h3>Alles gut!</h3>
                <p style="text-align:center; margin:20px 0; color:var(--secondary);">
                    Du bist aktuell schuldenfrei (oder im Plus).<br>
                    Keine Zahlung nötig. 🎉
                </p>
                <button class="primary" onclick="document.getElementById('finance-modal').style.display='none'">Schließen</button>
            `;
        } else {
            // Schulden vorhanden -> Algorithmus: Wem schulde ich was?
            // Wir zahlen einfach demjenigen, der am meisten Plus hat.
            
            // Creditors finden (Leute mit Plus)
            let creditors = [];
            for (const [user, amount] of Object.entries(this.balances)) {
                if (amount > 0.01 && user !== myName) {
                    creditors.push({ user, amount });
                }
            }
            // Sortieren: Höchstes Plus zuerst
            creditors.sort((a, b) => b.amount - a.amount);

            if (creditors.length === 0) {
                contentHtml = `<p>Fehler: Niemand hat Plus? System ungleichgewicht.</p>`;
            } else {
                const target = creditors[0];
                // Ich zahle maximal meine Schulden oder maximal das was er kriegt
                const payAmount = Math.min(Math.abs(myBalance), target.amount).toFixed(2);

                contentHtml = `
                    <button class="close-modal-x" onclick="document.getElementById('finance-modal').style.display='none'">&times;</button>
                    <h3>Schulden begleichen</h3>
                    
                    <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; text-align:center; margin-bottom:20px;">
                        <p style="margin:0; color:#888; font-size:0.9rem;">Vorschlag: Überweise an</p>
                        <h2 style="margin:5px 0; color:var(--text-main);">${target.user}</h2>
                        <div style="font-size:2.5rem; font-weight:bold; color:var(--secondary); margin:10px 0;">
                            ${payAmount} €
                        </div>
                        <p style="margin:0; font-size:0.8rem; color:#666;">Damit sind die Konten ausgeglichener.</p>
                    </div>

                    <!-- Versteckte Felder für die Logik -->
                    <input type="hidden" id="fin-recipient" value="${target.user}">
                    <input type="hidden" id="fin-amount" value="${payAmount}">
                    <input type="hidden" id="fin-desc" value="Rückzahlung">
                    
                    <button class="primary" style="background:var(--secondary); color:black; font-weight:bold;" onclick="FinanceModule.saveTransaction('payment')">
                        Betrag ausgeglichen (Bezahlt)
                    </button>
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

        // Optimistic UI Update
        this.transactions.push(payload);
        this.calculateDebts();
        this.renderHistory();

        // Backend Call
        await API.post('create', { sheet: 'Finance', payload: JSON.stringify(payload) });
        
        // Final Reload zur Sicherheit
        await this.load();
    }
};
