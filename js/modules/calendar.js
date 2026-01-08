const CalendarModule = {
    currentDate: new Date(),
    events: [],
    
    async init(targetId) {
        const container = document.getElementById(targetId);
        if(!container) return;
        
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
        try {
            // Wir hängen einen Zufallswert an (_t), damit der Browser NICHTS aus dem Cache lädt
            const timestamp = new Date().getTime();
            
            const [r1, r2, r3] = await Promise.all([
                API.post('read', { sheet: 'Events', _t: timestamp }),
                API.post('read', { sheet: 'Tasks', _t: timestamp }),
                API.post('get_garbage', { _t: timestamp }).catch(e => ({status:'error'}))
            ]);
            
            this.events = [];
            if(r1.status === 'success') this.events.push(...r1.data);
            if(r2.status === 'success') this.events.push(...r2.data.filter(t => t.status === 'open'));
            
            if(r3 && r3.status === 'success' && Array.isArray(r3.data)) {
                const garbage = r3.data.map(d => ({ date: d.date, title: "Müll: " + d.title, type: "garbage" }));
                this.events.push(...garbage);
            }
        } catch (e) { console.error("Cal load error", e); }
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
            // Wir bauen das aktuelle Zellen-Datum
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            
            const daysEvents = this.getEventsForDate(dateStr);
            
            let dots = "";
            daysEvents.forEach(e => {
                let col = '#aaa'; 
                if(e.type === 'cleaning') col = 'var(--primary)';
                if(e.type === 'shopping') col = 'var(--danger)';
                if(e.type === 'party') col = '#e91e63';
                if(e.type === 'garbage') col = 'var(--veto)';
                dots += `<span class="dot" style="background:${col}"></span>`;
            });

            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
            const isToday = todayStr === dateStr ? 'today' : '';

            grid.innerHTML += `
                <div class="cal-day ${isToday}" onclick="CalendarModule.openDay('${dateStr}')">
                    <span>${i}</span>
                    <div class="dots">${dots}</div>
                </div>`;
        }
    },

    getEventsForDate(targetDateStr) {
        return this.events.filter(e => {
            if (!e.date) return false;
            
            // FIX: Datum korrekt umwandeln unter Berücksichtigung der Zeitzone
            const d = new Date(e.date);
            // sv-SE Format ist YYYY-MM-DD, nutzt lokale Zeitzone des Browsers
            const localDateStr = d.toLocaleDateString('sv-SE'); 
            
            // 1. Exaktes Datum
            if ((!e.recurrence || e.recurrence === 'none') && localDateStr === targetDateStr) {
                return true;
            }
            
            // 2. Wiederholungen
            if (e.recurrence) {
                const [tY, tM, tD] = targetDateStr.split('-').map(Number);
                const tDateObj = new Date(tY, tM-1, tD, 12, 0, 0);
                const eDateObj = new Date(d); // Startdatum des Events
                
                if (tDateObj < eDateObj) return false;

                if (e.recurrence === 'weekly') return tDateObj.getDay() === eDateObj.getDay();
                if (e.recurrence === 'monthly') return tD === eDateObj.getDate();
                if (e.recurrence === 'yearly') return tD === eDateObj.getDate() && tM === (eDateObj.getMonth()+1);
            }
            return false;
        });
    },

    openDay(dateStr) {
        const events = this.getEventsForDate(dateStr);
        const modal = document.getElementById('day-modal');
        const list = document.getElementById('day-modal-list');
        const title = document.getElementById('day-modal-title');
        
        const [y, m, d] = dateStr.split('-');
        title.innerText = `${d}.${m}.${y}`;
        
        list.innerHTML = "";
        if(events.length === 0) {
            list.innerHTML = "<p style='color:var(--text-muted); text-align:center;'>Keine Termine</p>";
        } else {
            events.forEach(e => {
                list.innerHTML += `
                    <div class="list-item" style="padding:10px;">
                        <strong>${e.title}</strong>
                        <small style="display:block; color:var(--text-muted)">${e.type || 'Event'}</small>
                    </div>`;
            });
        }
        modal.style.display = 'flex';
    },

    changeMonth(step) { this.currentDate.setMonth(this.currentDate.getMonth() + step); this.render(); },
    
    async saveEvent() {
        const title = document.getElementById('evt-title').value;
        const date = document.getElementById('evt-date').value;
        const type = document.getElementById('evt-type').value;
        const recur = document.getElementById('evt-recurrence').value;
        
        if(!title || !date) { alert("Bitte ausfüllen"); return; }
        
        // Button Feedback
        const btn = document.querySelector('#event-modal button.primary');
        const oldText = btn.innerText;
        btn.innerText = "⏳";

        await API.post('create', { sheet: 'Events', payload: JSON.stringify({
            title, date, type, recurrence: recur, author: App.user.name
        })});
        
        btn.innerText = oldText;
        document.getElementById('event-modal').style.display = 'none';
        document.getElementById('evt-title').value = "";
        await this.loadEvents();
        this.render();
    }
};
