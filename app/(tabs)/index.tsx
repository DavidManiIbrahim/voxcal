
import { Ionicons } from '@expo/vector-icons';
import { addMonths, format, isSameDay, subMonths } from 'date-fns';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { CalendarMonth } from '@/components/CalendarMonth'; // Oops, I named it that
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/contexts/AppContext';

export default function CalendarScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { events } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const eventsForSelectedDate = events.filter(event =>
    isSameDay(new Date(event.startDate), selectedDate)
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Optimize event map for calendar dots
  const eventsMap = events.reduce((acc, event) => {
    const dateKey = format(new Date(event.startDate), 'yyyy-MM-dd');
    acc[dateKey] = true;
    return acc;
  }, {} as Record<string, boolean>);

  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => router.push({ pathname: '/modal', params: { id: item.id } })} // Edit event
    >
      <View style={styles.eventTimeContainer}>
        <ThemedText style={styles.eventTime}>
          {format(new Date(item.startDate), 'HH:mm')}
        </ThemedText>
        <ThemedText style={styles.eventEndTime}>
          {item.endDate ? format(new Date(item.endDate), 'HH:mm') : ''}
        </ThemedText>
      </View>
      <View style={[styles.eventContent, { borderLeftColor: item.calendarColor || '#2196F3' }]}>
        <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
        {item.notes && <ThemedText numberOfLines={1} style={styles.eventNote}>{item.notes}</ThemedText>}
        {item.alarmId && <Ionicons name="alarm" size={14} color="#666" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <Ionicons name="chevron-back" size={24} color="#666" />
        </TouchableOpacity>
        <ThemedText type="subtitle">{format(currentDate, 'MMMM yyyy')}</ThemedText>
        <TouchableOpacity onPress={handleNextMonth}>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <CalendarMonth
        currentDate={currentDate}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        events={eventsMap}
      />

      {/* Selected Date Header */}
      <View style={styles.dateHeader}>
        <ThemedText type="link">{format(selectedDate, 'EEEE, MMMM d')}</ThemedText>
      </View>

      {/* Events List */}
      <FlatList
        data={eventsForSelectedDate}
        keyExtractor={item => item.id}
        renderItem={renderEventItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText>No events for this day.</ThemedText>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/modal', params: { date: selectedDate.toISOString() } })}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f033',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  eventItem: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  eventTimeContainer: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  eventTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventEndTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  eventContent: {
    flex: 1,
    padding: 10,
    borderLeftWidth: 4,
    justifyContent: 'center',
  },
  eventNote: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
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
});
