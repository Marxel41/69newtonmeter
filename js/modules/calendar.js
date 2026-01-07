const CalendarModule = {
    currentDate: new Date(),
    events: [],

    async init() {
        const container = document.getElementById('app-container');
        // Wir nutzen das existierende Modal in index.html, bauen hier nur die Kalender-Ansicht
        
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
        `;

        await this.loadEvents();
        this.render();
    },

    async loadEvents() {
        // Lädt alle Events aus dem Sheet "Events"
        const result = await API.post('read', { sheet: 'Events' });
        if (result.status === 'success') {
            this.events = result.data;
        } else {
            console.error("Fehler beim Laden:", result);
        }
    },

    render() {
        const grid = document.getElementById('cal-grid');
        const monthLabel = document.getElementById('cal-month-name');
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        monthLabel.innerText = `${monthNames[month]} ${year}`;
        
        grid.innerHTML = ""; // Grid leeren

        // Berechnen, an welchem Wochentag der Monat startet
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sonntag
        // Korrektur für deutsche Woche (Montag = erste Spalte)
        const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Wochentage Header
        const daysHeader = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
        daysHeader.forEach(d => grid.innerHTML += `<div class="day-name">${d}</div>`);

        // Leere Felder vor dem 1. des Monats
        for (let i = 0; i < adjustedFirstDay; i++) {
            grid.innerHTML += `<div></div>`;
        }

        // Tage rendern
        for (let i = 1; i <= daysInMonth; i++) {
            const currentCellDate = new Date(year, month, i);
            const dateStr = currentCellDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            // WICHTIG: Hier prüfen wir auf Events (auch wiederkehrende)
            const daysEvents = this.getEventsForDate(currentCellDate, dateStr);
            
            let eventDots = "";
            daysEvents.forEach(e => {
                let colorClass = 'dot-green'; // Default
                if(e.type === 'cleaning') colorClass = 'dot-blue';
                if(e.type === 'garbage') colorClass = 'dot-red';
                if(e.type === 'party') colorClass = 'dot-purple';
                
                eventDots += `<span class="dot ${colorClass}"></span>`;
            });

            // Markierung für "Heute"
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = todayStr === dateStr ? 'today' : '';

            // Tooltip / Alert Text vorbereiten
            const eventTitles = daysEvents.map(e => `• ${e.title}`).join("\\n");
            const clickAction = daysEvents.length > 0 ? `alert('${eventTitles}')` : '';

            grid.innerHTML += `
                <div class="cal-day ${isToday}" onclick="${clickAction}">
                    <span>${i}</span>
                    <div class="dots">${eventDots}</div>
                </div>
            `;
        }
    },

    // Logik: Prüft ob ein Event an einem bestimmten Tag stattfindet
    getEventsForDate(dateObj, dateStr) {
        return this.events.filter(e => {
            // A) Einmaliges Event
            if (!e.recurrence || e.recurrence === 'none' || e.recurrence === '') {
                // Prüfen ob Datumstext übereinstimmt
                return e.date && e.date.startsWith(dateStr);
            }

            // B) Wiederkehrendes Event
            const startDate = new Date(e.date);
            // Wenn das Kalenderblatt VOR dem Startdatum des Events ist -> ignorieren
            if (dateObj < startDate) return false;
            
            // Um Probleme mit Uhrzeiten zu vermeiden, setzen wir beide auf 0 Uhr
            const dObj = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
            const sDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

            if (e.recurrence === 'weekly') {
                // Gleicher Wochentag? (0-6)
                return dObj.getDay() === sDate.getDay();
            }
            
            if (e.recurrence === 'monthly') {
                // Gleicher Tag im Monat? (1-31)
                return dObj.getDate() === sDate.getDate();
            }

            if (e.recurrence === 'yearly') {
                // Gleicher Tag und gleicher Monat?
                return dObj.getDate() === sDate.getDate() && 
                       dObj.getMonth() === sDate.getMonth();
            }

            return false;
        });
    },

    changeMonth(step) {
        this.currentDate.setMonth(this.currentDate.getMonth() + step);
        this.render();
    },

    showAddModal() {
        const modal = document.getElementById('event-modal');
        modal.style.display = 'flex';
        // Datum auf heute setzen
        document.getElementById('evt-date').valueAsDate = new Date();
    },

    async saveEvent() {
        const title = document.getElementById('evt-title').value;
        const date = document.getElementById('evt-date').value;
        const type = document.getElementById('evt-type').value;
        const recurrence = document.getElementById('evt-recurrence').value;

        if(!title || !date) return alert("Bitte Titel und Datum ausfüllen");

        const payload = {
            title: title,
            date: date,
            type: type,
            recurrence: recurrence,
            author: App.user ? App.user.name : 'Unbekannt'
        };

        // Button Feedback
        const btn = document.querySelector('#event-modal button.primary');
        const oldText = btn.innerText;
        btn.innerText = "Speichert...";

        const result = await API.post('create', { 
            sheet: 'Events', 
            payload: JSON.stringify(payload) 
        });

        btn.innerText = oldText;

        if(result.status === 'success') {
            document.getElementById('event-modal').style.display = 'none';
            // Felder leeren
            document.getElementById('evt-title').value = "";
            
            // Neu laden
            await this.loadEvents();
            this.render();
        } else {
            alert("Fehler: " + result.message);
        }
    }
};
