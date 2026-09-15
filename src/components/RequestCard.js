import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';

const URGENCY = {
  normal:        { label: 'Normal',        color: '#2E7D32', strip: '#43A047' },
  urgente:       { label: 'Urgente',       color: '#E65100', strip: '#FB8C00' },
  muito_urgente: { label: 'Muito Urgente', color: '#C62828', strip: '#E53935' },
  critico:       { label: '⚠ CRÍTICO',    color: '#4A148C', strip: '#7B1FA2' },
};

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

const DONORS_FOR = {
  'AB+': ['O-','O+','A-','A+','B-','B+','AB-','AB+'],
  'AB-': ['O-','A-','B-','AB-'],
  'A+':  ['O-','O+','A-','A+'],
  'A-':  ['O-','A-'],
  'B+':  ['O-','O+','B-','B+'],
  'B-':  ['O-','B-'],
  'O+':  ['O-','O+'],
  'O-':  ['O-'],
};

export default function RequestCard({ request, userBloodType, onClose }) {
  const cfg = URGENCY[request.urgency] || URGENCY.normal;
  const canDonate = userBloodType && (DONORS_FOR[request.bloodType] || []).includes(userBloodType);

  const handleHelp = () => {
    const rawPhone = request.requesterPhone?.replace(/\D/g, '');
    const phoneLabel = request.requesterPhone || 'Não informado';

    const buttons = [{ text: 'Fechar', style: 'cancel' }];
    if (rawPhone) {
      buttons.push({
        text: `📞 Ligar: ${request.requesterPhone}`,
        onPress: () => Linking.openURL(`tel:${rawPhone}`),
      });
    }

    Alert.alert(
      canDonate ? '❤️ Você pode ajudar!' : 'Informações do pedido',
      `👤 ${request.requesterName}\n🏥 ${request.hospital}\n📍 ${request.city}\n🩸 Tipo necessário: ${request.bloodType}\n📞 ${phoneLabel}`,
      buttons,
    );
  };

  return (
    <View style={styles.card}>
      <View style={[styles.strip, { backgroundColor: cfg.strip }]}>
        <Text style={styles.stripLabel}>{cfg.label}</Text>
        <Text style={styles.stripTime}>{timeAgo(request.createdAt)}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.bloodWrap}>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{request.bloodType}</Text>
          </View>
          {canDonate && (
            <View style={styles.compatChip}>
              <Text style={styles.compatText}>✓ Você</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.hospital} numberOfLines={2}>{request.hospital}</Text>
          <Text style={styles.city}>📍 {request.city}</Text>
          {request.patientName ? (
            <Text style={styles.detail}>👤 {request.patientName}</Text>
          ) : null}
          {request.notes ? (
            <Text style={styles.notes} numberOfLines={2}>{request.notes}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.helpBtn, !canDonate && styles.helpBtnGray]}
          onPress={handleHelp}
          activeOpacity={0.8}
        >
          <Text style={styles.helpBtnText}>
            {canDonate ? '❤️  Quero Ajudar' : 'Ver Contato'}
          </Text>
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity style={styles.resolvedBtn} onPress={onClose}>
            <Text style={styles.resolvedText}>✓ Marcar como resolvido</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stripLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  stripTime: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  body: { flexDirection: 'row', gap: 14, padding: 16, alignItems: 'flex-start' },
  bloodWrap: { alignItems: 'center', gap: 6 },
  bloodBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#B71C1C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bloodText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  compatChip: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  compatText: { color: '#2E7D32', fontSize: 11, fontWeight: '800' },
  info: { flex: 1 },
  hospital: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', lineHeight: 21, marginBottom: 4 },
  city: { fontSize: 13, color: '#757575', marginBottom: 2 },
  detail: { fontSize: 13, color: '#757575', marginBottom: 2 },
  notes: { fontSize: 12, color: '#BDBDBD', marginTop: 6, fontStyle: 'italic', lineHeight: 17 },
  footer: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  helpBtn: {
    backgroundColor: '#B71C1C',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  helpBtnGray: { backgroundColor: '#757575' },
  helpBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  resolvedBtn: { alignItems: 'center', paddingVertical: 4 },
  resolvedText: { color: '#BDBDBD', fontSize: 13 },
});
