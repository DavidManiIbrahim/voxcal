
import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_KEY = '@voxcal_events';
const ALARMS_KEY = '@voxcal_alarms';

export interface VoxEvent {
    id: string;
    title: string;
    startDate: string; // ISO string
    endDate: string; // ISO string
    isAllDay: boolean;
    notes?: string;
    alarmId?: string;
    reminderType?: 'voice' | 'standard';
    sound?: string; // e.g. 'default', 'bell', 'chime'
}

export interface VoxAlarm {
    id: string; // notification id
    eventId: string;
    time: string; // ISO string
    active: boolean;
    label: string;
}

export const StorageService = {
    async saveEvents(events: VoxEvent[]) {
        try {
            const jsonValue = JSON.stringify(events);
            await AsyncStorage.setItem(EVENTS_KEY, jsonValue);
        } catch (e) {
            console.error('Error saving events', e);
        }
    },

    async getEvents(): Promise<VoxEvent[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(EVENTS_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading events', e);
            return [];
        }
    },

    async saveAlarms(alarms: VoxAlarm[]) {
        try {
            const jsonValue = JSON.stringify(alarms);
            await AsyncStorage.setItem(ALARMS_KEY, jsonValue);
        } catch (e) {
            console.error('Error saving alarms', e);
        }
    },

    async getAlarms(): Promise<VoxAlarm[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(ALARMS_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading alarms', e);
            return [];
        }
    },

    async clearAll() {
        await AsyncStorage.clear();
    },

    async saveSoundFile(uri: string): Promise<string> {
        try {
            // Lazy load to avoid cycle or error if not installed yet (though we just installed it)
            const FileSystem = require('expo-file-system');

            const soundsDir = FileSystem.documentDirectory + 'sounds/';
            const dirInfo = await FileSystem.getInfoAsync(soundsDir);

            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(soundsDir, { intermediates: true });
            }

            const filename = uri.split('/').pop() || `sound_${Date.now()}.mp3`;
            const dest = soundsDir + filename;

            await FileSystem.copyAsync({
                from: uri,
                to: dest
            });

            return dest;
        } catch (e) {
            console.error('Error saving sound file', e);
            return uri; // Fallback to original URI if copy fails (though might be temporary cache)
        }
    }
};
