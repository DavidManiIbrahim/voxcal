
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/contexts/AppContext';

export default function EventModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addEvent } = useApp();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState(params.date ? new Date(params.date as string) : new Date());
  const [endDate, setEndDate] = useState(new Date(startDate.getTime() + 3600000)); // +1 hour
  const [hasAlarm, setHasAlarm] = useState(true);
  const [isVoice, setIsVoice] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleSave = async () => {
    if (!title) {
      alert('Please enter a title');
      return;
    }

    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      notes,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isAllDay: false,
      alarmId: hasAlarm ? 'pending' : undefined,
      reminderType: isVoice ? 'voice' : 'standard',
    };

    await addEvent(newEvent);
    router.back();
  };

  const handleDateChange = (event, selectedDate: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleEndChange = (event, selectedDate: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title">New Event</ThemedText>

        <View style={styles.inputGroup}>
          <ThemedText>Title</ThemedText>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Event Title"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText>Start Time</ThemedText>
          {Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
              <ThemedText>{format(startDate, 'PP p')}</ThemedText>
            </TouchableOpacity>
          )}
          {(showStartPicker || Platform.OS === 'ios') && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
              textColor="white" // iOS dark mode hack if needed, though system theme handles usually
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText>End Time</ThemedText>
          {Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
              <ThemedText>{format(endDate, 'PP p')}</ThemedText>
            </TouchableOpacity>
          )}
          {(showEndPicker || Platform.OS === 'ios') && (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display="default"
              onChange={handleEndChange}
              minimumDate={startDate}
            />
          )}
        </View>

        <View style={styles.row}>
          <ThemedText>Enable Alarm</ThemedText>
          <Switch value={hasAlarm} onValueChange={setHasAlarm} />
        </View>

        {hasAlarm && (
          <View style={styles.row}>
            <ThemedText>Voice Reminder</ThemedText>
            <Switch value={isVoice} onValueChange={setIsVoice} />
          </View>
        )}

        <View style={styles.inputGroup}>
          <ThemedText>Notes</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Details..."
            placeholderTextColor="#888"
            multiline
          />
        </View>

        <Button title="Save Event" onPress={handleSave} />
        <Button title="Cancel" color="red" onPress={() => router.back()} />

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scroll: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 10,
    borderRadius: 8,
  },
  dateBtn: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginTop: 8,
  }
});
