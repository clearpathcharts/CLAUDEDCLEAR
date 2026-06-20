// Google AI Studio Dual-Engine Failover for CPMS TV
class CPMSAIBackupEngine {
    constructor() {
        this.apiKey = window.localStorage.getItem('AI_STUDIO_KEY') || '';
        
        // Primary Engine (Fastest)
        this.primaryModel = "gemini-2.5-flash";
        // Backup Engine (Failsafe fallback if primary glitches)
        this.backupModel = "gemini-1.5-flash";
        
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
    }

    async processVoiceCommand(userInput) {
        if (!this.apiKey) {
            console.log("⚠️ AI Studio Key missing. Running in standard local mode.");
            return null; 
        }

        const prompt = `You are the CPMS TV framework core assistant for clearpathtrader.com. 
        The user gave this command: "${userInput}". Translate this into a single clean interface action.`;

        // STEP 1: Attempt to use the Primary Engine
        try {
            console.log(`🤖 Attempting Primary Engine (${this.primaryModel})...`);
            return await this.callGoogleAPI(this.primaryModel, prompt);
        } catch (primaryError) {
            console.warn("⚠️ Primary AI Engine experienced a loading issue. Flipping to Failsafe Backup...");
            
            // STEP 2: Automatic Failover to Backup Engine
            try {
                console.log(`🚀 Activating Backup Engine (${this.backupModel})...`);
                return await this.callGoogleAPI(this.backupModel, prompt);
            } catch (backupError) {
                console.error("❌ Both AI engines are currently refusing to load:", backupError);
                return "System temporary latency. Reverting to manual menu selection.";
            }
        }
    }

    async callGoogleAPI(model, prompt) {
        const targetUrl = `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`Google API Status: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
}

window.cpmsAIEngine = new CPMSAIBackupEngine();
console.log("🔒 CPMS Dual-Engine Backup AI Framework armed and insulated.");
