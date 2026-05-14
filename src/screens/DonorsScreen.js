import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import DonorCard from '../components/DonorCard';

const BLOOD_TYPES = ['Todos', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function DonorsScreen() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    loadDonors();
  }, []);

  const loadDonors = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('isAvailable', '==', true));
      const snap = await getDocs(q);
      setDonors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (_) {}
    setLoading(false);
  };

  const filtered =
    filter === 'Todos' ? donors : donors.filter((d) => d.bloodType === filter);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Doadores Disponíveis</Text>
        <Text style={styles.subtitle}>{filtered.length} doador(es) encontrado(s)</Text>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={BLOOD_TYPES}
          keyExtractor={(i) => i}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, filter === item && styles.chipActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C62828" />
          <Text style={styles.loadingText}>Buscando doadores...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={styles.emptyTitle}>Nenhum doador disponível</Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'Todos'
              ? 'Ainda não há doadores cadastrados.'
              : `Sem doadores do tipo ${filter} disponíveis.`}
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadDonors}>
            <Text style={styles.refreshBtnText}>🔄 Atualizar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <DonorCard donor={item} />}
          showsVerticalScrollIndicator={false}
          onRefresh={loadDonors}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F8' },
  header: {
    backgroundColor: '#C62828',
    padding: 20,
    paddingTop: 12,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#FFCDD2', marginTop: 2 },
  filterRow: { paddingVertical: 12 },
  chip: {
    borderWidth: 1.5,
    borderColor: '#C62828',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#C62828' },
  chipText: { color: '#C62828', fontWeight: '700', fontSize: 14 },
  chipTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#9E9E9E', fontSize: 15 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#424242', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginTop: 8 },
  refreshBtn: {
    marginTop: 20,
    backgroundColor: '#C62828',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refreshBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
