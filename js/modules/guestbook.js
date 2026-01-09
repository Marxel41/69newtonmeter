const GuestbookModule = {
    async init(containerId) {
        const container = document.getElementById(containerId);
        
        // Dein HTML Code (eingebettet in den Wrapper)
        container.innerHTML = `
        <div class="gb-wrapper">
            <div class="gb-form-container">
                
                <!-- Formular Ansicht -->
                <div id="form-view">
                    <h1>📝 Aufenthaltsfeedback</h1>
                    <p class="subtitle">Dein Feedback ist uns mega wichtig</p>

                    <!-- ID für JS Zugriff -->
                    <div id="gb-form-inputs">
                        
                        <div class="form-row">
                            <label>Dein Name (oder Alias)</label>
                            <input type="text" id="gb-name" placeholder="z.B. Sherlock Holmes">
                        </div>

                        <div class="form-row">
                            <label>Grund des Besuchs</label>
                            <input type="text" id="gb-grund" placeholder="z.B. Wollte nur kurz Hallo sagen...">
                        </div>

                        <div class="form-row">
                            <label style="display:flex; justify-content:space-between; align-items:center;">
                                Ordnungs-Skala (1-10)
                                <div>
                                    <span id="rangeVal" style="color:#667eea; font-weight:bold; font-size:1.2rem;">5</span>
                                    <span id="emojiDisplay" class="emoji-feedback">😐</span>
                                </div>
                            </label>
                            <input type="range" id="gb-ordnung" min="1" max="10" value="5">
                            <div class="range-labels">
                                <span>💣 Chaos</span>
                                <span>✨ Blitzblank</span>
                            </div>
                        </div>

                        <div class="form-row">
                            <label>Kulinarik: Was wurde dir angeboten?</label>
                            <select id="gb-kulinarik">
                                <option value="Nichts">Nichts (Frechheit!)</option>
                                <option value="Leitungswasser">Lauwarmes Leitungswasser</option>
                                <option value="Kaffee/Tee">Kaffee / Tee</option>
                                <option value="Alkohol">Alkohol (Notwendig)</option>
                                <option value="Gourmet">Gourmet 3-Gänge Menü</option>
                                <option value="Abgelaufen">Abgelaufene Kekse</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <label>Welches seltsame Objekt lag offen herum?</label>
                            <input type="text" id="gb-objekt" placeholder="z.B. Willys Dildos">
                        </div>

                        <div class="form-row">
                            <label>Wonach roch es beim Reinkommen?</label>
                            <select id="gb-geruch">
                                <option value="Neutral">Frische Luft</option>
                                <option value="Kaffee">Frischer Kaffee</option>
                                <option value="Essen">Leckerem Essen</option>
                                <option value="Angstschweiß">Angstschweiß</option>
                                <option value="Raumspray">Billiges Raumspray</option>
                                <option value="Nasser Hund">Nasser Hund</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <label>Hat der/die Gastgeber/in eine Hose getragen?</label>
                            <select id="gb-hose">
                                <option value="Ja">Ja, vorbildlich</option>
                                <option value="Nein">Nein, leider nicht</option>
                                <option value="Unsicher">Bin mir unsicher / Will es nicht wissen</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <label>Würdest du hier notfalls übernachten?</label>
                            <select id="gb-wohlfuehl">
                                <option value="Sofort">Ja, sofort!</option>
                                <option value="Wenn es brennt">Nur wenn ich die letze Bahn verpasst habe</option>
                                <option value="Niemals">Lieber unter der Brücke</option>
                            </select>
                        </div>
                        
                        <div class="form-row">
                            <label>Sonstige Anmerkungen</label>
                            <textarea id="gb-nachricht" rows="4" placeholder="Was du noch loswerden wolltest..."></textarea>
                        </div>

                        <button id="gb-submit-btn" class="gb-btn" onclick="GuestbookModule.submit()">Absenden 🚀</button>
                    </div>
                </div>

                <!-- Success Ansicht -->
                <div id="success-view" style="display:none; text-align: center;">
                    <div style="font-size: 5rem; margin-bottom: 20px;">🎉</div>
                    <h2 style="color:#2d3748; margin-bottom: 10px;">Erfolgreich übermittelt!</h2>
                    <p style="color:#718096; margin-bottom: 30px;">
                        Vielen Dank für deine brutale Ehrlichkeit.<br>
                    </p>
                    <button class="gb-btn" onclick="GuestbookModule.reset()">Noch einen Eintrag</button>
                </div>

            </div>

            <!-- TABELLE DER ERGEBNISSE -->
            <div style="margin-top: 40px;">
                <h2 style="color: white; text-align: center; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Das sagen andere</h2>
                <div id="gb-entries-list">Lade Einträge...</div>
            </div>
        </div>
        `;

        this.attachSliderLogic();
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

        rangeInput.addEventListener('input', function() {
            const val = parseInt(this.value);
            valDisplay.innerText = val;
            const newEmoji = emojis[val] || "😐";
            if (emojiDisplay.innerText !== newEmoji) {
                emojiDisplay.innerText = newEmoji;
                // Simple animation reset
                emojiDisplay.style.opacity = 0;
                setTimeout(() => emojiDisplay.style.opacity = 1, 50);
            }
        });
    },

    async submit() {
        // Daten sammeln
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
        const oldText = btn.innerText;
        btn.innerText = "Sende...";
        btn.disabled = true;

        // An Google Sheet senden
        const result = await API.post('create', { sheet: 'Guestbook', payload: JSON.stringify(payload) });

        btn.innerText = oldText;
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
        // Felder leeren (rudimentär)
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
            const entries = result.data.reverse(); // Neueste oben
            list.innerHTML = "";
            if (entries.length === 0) list.innerHTML = "<p style='text-align:center; color:white;'>Noch keine Einträge.</p>";
            
            entries.forEach(entry => {
                let dStr = "-";
                try { dStr = new Date(entry.date).toLocaleDateString(); } catch(e){}

                list.innerHTML += `
                    <div class="gb-entry-card">
                        <div class="gb-entry-header">
                            <span>${entry.name}</span>
                            <span>Ordnung: ${entry.ordnung}/10</span>
                        </div>
                        <div style="font-style:italic; margin-bottom:5px;">"${entry.grund}"</div>
                        
                        <div style="background:#f7fafc; padding:8px; border-radius:8px; font-size:0.9rem; margin:10px 0;">
                            <div>🥘 ${entry.kulinarik}</div>
                            <div>👃 ${entry.geruch}</div>
                            <div>👖 Hose? ${entry.hose}</div>
                            ${entry.objekt ? `<div>👀 Objekt: ${entry.objekt}</div>` : ''}
                        </div>

                        ${entry.nachricht ? `<div style="margin-top:5px;">"${entry.nachricht}"</div>` : ''}
                        <div class="gb-entry-meta">${dStr}</div>
                    </div>
                `;
            });
        }
    }
};
