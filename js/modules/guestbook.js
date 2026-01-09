const GuestbookModule = {
    async init(containerId, isPublic = false) {
        const container = document.getElementById(containerId);
        if(!container) return;

        const backFunc = isPublic ? "window.location.reload()" : "App.showDashboard()";
        const backText = isPublic ? "Zum Login" : "Startseite";

        // Header nur anzeigen, wenn nicht public (im Public Mode hat man evtl. kein Menü)
        // Oder wir nutzen konsistentes Design:
        const headerHtml = `
            <div style="display: flex; align-items: center; padding: 15px; background: #1f1f1f; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 100;">
                <button onclick="${backFunc}" style="background: none; border: none; color: #bb86fc; font-size: 1.1rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; padding: 5px 10px 5px 0;">
                    <span style="font-size: 1.4rem; margin-right: 8px;">❮</span> ${backText}
                </button>
                <span style="margin-left: 15px; color: #888; border-left: 1px solid #555; padding-left: 15px;">Gästebuch</span>
            </div>`;

        container.innerHTML = `
            ${headerHtml}
            <div class="module-container" style="padding-top: 20px;">
                <!-- EINGABE FORMULAR -->
                <div class="add-box" style="background:var(--card-bg); padding:20px; border-radius:12px; margin-bottom:30px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                    <h3 style="margin-top:0; color:var(--secondary);">Hinterlasse eine Nachricht! 👋</h3>
                    <input type="text" id="gb-name" placeholder="Dein Name" style="margin-bottom:10px;">
                    <textarea id="gb-msg" placeholder="Was möchtest du sagen?" style="width:100%; background:#2c2c2c; border:1px solid #444; color:white; border-radius:8px; padding:10px; min-height:80px; box-sizing:border-box; margin-bottom:10px; font-family:inherit;"></textarea>
                    <button class="primary" onclick="GuestbookModule.submitEntry()">Absenden</button>
                </div>

                <!-- LISTE -->
                <h4 style="color:var(--text-muted); margin-bottom:15px;">Bisherige Einträge</h4>
                <div id="gb-list">Lade Einträge...</div>
            </div>
        `;

        await this.loadEntries();
    },

    async loadEntries() {
        const list = document.getElementById('gb-list');
        // _t gegen Caching
        const result = await API.post('read', { sheet: 'Guestbook', _t: Date.now() });
        
        if (result.status === 'success') {
            const entries = result.data;
            list.innerHTML = "";
            
            if (entries.length === 0) {
                list.innerHTML = "<p style='text-align:center; color:#666;'>Noch keine Einträge. Sei der Erste!</p>";
                return;
            }

            // Neueste zuerst
            entries.reverse().forEach(entry => {
                let dateStr = "";
                try {
                    const d = new Date(entry.date);
                    if(!isNaN(d.getTime())) dateStr = d.toLocaleDateString() + " " + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } catch(e) {}

                list.innerHTML += `
                    <div style="background:var(--card-bg); padding:15px; border-radius:12px; margin-bottom:15px; position:relative;">
                        <div style="font-weight:bold; color:var(--primary); margin-bottom:5px;">${entry.name}</div>
                        <div style="color:var(--text-main); line-height:1.4; white-space: pre-wrap;">${entry.message}</div>
                        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:10px; text-align:right;">${dateStr}</div>
                    </div>
                `;
            });
        } else {
            list.innerHTML = "<p style='color:var(--danger);'>Fehler beim Laden.</p>";
        }
    },

    async submitEntry() {
        const name = document.getElementById('gb-name').value;
        const msg = document.getElementById('gb-msg').value;

        if(!name || !msg) { alert("Bitte Name und Nachricht eingeben."); return; }

        const btn = document.querySelector('.add-box button');
        const oldText = btn.innerText;
        btn.innerText = "Sende...";
        btn.disabled = true;

        const payload = {
            date: new Date().toISOString(),
            name: name,
            message: msg
        };

        const result = await API.post('create', { sheet: 'Guestbook', payload: JSON.stringify(payload) });

        btn.innerText = oldText;
        btn.disabled = false;

        if (result.status === 'success') {
            document.getElementById('gb-msg').value = ""; // Textfeld leeren
            // Name lassen wir stehen, falls man noch was schreiben will
            await this.loadEntries();
        } else {
            alert("Fehler: " + result.message);
        }
    }
};
