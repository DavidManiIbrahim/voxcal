
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useApp } from '@/contexts/AppContext';

export default function EventModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addEvent, updateEvent, events } = useApp();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState(params.date ? new Date(params.date as string) : new Date());
  const [endDate, setEndDate] = useState(new Date(startDate.getTime() + 3600000)); // +1 hour
  const [hasAlarm, setHasAlarm] = useState(true);
  const [isVoice, setIsVoice] = useState(false);
  const [sound, setSound] = useState('Default');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (params.id) {
      const existingEvent = events.find(e => e.id === params.id);
      if (existingEvent) {
        setTitle(existingEvent.title);
        setNotes(existingEvent.notes || '');
        setStartDate(new Date(existingEvent.startDate));
        setEndDate(new Date(existingEvent.endDate));
        setHasAlarm(!!existingEvent.alarmId);
        setIsVoice(existingEvent.reminderType === 'voice');
        setSound(existingEvent.sound || 'Default');
      }
    } else if (params.hasAlarm === 'true') {
      setHasAlarm(true);
    }
  }, [params.id, params.hasAlarm, events]);

  const handleSave = async () => {
    if (!title) {
      alert('Please enter a title');
      return;
    }

    const newEvent = {
      id: params.id ? (params.id as string) : Math.random().toString(36).substr(2, 9),
      title,
      notes,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isAllDay: false,
      alarmId: hasAlarm ? 'pending' : undefined,
      reminderType: isVoice ? 'voice' : 'standard',
      sound: hasAlarm ? sound : undefined,
    };

    if (params.id) {
      await updateEvent(newEvent);
    } else {
      await addEvent(newEvent);
    }
    router.back();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setActivePicker(null);
      return;
    }

    const currentDate = selectedDate || (activePicker === 'start' ? startDate : endDate);

    if (Platform.OS === 'android') {
      setActivePicker(null);
    }

    if (activePicker === 'start') {
      setStartDate(currentDate);
      if (currentDate > endDate) {
        setEndDate(new Date(currentDate.getTime() + 3600000));
      }
    } else {
      setEndDate(currentDate);
    }
  };

  const showPicker = (type: 'start' | 'end', mode: 'date' | 'time') => {
    // If clicking the same trigger, toggle it off (mainly for iOS inline)
    if (activePicker === type && pickerMode === mode) {
      setActivePicker(null);
      return;
    }
    setActivePicker(type);
    setPickerMode(mode);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText type="title">{params.id ? 'Edit Event' : 'New Event'}</ThemedText>

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
          <View style={styles.dateTimeRow}>
            <TouchableOpacity onPress={() => showPicker('start', 'date')} style={styles.dateBtn}>
              <ThemedText>{format(startDate, 'EEE, MMM d, yyyy')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showPicker('start', 'time')} style={styles.timeBtn}>
              <ThemedText>{format(startDate, 'h:mm a')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText>End Time</ThemedText>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity onPress={() => showPicker('end', 'date')} style={styles.dateBtn}>
              <ThemedText>{format(endDate, 'EEE, MMM d, yyyy')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showPicker('end', 'time')} style={styles.timeBtn}>
              <ThemedText>{format(endDate, 'h:mm a')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {activePicker && (
          <DateTimePicker
            value={activePicker === 'start' ? startDate : endDate}
            mode={pickerMode}
            is24Hour={false}
            display="default"
            onChange={onDateChange}
            textColor="white"
          />
        )}

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

        {hasAlarm && !isVoice && (
          <View style={styles.inputGroup}>
            <ThemedText style={{ marginBottom: 10 }}>Alarm Sound</ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['Default', 'Chime', 'Beep', 'Cosmic'].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSound(s)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: sound === s ? '#2196F3' : 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    borderColor: sound === s ? '#2196F3' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  <ThemedText style={{ fontWeight: sound === s ? 'bold' : 'normal' }}>{s}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
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
    flex: 1,
  },
  timeBtn: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginTop: 8,
    width: 100,
    alignItems: 'center',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
