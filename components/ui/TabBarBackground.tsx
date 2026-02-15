import { useColorScheme } from '@/hooks/use-color-scheme';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

export default function TabBarBackground() {
  const colorScheme = useColorScheme();

  if (Platform.OS === 'ios') {
    return (
      <BlurView tint="systemChromeMaterial" intensity={100} style={StyleSheet.absoluteFill} />
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colorScheme === 'dark' ? '#1D1D1D' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
        }
      ]}
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
