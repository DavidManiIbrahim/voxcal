
import { StorageService, VoxAlarm, VoxEvent } from '@/services/StorageService';
import { VoiceService } from '@/services/VoiceService';
import { useMutation, useQuery } from "convex/react";
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface AppState {
    events: VoxEvent[];
    addEvent: (event: VoxEvent) => void;
    updateEvent: (event: VoxEvent) => void;
    deleteEvent: (id: string) => void;
    snoozeAlarm: (id: string) => void;
    isLoading: boolean;
}

const AppContext = createContext<AppState>({} as AppState);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const eventsQuery = useQuery(api.events.getEvents);
    const addEventMutation = useMutation(api.events.addEvent);
    const updateEventMutation = useMutation(api.events.updateEvent);
    const deleteEventMutation = useMutation(api.events.deleteEvent);

    // Fallback to empty array if query is loading, and map _id to id
    const events = (eventsQuery || []).map(e => ({ ...e, id: e._id }));

    // Internal alarms tracking (still local)
    const [alarms, setAlarms] = useState<VoxAlarm[]>([]);
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
        // Events come from Convex useQuery automatically
        const storedAlarms = await StorageService.getAlarms();
        setAlarms(storedAlarms || []);
        setIsLoading(false);
    };

    const addEvent = async (event: VoxEvent) => {
        // Prepare args for Convex (remove id as it's generated, unless we pass UUID?)
        // Convex generates ID. We use that ID for alarms.
        const { id, ...eventData } = event;

        // Optimistic update or wait for server?
        const newId = await addEventMutation(eventData);

        if (event.startDate) {
            // Schedule using the new Convex ID
            await scheduleEventAlarm({ ...event, id: newId });
        }
    };

    const updateEvent = async (updatedEvent: VoxEvent) => {
        // For update, we need ID.
        // Convert string ID to Id<"events"> if needed, or assume it's passed correctly
        const { id, ...rest } = updatedEvent;
        await updateEventMutation({ id: id as Id<"events">, ...rest });

        // Cancel old alarms for this event
        await cancelEventAlarms(updatedEvent.id);

        // Schedule new alarms if needed
        if (updatedEvent.alarmId) {
            await scheduleEventAlarm(updatedEvent);
        }
    };

    const deleteEvent = async (id: string) => {
        await deleteEventMutation({ id: id as Id<"events"> });
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
            } else if (event.sound && event.sound.startsWith('file://')) {
                // Play custom user uploaded sound
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
