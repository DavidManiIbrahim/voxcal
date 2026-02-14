
import { StorageService, VoxAlarm, VoxEvent } from '@/services/StorageService';
import { VoiceService } from '@/services/VoiceService';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AppState {
    events: VoxEvent[];
    addEvent: (event: VoxEvent) => void;
    deleteEvent: (id: string) => void;
    snoozeAlarm: (id: string) => void;
    isLoading: boolean;
}

const AppContext = createContext<AppState>({} as AppState);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [events, setEvents] = useState<VoxEvent[]>([]);
    const [alarms, setAlarms] = useState<VoxAlarm[]>([]); // internal tracking
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.eventId) {
                handleAlarmTrigger(data.eventId, response.actionIdentifier);
            }
        });
        return () => subscription.remove();
    }, []);

    const loadData = async () => {
        const storedEvents = await StorageService.getEvents();
        const storedAlarms = await StorageService.getAlarms();
        setEvents(storedEvents || []);
        setAlarms(storedAlarms || []);
        setIsLoading(false);
    };

    const addEvent = async (event: VoxEvent) => {
        const newEvents = [...events, event];
        setEvents(newEvents);
        await StorageService.saveEvents(newEvents);

        if (event.startDate) {
            await scheduleEventAlarm(event);
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
                    sound: 'default' // Add custom sound file to assets/ and reference here if configured
                },
                trigger,
            });
            ids.push(id1);

            // 2. Escalation 1 (+5 mins) - "Alarms that escalate if ignored"
            // If the user doesn't dismiss the first one (i.e. open app), this triggers
            const escalation1 = new Date(trigger.getTime() + 5 * 60000);
            const id2 = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'MISSED: ' + event.title,
                    body: 'You missed your event! Tap to view details.',
                    data: { eventId: event.id, type: event.reminderType, isEscalation: true },
                    badge: 1,
                    sound: 'default'
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
                    sound: 'default'
                },
                trigger: escalation2,
            });
            ids.push(id3);

            // Store these newly created scheduled alarms
            const newAlarms = [
                ...alarms,
                ...ids.map(id => ({ id, eventId: event.id, time: trigger.toISOString(), active: true, label: 'reminder' }))
            ];
            setAlarms(newAlarms);
            await StorageService.saveAlarms(newAlarms);
        }
    };

    const cancelEventAlarms = async (eventId: string, currentAlarmsList?: VoxAlarm[]) => {
        const listToFilter = currentAlarmsList || alarms;
        const eventAlarms = listToFilter.filter(a => a.eventId === eventId);

        for (const alarm of eventAlarms) {
            try {
                await Notifications.cancelScheduledNotificationAsync(alarm.id);
            } catch (e) {
                console.warn("Failed to cancel alarm", alarm.id, e);
            }
        }

        const remainingAlarms = listToFilter.filter(a => a.eventId !== eventId);
        setAlarms(remainingAlarms);
        await StorageService.saveAlarms(remainingAlarms);
    };

    const deleteEvent = async (id: string) => {
        const newEvents = events.filter(e => e.id !== id);
        setEvents(newEvents);
        await StorageService.saveEvents(newEvents);
        await cancelEventAlarms(id);
    };

    const handleAlarmTrigger = async (eventId: string, actionId: string) => {
        // User interacted -> cancel further escalations
        await cancelEventAlarms(eventId); // This clears upcoming escalations as they are stored with same eventId

        const event = events.find(e => e.id === eventId);
        if (event) {
            // "Spoken voice reminders" logic
            if (event.reminderType === 'voice') {
                VoiceService.speak(`Reminder: ${event.title}. ${event.notes || ''}`);
            } else {
                // "Alarms with custom sounds" - notification sound played, maybe play inside app too?
                // For now, rely on notification sound.
            }
        }
    };

    const snoozeAlarm = async (eventId: string) => {
        // Find event
        const event = events.find(e => e.id === eventId);
        if (event) {
            // Schedule new notification in 10 mins
            const trigger = new Date(Date.now() + 10 * 60000);
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Snoozed: ' + event.title,
                    body: event.notes,
                    data: { eventId: event.id, type: event.reminderType },
                    sound: 'default'
                },
                trigger
            });
        }
    };

    return (
        <AppContext.Provider value={{ events, addEvent, deleteEvent, snoozeAlarm, isLoading }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
