export class VoiceEngine {
  recognition: any;
  listening = false;
  onEvent: any;
  onStatus: any;

  constructor(onEvent: any, onStatus: any) {
    this.onEvent = onEvent;
    this.onStatus = onStatus;

    const w: any = window;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onStatus({
        supported: false,
        listening: false,
        lastError: "Speech recognition unsupported",
      });
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      this.onEvent({ raw: transcript });
    };

    this.recognition.onerror = (e: any) => {
      onStatus({ supported: true, listening: false, lastError: e.error });
    };

    this.recognition.onend = () => {
      if (this.listening) this.recognition.start();
    };

    onStatus({ supported: true, listening: false });
  }

  start() {
    if (!this.recognition) return;
    this.listening = true;
    this.recognition.start();
    this.onStatus({ supported: true, listening: true });
  }

  stop() {
    if (!this.recognition) return;
    this.listening = false;
    try {
      this.recognition.abort();
      this.recognition.stop();
    } catch (e) {
      console.error(e);
    }
    this.onStatus({ supported: true, listening: false });
  }
}
