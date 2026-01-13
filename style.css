/* VERSION: 17.1 - LOGIN & GUEST BUTTON LAYOUT FIX */

:root {
    --bg-color: #121212;
    --card-bg: #1e1e1e;
    --primary: #bb86fc;
    --secondary: #03dac6;
    --text-main: #e0e0e0;
    --text-muted: #a0a0a0;
    --danger: #cf6679;
    --warn: #ffca28;
    --veto: #ff9800;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: var(--bg-color);
    color: var(--text-main);
    margin: 0;
    padding-bottom: 50px; 
}

header {
    background: #1f1f1f;
    padding: 0 15px;
    position: sticky;
    top: 0;
    z-index: 1000;
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 60px;
}

.header-actions { display: flex; align-items: center; gap: 15px; }
#user-info { font-size: 0.9rem; color: var(--text-muted); }
.icon-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-main); padding: 5px; }

/* Login Screen Fix */
#login-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center; /* Zentriert den Inhalt */
    padding: 20px;
    background-color: var(--bg-color);
    /* Kein min-height: 100vh mehr, da es sonst den Button runterschiebt */
    min-height: calc(100vh - 80px); 
    box-sizing: border-box;
}

.guest-access-section {
    margin-top: 30px; /* Etwas weniger Abstand für bessere Sichtbarkeit */
    border-top: 1px solid #333;
    padding-top: 20px;
    width: 100%;
    max-width: 300px;
    text-align: center;
}

#guest-btn {
    background: transparent;
    border: 1px solid #555;
    color: #aaa;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    width: 100%;
    font-size: 0.95rem;
    transition: all 0.2s;
}

#guest-btn:active {
    background: rgba(255,255,255,0.1);
    transform: scale(0.98);
}

/* Restliche Styles wie gehabt... */
.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 15px; }
.tile { background: var(--card-bg); border-radius: 12px; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; aspect-ratio: 1/1; cursor: pointer; text-align: center; }
.tile span { font-size: 2rem; margin-bottom: 5px; }
.tile h3 { margin: 0; font-size: 0.9rem; font-weight: 500; }
.tile.wide { grid-column: span 2; aspect-ratio: auto; flex-direction: row; justify-content: space-between; padding: 20px; }

.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; justify-content: center; align-items: center; z-index: 10000; }
.modal-content { background: var(--card-bg); padding: 30px 20px 20px 20px; border-radius: 12px; width: 85%; max-width: 350px; position: relative; max-height: 80vh; overflow-y: auto; }
.close-modal-x { position: absolute; top: 5px; right: 10px; font-size: 2rem; color: #666; cursor: pointer; border: none; background: none; }

input, select { background: #2c2c2c; border: 1px solid #444; color: white; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 10px; box-sizing: border-box; }
button.primary { background: var(--primary); color: black; font-weight: bold; border: none; padding: 12px; border-radius: 8px; width: 100%; cursor: pointer; }
