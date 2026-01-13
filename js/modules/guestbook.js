const GuestbookModule = {
    isPublic: false,

    async init(containerId, isPublic = true) {
        this.isPublic = isPublic;
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let htmlContent = '<div>';
        
        // --- 1. GAST ANSICHT (FORMULAR) ---
        if (isPublic) {
            htmlContent += `
            <div style="background:var(--card-bg); padding:20px; border-radius:12px; margin-bottom:20px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                
                <!-- VIEW 1: Formular -->
                <div id="form-view">
                    <h3 style="margin-top:0; color:var(--secondary); margin-bottom: 5px;">Aufenthaltsfeedback</h3>
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">Dein Feedback ist uns mega wichtig.</p>

                    <div id="gb-form-inputs">
                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Dein Name (oder Alias)</label>
                        <input type="text" id="gb-name" placeholder="z.B. Sherlock Holmes" style="margin-bottom:15px;">

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Grund des Besuchs</label>
                        <input type="text" id="gb-grund" placeholder="Wollte nur kurz Hallo sagen..." style="margin-bottom:15px;">

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
                                <span>💣 Chaos</span>
                                <span>✨ Blitzblank</span>
                            </div>
                        </div>

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Kulinarik: Was wurde angeboten?</label>
                        <select id="gb-kulinarik" style="margin-bottom:15px;">
                            <option value="Nichts">Nichts (Frechheit!)</option>
                            <option value="Leitungswasser">Lauwarmes Leitungswasser</option>
                            <option value="Kaffee/Tee">Kaffee / Tee</option>
                            <option value="Alkohol">Alkohol (Notwendig)</option>
                            <option value="Gourmet">Gourmet 3-Gänge Menü</option>
                            <option value="Abgelaufen">Abgelaufene Kekse</option>
                        </select>

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Welches seltsame Objekt lag herum?</label>
                        <input type="text" id="gb-objekt" placeholder="..." style="margin-bottom:15px;">

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Wonach roch es?</label>
                        <select id="gb-geruch" style="margin-bottom:15px;">
                            <option value="Neutral">Frische Luft</option>
                            <option value="Kaffee">Frischer Kaffee</option>
                            <option value="Essen">Leckerem Essen</option>
                            <option value="Angstschweiß">Angstschweiß</option>
                            <option value="Raumspray">Billiges Raumspray</option>
                            <option value="Nasser Hund">Nasser Hund</option>
                        </select>

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Hose getragen?</label>
                        <select id="gb-hose" style="margin-bottom:15px;">
                            <option value="Ja">Ja, vorbildlich</option>
                            <option value="Nein">Nein, leider nicht</option>
                            <option value="Unsicher">Unsicher / Will es nicht wissen</option>
                        </select>

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Würdest du hier notfalls übernachten?</label>
                        <select id="gb-wohlfuehl" style="margin-bottom:15px;">
                            <option value="Sofort">Ja, sofort!</option>
                            <option value="Wenn es brennt">Nur wenn ich die letzte Bahn verpasse</option>
                            <option value="Niemals">Lieber unter der Brücke</option>
                        </select>
                        
                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Sonstige Anmerkungen</label>
                        <textarea id="gb-nachricht" rows="3" placeholder="Was du noch loswerden wolltest..." style="width:100%; background:#2c2c2c; border:1px solid #444; color:white; border-radius:8px; padding:10px; margin-bottom:15px;"></textarea>

                        <label style="display:block; margin-bottom:5px; color:#888; font-size:0.8rem;">Verbesserungsvorschläge?</label>
                        <textarea id="gb-improve" rows="2" placeholder="Was können wir besser machen?" style="width:100%; background:#2c2c2c; border:1px solid #444; color:white; border-radius:8px; padding:10px; margin-bottom:15px;"></textarea>

                        <button id="gb-submit-btn" class="primary" onclick="GuestbookModule.submit()">Absenden 🚀</button>
                    </div>
                </div>

                <!-- VIEW 2: Success -->
                <div id="success-view" style="display:none; text-align: center; padding: 20px 0;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🎉</div>
                    <h3 style="color:var(--text-main); margin-bottom: 10px;">Erfolgreich übermittelt!</h3>
                    <p style="color:var(--text-muted); margin-bottom: 30px;">
                        Vielen Dank für deine brutale Ehrlichkeit.<br>
                        Wir werden (vielleicht) daran arbeiten.
                    </p>
                    <button class="primary" onclick="GuestbookModule.showFinalMessage()">Noch einen Eintrag schreiben</button>
                </div>

                <!-- VIEW 3: Final Snarky Message -->
                <div id="final-message-view" style="display:none; text-align: center; padding: 20px 0;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">😒</div>
                    <h3 style="color:var(--text-main); margin-bottom: 10px;">So wichtig ist uns deine Meinung auch nicht...</h3>
                    <p style="color:var(--text-muted); margin-bottom: 30px;">
                        Einmal reicht vollkommen.<br>
                        Genieß lieber den Tag (woanders).
                    </p>
                </div>

            </div>`;
        }

        // --- 2. INTERNE STATISTIK (Nur wenn NICHT öffentlich/Gast) ---
        if (!isPublic) {
            htmlContent += `<div id="gb-stats">Lade Statistik...</div>`;
        }

        // --- 3. LISTE DER EINTRÄGE ---
        const headerText = isPublic ? "Das sagen andere" : "Alle Einträge";
        htmlContent += `
            <div style="margin-top: 30px;">
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
                if (valDisplay) valDisplay.innerText = val;
                if (emojiDisplay) emojiDisplay.innerText = emojis[val] || "😐";
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
            nachricht: document.getElementById('gb-nachricht').value,
            improvements: document.getElementById('gb-improve').value
        };

        if(!payload.name) { alert("Name fehlt!"); return; }

        const btn = document.getElementById('gb-submit-btn');
        btn.innerText = "Sende...";
        btn.disabled = true;

        const result = await API.post('create', { sheet: 'Guestbook', payload: JSON.stringify(payload) });

        btn.innerText = "Absenden 🚀";
        btn.disabled = false;

        if (result.status === 'success') {
            document.getElementById('form-view').style.display = 'none';
            document.getElementById('success-view').style.display = 'block';
            await this.loadEntries();
        } else {
            alert("Fehler: " + result.message);
        }
    },

    showFinalMessage() {
        document.getElementById('success-view').style.display = 'none';
        document.getElementById('final-message-view').style.display = 'block';
    },

    async loadEntries() {
        const list = document.getElementById('gb-entries-list');
        const statsDiv = document.getElementById('gb-stats');
        if (!list) return;
        
        const result = await API.post('read', { sheet: 'Guestbook', _t: Date.now() });

        if (result.status === 'success') {
            const entries = result.data.reverse();
            
            // --- STATISTIK BERECHNEN (Nur Intern) ---
            if (!this.isPublic && statsDiv) {
                this.renderStats(statsDiv, entries);
            }

            // --- LISTE RENDERN ---
            list.innerHTML = "";
            if (entries.length === 0) {
                list.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>Noch keine Einträge.</p>";
                return;
            }
            
            entries.forEach(entry => {
                let dStr = "-";
                try { dStr = new Date(entry.date).toLocaleDateString(); } catch(e){}

                list.innerHTML += `
                    <div style="background:var(--card-bg); padding:15px; border-radius:12px; margin-bottom:15px; border-left: 4px solid var(--primary);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span style="font-weight:bold; color:var(--text-main); font-size:1.1rem;">${entry.name}</span>
                            <span style="font-size:0.9rem; color:var(--secondary);">Ordnung: <strong>${entry.ordnung}/10</strong></span>
                        </div>
                        <div style="font-style:italic; margin-bottom:10px; color:var(--text-muted); font-size:0.9rem;">"${entry.grund}"</div>
                        
                        <div style="background:#252525; padding:10px; border-radius:8px; font-size:0.9rem; margin:10px 0; display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                            <div>🥘 ${entry.kulinarik || '-'}</div>
                            <div>👃 ${entry.geruch || '-'}</div>
                            <div>👖 Hose? ${entry.hose || '-'}</div>
                            <div>🛌 Stay? ${entry.wohlfuehl || '-'}</div>
                        </div>
                        
                        ${entry.objekt ? `<div style="margin-bottom:5px; font-size:0.9rem;">👀 <strong>Objekt:</strong> ${entry.objekt}</div>` : ''}
                        
                        ${entry.nachricht ? `<div style="margin-top:10px; padding-left:10px; border-left:2px solid #444; color:#ddd;">"${entry.nachricht}"</div>` : ''}
                        
                        ${entry.improvements ? `<div style="margin-top:10px; color:var(--warn); font-size:0.9rem;">💡 <strong>Vorschlag:</strong> ${entry.improvements}</div>` : ''}
                        
                        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:10px; text-align:right;">${dStr}</div>
                    </div>
                `;
            });
        }
    },

    renderStats(container, entries) {
        if(entries.length === 0) { container.innerHTML = ""; return; }

        let sumOrdnung = 0;
        let hoseJa = 0;
        let staySofort = 0;

        entries.forEach(e => {
            sumOrdnung += parseInt(e.ordnung) || 0;
            if (e.hose === 'Ja') hoseJa++;
            if (e.wohlfuehl === 'Sofort') staySofort++;
        });

        const avgOrd = (sumOrdnung / entries.length).toFixed(1);
        const hosePct = Math.round((hoseJa / entries.length) * 100);
        const stayPct = Math.round((staySofort / entries.length) * 100);

        const bar = (pct, color) => `
            <div style="background:#333; height:6px; border-radius:3px; margin-top:5px; overflow:hidden;">
                <div style="width:${pct}%; background:${color}; height:100%;"></div>
            </div>`;

        container.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:30px;">
                <div style="background:var(--card-bg); padding:15px; border-radius:12px; text-align:center;">
                    <div style="font-size:2rem; font-weight:bold; color:var(--primary);">${avgOrd}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Ø Ordnung</div>
                </div>
                <div style="background:var(--card-bg); padding:15px; border-radius:12px; text-align:center;">
                    <div style="font-size:2rem; font-weight:bold; color:var(--secondary);">${entries.length}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Einträge</div>
                </div>
                
                <div style="background:var(--card-bg); padding:15px; border-radius:12px; grid-column: span 2;">
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
                        <span>👖 Hosen-Quote</span>
                        <strong>${hosePct}%</strong>
                    </div>
                    ${bar(hosePct, 'var(--secondary)')}
                    
                    <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-top:15px;">
                        <span>🛌 Übernachtungswillig</span>
                        <strong>${stayPct}%</strong>
                    </div>
                    ${bar(stayPct, 'var(--primary)')}
                </div>
            </div>
        `;
    }
};
