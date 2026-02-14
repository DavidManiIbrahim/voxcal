
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
    }
};
