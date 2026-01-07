// HIER DEINE URL EINFÜGEN!
const API_URL = "https://script.google.com/macros/s/AKfycbzKCx9ZmwhkMPfROYPlkRUc8UKjdSS-QBtDv-MvOiqG1uFnwKPZPSTh4dIGS-MQa4wkow/exec";

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
