import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { notifyDonors } from './AlertController';

/**
 * Cria um novo pedido de sangue no Firestore e dispara notificações regionais.
 *
 * A notificação é fire-and-forget: qualquer falha em notifyDonors é capturada
 * silenciosamente e nunca impede o retorno do docRef ao caller.
 *
 * @param {object} data - Dados do pedido (bloodType, urgency, hospitalName, region, etc.)
 * @returns {Promise<DocumentReference>} Referência do documento criado
 */
export async function createBloodRequest(data) {
  const docRef = await addDoc(collection(db, 'bloodRequests'), {
    ...data,
    status: 'open',
    respondedDonors: [],
    notifiedDonorsCount: 0,
    expandedToState: false,
    createdAt: new Date().toISOString(),
  });

  // Notifica doadores — falha silenciosa para não bloquear o salvamento
  try {
    await notifyDonors({ id: docRef.id, ...data });
  } catch (err) {
    console.warn('[DonationController] notifyDonors falhou:', err.message);
  }

  return docRef;
}
