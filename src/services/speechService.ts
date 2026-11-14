/**
 * Text-to-Speech audio reader using browser Web Speech API
 * 100% offline support built into modern Android & iOS & desktop browsers.
 */

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakArabicDiagnosis(text: string, onEnd?: () => void): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  utterance.rate = 0.92; // Slightly slower for clarity in technical agricultural names
  utterance.pitch = 1.0;

  // Try finding an Arabic voice
  const voices = window.speechSynthesis.getVoices();
  const arVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('Arabic'));
  if (arVoice) {
    utterance.voice = arVoice;
  }

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking;
}
