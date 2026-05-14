import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BLOOD_BANKS = [
  { id: '1',  name: 'Fundação Pró-Sangue',           city: 'São Paulo - SP',        address: 'Av. Dr. Enéas de Carvalho Aguiar, 155', phone: '(11) 3081-3800', hours: 'Seg–Sex: 7h–19h | Sáb: 7h–13h' },
  { id: '2',  name: 'Hemorio',                        city: 'Rio de Janeiro - RJ',   address: 'Rua Frei Caneca, 8 - Centro',           phone: '(21) 2332-8600', hours: 'Seg–Sex: 7h–18h | Sáb: 7h–13h' },
  { id: '3',  name: 'Hemocentro de Campinas',         city: 'Campinas - SP',         address: 'Rua Carlos Chagas, 480',                phone: '(19) 3521-8300', hours: 'Seg–Sex: 7h–19h' },
  { id: '4',  name: 'Hemominas',                      city: 'Belo Horizonte - MG',   address: 'Alameda Ezequiel Dias, 321',            phone: '(31) 3339-9300', hours: 'Seg–Sex: 7h–18h | Sáb: 7h–12h' },
  { id: '5',  name: 'Hemepar',                        city: 'Curitiba - PR',         address: 'Rua Presidente Faria, 105',             phone: '(41) 3330-4399', hours: 'Seg–Sex: 7h–18h' },
  { id: '6',  name: 'Hemosc',                         city: 'Florianópolis - SC',    address: 'Rua São Francisco, 1260',               phone: '(48) 3221-9400', hours: 'Seg–Sex: 7h–18h' },
  { id: '7',  name: 'Hemocentro de Ribeirão Preto',  city: 'Ribeirão Preto - SP',   address: 'Rua Tenente Catão Roxo, 2501',          phone: '(16) 3602-1000', hours: 'Seg–Sex: 7h–18h' },
  { id: '8',  name: 'Hemorgs',                        city: 'Porto Alegre - RS',     address: 'Rua Dona Leonor, 329',                  phone: '(51) 3224-7200', hours: 'Seg–Sex: 7h–18h | Sáb: 7h–12h' },
  { id: '9',  name: 'Hemope',                         city: 'Recife - PE',           address: 'Rua Joaquim Nabuco, 200',               phone: '(81) 3184-4400', hours: 'Seg–Sex: 6h30–18h' },
  { id: '10', name: 'Hemoal',                         city: 'Maceió - AL',           address: 'Rua Comendador Leão, 1090',             phone: '(82) 3315-1800', hours: 'Seg–Sex: 7h–17h' },
  { id: '11', name: 'Hemoba',                         city: 'Salvador - BA',         address: 'Av. Vasco da Gama, 01',                 phone: '(71) 3116-3600', hours: 'Seg–Sex: 7h–18h | Sáb: 7h–12h' },
  { id: '12', name: 'Hemoce',                         city: 'Fortaleza - CE',        address: 'Av. José Jucá, s/n - Papicu',          phone: '(85) 3101-3800', hours: 'Seg–Sex: 7h–17h' },
];

const STATE_COLORS = {
  SP: '#1565C0', RJ: '#2E7D32', MG: '#6A1B9A', PR: '#00695C',
  SC: '#E65100', RS: '#B71C1C', PE: '#F57F17', AL: '#4527A0',
  BA: '#BF360C', CE: '#00838F',
};

function getStateColor(city) {
  const state = city.split(' - ')[1];
  return STATE_COLORS[state] || '#B71C1C';
}

function BankCard({ bank }) {
  const color = getStateColor(bank.city);
  const state = bank.city.split(' - ')[1];

  const handleInfo = () => {
    Alert.alert(
      bank.name,
      `📞 ${bank.phone}\n📍 ${bank.address}\n🏙 ${bank.city}\n⏰ ${bank.hours}`,
      [{ text: 'Fechar' }]
    );
  };

  return (
    <View style={styles.card}>
      <View style={[styles.stateBadge, { backgroundColor: color }]}>
        <Text style={styles.stateText}>{state}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.bankName}>{bank.name}</Text>
        <Text style={styles.bankCity}>📍 {bank.city}</Text>
        <Text style={styles.bankHours} numberOfLines={1}>⏰ {bank.hours}</Text>
      </View>

      <TouchableOpacity style={styles.infoBtn} onPress={handleInfo} activeOpacity={0.8}>
        <Text style={styles.infoBtnIcon}>📞</Text>
        <Text style={styles.infoBtnLabel}>Info</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BloodBanksScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backWrap}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Bancos de Sangue</Text>
          <Text style={styles.headerSub}>{BLOOD_BANKS.length} hemocentros cadastrados</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Aviso */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          Ligue antes de ir para confirmar horários e necessidade do seu tipo sanguíneo.
        </Text>
      </View>

      <FlatList
        data={BLOOD_BANKS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <BankCard bank={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },

  header: {
    backgroundColor: '#B71C1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  backWrap: { width: 40 },
  backText: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFDE7',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#F9A825',
  },
  tipIcon: { fontSize: 16, marginTop: 1 },
  tipText: { flex: 1, fontSize: 13, color: '#795548', lineHeight: 19 },

  list: { padding: 16, gap: 10, paddingBottom: 30 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  stateBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stateText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  cardContent: { flex: 1 },
  bankName: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 3 },
  bankCity: { fontSize: 12, color: '#9E9E9E', marginBottom: 2 },
  bankHours: { fontSize: 11, color: '#BDBDBD' },
  infoBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    width: 52,
    height: 52,
    flexShrink: 0,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
  },
  infoBtnIcon: { fontSize: 18 },
  infoBtnLabel: { fontSize: 10, color: '#B71C1C', fontWeight: '700', marginTop: 2 },
});
