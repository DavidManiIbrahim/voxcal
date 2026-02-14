
import * as Speech from 'expo-speech';

export const VoiceService = {
    speak: (text: string) => {
        Speech.speak(text, {
            language: 'en-US',
            pitch: 1.0,
            rate: 1.0,
        });
    },
    stop: () => {
        Speech.stop();
    },
    isSpeaking: async () => {
        return await Speech.isSpeakingAsync();
    }
};
