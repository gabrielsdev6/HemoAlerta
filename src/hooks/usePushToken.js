import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'HemoAlerta',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B71C1C',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;

  if (existing !== 'granted') {
    const { status: requested } = await Notifications.requestPermissionsAsync();
    status = requested;
  }

  if (status !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

export function usePushToken() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    registerForPushNotifications()
      .then(async (token) => {
        if (token) {
          try {
            await updateDoc(doc(db, 'users', user.uid), { pushToken: token });
          } catch (_) {}
        }
      })
      .catch(() => {});
  }, [user?.uid]);
}
