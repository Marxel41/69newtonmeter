// HIER DEINE URL EINFÜGEN!
const API_URL = "https://script.google.com/macros/s/AKfycbzX5fIR2OjBuCyhwg2XFcwbriFG8mdZO_YaZVhkUojMe7z0DZMpoYcb07i2e4KUxAgPEQ/exec";

const API = {
    async post(action, data = {}) {
        const params = new URLSearchParams({ ...data, action: action });
        try {
            console.log(`API Anfrage: ${action}`);
            const response = await fetch(`${API_URL}?${params.toString()}`);
            if (!response.ok) throw new Error("Netzwerk Antwort war nicht ok");
            const json = await response.json();
            return json;
        } catch (error) {
            console.error("API Fehler:", error);
            return { status: "error", message: "Verbindungsfehler: " + error.message };
        }
    }
};
