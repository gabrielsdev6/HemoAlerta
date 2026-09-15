import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Which blood types can donate to each type
const DONORS_FOR = {
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'A+':  ['O-', 'O+', 'A-', 'A+'],
  'A-':  ['O-', 'A-'],
  'B+':  ['O-', 'O+', 'B-', 'B+'],
  'B-':  ['O-', 'B-'],
  'O+':  ['O-', 'O+'],
  'O-':  ['O-'],
};

const URGENCY_LABEL = {
  normal:        'Pedido',
  urgente:       'Urgente',
  muito_urgente: 'Muito Urgente',
  critico:       '⚠ CRÍTICO',
};

export async function notifyCompatibleDonors({ bloodType, municipio, hospital, urgency }) {
  const compatibleTypes = DONORS_FOR[bloodType];
  if (!compatibleTypes?.length || !municipio) return;

  try {
    // Query available donors in the same municipality
    // bloodType 'in' filter limited to 10 items — all types fit within this limit
    const q = query(
      collection(db, 'users'),
      where('municipio', '==', municipio),
      where('isAvailable', '==', true),
      where('bloodType', 'in', compatibleTypes.slice(0, 10)),
    );

    const snap = await getDocs(q);
    const tokens = snap.docs
      .map((d) => d.data().pushToken)
      .filter(Boolean);

    if (!tokens.length) return;

    // Expo Push API accepts batches of up to 100 messages
    for (let i = 0; i < tokens.length; i += 100) {
      const batch = tokens.slice(i, i + 100).map((to) => ({
        to,
        title: `🩸 ${URGENCY_LABEL[urgency] || 'Pedido'} de ${bloodType}`,
        body: `${hospital} em ${municipio} precisa de doação. Você pode ajudar!`,
        data: { municipio, bloodType },
        sound: 'default',
        priority: urgency === 'critico' ? 'high' : 'normal',
        channelId: 'default',
      }));

      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });
    }
  } catch (err) {
    console.warn('notificationService error:', err.message);
  }
}
