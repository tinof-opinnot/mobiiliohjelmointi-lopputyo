import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { formatDateTime, toDateTime } from '../format';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Näytetään ilmoitus myös silloin, kun sovellus on auki
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function hasPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Ajastaa muistutuksen 24 h ennen retkeä. Jos siihen on alle vuorokausi,
// muistutus tulee tuntia ennen. Palauttaa { id, date } tai null.
export async function scheduleReminder({ rideName, date, time, persons }) {
  if (!(await hasPermission())) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Muistutukset',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const rideStart = toDateTime(date, time);
  const now = Date.now();
  let triggerDate = new Date(rideStart.getTime() - DAY_MS);
  let when = 'huomenna';
  if (triggerDate.getTime() <= now) {
    triggerDate = new Date(rideStart.getTime() - HOUR_MS);
    when = 'tunnin päästä';
  }
  if (triggerDate.getTime() <= now) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Pony Club: retki lähestyy',
      body: `${rideName} alkaa ${when} klo ${time} (${persons} hlö).`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: 'reminders',
    },
  });
  return { id, date: triggerDate, label: formatDateTime(triggerDate) };
}

export async function cancelReminder(notificationId) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
