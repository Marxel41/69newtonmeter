const CalendarModule = {
    currentDate: new Date(),
    events: [],
    targetId: null,

    async init(targetDivId) {
        this.targetId = targetDivId;
        const container = document.getElementById(targetDivId);
        // Minimalistischeres Design für Dashboard
        container.innerHTML = `
            <div class="cal-header" style="background:var(--card-bg); border-radius:10px 10px 0 0; border:none;">
                <button onclick="CalendarModule.changeMonth(-1)">❮</button>
                <h2 id="cal-month-name" style="font-size:1rem;">Lade...</h2>
                <button onclick="CalendarModule.changeMonth(1)">❯</button>
            </div>
            <div class="cal-grid" id="cal-grid" style="background:var(--card-bg); border-radius:0 0 10px 10px;"></div>
            <div style="text-align:right; margin-top:5px;">
                <button class="primary" style="width:auto; padding:5px 15px; font-size:0.8rem;" onclick="document.getElementById('event-modal').style.display='flex'">+ Termin</button>
            </div>
        `;
        await this.loadEvents();
        this.render();
    },

    async loadEvents() {
        const resEvents = await API.post('read', { sheet: 'Events' });
        const resTasks = await API.post('read', { sheet: 'Tasks' });
        
        this.events = [];
        if (resEvents.status === 'success') this.events = this.events.concat(resEvents.data);
        if (resTasks.status === 'success') {
            const activeTasks = resTasks.data.filter(t => t.status === 'open');
            this.events = this.events.concat(activeTasks);
        }
    },

    render() {
        const grid = document.getElementById('cal-grid');
        const monthLabel = document.getElementById('cal-month-name');
        if(!grid) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
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
                let color = 'var(--secondary)';
                if(e.type === 'cleaning') color = 'var(--primary)';
                if(e.type === 'shopping') color = 'var(--danger)';
                if(e.type === 'party') color = '#e91e63';
                if(e.type === 'garbage') color = '#ff9800'; // Orange
                eventDots += `<span class="dot" style="background-color:${color}"></span>`;
            });

            const isToday = new Date().toISOString().split('T')[0] === dateStr ? 'today' : '';
            
            // JSON stringify für Übergabe an onclick ist tricky wegen Anführungszeichen. 
            // Wir speichern die Events temporär in einem globalen Array oder nutzen Index
            // Einfacher: Wir bauen die Onclick Logik so, dass sie Daten holt.
            
            grid.innerHTML += `<div class="cal-day ${isToday}" onclick='CalendarModule.showDayDetails("${dateStr}")'><span>${i}</span><div class="dots">${eventDots}</div></div>`;
        }
    },

    showDayDetails(dateStr) {
        const dateObj = new Date(dateStr);
        const events = this.getEventsForDate(dateObj, dateStr);
        
        if(events.length === 0) return; // Oder leeres Modal öffnen

        const modal = document.getElementById('day-modal');
        const list = document.getElementById('day-modal-list');
        document.getElementById('day-modal-title').innerText = dateStr.split('-').reverse().join('.');
        
        list.innerHTML = "";
        events.forEach(e => {
            list.innerHTML += `<div class="list-item"><strong>${e.title}</strong><small>${e.type || 'Allgemein'}</small></div>`;
        });
        
        modal.style.display = 'flex';
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
    
    async saveEvent() {
        // ... (Bleibt gleich, nur nutzt API)
        const title = document.getElementById('evt-title').value;
        const date = document.getElementById('evt-date').value;
        const type = document.getElementById('evt-type').value;
        const recur = document.getElementById('evt-recurrence').value;
        if(!title) return;
        
        await API.post('create', { sheet: 'Events', payload: JSON.stringify({title, date, type, recurrence: recur, author: App.user.name}) });
        document.getElementById('event-modal').style.display = 'none';
        await this.loadEvents();
        this.render();
    }
};
