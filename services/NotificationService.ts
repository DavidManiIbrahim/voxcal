
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  // token = (await Notifications.getExpoPushTokenAsync()).data;
  // console.log(token);
  return token;
}

export async function scheduleAlarm(
  title: string,
  body: string,
  triggerDate: Date,
  data: any = {}
) {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default', // Custom sounds need local assets
      data,
    },
    trigger: triggerDate,
  });
  return id;
}

export async function cancelAlarm(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function getAllScheduledAlarms() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
