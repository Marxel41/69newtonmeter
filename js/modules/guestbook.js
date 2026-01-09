const GuestbookModule = {
    async init(containerId, isPublic = true) {
        const container = document.getElementById(containerId);
        
        let htmlContent = '<div>'; // Kein Wrapper mehr
        
        // Formular nur anzeigen, wenn öffentlicher Modus (Gast)
        if (isPublic) {
            htmlContent += `
            <div style="background:var(--card-bg); padding:20px; border-radius:12px; margin-bottom:20px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                <div id="form-view">
                    <h3 style="margin-top:0; color:var(--secondary); margin-bottom: 20px;">Aufenthaltsfeedback</h3>
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">Dein Feedback ist uns wichtig!</p>

                    <div id="gb-form-inputs">
                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Dein Name</label>
                        <input type="text" id="gb-name" placeholder="Name / Alias" style="margin-bottom:15px;">

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Grund des Besuchs</label>
                        <input type="text" id="gb-grund" placeholder="Besuchsgrund..." style="margin-bottom:15px;">

                        <div style="margin-bottom:15px;">
                            <label style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; color:#888; font-size:0.8rem;">
                                Ordnungs-Skala (1-10)
                                <div>
                                    <span id="rangeVal" style="color:var(--secondary); font-weight:bold;">5</span>
                                    <span id="emojiDisplay" style="margin-left:5px;">😐</span>
                                </div>
                            </label>
                            <input type="range" id="gb-ordnung" min="1" max="10" value="5" style="width:100%;">
                            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-top:5px;">
                                <span>Chaos</span>
                                <span>Sauber</span>
                            </div>
                        </div>

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Kulinarik</label>
                        <select id="gb-kulinarik" style="margin-bottom:15px;">
                            <option value="Nichts">Nichts</option>
                            <option value="Leitungswasser">Leitungswasser</option>
                            <option value="Kaffee/Tee">Kaffee / Tee</option>
                            <option value="Alkohol">Alkohol</option>
                            <option value="Gourmet">Essen</option>
                            <option value="Abgelaufen">Abgelaufen</option>
                        </select>

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Seltsames Objekt?</label>
                        <input type="text" id="gb-objekt" placeholder="..." style="margin-bottom:15px;">

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Geruch</label>
                        <select id="gb-geruch" style="margin-bottom:15px;">
                            <option value="Neutral">Neutral</option>
                            <option value="Gut">Gut</option>
                            <option value="Schlecht">Schlecht</option>
                        </select>

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Hose getragen?</label>
                        <select id="gb-hose" style="margin-bottom:15px;">
                            <option value="Ja">Ja</option>
                            <option value="Nein">Nein</option>
                            <option value="Unsicher">Unsicher</option>
                        </select>

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Würdest du hier übernachten?</label>
                        <select id="gb-wohlfuehl" style="margin-bottom:15px;">
                            <option value="Sofort">Ja</option>
                            <option value="Notfalls">Notfalls</option>
                            <option value="Niemals">Niemals</option>
                        </select>
                        
                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Anmerkungen</label>
                        <textarea id="gb-nachricht" rows="4" placeholder="..." style="width:100%; background:#2c2c2c; border:1px solid #444; color:white; border-radius:8px; padding:10px; margin-bottom:15px;"></textarea>

                        <button id="gb-submit-btn" class="primary" onclick="GuestbookModule.submit()">Eintragen</button>
                    </div>
                </div>

                <div id="success-view" style="display:none; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🎉</div>
                    <h3 style="color:var(--text-main); margin-bottom: 10px;">Danke!</h3>
                    <p style="color:var(--text-muted); margin-bottom: 30px;">Feedback gespeichert.</p>
                    <button class="primary" onclick="GuestbookModule.reset()">Noch einen Eintrag</button>
                </div>
            </div>`;
        }

        // Liste
        const headerText = isPublic ? "Das sagen andere" : "Einträge";
        
        htmlContent += `
            <div style="margin-top: 20px;">
                <h3 style="color: var(--text-muted); margin-bottom: 15px; padding-bottom:10px; border-bottom:1px solid #333;">${headerText}</h3>
                <div id="gb-entries-list">Lade Einträge...</div>
            </div>
        </div>`; 

        container.innerHTML = htmlContent;

        if (isPublic) {
            this.attachSliderLogic();
        }
        
        await this.loadEntries();
    },

    attachSliderLogic() {
        const rangeInput = document.getElementById('gb-ordnung');
        const valDisplay = document.getElementById('rangeVal');
        const emojiDisplay = document.getElementById('emojiDisplay');
        
        const emojis = {
            1: "☢️", 2: "🗑️", 3: "🕸️", 4: "🤧", 5: "🤨", 
            6: "😐", 7: "👌", 8: "🧹", 9: "🧼", 10: "✨"
        };

        if(rangeInput) {
            rangeInput.addEventListener('input', function() {
                const val = parseInt(this.value);
                valDisplay.innerText = val;
                const newEmoji = emojis[val] || "😐";
                if (emojiDisplay.innerText !== newEmoji) {
                    emojiDisplay.innerText = newEmoji;
                }
            });
        }
    },

    async submit() {
        const payload = {
            date: new Date().toISOString(),
            name: document.getElementById('gb-name').value,
            grund: document.getElementById('gb-grund').value,
            ordnung: document.getElementById('gb-ordnung').value,
            kulinarik: document.getElementById('gb-kulinarik').value,
            objekt: document.getElementById('gb-objekt').value,
            geruch: document.getElementById('gb-geruch').value,
            hose: document.getElementById('gb-hose').value,
            wohlfuehl: document.getElementById('gb-wohlfuehl').value,
            nachricht: document.getElementById('gb-nachricht').value
        };

        if(!payload.name) { alert("Name fehlt!"); return; }

        const btn = document.getElementById('gb-submit-btn');
        btn.innerText = "Sende...";
        btn.disabled = true;

        const result = await API.post('create', { sheet: 'Guestbook', payload: JSON.stringify(payload) });

        btn.innerText = "Eintragen";
        btn.disabled = false;

        if (result.status === 'success') {
            document.getElementById('form-view').style.display = 'none';
            document.getElementById('success-view').style.display = 'block';
            await this.loadEntries();
        } else {
            alert("Fehler: " + result.message);
        }
    },

    reset() {
        document.getElementById('gb-name').value = "";
        document.getElementById('gb-grund').value = "";
        document.getElementById('gb-objekt').value = "";
        document.getElementById('gb-nachricht').value = "";
        document.getElementById('form-view').style.display = 'block';
        document.getElementById('success-view').style.display = 'none';
    },

    async loadEntries() {
        const list = document.getElementById('gb-entries-list');
        const result = await API.post('read', { sheet: 'Guestbook', _t: Date.now() });

        if (result.status === 'success') {
            const entries = result.data.reverse();
            list.innerHTML = "";
            if (entries.length === 0) list.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>Noch keine Einträge.</p>";
            
            entries.forEach(entry => {
                let dStr = "-";
                try { dStr = new Date(entry.date).toLocaleDateString(); } catch(e){}

                list.innerHTML += `
                    <div style="background:var(--card-bg); padding:15px; border-radius:12px; margin-bottom:15px; border-left: 4px solid var(--primary);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span style="font-weight:bold; color:var(--text-main);">${entry.name}</span>
                            <span style="font-size:0.8rem; color:var(--text-muted);">Ordnung: ${entry.ordnung}/10</span>
                        </div>
                        <div style="font-style:italic; margin-bottom:10px; color:var(--text-muted);">"${entry.grund}"</div>
                        
                        <div style="font-size:0.85rem; color:#ccc; margin-bottom:10px;">
                            ${entry.kulinarik !== 'Nichts' ? `🍪 ${entry.kulinarik} ` : ''}
                            ${entry.objekt ? `👀 ${entry.objekt}` : ''}
                        </div>

                        ${entry.nachricht ? `<div style="margin-top:5px; color:var(--text-main);">"${entry.nachricht}"</div>` : ''}
                        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:10px; text-align:right;">${dStr}</div>
                    </div>
                `;
            });
        }
    }
};
