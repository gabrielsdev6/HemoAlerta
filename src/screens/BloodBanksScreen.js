import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getHemocentros } from '../services/hemocentroService';

function BankCard({ bank }) {
  const handleCall = () => {
    const rawPhone = bank.telefone?.replace(/\D/g, '');
    if (!rawPhone) {
      Alert.alert(bank.nome, `📍 ${bank.endereco}\n⏰ ${bank.horario}`, [{ text: 'Fechar' }]);
      return;
    }
    Alert.alert(
      bank.nome,
      `📍 ${bank.endereco}\n⏰ ${bank.horario}`,
      [
        { text: 'Fechar', style: 'cancel' },
        { text: `📞 ${bank.telefone}`, onPress: () => Linking.openURL(`tel:${rawPhone}`) },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Text style={styles.iconText}>🏥</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.bankName} numberOfLines={2}>{bank.nome}</Text>
        <Text style={styles.bankAddr} numberOfLines={1}>📍 {bank.endereco}</Text>
        {bank.horario ? (
          <Text style={styles.bankHours} numberOfLines={1}>⏰ {bank.horario}</Text>
        ) : null}
        {bank.aviso ? (
          <View style={styles.avisoBox}>
            <Text style={styles.avisoText}>{bank.aviso}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
        <Text style={styles.callBtnIcon}>📞</Text>
        <Text style={styles.callBtnLabel}>Info</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BloodBanksScreen({ navigation }) {
  const { userProfile } = useAuth();
  const [search, setSearch] = useState('');

  const municipio = userProfile?.municipio;
  const uf = userProfile?.estado;

  // Busca síncrona no JSON local — sem loading, sem API
  const banks = useMemo(() => {
    if (!municipio || !uf) return [];
    return getHemocentros(municipio, uf);
  }, [municipio, uf]);

  const filtered = banks.filter((b) =>
    !search || b.nome.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backWrap}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Bancos de Sangue</Text>
          <Text style={styles.headerSub}>
            {municipio ? `📍 ${municipio}` : 'Configure sua região'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Sem região configurada */}
      {(!municipio || !uf) && (
        <View style={styles.center}>
          <Text style={styles.centerEmoji}>📍</Text>
          <Text style={styles.centerTitle}>Região não configurada</Text>
          <Text style={styles.centerSub}>
            Vá em Perfil → Editar perfil para selecionar seu estado e município.
          </Text>
        </View>
      )}

      {/* Resultados */}
      {municipio && uf && (
        <>
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar hemocentro..."
              placeholderTextColor="#BDBDBD"
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
            />
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Ligue antes de ir para confirmar horários e disponibilidade para o seu tipo sanguíneo.
            </Text>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => <BankCard bank={item} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>{search ? '🔍' : '😕'}</Text>
                <Text style={styles.emptyTitle}>
                  {search
                    ? `Nenhum resultado para "${search}"`
                    : `Nenhum hemocentro cadastrado em ${municipio}`}
                </Text>
                {!search && (
                  <Text style={styles.emptySub}>
                    Exibindo hemocentros do estado de {uf} abaixo.
                  </Text>
                )}
              </View>
            }
          />
        </>
      )}
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

  searchWrap: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1A1A1A',
  },

  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FFFDE7', marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#F9A825',
  },
  tipIcon: { fontSize: 16, marginTop: 1 },
  tipText: { flex: 1, fontSize: 13, color: '#795548', lineHeight: 19 },

  list: { padding: 16, gap: 10, paddingBottom: 30 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  iconText: { fontSize: 22 },
  cardContent: { flex: 1 },
  bankName: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginBottom: 3 },
  bankAddr: { fontSize: 12, color: '#9E9E9E', marginBottom: 2 },
  bankHours: { fontSize: 11, color: '#BDBDBD' },
  avisoBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F9A825',
  },
  avisoText: { fontSize: 11, color: '#795548', lineHeight: 15 },
  callBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF5F5', borderRadius: 12, width: 52, height: 52,
    flexShrink: 0, borderWidth: 1.5, borderColor: '#FFCDD2',
  },
  callBtnIcon: { fontSize: 18 },
  callBtnLabel: { fontSize: 10, color: '#B71C1C', fontWeight: '700', marginTop: 2 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  centerEmoji: { fontSize: 52, marginBottom: 12 },
  centerTitle: { fontSize: 18, fontWeight: '800', color: '#424242', textAlign: 'center' },
  centerSub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  emptyWrap: { alignItems: 'center', paddingTop: 32, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#424242', textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', marginTop: 8, lineHeight: 19 },
});
