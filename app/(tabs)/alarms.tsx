
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
    const [activeTab, setActiveTab] = React.useState<'alarms' | 'timer' | 'stopwatch'>('alarms');

    // Timer State
    const [timerDuration, setTimerDuration] = React.useState(0); // in seconds
    const [timerRemaining, setTimerRemaining] = React.useState(0);
    const [isTimerRunning, setIsTimerRunning] = React.useState(false);
    const timerInterval = React.useRef<NodeJS.Timeout | null>(null);

    // Stopwatch State
    const [stopwatchTime, setStopwatchTime] = React.useState(0); // in ms
    const [isStopwatchRunning, setIsStopwatchRunning] = React.useState(false);
    const stopwatchInterval = React.useRef<NodeJS.Timeout | null>(null);
    const [laps, setLaps] = React.useState<number[]>([]);

    const toggleExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    // Timer Logic
    React.useEffect(() => {
        if (isTimerRunning && timerRemaining > 0) {
            timerInterval.current = setInterval(() => {
                setTimerRemaining((prev) => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        clearInterval(timerInterval.current!);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerInterval.current) clearInterval(timerInterval.current);
        }
        return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
    }, [isTimerRunning, timerRemaining]);

    const startTimer = () => {
        if (timerRemaining === 0) setTimerRemaining(timerDuration);
        setIsTimerRunning(true);
    };

    const pauseTimer = () => setIsTimerRunning(false);
    const resetTimer = () => {
        setIsTimerRunning(false);
        setTimerRemaining(timerDuration);
    };

    // Stopwatch Logic
    React.useEffect(() => {
        if (isStopwatchRunning) {
            const startTime = Date.now() - stopwatchTime;
            stopwatchInterval.current = setInterval(() => {
                setStopwatchTime(Date.now() - startTime);
            }, 10);
        } else {
            if (stopwatchInterval.current) clearInterval(stopwatchInterval.current);
        }
        return () => { if (stopwatchInterval.current) clearInterval(stopwatchInterval.current); };
    }, [isStopwatchRunning]);

    const startStopwatch = () => setIsStopwatchRunning(true);
    const stopStopwatch = () => setIsStopwatchRunning(false);
    const resetStopwatch = () => {
        setIsStopwatchRunning(false);
        setStopwatchTime(0);
        setLaps([]);
    };
    const lapStopwatch = () => {
        setLaps([stopwatchTime, ...laps]);
    };

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centis = Math.floor((ms % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
    };

    const formatTimer = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

    const renderContent = () => {
        if (activeTab === 'alarms') {
            return (
                <>
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
                </>
            );
        } else if (activeTab === 'timer') {
            return (
                <View style={styles.centerContainer}>
                    <View style={styles.timerDisplay}>
                        <ThemedText style={styles.timerText}>{formatTimer(timerRemaining)}</ThemedText>
                    </View>

                    {timerRemaining === 0 && !isTimerRunning && (
                        <View style={styles.presetContainer}>
                            {[60, 300, 600, 1800].map(s => (
                                <TouchableOpacity key={s} style={styles.presetBtn} onPress={() => { setTimerDuration(s); setTimerRemaining(s); }}>
                                    <ThemedText>{s / 60} min</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.controls}>
                        {!isTimerRunning ? (
                            <TouchableOpacity style={[styles.controlBtn, styles.startBtn]} onPress={startTimer}>
                                <ThemedText style={styles.controlText}>Start</ThemedText>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.controlBtn, styles.stopBtn]} onPress={pauseTimer}>
                                <ThemedText style={styles.controlText}>Pause</ThemedText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={resetTimer}>
                            <ThemedText style={styles.controlText}>Reset</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        } else {
            return (
                <View style={styles.centerContainer}>
                    <ThemedText style={styles.timerText}>{formatTime(stopwatchTime)}</ThemedText>
                    <View style={styles.controls}>
                        {!isStopwatchRunning ? (
                            <TouchableOpacity style={[styles.controlBtn, styles.startBtn]} onPress={startStopwatch}>
                                <ThemedText style={styles.controlText}>Start</ThemedText>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.controlBtn, styles.stopBtn]} onPress={stopStopwatch}>
                                <ThemedText style={styles.controlText}>Stop</ThemedText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={isStopwatchRunning ? lapStopwatch : resetStopwatch}>
                            <ThemedText style={styles.controlText}>{isStopwatchRunning ? 'Lap' : 'Reset'}</ThemedText>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        style={{ marginTop: 20, width: '100%' }}
                        data={laps}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <View style={styles.lapItem}>
                                <ThemedText>Lap {laps.length - index}</ThemedText>
                                <ThemedText>{formatTime(item)}</ThemedText>
                            </View>
                        )}
                    />
                </View>
            );
        }
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.topTabs}>
                {['alarms', 'timer', 'stopwatch'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabBtn, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab as any)}
                    >
                        <ThemedText style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            {renderContent()}
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
    },
    topTabs: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 4,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#2196F3',
    },
    tabText: {
        fontWeight: '600',
        opacity: 0.6,
    },
    activeTabText: {
        opacity: 1,
        color: '#fff',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
    },
    timerText: {
        fontSize: 64,
        fontWeight: '200',
        fontVariant: ['tabular-nums'],
    },
    controls: {
        flexDirection: 'row',
        marginTop: 40,
        gap: 20,
    },
    controlBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    startBtn: {
        backgroundColor: 'rgba(50, 205, 50, 0.3)',
    },
    stopBtn: {
        backgroundColor: 'rgba(255, 69, 0, 0.3)',
    },
    resetBtn: {
        backgroundColor: 'rgba(128, 128, 128, 0.3)',
    },
    controlText: {
        fontSize: 16,
        fontWeight: '600',
    },
    timerDisplay: {
        marginBottom: 40,
    },
    presetContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    presetBtn: {
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    lapItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    }
});
