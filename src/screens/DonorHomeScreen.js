import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { getDonorsCompatibleWith, BLOOD_TYPE_COLORS } from '../utils/bloodTypeUtils';

// Urgência: suporta os novos valores (critico/alto/medio/baixo)
// e os antigos (muito_urgente/urgente/normal) para compatibilidade
const URGENCY_CONFIG = {
  critico:       { label: 'Crítico',       bg: '#C62828', text: '#FFFFFF', order: 0 },
  alto:          { label: 'Alto',          bg: '#E65100', text: '#FFFFFF', order: 1 },
  muito_urgente: { label: 'Muito Urgente', bg: '#E65100', text: '#FFFFFF', order: 1 },
  medio:         { label: 'Médio',         bg: '#F9A825', text: '#1A1A1A', order: 2 },
  urgente:       { label: 'Urgente',       bg: '#F9A825', text: '#1A1A1A', order: 2 },
  baixo:         { label: 'Baixo',         bg: '#2E7D32', text: '#FFFFFF', order: 3 },
  normal:        { label: 'Normal',        bg: '#2E7D32', text: '#FFFFFF', order: 3 },
};

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// ─── Card de pedido ────────────────────────────────────────────────────────
function DonorRequestCard({ pedido, userUid, isExpanded, onInteresse }) {
  const urg = URGENCY_CONFIG[pedido.urgency] || URGENCY_CONFIG.baixo;
  const bloodColor = BLOOD_TYPE_COLORS[pedido.bloodType] || '#B71C1C';
  const hasResponded = Array.isArray(pedido.respondedDonors) &&
    pedido.respondedDonors.includes(userUid);
  const showExpanded = hasResponded || isExpanded;

  const hospitalName = pedido.hospitalName || pedido.hospital || 'Hospital';
  const hospitalAddress = pedido.hospitalAddress || pedido.city || '';
  const hospitalPhone = pedido.hospitalPhone || pedido.requesterPhone || '';

  return (
    <View style={styles.card}>
      {/* Linha superior: tipo sanguíneo + nome + urgência */}
      <View style={styles.cardTop}>
        <View style={[styles.bloodBadge, { backgroundColor: bloodColor }]}>
          <Text style={styles.bloodBadgeText}>{pedido.bloodType}</Text>
        </View>

        <View style={styles.cardMid}>
          <Text style={styles.hospitalName} numberOfLines={2}>{hospitalName}</Text>
          <Text style={styles.cardTime}>{timeAgo(pedido.createdAt)}</Text>
        </View>

        <View style={[styles.urgBadge, { backgroundColor: urg.bg }]}>
          <Text style={[styles.urgText, { color: urg.text }]}>{urg.label}</Text>
        </View>
      </View>

      {/* Endereço resumido */}
      {!!hospitalAddress && (
        <Text style={styles.addressShort} numberOfLines={1}>📍 {hospitalAddress}</Text>
      )}

      {/* Botão de interesse */}
      <TouchableOpacity
        style={[styles.intBtn, hasResponded && styles.intBtnConfirmed]}
        onPress={() => onInteresse(pedido)}
        disabled={hasResponded}
        activeOpacity={0.85}
      >
        <Text style={[styles.intBtnText, hasResponded && styles.intBtnTextConfirmed]}>
          {hasResponded ? 'Interesse Confirmado ✓' : 'Tenho Interesse'}
        </Text>
      </TouchableOpacity>

      {/* Expandido: endereço completo + telefone */}
      {showExpanded && (
        <View style={styles.expandedBox}>
          <View style={styles.expandedDivider} />
          <Text style={styles.expandedTitle}>Informações para comparecer</Text>
          {!!hospitalAddress && (
            <Text style={styles.expandedRow}>📍 {hospitalAddress}</Text>
          )}
          {!!hospitalPhone && (
            <Text style={styles.expandedRow}>📞 {hospitalPhone}</Text>
          )}
          {!hospitalPhone && (
            <Text style={styles.expandedHint}>Ligue para o hospital para confirmar o horário.</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Tela principal ─────────────────────────────────────────────────────────
export default function DonorHomeScreen({ navigation }) {
  const drawerCtx = useDrawer();
  const { userProfile, user } = useAuth();

  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStateWide, setShowStateWide] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [indexError, setIndexError] = useState(false);

  const bloodType    = userProfile?.bloodType;
  const userState    = userProfile?.region?.state    || userProfile?.estado;
  const userCityNorm = userProfile?.region?.cityNormalized;
  const userCity     = userProfile?.region?.city     || userProfile?.municipio || '';
  const userStateName = userProfile?.region?.stateName || userState || '';

  // Filtragem local: apenas pedidos onde o tipo do doador é compatível
  const requests = useMemo(() => {
    if (!bloodType) return allRequests;
    return allRequests.filter((r) =>
      getDonorsCompatibleWith(r.bloodType).includes(bloodType),
    );
  }, [allRequests, bloodType]);

  // onSnapshot — reconstrói quando muda estado, cidade ou modo
  useEffect(() => {
    if (!userState) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setIndexError(false);

    // Modo cidade: 3 condições → pode exigir índice composto no Firestore
    // Modo estado: 2 condições → funciona com índices simples
    const conditions = [
      where('status', '==', 'open'),
      where('region.state', '==', userState),
    ];
    if (!showStateWide && userCityNorm) {
      conditions.push(where('region.cityNormalized', '==', userCityNorm));
    }

    const q = query(collection(db, 'bloodRequests'), ...conditions);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const oa = URGENCY_CONFIG[a.urgency]?.order ?? 4;
            const ob = URGENCY_CONFIG[b.urgency]?.order ?? 4;
            if (oa !== ob) return oa - ob;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
        setAllRequests(data);
        setLoading(false);
      },
      (error) => {
        // 'failed-precondition' indica índice composto ausente no Firestore
        if (error.code === 'failed-precondition') setIndexError(true);
        setLoading(false);
      },
    );

    return unsub;
  }, [userState, userCityNorm, showStateWide]);

  const handleInteresse = useCallback(async (pedido) => {
    if (!user?.uid) return;
    if (pedido.respondedDonors?.includes(user.uid)) return;

    try {
      await updateDoc(doc(db, 'bloodRequests', pedido.id), {
        respondedDonors: arrayUnion(user.uid),
      });
      setExpandedIds((prev) => new Set([...prev, pedido.id]));
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar seu interesse. Tente novamente.');
    }
  }, [user?.uid]);

  // Sem região configurada
  if (!userState) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => drawerCtx.open()} style={styles.menuBtn}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>Pedidos Compatíveis</Text>
            <Text style={styles.headerCount}>Região</Text>
          </View>
        </View>
        <View style={styles.center}>
          <Text style={styles.centerEmoji}>📍</Text>
          <Text style={styles.centerTitle}>Configure sua região</Text>
          <Text style={styles.centerSub}>
            Vá em Perfil → Editar perfil para selecionar seu estado e município.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const scopeLabel = showStateWide ? userStateName : `${userCity} - ${userState}`;
  const isEmpty = !loading && requests.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => drawerCtx.open()} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>Pedidos Compatíveis</Text>
          <Text style={styles.headerCount}>
            {loading ? '...' : `${requests.length} ${requests.length === 1 ? 'pedido' : 'pedidos'}`}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
          {bloodType && (
            <View style={[styles.bloodCircle, { backgroundColor: BLOOD_TYPE_COLORS[bloodType] || '#FFFFFF' }]}>
              <Text style={styles.bloodCircleText}>{bloodType}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Badge de escopo ── */}
      <View style={[styles.scopeBadge, showStateWide && styles.scopeBadgeState]}>
        <Text style={styles.scopeText}>
          📍 Exibindo pedidos em {scopeLabel}
        </Text>
        {showStateWide && (
          <TouchableOpacity onPress={() => setShowStateWide(false)}>
            <Text style={styles.scopeToggle}>← Só minha cidade</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Erro de índice Firestore ── */}
      {indexError && (
        <View style={styles.indexWarning}>
          <Text style={styles.indexWarningText}>
            ⚠️ Esta consulta requer um índice composto no Firestore.{'\n'}
            Verifique o console para o link de criação do índice.
          </Text>
        </View>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#B71C1C" />
          <Text style={styles.loadingText}>Carregando pedidos compatíveis...</Text>
        </View>
      ) : isEmpty ? (
        /* ── Lista vazia ── */
        <View style={styles.center}>
          <Text style={styles.centerEmoji}>🎉</Text>
          <Text style={styles.centerTitle}>
            {showStateWide
              ? `Nenhum pedido compatível no estado de ${userStateName}`
              : 'Nenhum pedido compatível na sua cidade'}
          </Text>
          <Text style={styles.centerSub}>
            {showStateWide
              ? 'Não há pedidos abertos compatíveis com seu tipo sanguíneo neste estado.'
              : `Tipo ${bloodType} compatível, mas sem pedidos abertos em ${userCity}.`}
          </Text>
          {!showStateWide && (
            <TouchableOpacity
              style={styles.stateWideBtn}
              onPress={() => setShowStateWide(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.stateWideBtnText}>Ver pedidos do estado inteiro</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* ── Lista de pedidos ── */
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <DonorRequestCard
              pedido={item}
              userUid={user?.uid}
              isExpanded={expandedIds.has(item.id)}
              onInteresse={handleInteresse}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },

  menuBtn:  { paddingRight: 14 },
  menuIcon: { color: '#FFFFFF', fontSize: 24 },

  // Header
  header: {
    backgroundColor: '#B71C1C',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerCount: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#69F0AE' },
  liveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  bloodCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodCircleText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },

  // Badge de escopo
  scopeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  scopeBadgeState: { backgroundColor: '#FFF8E1', borderBottomColor: '#F9A825' },
  scopeText: { fontSize: 13, color: '#1565C0', fontWeight: '600' },
  scopeToggle: { fontSize: 12, color: '#E65100', fontWeight: '700' },

  // Aviso de índice
  indexWarning: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#E65100',
  },
  indexWarningText: { fontSize: 12, color: '#E65100', lineHeight: 17 },

  // Estados centralizados
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  centerEmoji: { fontSize: 52, marginBottom: 12 },
  centerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#424242',
    textAlign: 'center',
    marginBottom: 8,
  },
  centerSub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 20 },
  loadingText: { marginTop: 12, color: '#9E9E9E', fontSize: 15 },

  stateWideBtn: {
    marginTop: 20,
    backgroundColor: '#B71C1C',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  stateWideBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  // Lista
  list: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  bloodBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bloodBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  cardMid: { flex: 1 },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 3,
  },
  cardTime: { fontSize: 11, color: '#BDBDBD' },
  urgBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  urgText: { fontSize: 12, fontWeight: '800' },

  addressShort: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 12,
    lineHeight: 18,
  },

  // Botão interesse
  intBtn: {
    backgroundColor: '#B71C1C',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  intBtnConfirmed: {
    backgroundColor: '#E8F5E9',
    shadowColor: 'transparent',
    elevation: 0,
  },
  intBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  intBtnTextConfirmed: { color: '#2E7D32' },

  // Expandido
  expandedBox: { marginTop: 14 },
  expandedDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  expandedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9E9E9E',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  expandedRow: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 4,
    fontWeight: '500',
  },
  expandedHint: {
    fontSize: 12,
    color: '#BDBDBD',
    fontStyle: 'italic',
  },
});
