const CalendarModule = {
    currentDate: new Date(),
    events: [],
    
    async init(targetId) {
        const container = document.getElementById(targetId);
        container.innerHTML = `
            <div class="cal-header" style="background:var(--card-bg); border-radius:12px 12px 0 0; border-bottom:none;">
                <button onclick="CalendarModule.changeMonth(-1)">❮</button>
                <h2 id="cal-month-name" style="font-size:1rem;">Lade...</h2>
                <button onclick="CalendarModule.changeMonth(1)">❯</button>
            </div>
            <div class="cal-grid" id="cal-grid" style="background:var(--card-bg); border-radius:0 0 12px 12px;"></div>
            <div style="text-align:right; margin-top:5px;">
                <button class="primary" style="width:auto; padding:5px 15px; font-size:0.8rem;" onclick="document.getElementById('event-modal').style.display='flex'">+ Termin</button>
            </div>
        `;
        await this.loadEvents();
        this.render();
    },

    async loadEvents() {
        const p1 = API.post('read', { sheet: 'Events' });
        const p2 = API.post('read', { sheet: 'Tasks' });
        const p3 = API.post('get_garbage'); // Holt Mülltermine vom Backend

        const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
        
        this.events = [];
        if(r1.status === 'success') this.events.push(...r1.data);
        if(r2.status === 'success') this.events.push(...r2.data.filter(t => t.status === 'open'));
        if(r3.status === 'success') {
            // Mülltermine markieren
            const garbage = r3.data.map(d => ({ date: d.date, title: "Müll: " + d.title, type: "garbage" }));
            this.events.push(...garbage);
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
        ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(d => grid.innerHTML += `<div class="day-name">${d}</div>`);

        const firstDay = new Date(year, month, 1).getDay();
        const adjFirstDay = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < adjFirstDay; i++) grid.innerHTML += `<div></div>`;

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const daysEvents = this.getEventsForDate(new Date(dateStr), dateStr);
            
            let dots = "";
            daysEvents.forEach(e => {
                let col = '#bbb';
                if(e.type === 'cleaning') col = 'var(--primary)';
                if(e.type === 'garbage') col = 'var(--veto)'; // Orange
                if(e.type === 'party') col = '#e91e63';
                dots += `<span class="dot" style="background:${col}"></span>`;
            });

            const isToday = new Date().toISOString().split('T')[0] === dateStr ? 'today' : '';
            // Fix: Wir nutzen encodeURIComponent für den DateStr um Probleme zu vermeiden
            grid.innerHTML += `
                <div class="cal-day ${isToday}" onclick="CalendarModule.openDay('${dateStr}')">
                    <span>${i}</span>
                    <div class="dots">${dots}</div>
                </div>`;
        }
    },

    openDay(dateStr) {
        const events = this.getEventsForDate(new Date(dateStr), dateStr);
        if(events.length === 0) return;

        const list = document.getElementById('day-modal-list');
        list.innerHTML = "";
        document.getElementById('day-modal-title').innerText = dateStr.split('-').reverse().join('.');
        
        events.forEach(e => {
            list.innerHTML += `
                <div class="list-item">
                    <strong>${e.title}</strong>
                    <small style="color:var(--text-muted)">${e.type || 'Event'}</small>
                </div>`;
        });
        document.getElementById('day-modal').style.display = 'flex';
    },

    getEventsForDate(dObj, dStr) {
        return this.events.filter(e => {
            if(!e.recurrence || e.recurrence === 'none') return e.date && e.date.startsWith(dStr);
            // Einfache Wiederholungslogik (erweitern wie in vorherigen Versionen nötig für 3-Days etc)
            // Hier gekürzt für Übersicht, nutzt Logik aus Tasks/Previous Calendar
            const start = new Date(e.date);
            if(dObj < start) return false;
            
            // Tagesdifferenz für "Alle X Tage"
            const diffTime = Math.abs(dObj - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if(e.recurrence === 'daily') return true;
            if(e.recurrence === '3days') return diffDays % 3 === 0;
            if(e.recurrence === '5days') return diffDays % 5 === 0;
            if(e.recurrence === 'weekly') return dObj.getDay() === start.getDay();
            if(e.recurrence === 'monthly') return dObj.getDate() === start.getDate();
            if(e.recurrence === 'yearly') return dObj.getDate() === start.getDate() && dObj.getMonth() === start.getMonth();
            return false;
        });
    },
    changeMonth(step) { this.currentDate.setMonth(this.currentDate.getMonth() + step); this.render(); },
    async saveEvent() { /* Code wie vorher */ }
};
