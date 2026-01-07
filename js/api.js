const API_URL = "https://script.google.com/macros/s/AKfycbx0wBCPaz0zcLrXPlHNOnVt-rYcdX8suwCVA1AlsUCo4pun7lHkGJzdJKH74aErsADB9A/exec";

const API = {
    async post(action, data = {}) {
        // Da Google Apps Script POST Requests mit CORS schwierig sind, 
        // nutzen wir oft GET für einfache Abfragen oder einen POST-Workaround.
        // Für den Anfang nutzen wir simple URL Parameter via fetch.
        
        const params = new URLSearchParams({ ...data, action: action });
        
        try {
            const response = await fetch(`${API_URL}?${params.toString()}`);
            return await response.json();
        } catch (error) {
            console.error("API Fehler:", error);
            return { status: "error", message: "Verbindungsfehler" };
        }
    }
};
