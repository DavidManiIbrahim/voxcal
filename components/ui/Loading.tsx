
import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';

export default function Loading() {
    const tintColor = useThemeColor({}, 'tint');

    return (
        <View style={styles.container}>
            <ThemedText style={styles.text} type="title">VoxCal</ThemedText>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={styles.subtext}>Loading reliable alarms...</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)', // Dark overlay
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    text: {
        marginBottom: 20,
        color: '#fff',
    },
    subtext: {
        marginTop: 10,
        color: '#ccc',
        fontSize: 12,
    }
});
