const CalendarModule = {
    currentDate: new Date(),
    events: [],

    async init() {
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
        `;
        await this.loadEvents();
        this.render();
    },

    async loadEvents() {
        // 1. Events vom Sheet "Events" laden (Parties etc.)
        const resEvents = await API.post('read', { sheet: 'Events' });
        // 2. Tasks vom Sheet "Tasks" laden (Putzplan etc.)
        const resTasks = await API.post('read', { sheet: 'Tasks' });
        
        this.events = [];
        if (resEvents.status === 'success') this.events = this.events.concat(resEvents.data);
        if (resTasks.status === 'success') {
            // Nur offene Tasks im Kalender anzeigen
            const tasks = resTasks.data.filter(t => t.status === 'open');
            this.events = this.events.concat(tasks);
        }
    },

    render() {
        const grid = document.getElementById('cal-grid');
        const monthLabel = document.getElementById('cal-month-name');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        monthLabel.innerText = `${monthNames[month]} ${year}`;
        grid.innerHTML = "";

        const firstDayIndex = new Date(year, month, 1).getDay();
        const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(d => grid.innerHTML += `<div class="day-name">${d}</div>`);
        for (let i = 0; i < adjustedFirstDay; i++) grid.innerHTML += `<div></div>`;

        for (let i = 1; i <= daysInMonth; i++) {
            const currentCellDate = new Date(year, month, i);
            const dateStr = currentCellDate.toISOString().split('T')[0];
            const daysEvents = this.getEventsForDate(currentCellDate, dateStr);
            
            let eventDots = "";
            daysEvents.forEach(e => {
                let color = 'dot-green';
                if(e.type === 'cleaning') color = 'dot-blue';
                if(e.type === 'shopping') color = 'dot-red'; // Einkaufen rot
                if(e.type === 'party') color = 'dot-purple';
                eventDots += `<span class="dot ${color}"></span>`;
            });

            const isToday = new Date().toISOString().split('T')[0] === dateStr ? 'today' : '';
            const titles = daysEvents.map(e => "• " + e.title).join("\\n");

            grid.innerHTML += `
                <div class="cal-day ${isToday}" onclick="alert('${titles || "Leer"}')">
                    <span>${i}</span>
                    <div class="dots">${eventDots}</div>
                </div>`;
        }
    },

    getEventsForDate(dateObj, dateStr) {
        return this.events.filter(e => {
            if (!e.recurrence || e.recurrence === 'none') return e.date && e.date.startsWith(dateStr);
            const start = new Date(e.date);
            if (dateObj < start) return false;
            
            const dObj = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
            const sDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());

            if (e.recurrence === 'weekly') return dObj.getDay() === sDate.getDay();
            if (e.recurrence === 'monthly') return dObj.getDate() === sDate.getDate();
            if (e.recurrence === 'yearly') return dObj.getDate() === sDate.getDate() && dObj.getMonth() === sDate.getMonth();
            return false;
        });
    },
    changeMonth(step) { this.currentDate.setMonth(this.currentDate.getMonth() + step); this.render(); },
    showAddModal() { 
        document.getElementById('event-modal').style.display = 'flex'; 
        document.getElementById('evt-date').valueAsDate = new Date();
    },
    // saveEvent Funktion nutzen wir hier weiter aus der vorherigen Version, 
    // aber eigentlich nutzen wir jetzt TasksModule für Aufgaben. 
    // Wir lassen die Funktion hier für "reine" Kalender-Events (Partys).
    async saveEvent() {
        // ... (Logik wie vorher, oder vereinfacht nur für Events)
        // Um Konflikte zu vermeiden: Einfach das Modal in index.html nutzen.
        const title = document.getElementById('evt-title').value;
        const date = document.getElementById('evt-date').value;
        const type = document.getElementById('evt-type').value;
        const recur = document.getElementById('evt-recurrence').value;
        
        const payload = { title, date, type, recurrence: recur, author: App.user.name };
        await API.post('create', { sheet: 'Events', payload: JSON.stringify(payload) });
        document.getElementById('event-modal').style.display = 'none';
        await this.loadEvents();
        this.render();
    }
};
