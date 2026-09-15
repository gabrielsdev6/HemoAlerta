import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import DonorCard from '../components/DonorCard';

const BLOOD_TYPES = ['Todos', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function DonorsScreen() {
  const drawerCtx = useDrawer();
  const { userProfile } = useAuth();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');

  const municipio = userProfile?.municipio;

  useEffect(() => {
    if (!municipio) {
      setLoading(false);
      return;
    }

    // Real-time listener scoped to the user's municipality
    const q = query(
      collection(db, 'users'),
      where('isAvailable', '==', true),
      where('municipio', '==', municipio),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDonors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsub;
  }, [municipio]);

  const filtered = donors.filter((d) => {
    const matchType = filter === 'Todos' || d.bloodType === filter;
    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      d.name?.toLowerCase().includes(term) ||
      d.city?.toLowerCase().includes(term);
    return matchType && matchSearch;
  });

  if (!municipio && !loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => drawerCtx.open()} style={styles.menuBtn}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Doadores Disponíveis</Text>
            <Text style={styles.subtitle}>Configure sua região</Text>
          </View>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={styles.emptyTitle}>Região não configurada</Text>
          <Text style={styles.emptySubtitle}>
            Vá em Perfil → Editar perfil para selecionar seu estado e município.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => drawerCtx.open()} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Doadores Disponíveis</Text>
          <Text style={styles.subtitle}>
            {municipio ? `📍 ${municipio}  •  ` : ''}{filtered.length} doador(es)
          </Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome..."
          placeholderTextColor="#BDBDBD"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
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
          <Text style={styles.emptyEmoji}>{search ? '🔍' : '😕'}</Text>
          <Text style={styles.emptyTitle}>
            {search ? 'Nenhum resultado' : 'Nenhum doador disponível'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search
              ? `Sem resultados para "${search}"`
              : filter === 'Todos'
              ? `Ainda não há doadores disponíveis em ${municipio}.`
              : `Sem doadores do tipo ${filter} em ${municipio}.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <DonorCard donor={item} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F8' },
  menuBtn:  { paddingRight: 14 },
  menuIcon: { color: '#FFFFFF', fontSize: 24 },
  header: { backgroundColor: '#C62828', padding: 20, paddingTop: 12, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#FFCDD2', marginTop: 2 },

  searchWrap: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1A1A1A',
  },

  filterRow: { paddingVertical: 12, backgroundColor: '#FFFFFF' },
  chip: {
    borderWidth: 1.5, borderColor: '#C62828', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#C62828' },
  chipText: { color: '#C62828', fontWeight: '700', fontSize: 14 },
  chipTextActive: { color: '#FFFFFF' },

  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#9E9E9E', fontSize: 15 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#424242', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
