import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCompatibleTypes } from '../utils/bloodTypeUtils';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100; // limite da Expo Push API por requisição

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchDonors(conditions) {
  const q = query(collection(db, 'users'), ...conditions);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

function deduplicateByUid(arrays) {
  const map = new Map();
  arrays.flat().forEach((d) => map.set(d.uid, d));
  return Array.from(map.values());
}

function buildMessage(token, bloodRequest) {
  const city =
    bloodRequest.region?.city ||
    bloodRequest.region?.cityNormalized ||
    'sua cidade';
  const isCritical = bloodRequest.urgency === 'critical';

  return {
    to: token,
    title: isCritical
      ? `🚨 URGENTE em ${city}!`
      : `🩸 Pedido em ${city}`,
    body: `${bloodRequest.hospitalName} precisa de sangue ${bloodRequest.bloodType}`,
    data: { requestId: bloodRequest.id },
    sound: 'default',
    priority: isCritical ? 'high' : 'normal',
  };
}

async function sendBatches(tokens, bloodRequest) {
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens
      .slice(i, i + BATCH_SIZE)
      .map((token) => buildMessage(token, bloodRequest));

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
}

// ─── notifyDonors ────────────────────────────────────────────────────────────
/**
 * Notifica doadores compatíveis na cidade (e no estado inteiro para urgências críticas).
 *
 * Nota: as queries abaixo usam múltiplas condições em campos aninhados
 * (region.state, region.cityNormalized) e precisam de índices compostos
 * no Firestore. O console exibirá o link para criá-los caso ainda não existam.
 */
export async function notifyDonors(bloodRequest) {
  try {
    const { region, urgency, bloodType } = bloodRequest;
    if (!region?.state || !region?.cityNormalized || !bloodType) return;

    // 1. Tipos sanguíneos compatíveis com o tipo solicitado pelo pedido
    const compatibleTypes = getCompatibleTypes(bloodType);
    if (!compatibleTypes.length) return;

    // 2. Doadores da cidade
    const cityConditions = [
      where('role', '==', 'donor'),
      where('region.state', '==', region.state),
      where('region.cityNormalized', '==', region.cityNormalized),
      where('isEligible', '==', true),
    ];
    const donorsDaCidade = await fetchDonors(cityConditions);

    // 3. Para urgências críticas: busca estado inteiro e une sem duplicatas
    let donorsDoEstado = [];
    const expandedToState = urgency === 'critical';

    if (expandedToState) {
      const stateConditions = [
        where('role', '==', 'donor'),
        where('region.state', '==', region.state),
        where('isEligible', '==', true),
      ];
      donorsDoEstado = await fetchDonors(stateConditions);
    }

    const allDonors = deduplicateByUid([donorsDaCidade, donorsDoEstado]);

    // 4. Filtra pelo tipo sanguíneo compatível
    const filteredDonors = allDonors.filter((d) =>
      compatibleTypes.includes(d.bloodType),
    );

    // 5. Coleta tokens válidos — ignora silenciosamente quem não tem
    const validTokens = filteredDonors
      .map((d) => d.expoPushToken)
      .filter((t) => t != null && t !== '');

    if (!validTokens.length) {
      // Nenhum doador com token — apenas registra a contagem zero
      await updateDoc(doc(db, 'bloodRequests', bloodRequest.id), {
        notifiedDonorsCount: 0,
        notifiedAt: serverTimestamp(),
        expandedToState,
      });
      return;
    }

    // 6. Envia em lotes de 100
    await sendBatches(validTokens, bloodRequest);

    // 7. Atualiza o pedido com os metadados da notificação
    await updateDoc(doc(db, 'bloodRequests', bloodRequest.id), {
      notifiedDonorsCount: validTokens.length,
      notifiedAt: serverTimestamp(),
      expandedToState,
    });
  } catch (err) {
    // Falha na notificação nunca deve impedir o salvamento do pedido
    console.warn('[AlertController] notifyDonors error:', err.message);
  }
}

// ─── scheduleExpiryCheck ─────────────────────────────────────────────────────
/**
 * Agenda a expiração de um pedido usando setTimeout (MVP).
 *
 * Limitações do MVP:
 *  - Cancela se o app for fechado (JS thread encerrado).
 *  - setTimeout tem delay máximo de ~24.8 dias (2^31 ms).
 *  - Para produção, use Firebase Cloud Functions com scheduledFunction ou TTL.
 */
export function scheduleExpiryCheck(requestId, expiresAt) {
  const delay = new Date(expiresAt).getTime() - Date.now();

  if (delay <= 0) {
    // Já expirou — atualiza imediatamente
    updateDoc(doc(db, 'bloodRequests', requestId), { status: 'expired' }).catch(
      (err) => console.warn('[AlertController] expiry update error:', err.message),
    );
    return;
  }

  setTimeout(() => {
    updateDoc(doc(db, 'bloodRequests', requestId), { status: 'expired' }).catch(
      (err) => console.warn('[AlertController] expiry update error:', err.message),
    );
  }, delay);
}
