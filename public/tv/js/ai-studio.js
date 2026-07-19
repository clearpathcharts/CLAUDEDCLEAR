// Google AI Studio helper for CPMS TV — keys must NEVER live in localStorage.
// Voice/AI commands should go through the ClearPath server (/api/mentor/chat or encyclopedia),
// which holds GEMINI_API_KEY / GROQ_API_KEY server-side only.
class CPMSAIBackupEngine {
    constructor() {
        // Intentionally empty — browser-held API keys are forbidden.
        this.apiKey = '';
        this.primaryModel = "gemini-2.5-flash";
        this.backupModel = "gemini-1.5-flash";
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
        try {
            window.localStorage.removeItem('AI_STUDIO_KEY');
        } catch (_) {}
    }

    async processVoiceCommand(userInput) {
        console.log("AI Studio client key path disabled. Use ClearPath server AI routes instead.", userInput);
        return null;
    }

    async callGoogleAPI() {
        throw new Error('Client-side Gemini keys are disabled. Configure GEMINI_API_KEY on the server.');
    }
}

window.cpmsAI = new CPMSAIBackupEngine();
