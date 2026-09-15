import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import RequestCard from '../components/RequestCard';

const BLOOD_TYPES = ['Todos', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_ORDER = { critico: 0, muito_urgente: 1, urgente: 2, normal: 3 };

export default function HomeScreen({ navigation }) {
  const drawerCtx = useDrawer();
  const { userProfile, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

  const municipio = userProfile?.municipio;

  useEffect(() => {
    if (!municipio) {
      setLoading(false);
      return;
    }

    // Filter by municipality — content is region-scoped
    const q = query(
      collection(db, 'requests'),
      where('status', '==', 'open'),
      where('municipio', '==', municipio),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const uo = (URGENCY_ORDER[a.urgency] ?? 4) - (URGENCY_ORDER[b.urgency] ?? 4);
            return uo !== 0 ? uo : new Date(b.createdAt) - new Date(a.createdAt);
          });
        setRequests(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsub;
  }, [municipio]);

  const filtered = filter === 'Todos' ? requests : requests.filter((r) => r.bloodType === filter);

  const handleClose = (id, uid) => {
    if (uid !== user?.uid) {
      Alert.alert('Permissão negada', 'Você só pode encerrar seus próprios pedidos.');
      return;
    }
    Alert.alert('Confirmar', 'Marcar como resolvido?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim', onPress: () => updateDoc(doc(db, 'requests', id), { status: 'fulfilled' }) },
    ]);
  };

  const bloodInitial = userProfile?.bloodType || '?';

  // No region configured yet
  if (!municipio && !loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => drawerCtx.open()} style={styles.menuBtn}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>Pedidos ativos</Text>
            <Text style={styles.headerCount}>Região</Text>
          </View>
          <View style={styles.bloodCircle}>
            <Text style={styles.bloodCircleText}>{bloodInitial}</Text>
          </View>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📍</Text>
          <Text style={styles.emptyTitle}>Configure sua região</Text>
          <Text style={styles.emptySub}>
            Vá em Perfil → Editar perfil e selecione seu estado e município para ver os pedidos da sua região.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => drawerCtx.open()} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>
            {municipio ? `📍 ${municipio}` : 'Pedidos ativos'}
          </Text>
          <Text style={styles.headerCount}>
            {filtered.length} {filtered.length === 1 ? 'pedido' : 'pedidos'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
          <View style={styles.bloodCircle}>
            <Text style={styles.bloodCircleText}>{bloodInitial}</Text>
          </View>
        </View>
      </View>

      {/* Filtros por tipo sanguíneo */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={BLOOD_TYPES}
        keyExtractor={(i) => i}
        contentContainerStyle={styles.filterList}
        style={styles.filterBar}
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

      {/* Lista */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B71C1C" />
          <Text style={styles.loadingText}>Carregando pedidos...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>Nenhum pedido ativo</Text>
          <Text style={styles.emptySub}>
            {filter === 'Todos'
              ? `Ótimas notícias! Nenhum pedido urgente em ${municipio}.`
              : `Sem pedidos ativos para o tipo ${filter} em ${municipio}.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              userBloodType={userProfile?.bloodType}
              onClose={item.requesterUid === user?.uid
                ? () => handleClose(item.id, item.requesterUid)
                : null}
            />
          )}
        />
      )}

      {/* FAB row */}
      <View style={styles.fabRow}>
        <TouchableOpacity
          style={styles.fabSecondary}
          onPress={() => navigation.navigate('BloodBanks')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabSecondaryText}>🏥</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fabSecondary}
          onPress={() => navigation.navigate('Map')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabSecondaryText}>🗺</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateRequest')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>＋ Pedido</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },

  menuBtn:  { paddingRight: 14 },
  menuIcon: { color: '#FFFFFF', fontSize: 24 },

  header: {
    backgroundColor: '#B71C1C',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8 },
  headerCount: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#69F0AE' },
  liveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  bloodCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  bloodCircleText: { color: '#B71C1C', fontSize: 14, fontWeight: '900' },

  filterBar: { backgroundColor: '#FFFFFF', maxHeight: 56 },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, backgroundColor: '#F2F2F2' },
  chipActive: { backgroundColor: '#B71C1C' },
  chipText: { color: '#616161', fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#FFFFFF' },

  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#9E9E9E', fontSize: 15 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: '#424242', textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  fabRow: { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', gap: 10 },
  fabSecondary: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  fabSecondaryText: { color: '#424242', fontWeight: '700', fontSize: 14 },
  fab: {
    backgroundColor: '#B71C1C', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 22, alignItems: 'center',
    shadowColor: '#B71C1C', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
});
