import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const BLOOD_FACTS = {
  'O-':  'Doador universal — seu sangue pode salvar qualquer pessoa.',
  'O+':  'Tipo mais comum no Brasil. Pode receber de O+ e O-.',
  'A+':  'Pode receber de A+, A-, O+ e O-.',
  'A-':  'Pode receber de A- e O-.',
  'B+':  'Pode receber de B+, B-, O+ e O-.',
  'B-':  'Pode receber de B- e O-.',
  'AB+': 'Receptor universal — pode receber de todos os tipos.',
  'AB-': 'Pode receber de AB-, A-, B- e O-.',
};

export default function ProfileScreen() {
  const { userProfile, user, logout, updateProfile } = useAuth();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (value) => {
    setToggling(true);
    try { await updateProfile({ isAvailable: value }); } catch (_) {}
    setToggling(false);
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  const initial = userProfile?.name?.charAt(0)?.toUpperCase() || '?';
  const donations = userProfile?.totalDonations ?? 0;
  const bloodFact = BLOOD_FACTS[userProfile?.bloodType];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            {userProfile?.bloodType && (
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodBadgeText}>{userProfile.bloodType}</Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{userProfile?.name || 'Usuário'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>

          <View style={styles.memberPill}>
            <Text style={styles.memberText}>
              Membro desde{' '}
              {userProfile?.createdAt
                ? new Date(userProfile.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                : '—'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{donations}</Text>
            <Text style={styles.statLbl}>Doações</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{donations * 4}</Text>
            <Text style={styles.statLbl}>Vidas salvas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#2E7D32' }]}>
              {userProfile?.isAvailable ? '✓' : '–'}
            </Text>
            <Text style={styles.statLbl}>Disponível</Text>
          </View>
        </View>

        {/* Fact card */}
        {bloodFact && (
          <View style={styles.factCard}>
            <View style={styles.factIconWrap}>
              <Text style={styles.factIcon}>💡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.factTitle}>Seu tipo sanguíneo</Text>
              <Text style={styles.factText}>{bloodFact}</Text>
            </View>
          </View>
        )}

        {/* Disponibilidade */}
        <View style={styles.section}>
          <View style={styles.availRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.availTitle}>Disponível para doar</Text>
              <Text style={styles.availSub}>Aparecer na lista de doadores</Text>
            </View>
            <Switch
              value={!!userProfile?.isAvailable}
              onValueChange={handleToggle}
              disabled={toggling}
              trackColor={{ false: '#E0E0E0', true: '#FFCDD2' }}
              thumbColor={userProfile?.isAvailable ? '#B71C1C' : '#BDBDBD'}
            />
          </View>
        </View>

        {/* Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INFORMAÇÕES</Text>
          {[
            { icon: '🩸', label: 'Tipo sanguíneo', value: userProfile?.bloodType },
            { icon: '📍', label: 'Cidade', value: userProfile?.city },
            { icon: '📞', label: 'Telefone', value: userProfile?.phone },
            { icon: '📧', label: 'E-mail', value: user?.email },
          ].map(({ icon, label, value }) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoIcon}>{icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || '—'}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },

  hero: {
    backgroundColor: '#B71C1C',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
  bloodBadge: {
    position: 'absolute',
    bottom: -2,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bloodBadgeText: { color: '#B71C1C', fontWeight: '900', fontSize: 13 },
  name: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  memberPill: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  memberText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },

  statsRow: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    marginTop: -20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 32, fontWeight: '900', color: '#B71C1C' },
  statLbl: { fontSize: 12, color: '#9E9E9E', marginTop: 3 },
  statDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0' },

  factCard: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  factIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3CD',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  factIcon: { fontSize: 20 },
  factTitle: { fontSize: 12, fontWeight: '800', color: '#F57F17', marginBottom: 3 },
  factText: { fontSize: 13, color: '#795548', lineHeight: 19 },

  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BDBDBD',
    letterSpacing: 1,
    marginBottom: 12,
  },
  availRow: { flexDirection: 'row', alignItems: 'center' },
  availTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  availSub: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  infoLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '600', marginTop: 1 },

  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
  },
  logoutText: { color: '#B71C1C', fontWeight: '800', fontSize: 15 },
});
