import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { ESTADOS } from '../data/estados';
import { getMunicipiosByUF } from '../services/ibgeService';

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
  const drawerCtx = useDrawer();
  const { userProfile, user, logout, updateProfile } = useAuth();
  const [toggling, setToggling] = useState(false);
  const [donating, setDonating] = useState(false);

  // Edit modal state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', estado: '', municipio: '', codMunicipio: null, phone: '' });
  const [saving, setSaving] = useState(false);

  // Region pickers inside edit modal
  const [estadoModal, setEstadoModal] = useState(false);
  const [municipioModal, setMunicipioModal] = useState(false);
  const [municipios, setMunicipios] = useState([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [municipioSearch, setMunicipioSearch] = useState('');

  const openEdit = () => {
    setEditForm({
      name: userProfile?.name || '',
      estado: userProfile?.estado || '',
      municipio: userProfile?.municipio || '',
      codMunicipio: userProfile?.codMunicipio || null,
      phone: userProfile?.phone || '',
    });
    if (userProfile?.estado) {
      getMunicipiosByUF(userProfile.estado).then(setMunicipios).catch(() => {});
    }
    setEditing(true);
  };

  const handleSelectEstado = useCallback(async (estado) => {
    setEditForm((p) => ({ ...p, estado: estado.sigla, municipio: '', codMunicipio: null }));
    setEstadoModal(false);
    setLoadingMunicipios(true);
    try {
      const list = await getMunicipiosByUF(estado.sigla);
      setMunicipios(list);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os municípios.');
    } finally {
      setLoadingMunicipios(false);
    }
  }, []);

  const handleSelectMunicipio = useCallback((municipio) => {
    setEditForm((p) => ({ ...p, municipio: municipio.nome, codMunicipio: municipio.id }));
    setMunicipioModal(false);
    setMunicipioSearch('');
  }, []);

  const filteredMunicipios = municipioSearch
    ? municipios.filter((m) => m.nome.toLowerCase().includes(municipioSearch.toLowerCase()))
    : municipios;

  const saveEdit = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Atenção', 'O nome é obrigatório.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: editForm.name.trim(),
        estado: editForm.estado,
        municipio: editForm.municipio,
        codMunicipio: editForm.codMunicipio,
        phone: editForm.phone.trim(),
      });
      setEditing(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (value) => {
    setToggling(true);
    try { await updateProfile({ isAvailable: value }); } catch (_) {}
    setToggling(false);
  };

  const handleRegisterDonation = () => {
    Alert.alert(
      '🩸 Registrar doação',
      'Confirma que você realizou uma doação de sangue hoje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setDonating(true);
            try {
              const total = (userProfile?.totalDonations || 0) + 1;
              await updateProfile({ totalDonations: total });
              Alert.alert('🎉 Obrigado!', `Você registrou ${total} doação${total > 1 ? 'ões' : ''}!\nIsso pode ter salvado até ${total * 4} vidas.`);
            } catch {
              Alert.alert('Erro', 'Não foi possível registrar. Tente novamente.');
            } finally {
              setDonating(false);
            }
          },
        },
      ],
    );
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
  const regionLabel = userProfile?.municipio && userProfile?.estado
    ? `${userProfile.municipio} - ${userProfile.estado}`
    : userProfile?.municipio || '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          {/* ☰ menu */}
          <TouchableOpacity
            onPress={() => drawerCtx.open()}
            style={styles.heroMenuBtn}
          >
            <Text style={styles.heroMenuIcon}>☰</Text>
          </TouchableOpacity>

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

          <TouchableOpacity style={styles.editBtn} onPress={openEdit} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>✏️  Editar perfil</Text>
          </TouchableOpacity>
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

        {/* Registrar doação */}
        <TouchableOpacity
          style={[styles.donateBtn, donating && { opacity: 0.6 }]}
          onPress={handleRegisterDonation}
          disabled={donating}
          activeOpacity={0.85}
        >
          {donating
            ? <ActivityIndicator color="#B71C1C" />
            : <Text style={styles.donateBtnText}>🩸  Registrar nova doação</Text>
          }
        </TouchableOpacity>

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
            { icon: '📍', label: 'Região', value: regionLabel },
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

      {/* Modal edição de perfil */}
      <Modal visible={editing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <TouchableOpacity onPress={saveEdit} disabled={saving} style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}>
                {saving ? <ActivityIndicator size="small" color="#B71C1C" /> : <Text style={styles.modalSaveText}>Salvar</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Nome completo *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editForm.name}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))}
                  placeholder="Seu nome"
                  placeholderTextColor="#C0C0C0"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Estado</Text>
                <TouchableOpacity style={styles.selectorBtn} onPress={() => setEstadoModal(true)} activeOpacity={0.8}>
                  <Text style={editForm.estado ? styles.selectorValue : styles.selectorPlaceholder}>
                    {editForm.estado
                      ? `${ESTADOS.find((e) => e.sigla === editForm.estado)?.nome} (${editForm.estado})`
                      : 'Selecione seu estado'}
                  </Text>
                  <Text style={styles.chevron}>▾</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Município</Text>
                <TouchableOpacity
                  style={[styles.selectorBtn, !editForm.estado && styles.selectorDisabled]}
                  onPress={() => {
                    if (!editForm.estado) { Alert.alert('Atenção', 'Selecione o estado primeiro.'); return; }
                    setMunicipioModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  {loadingMunicipios
                    ? <ActivityIndicator size="small" color="#B71C1C" />
                    : <Text style={editForm.municipio ? styles.selectorValue : styles.selectorPlaceholder}>
                        {editForm.municipio || 'Selecione seu município'}
                      </Text>
                  }
                  <Text style={styles.chevron}>▾</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>WhatsApp</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editForm.phone}
                  onChangeText={(v) => setEditForm((p) => ({ ...p, phone: v }))}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#C0C0C0"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.modalNote}>
                <Text style={styles.modalNoteText}>
                  Para alterar tipo sanguíneo ou e-mail, entre em contato com o suporte.
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Modal — selecionar Estado (dentro do edit) */}
      <Modal visible={estadoModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione o Estado</Text>
            <TouchableOpacity onPress={() => setEstadoModal(false)}>
              <Text style={styles.modalClose}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={ESTADOS}
            keyExtractor={(item) => item.sigla}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listItem, editForm.estado === item.sigla && styles.listItemActive]}
                onPress={() => handleSelectEstado(item)}
                activeOpacity={0.7}
              >
                <View style={styles.siglaBadge}>
                  <Text style={styles.siglaText}>{item.sigla}</Text>
                </View>
                <Text style={[styles.listItemText, editForm.estado === item.sigla && { color: '#B71C1C', fontWeight: '800' }]}>
                  {item.nome}
                </Text>
                {editForm.estado === item.sigla && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal — selecionar Município (dentro do edit) */}
      <Modal visible={municipioModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione o Município</Text>
            <TouchableOpacity onPress={() => { setMunicipioModal(false); setMunicipioSearch(''); }}>
              <Text style={styles.modalClose}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar município..."
              placeholderTextColor="#BDBDBD"
              value={municipioSearch}
              onChangeText={setMunicipioSearch}
              clearButtonMode="while-editing"
              autoFocus
            />
          </View>
          <FlatList
            data={filteredMunicipios}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listItem, editForm.codMunicipio === item.id && styles.listItemActive]}
                onPress={() => handleSelectMunicipio(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.listItemText, editForm.codMunicipio === item.id && { color: '#B71C1C', fontWeight: '800' }]}>
                  {item.nome}
                </Text>
                {editForm.codMunicipio === item.id && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },

  heroMenuBtn: { alignSelf: 'flex-start', padding: 4, marginBottom: 14 },
  heroMenuIcon: { color: '#FFFFFF', fontSize: 24 },

  hero: {
    backgroundColor: '#B71C1C',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
  bloodBadge: {
    position: 'absolute', bottom: -2, right: -8,
    backgroundColor: '#FFFFFF', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  bloodBadgeText: { color: '#B71C1C', fontWeight: '900', fontSize: 13 },
  name: { fontSize: 24, fontWeight: '900', color: '#FFFFFF' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  memberPill: {
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
  },
  memberText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  editBtn: {
    marginTop: 14, backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  editBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  statsRow: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 20,
    marginTop: -20, flexDirection: 'row', alignItems: 'center',
    paddingVertical: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 32, fontWeight: '900', color: '#B71C1C' },
  statLbl: { fontSize: 12, color: '#9E9E9E', marginTop: 3 },
  statDivider: { width: 1, height: 40, backgroundColor: '#F0F0F0' },

  donateBtn: {
    marginHorizontal: 16, marginTop: 14, backgroundColor: '#FFF5F5',
    borderRadius: 16, paddingVertical: 15, alignItems: 'center',
    borderWidth: 2, borderColor: '#FFCDD2',
  },
  donateBtnText: { color: '#B71C1C', fontWeight: '800', fontSize: 15 },

  factCard: {
    backgroundColor: '#FFF8E1', marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start',
  },
  factIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF3CD',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  factIcon: { fontSize: 20 },
  factTitle: { fontSize: 12, fontWeight: '800', color: '#F57F17', marginBottom: 3 },
  factText: { fontSize: 13, color: '#795548', lineHeight: 19 },

  section: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#BDBDBD', letterSpacing: 1, marginBottom: 12 },
  availRow: { flexDirection: 'row', alignItems: 'center' },
  availTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  availSub: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  infoLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '600', marginTop: 1 },

  logoutBtn: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 16,
    paddingVertical: 15, alignItems: 'center', backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#FFCDD2',
  },
  logoutText: { color: '#B71C1C', fontWeight: '800', fontSize: 15 },

  // Shared modal/selector styles
  modalSafe: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  modalCancel: { width: 72 },
  modalCancelText: { color: '#9E9E9E', fontSize: 15, fontWeight: '600' },
  modalTitle: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
  modalSaveBtn: { width: 72, alignItems: 'flex-end' },
  modalSaveText: { color: '#B71C1C', fontSize: 15, fontWeight: '800' },
  modalClose: { color: '#B71C1C', fontSize: 15, fontWeight: '700' },
  modalScroll: { padding: 24, gap: 20 },
  modalField: { gap: 8 },
  modalLabel: { fontSize: 13, fontWeight: '800', color: '#424242', letterSpacing: 0.3 },
  modalInput: {
    backgroundColor: '#F7F7F7', borderWidth: 1.5, borderColor: '#EEEEEE',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: '#1A1A1A',
  },
  modalNote: {
    backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#F9A825',
  },
  modalNoteText: { fontSize: 13, color: '#795548', lineHeight: 19 },

  selectorBtn: {
    backgroundColor: '#F7F7F7', borderWidth: 1.5, borderColor: '#EEEEEE',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52,
  },
  selectorDisabled: { opacity: 0.5 },
  selectorValue: { fontSize: 16, color: '#1A1A1A', flex: 1 },
  selectorPlaceholder: { fontSize: 16, color: '#C0C0C0', flex: 1 },
  chevron: { fontSize: 16, color: '#9E9E9E', marginLeft: 8 },

  searchWrap: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1A1A1A',
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F7F7F7',
  },
  listItemActive: { backgroundColor: '#FFF5F5' },
  siglaBadge: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#B71C1C',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  siglaText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  listItemText: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  checkMark: { color: '#B71C1C', fontSize: 18, fontWeight: '900' },
});
