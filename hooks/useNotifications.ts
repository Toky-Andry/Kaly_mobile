import * as Notifications from 'expo-notifications';
import { getAllRepas } from './useDatabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,  // ← ajouté
    shouldShowList: true,    // ← ajouté
  }),
});

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function getLaokaForJour(jour: string): string {
  const repas = getAllRepas().filter(r => r.jour === jour);
  if (repas.length === 0) return 'Tsy misy laoka napetraka';
  return repas.map(r => r.nom).join(', ');
}

export async function demanderPermissionNotification(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function programmerNotifications(): Promise<void> {
  const permitted = await demanderPermissionNotification();
  if (!permitted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const maintenant = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(maintenant);
    date.setDate(maintenant.getDate() + i);
    const jourIndex = date.getDay();
    const jourNom = JOURS_FR[jourIndex];
    const laokaAujourdhui = getLaokaForJour(jourNom);
    const jourSuivantNom = JOURS_FR[(jourIndex + 1) % 7];
    const laokaRahampitso = getLaokaForJour(jourSuivantNom);

    // 🌅 Matin 8h00
    const matin = new Date(date);
    matin.setHours(8, 0, 0, 0);
    if (matin > maintenant) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍛 Sakafo Androany !',
          body: `${jourNom} : ${laokaAujourdhui}`,
          sound: true,
          data: { type: 'matin', jour: jourNom },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: matin,
        },
      });
    }

    // 🌙 Soir 19h00
    const soir = new Date(date);
    soir.setHours(19, 0, 0, 0);
    if (soir > maintenant) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌙 Sakafo Rahampitso !',
          body: `${jourSuivantNom} : ${laokaRahampitso}`,
          sound: true,
          data: { type: 'soir', jour: jourSuivantNom },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: soir,
        },
      });
    }
  }
}

export async function annulerToutesNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function notificationTest(): Promise<void> {
  const permitted = await demanderPermissionNotification();
  if (!permitted) return;

  const today = new Date();
  const jourNom = JOURS_FR[today.getDay()];
  const laoka = getLaokaForJour(jourNom);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🍛 Test — Sakafo Androany !',
      body: `${jourNom} : ${laoka}`,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
    },
  });
}