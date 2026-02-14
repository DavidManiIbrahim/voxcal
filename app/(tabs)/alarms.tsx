
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { format, isPast } from 'date-fns';
import React from 'react';
import { FlatList, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

export default function AlarmsScreen() {
    const { events, deleteEvent } = useApp();

    // Filter for events with alarms that are in the future
    const activeAlarms = events.filter(e => e.alarmId && !isPast(new Date(e.startDate))).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const renderItem = ({ item }) => (
        <View style={styles.alarmItem}>
            <View style={styles.alarmInfo}>
                <ThemedText style={styles.alarmTime}>{format(new Date(item.startDate), 'HH:mm')}</ThemedText>
                <ThemedText style={styles.alarmDate}>{format(new Date(item.startDate), 'EEE, MMM d')}</ThemedText>
                <ThemedText style={styles.alarmTitle}>{item.title}</ThemedText>
            </View>
            <View style={styles.alarmActions}>
                <Switch value={true} onValueChange={() => { }} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={"#f4f3f4"} />
                <TouchableOpacity onPress={() => deleteEvent(item.id)} style={{ marginLeft: 16 }}>
                    <Ionicons name="trash-outline" size={24} color="#ff4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.header}>Upcoming Alarms</ThemedText>
            <FlatList
                data={activeAlarms}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <ThemedText>No upcoming alarms.</ThemedText>
                    </View>
                }
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 60,
    },
    header: {
        marginBottom: 20,
    },
    list: {
        paddingBottom: 20,
    },
    alarmItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    alarmInfo: {
        flex: 1,
    },
    alarmTime: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    alarmDate: {
        opacity: 0.7,
        marginBottom: 4,
    },
    alarmTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    alarmActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    empty: {
        marginTop: 50,
        alignItems: 'center',
    }
});
