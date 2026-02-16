import { db } from '@/services/firebaseConfig';
import { StorageService, VoxAlarm, VoxEvent } from '@/services/StorageService';
import { VoiceService } from '@/services/VoiceService';
import * as Notifications from 'expo-notifications';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AppState {
    events: VoxEvent[];
    addEvent: (event: Omit<VoxEvent, 'id'>) => Promise<void>;
    updateEvent: (event: VoxEvent) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    snoozeAlarm: (id: string) => Promise<void>;
    isLoading: boolean;
}

const AppContext = createContext<AppState>({} as AppState);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [events, setEvents] = useState<VoxEvent[]>([]);
    const [alarms, setAlarms] = useState<VoxAlarm[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for events
        const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
            const eventsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as VoxEvent[];
            setEvents(eventsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching events: ", error);
            setIsLoading(false);
        });

        loadLocalData();

        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.eventId) {
                handleAlarmTrigger(data.eventId, response.actionIdentifier);
            }
        });

        return () => {
            unsubscribe();
            subscription.remove();
        };
    }, []);

    const loadLocalData = async () => {
        const storedAlarms = await StorageService.getAlarms();
        setAlarms(storedAlarms || []);
    };

    const addEvent = async (eventData: Omit<VoxEvent, 'id'>) => {
        try {
            const docRef = await addDoc(collection(db, 'events'), eventData);
            const newId = docRef.id;

            if (eventData.startDate) {
                // Schedule using the new Firebase ID
                await scheduleEventAlarm({ ...eventData, id: newId } as VoxEvent);
            }
        } catch (e) {
            console.error("Error adding event: ", e);
        }
    };

    const updateEvent = async (updatedEvent: VoxEvent) => {
        try {
            const { id, ...data } = updatedEvent;
            const eventRef = doc(db, 'events', id);
            await updateDoc(eventRef, data as any);

            // Cancel old alarms for this event
            await cancelEventAlarms(updatedEvent.id);

            // Schedule new alarms if needed
            if (updatedEvent.alarmId) { // check logic: assumes alarmId meant "needs alarm" or similar? Original code used it.
                // Wait, original code: if (updatedEvent.alarmId) { await scheduleEventAlarm(updatedEvent); }
                // But VoxEvent interface says alarmId?: string.
                // Re-checking logic: scheduleEventAlarm usually sets alarms.
                // If the updated event is supposed to have an alarm, we proceed.
                // The original code passed `updatedEvent` to `scheduleEventAlarm`.
                // I'll stick to original logic.
                await scheduleEventAlarm(updatedEvent);
            }
        } catch (e) {
            console.error("Error updating event: ", e);
        }
    };

    const deleteEvent = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'events', id));
            await cancelEventAlarms(id);
        } catch (e) {
            console.error("Error deleting event: ", e);
        }
    };

    const scheduleEventAlarm = async (event: VoxEvent) => {
        const trigger = new Date(event.startDate);
        const now = new Date();

        // Only schedule if in future
        if (trigger.getTime() > now.getTime()) {
            const ids: string[] = [];

            // 1. Primary Alarm
            const id1 = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'VoxCal: ' + event.title,
                    body: event.notes || 'Event Starting Now',
                    data: { eventId: event.id, type: event.reminderType, isPrimary: true },
                    sound: event.sound || 'default'
                },
                trigger,
            });
            ids.push(id1);

            // 2. Escalation 1 (+5 mins)
            const escalation1 = new Date(trigger.getTime() + 5 * 60000);
            const id2 = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'MISSED: ' + event.title,
                    body: 'You missed your event! Tap to view details.',
                    data: { eventId: event.id, type: event.reminderType, isEscalation: true },
                    badge: 1,
                    sound: event.sound || 'default'
                },
                trigger: escalation1,
            });
            ids.push(id2);

            // 3. Escalation 2 (+15 mins)
            const escalation2 = new Date(trigger.getTime() + 15 * 60000);
            const id3 = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'URGENT: ' + event.title,
                    body: 'Final Reminder! Please check your schedule.',
                    data: { eventId: event.id, type: event.reminderType, isEscalation: true },
                    badge: 2,
                    sound: event.sound || 'default'
                },
                trigger: escalation2,
            });
            ids.push(id3);

            // Store these newly created scheduled alarms
            const newAlarmsTrace = ids.map(id => ({ id, eventId: event.id, time: trigger.toISOString(), active: true, label: 'reminder' }));
            
            // To update state based on previous state in a safe way:
            setAlarms(prevAlarms => {
                const updatedAlarms = [...prevAlarms, ...newAlarmsTrace];
                StorageService.saveAlarms(updatedAlarms);
                return updatedAlarms;
            });
        }
    };

    const cancelEventAlarms = async (eventId: string) => {
        // We need current alarms from state or retrieval
        // Since setAlarms is async, mapping over 'alarms' state might be slightly stale if called rapidly, 
        // but typically fine for user actions.
        
        // Filter out alarms for this event
        const eventAlarms = alarms.filter(a => a.eventId === eventId);

        for (const alarm of eventAlarms) {
            try {
                await Notifications.cancelScheduledNotificationAsync(alarm.id);
            } catch (e) {
                console.warn("Failed to cancel alarm", alarm.id, e);
            }
        }

        const remainingAlarms = alarms.filter(a => a.eventId !== eventId);
        setAlarms(remainingAlarms);
        await StorageService.saveAlarms(remainingAlarms);
    };

    const handleAlarmTrigger = async (eventId: string, actionId: string) => {
        // User interacted -> cancel further escalations
        await cancelEventAlarms(eventId); 

        const event = events.find(e => e.id === eventId);
        if (event) {
            if (event.reminderType === 'voice') {
                VoiceService.speak(`Reminder: ${event.title}. ${event.notes || ''}`);
            } else if (event.sound && event.sound.startsWith('file://')) {
                try {
                    const { Audio } = require('expo-av');
                    const { sound } = await Audio.Sound.createAsync({ uri: event.sound });
                    await sound.playAsync();
                } catch (e) {
                    console.error("Failed to play custom sound", e);
                }
            }
        }
    };

    const snoozeAlarm = async (eventId: string) => {
        const event = events.find(e => e.id === eventId);
        if (event) {
            const trigger = new Date(Date.now() + 10 * 60000);
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Snoozed: ' + event.title,
                    body: event.notes,
                    data: { eventId: event.id, type: event.reminderType },
                    sound: event.sound || 'default'
                },
                trigger
            });
        }
    };

    return (
        <AppContext.Provider value={{ events, addEvent, updateEvent, deleteEvent, snoozeAlarm, isLoading }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);

