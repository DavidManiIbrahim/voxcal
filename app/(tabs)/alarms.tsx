
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, LayoutAnimation, Platform, StyleSheet, Switch, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function AlarmsScreen() {
    const router = useRouter();
    const { events, deleteEvent } = useApp();
    const [expandedId, setExpandedId] = React.useState<string | null>(null);

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    // Filter for events with alarms
    const activeAlarms = events.filter(e => e.alarmId).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const renderItem = ({ item }) => {
        const isExpanded = expandedId === item.id;
        return (
            <View style={styles.alarmItemContainer}>
                <TouchableOpacity
                    style={styles.alarmItem}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.alarmInfo}>
                        <ThemedText style={styles.alarmTime}>{format(new Date(item.startDate), 'h:mm a')}</ThemedText>
                        <ThemedText style={styles.alarmDate}>{format(new Date(item.startDate), 'EEE, MMM d')}</ThemedText>
                        <ThemedText style={styles.alarmTitle}>{item.title}</ThemedText>
                    </View>
                    <View style={styles.alarmActions}>
                        <Switch value={true} onValueChange={() => { }} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={"#f4f3f4"} />
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        {item.notes ? (
                            <ThemedText style={styles.notes}>{item.notes}</ThemedText>
                        ) : (
                            <ThemedText style={styles.noNotes}>No notes</ThemedText>
                        )}
                        <View style={styles.expandedActions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.editBtn]}
                                onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })}
                            >
                                <Ionicons name="create-outline" size={20} color="#fff" />
                                <ThemedText style={styles.btnText}>Edit</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.deleteBtn]}
                                onPress={() => deleteEvent(item.id)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#fff" />
                                <ThemedText style={styles.btnText}>Delete</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

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
                        <ThemedText>No alarms set.</ThemedText>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push({ pathname: '/modal', params: { hasAlarm: 'true' } })}
            >
                <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
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
        alignItems: 'center',
    },
    alarmItemContainer: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    alarmItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    expandedContent: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    notes: {
        fontSize: 14,
        marginBottom: 16,
        opacity: 0.8,
    },
    noNotes: {
        fontSize: 14,
        marginBottom: 16,
        opacity: 0.5,
        fontStyle: 'italic',
    },
    expandedActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editBtn: {
        backgroundColor: '#2196F3',
    },
    deleteBtn: {
        backgroundColor: '#ff4444',
    },
    btnText: {
        color: '#fff',
        marginLeft: 6,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    empty: {
        marginTop: 50,
        alignItems: 'center',
    }
});
