// HIER DEINE URL EINFÜGEN!
const API_URL = "https://script.google.com/macros/s/AKfycbxXOzdXydtPakfKm8ydkajeyRl1ar8Kh6R-UHpZw_3LVx_YT7Q4mxQ6_4wjEGSfGn-n9A/exec";

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
