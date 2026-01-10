const VotingModule = {
    containerId: null,

    async init(cId) {
        this.containerId = cId;
        const container = document.getElementById(cId);
        container.innerHTML = `
            <div class="add-box" style="background:var(--card-bg); padding:15px; border-radius:10px; margin-bottom:20px;">
                <input type="text" id="v-title" placeholder="Über was abstimmen?">
                <button class="primary" onclick="VotingModule.addVote()">Abstimmung starten</button>
            </div>
            
            <h3 style="color:var(--text-muted); font-size:0.9rem; margin-bottom:10px;">Laufende Abstimmungen</h3>
            <div id="voting-list">Lade...</div>

            <!-- ARCHIV (Ausklappbar) -->
            <div style="margin-top: 30px; border-top: 1px solid #333; padding-top: 10px;">
                <details>
                    <summary style="cursor:pointer; color:var(--text-muted); padding:10px 0; font-weight:bold;">
                        📂 Abgeschlossene Abstimmungen
                    </summary>
                    <div id="voting-archive" style="margin-top:10px;"></div>
                </details>
            </div>
        `;
        await this.load();
    },

    async load() {
        const result = await API.post('read', { sheet: 'Votes', _t: Date.now() });
        const activeDiv = document.getElementById('voting-list');
        const archiveDiv = document.getElementById('voting-archive');
        
        activeDiv.innerHTML = "";
        archiveDiv.innerHTML = "";

        if (result.status === 'success') {
            const votes = result.data;
            const now = Date.now();
            let hasActive = false;
            let hasClosed = false;

            // Neueste zuerst
            votes.reverse().forEach(v => {
                // ID ist der Timestamp der Erstellung
                const created = parseInt(v.id);
                const ageHours = (now - created) / (1000 * 60 * 60);
                const isExpired = ageHours >= 24;

                if (!isExpired && v.status !== 'closed') {
                    this.renderCard(v, activeDiv, false, ageHours);
                    hasActive = true;
                } else {
                    this.renderCard(v, archiveDiv, true, ageHours);
                    hasClosed = true;
                }
            });

            if (!hasActive) activeDiv.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>Aktuell keine offenen Abstimmungen.</p>";
            if (!hasClosed) archiveDiv.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>Das Archiv ist leer.</p>";
        }
    },

    renderCard(vote, container, isClosed, ageHours) {
        const yesList = vote.yes_votes ? vote.yes_votes.split(',') : [];
        const noList = vote.no_votes ? vote.no_votes.split(',') : [];
        const total = yesList.length + noList.length;
        
        const yesPct = total === 0 ? 50 : (yesList.length / total) * 100;
        const noPct = total === 0 ? 50 : (noList.length / total) * 100;

        let statusClass = '';
        if (vote.veto_by) statusClass = 'status-veto';
        else if (yesList.length > noList.length) statusClass = 'status-yes';
        else if (noList.length > yesList.length) statusClass = 'status-no';

        // Veto Info
        const vetoInfo = vote.veto_by ? `<div style="color:var(--veto); font-weight:bold; margin-bottom:10px;">⛔ VETO durch ${vote.veto_by}</div>` : '';

        // User Status
        const myName = App.user.name;
        const votedYes = yesList.includes(myName);
        const votedNo = noList.includes(myName);
        const hasVoted = votedYes || votedNo;
        const isVetoOwner = vote.veto_by === myName;

        // Zeit Info
        let timeInfo = "";
        if (isClosed) {
            timeInfo = `<span style="color:var(--text-muted); font-size:0.8rem;">🏁 Abgeschlossen</span>`;
        } else {
            const hoursLeft = Math.ceil(24 - ageHours);
            timeInfo = `<span style="color:var(--secondary); font-size:0.8rem;">⏳ Endet in ca. ${hoursLeft} Std.</span>`;
        }

        // Action Buttons bauen
        let actionsHtml = "";
        
        if (isClosed) {
            // Keine Buttons im Archiv, nur Ergebnis
            actionsHtml = `<div style="text-align:center; color:#666; font-size:0.9rem; margin-top:10px;">Abstimmung beendet.</div>`;
        } else {
            // Aktive Abstimmung
            // Wenn schon abgestimmt: Buttons deaktiviert
            const btnStyle = hasVoted ? "opacity:0.5; cursor:not-allowed;" : "";
            const clickAction = hasVoted ? "" : `onclick="VotingModule.vote('${vote.id}', 'TYPE', ${vote.veto_by ? 'true' : 'false'})"`;

            actionsHtml = `
                <div class="vote-actions">
                    <button class="vote-btn btn-yes" style="${votedYes ? 'background:var(--secondary); color:black;' : ''} ${btnStyle}" 
                        ${clickAction.replace('TYPE', 'yes')}>JA</button>
                    
                    <button class="vote-btn btn-no" style="${votedNo ? 'background:var(--danger); color:white;' : ''} ${btnStyle}" 
                        ${clickAction.replace('TYPE', 'no')}>NEIN</button>
                    
                    <button class="vote-btn btn-veto" onclick="VotingModule.toggleVeto('${vote.id}', '${vote.veto_by}')">
                        ${isVetoOwner ? 'LÖSEN' : 'VETO'}
                    </button>
                </div>
                ${hasVoted ? '<div style="text-align:center; font-size:0.8rem; color:#666; margin-top:5px;">Stimme abgegeben</div>' : ''}
            `;
        }

        container.innerHTML += `
            <div class="vote-card ${statusClass}">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3 style="margin-top:0;">${vote.title}</h3>
                    ${timeInfo}
                </div>
                <small style="color:var(--text-muted)">von ${vote.author}</small>
                
                ${vetoInfo}

                <div class="vote-bars">
                    <div class="bar-yes" style="width:${yesPct}%"></div>
                    <div class="bar-no" style="width:${noPct}%"></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:10px;">
                    <span>Ja: ${yesList.length}</span>
                    <span>Nein: ${noList.length}</span>
                </div>

                ${actionsHtml}
            </div>
        `;
    },

    async addVote() {
        const title = document.getElementById('v-title').value;
        if(!title) return;
        
        // ID ist der Timestamp -> Basis für 24h Timer
        await API.post('create', { sheet: 'Votes', payload: JSON.stringify({
            title, yes_votes: "", no_votes: "", veto_by: "", status: "open", author: App.user.name
        })});
        
        document.getElementById('v-title').value = "";
        await this.load();
    },

    async vote(id, type, isLocked) {
        if(isLocked) { alert("Abstimmung ist durch VETO blockiert."); return; }

        // Lesen um sicherzustellen dass man nicht doppelt abstimmt (Client-Side Check war nur UI)
        const result = await API.post('read', { sheet: 'Votes', _t: Date.now() });
        const vote = result.data.find(v => v.id == id);
        
        let yesList = vote.yes_votes ? vote.yes_votes.split(',') : [];
        let noList = vote.no_votes ? vote.no_votes.split(',') : [];
        const me = App.user.name;

        // Check: Habe ich schon?
        if (yesList.includes(me) || noList.includes(me)) {
            alert("Du hast bereits abgestimmt! Meinung ändern ist nicht erlaubt.");
            return;
        }

        // Hinzufügen
        if(type === 'yes') yesList.push(me);
        if(type === 'no') noList.push(me);

        await API.post('update', { sheet: 'Votes', id: id, updates: JSON.stringify({
            yes_votes: yesList.join(','),
            no_votes: noList.join(',')
        })});
        
        await this.load();
    },

    async toggleVeto(id, currentVetoUser) {
        const me = App.user.name;
        
        if (currentVetoUser && currentVetoUser !== me) {
            alert("Nur derjenige, der das Veto eingelegt hat, kann es lösen.");
            return;
        }

        const newVeto = currentVetoUser === me ? "" : me; 

        await API.post('update', { sheet: 'Votes', id: id, updates: JSON.stringify({
            veto_by: newVeto
        })});
        await this.load();
    }
};
