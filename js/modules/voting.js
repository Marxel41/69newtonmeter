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
            <div id="voting-list">Lade...</div>
        `;
        await this.load();
    },

    async load() {
        const result = await API.post('read', { sheet: 'Votes', _t: new Date().getTime() });
        const div = document.getElementById('voting-list');
        div.innerHTML = "";

        if (result.status === 'success') {
            const openVotes = result.data.filter(v => v.status !== 'closed');
            if(openVotes.length === 0) { div.innerHTML = "<p style='text-align:center;'>Keine aktiven Abstimmungen.</p>"; return; }

            openVotes.forEach(v => this.renderCard(v, div));
        }
    },

    renderCard(vote, container) {
        // Daten parsen (Wir speichern Namen als String "Max,Anna")
        const yesList = vote.yes_votes ? vote.yes_votes.split(',') : [];
        const noList = vote.no_votes ? vote.no_votes.split(',') : [];
        const total = yesList.length + noList.length;
        
        // Prozent berechnen
        const yesPct = total === 0 ? 50 : (yesList.length / total) * 100;
        const noPct = total === 0 ? 50 : (noList.length / total) * 100;

        // Status Klasse
        let statusClass = '';
        if (vote.veto_by) statusClass = 'status-veto';
        else if (yesList.length > noList.length) statusClass = 'status-yes';
        else if (noList.length > yesList.length) statusClass = 'status-no';

        // Veto Info
        const vetoInfo = vote.veto_by ? `<div style="color:var(--veto); font-weight:bold; margin-bottom:10px;">⛔ VETO durch ${vote.veto_by}</div>` : '';

        // Hab ich schon abgestimmt?
        const myName = App.user.name;
        const votedYes = yesList.includes(myName);
        const votedNo = noList.includes(myName);
        const isVeto = vote.veto_by === myName;

        container.innerHTML += `
            <div class="vote-card ${statusClass}">
                <h3 style="margin-top:0;">${vote.title}</h3>
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

                <div class="vote-actions">
                    <button class="vote-btn btn-yes" style="${votedYes ? 'background:var(--secondary); color:black;' : ''}" 
                        onclick="VotingModule.vote('${vote.id}', 'yes', ${vote.veto_by ? 'true' : 'false'})">JA</button>
                    
                    <button class="vote-btn btn-no" style="${votedNo ? 'background:var(--danger); color:white;' : ''}" 
                        onclick="VotingModule.vote('${vote.id}', 'no', ${vote.veto_by ? 'true' : 'false'})">NEIN</button>
                    
                    <button class="vote-btn btn-veto" onclick="VotingModule.toggleVeto('${vote.id}', '${vote.veto_by}')">
                        ${isVeto ? 'LÖSEN' : 'VETO'}
                    </button>
                </div>
            </div>
        `;
    },

    async addVote() {
        const title = document.getElementById('v-title').value;
        if(!title) return;
        await API.post('create', { sheet: 'Votes', payload: JSON.stringify({
            title, yes_votes: "", no_votes: "", veto_by: "", status: "open", author: App.user.name
        })});
        document.getElementById('v-title').value = "";
        await this.load();
    },

    async vote(id, type, isLocked) {
        if(isLocked) { alert("Abstimmung ist durch VETO blockiert."); return; }

        // Wir müssen erst lesen, um die Arrays zu manipulieren (nicht atomar, aber ok für WG)
        const result = await API.post('read', { sheet: 'Votes', _t: new Date().getTime() });
        const vote = result.data.find(v => v.id == id); // ACHTUNG: id ist string, == nutzen
        
        let yesList = vote.yes_votes ? vote.yes_votes.split(',') : [];
        let noList = vote.no_votes ? vote.no_votes.split(',') : [];
        const me = App.user.name;

        // Erstmal entfernen falls vorhanden
        yesList = yesList.filter(u => u !== me);
        noList = noList.filter(u => u !== me);

        // Dann hinzufügen
        if(type === 'yes') yesList.push(me);
        if(type === 'no') noList.push(me);

        // Update
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

        const newVeto = currentVetoUser === me ? "" : me; // Toggle

        await API.post('update', { sheet: 'Votes', id: id, updates: JSON.stringify({
            veto_by: newVeto
        })});
        await this.load();
    }
};
