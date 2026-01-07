const CalendarModule = {
    currentDate: new Date(),
    events: [],

    async init() {
        // HTML Grundgerüst in den Container laden
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="cal-header">
                <button onclick="CalendarModule.changeMonth(-1)">❮</button>
                <h2 id="cal-month-name">Lade...</h2>
                <button onclick="CalendarModule.changeMonth(1)">❯</button>
            </div>
            
            <div class="cal-grid" id="cal-grid"></div>
            
            <div class="cal-controls">
                <button class="fab" onclick="CalendarModule.showAddModal()">+</button>
            </div>

            <div id="event-modal" class="modal" style="display:none;">
                <div class="modal-content">
                    <h3>Neuer Termin</h3>
                    <input type="text" id="evt-title" placeholder="Was ist los?">
                    <input type="date" id="evt-date">
                    <select id="evt-type">
                        <option value="general">Allgemein</option>
                        <option value="party">WG Party / Besuch</option>
                    </select>
                    <div class="modal-actions">
                        <button onclick="document.getElementById('event-modal').style.display='none'">Abbr.</button>
                        <button class="primary" onclick="CalendarModule.saveEvent()">Speichern</button>
                    </div>
                </div>
            </div>
        `;

        await this.loadEvents();
        this.render();
    },

    async loadEvents() {
        // Daten vom Sheet holen
        const result = await API.post('read', { sheet: 'Events' });
        if (result.status === 'success') {
            this.events = result.data; // Hier speichern wir alle Events
        }
    },

    render() {
        const grid = document.getElementById('cal-grid');
        const monthLabel = document.getElementById('cal-month-name');
        
        // Datum berechnen
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Monatsname setzen
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        monthLabel.innerText = `${monthNames[month]} ${year}`;

        grid.innerHTML = ""; // Reset

        // Erster Tag des Monats & Anzahl Tage
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sonntag
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Wochentage Header
        const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        days.forEach(d => grid.innerHTML += `<div class="day-name">${d}</div>`);

        // Leere Felder am Anfang (Padding)
        for (let i = 0; i < firstDayIndex; i++) {
            grid.innerHTML += `<div></div>`;
        }

        // Tage rendern
        for (let i = 1; i <= daysInMonth; i++) {
            // Checken ob Events an diesem Tag sind
            const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            // Filtert Events für diesen Tag
            const daysEvents = this.events.filter(e => e.date.includes(dateStr));
            
            let eventDots = "";
            daysEvents.forEach(e => {
                let colorClass = e.type === 'cleaning' ? 'dot-blue' : (e.type === 'garbage' ? 'dot-red' : 'dot-green');
                eventDots += `<span class="dot ${colorClass}"></span>`;
            });

            // Tag "heute" markieren
            const isToday = new Date().toISOString().split('T')[0] === dateStr ? 'today' : '';

            grid.innerHTML += `
                <div class="cal-day ${isToday}" onclick="alert('${daysEvents.map(e=>e.title).join(", ")}')">
                    <span>${i}</span>
                    <div class="dots">${eventDots}</div>
                </div>
            `;
        }
    },

    changeMonth(step) {
        this.currentDate.setMonth(this.currentDate.getMonth() + step);
        this.render();
    },

    showAddModal() {
        document.getElementById('event-modal').style.display = 'flex';
        // Standardmäßig heute auswählen
        document.getElementById('evt-date').valueAsDate = new Date();
    },

    async saveEvent() {
        const title = document.getElementById('evt-title').value;
        const date = document.getElementById('evt-date').value;
        const type = document.getElementById('evt-type').value;

        if(!title || !date) return alert("Bitte alles ausfüllen");

        const payload = {
            title: title,
            date: date,
            type: type,
            author: App.user.name
        };

        const result = await API.post('create', { 
            sheet: 'Events', 
            payload: JSON.stringify(payload) 
        });

        if(result.status === 'success') {
            document.getElementById('event-modal').style.display = 'none';
            await this.loadEvents(); // Neu laden
            this.render();
        } else {
            alert("Fehler beim Speichern");
        }
    }
};
