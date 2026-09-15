import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';

const AVATAR_COLORS = ['#B71C1C', '#1565C0', '#2E7D32', '#6A1B9A', '#E65100', '#00695C'];

function avatarColor(name = '') {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

export default function DonorCard({ donor }) {
  const handleContact = () => {
    const rawPhone = donor.phone?.replace(/\D/g, '');
    const buttons = [{ text: 'Fechar', style: 'cancel' }];
    if (rawPhone) {
      buttons.push({
        text: `📞 Ligar: ${donor.phone}`,
        onPress: () => Linking.openURL(`tel:${rawPhone}`),
      });
    }
    Alert.alert(
      donor.name,
      `🩸 Tipo: ${donor.bloodType}\n📍 ${donor.city}\n📞 ${donor.phone || 'Não informado'}`,
      buttons,
    );
  };

  const color = avatarColor(donor.name);

  return (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>
          {donor.name ? donor.name.charAt(0).toUpperCase() : '?'}
        </Text>
        <View style={styles.bloodBadge}>
          <Text style={styles.bloodText}>{donor.bloodType}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{donor.name}</Text>
        <Text style={styles.city}>📍 {donor.city}</Text>
        <View style={[
          styles.statusChip,
          { backgroundColor: donor.isAvailable ? '#E8F5E9' : '#F5F5F5' },
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: donor.isAvailable ? '#43A047' : '#BDBDBD' },
          ]} />
          <Text style={[
            styles.statusText,
            { color: donor.isAvailable ? '#2E7D32' : '#9E9E9E' },
          ]}>
            {donor.isAvailable ? 'Disponível' : 'Indisponível'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.contactBtn} onPress={handleContact} activeOpacity={0.8}>
        <Text style={styles.contactIcon}>📞</Text>
        <Text style={styles.contactLabel}>Contato</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    position: 'relative',
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  bloodBadge: {
    position: 'absolute',
    bottom: -4,
    right: -6,
    backgroundColor: '#B71C1C',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bloodText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  city: { fontSize: 12, color: '#9E9E9E', marginBottom: 6 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  contactBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    width: 56,
    height: 56,
    flexShrink: 0,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
  },
  contactIcon: { fontSize: 18 },
  contactLabel: { fontSize: 10, color: '#B71C1C', fontWeight: '700', marginTop: 2 },
});
