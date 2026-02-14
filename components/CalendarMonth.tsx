
import { useThemeColor } from '@/hooks/use-theme-color';
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';

interface CalendarMonthProps {
    currentDate: Date;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    events?: { [dateString: string]: boolean }; // Map to show dots
}

export function CalendarMonth({ currentDate, selectedDate, onSelectDate, events }: CalendarMonthProps) {
    const textColor = useThemeColor({}, 'text');
    const tintColor = useThemeColor({}, 'tint');

    const days = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        return eachDayOfInterval({
            start: startDate,
            end: endDate,
        });
    }, [currentDate]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <View style={styles.container}>
            <View style={styles.weekRow}>
                {weekDays.map(day => (
                    <ThemedText key={day} style={styles.weekDayText}>{day}</ThemedText>
                ))}
            </View>
            <View style={styles.daysGrid}>
                {days.map((day, index) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);

                    return (
                        <TouchableOpacity
                            key={day.toISOString()}
                            style={[
                                styles.dayCell,
                                isSelected && { backgroundColor: tintColor, borderRadius: 20 }
                            ]}
                            onPress={() => onSelectDate(day)}
                        >
                            <ThemedText
                                style={[
                                    styles.dayText,
                                    !isCurrentMonth && { opacity: 0.3 },
                                    isSelected && { color: '#fff' },
                                    isTodayDate && !isSelected && { color: tintColor, fontWeight: 'bold' }
                                ]}
                            >
                                {format(day, 'd')}
                            </ThemedText>
                            {/* Event Dot */}
                            {events && events[format(day, 'yyyy-MM-dd')] && (
                                <View style={[styles.dot, isSelected && { backgroundColor: '#fff' }]} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    weekDayText: {
        fontSize: 12,
        opacity: 0.6,
        width: 30,
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    dayText: {
        fontSize: 16,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'red',
        marginTop: 2,
    }
});
