import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { ESTADOS } from '../data/estados';
import { getCidadesPorEstado } from '../services/ibgeService';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Normaliza cidade: lowercase + sem acentos + mantém espaços
// Ex: 'São João del-Rei' → 'sao joao del-rei'
const normalizarCidade = (texto) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const formatarCNPJ = (valor) => {
  const d = valor.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

async function getPushToken() {
  if (!Device.isDevice) return null;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch {
    return null;
  }
}

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [userType, setUserType] = useState('doador');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    bloodType: '', cnpj: '', phone: '',
    estado: '', estadoNome: '', municipio: '',
  });
  const [loading, setLoading] = useState(false);

  // Estado picker
  const [estadoModal, setEstadoModal] = useState(false);

  // Município picker
  const [municipioModal, setMunicipioModal] = useState(false);
  const [municipios, setMunicipios] = useState([]);   // string[]
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [municipioSearch, setMunicipioSearch] = useState('');

  const set = (field) => (value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSwitchType = (tipo) => {
    setUserType(tipo);
    setForm((p) => ({ ...p, bloodType: '', cnpj: '' }));
  };

  const handleSelectEstado = useCallback(async (estado) => {
    setForm((p) => ({
      ...p,
      estado: estado.sigla,
      estadoNome: estado.nome,
      municipio: '',
    }));
    setEstadoModal(false);
    setMunicipios([]);
    setLoadingMunicipios(true);
    try {
      const cidades = await getCidadesPorEstado(estado.sigla);
      setMunicipios(cidades);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os municípios. Verifique sua conexão.');
    } finally {
      setLoadingMunicipios(false);
    }
  }, []);

  const handleSelectMunicipio = useCallback((cidade) => {
    setForm((p) => ({ ...p, municipio: cidade }));
    setMunicipioModal(false);
    setMunicipioSearch('');
  }, []);

  const filteredMunicipios = municipioSearch
    ? municipios.filter((m) => m.toLowerCase().includes(municipioSearch.toLowerCase()))
    : municipios;

  const validate = () => {
    const { name, email, password, bloodType, cnpj, estado, municipio } = form;
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha nome, e-mail e senha.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    if (userType === 'doador' && !bloodType) {
      Alert.alert('Atenção', 'Selecione seu tipo sanguíneo.');
      return false;
    }
    if (userType === 'hospital' && cnpj.replace(/\D/g, '').length < 14) {
      Alert.alert('Atenção', 'Informe um CNPJ válido (14 dígitos).');
      return false;
    }
    if (!estado || !municipio) {
      Alert.alert('Atenção', 'Selecione seu estado e município.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const region = {
        state: form.estado,
        stateName: form.estadoNome,
        city: form.municipio,
        cityNormalized: normalizarCidade(form.municipio),
      };

      const profileData = {
        userType,
        name: form.name.trim(),
        phone: form.phone.trim(),
        region,
        // campos planos mantidos para compatibilidade com screens existentes
        estado: form.estado,
        municipio: form.municipio,
        ...(userType === 'doador'
          ? { bloodType: form.bloodType, isAvailable: true, totalDonations: 0 }
          : { cnpj: form.cnpj, isAvailable: false }),
      };

      const cred = await register(
        form.email.trim().toLowerCase(),
        form.password,
        profileData,
      );

      // Push token: fire-and-forget, não bloqueia o cadastro
      getPushToken().then((token) => {
        if (token && cred?.user?.uid) {
          updateDoc(doc(db, 'users', cred.user.uid), { pushToken: token }).catch(() => {});
        }
      });
    } catch (error) {
      let msg = 'Erro ao cadastrar. Tente novamente.';
      if (error.code === 'auth/email-already-in-use') msg = 'E-mail já cadastrado.';
      if (error.code === 'auth/invalid-email') msg = 'E-mail inválido.';
      if (error.code === 'auth/weak-password') msg = 'Senha muito fraca (mín. 6 caracteres).';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const estadoLabel = form.estado
    ? `${ESTADOS.find((e) => e.sigla === form.estado)?.nome} (${form.estado})`
    : 'Selecione seu estado';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>
              {userType === 'doador'
                ? 'Junte-se à rede de doadores 🩸'
                : 'Cadastre sua instituição de saúde 🏥'}
            </Text>
          </View>

          {/* Toggle Doador / Hospital */}
          <View style={styles.typeToggle}>
            {[
              { key: 'doador',   label: '🩸  Doador' },
              { key: 'hospital', label: '🏥  Hospital / Clínica' },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[styles.typeBtn, userType === key && styles.typeBtnActive]}
                onPress={() => handleSwitchType(key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, userType === key && styles.typeBtnTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.form}>
            {/* Nome */}
            <View style={styles.field}>
              <Text style={styles.label}>
                {userType === 'doador' ? 'Nome completo *' : 'Nome da instituição *'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={userType === 'doador' ? 'Seu nome' : 'Ex: Hospital das Clínicas'}
                placeholderTextColor="#C0C0C0"
                value={form.name}
                onChangeText={set('name')}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>E-mail *</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#C0C0C0"
                value={form.email}
                onChangeText={set('email')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Senha */}
            <View style={styles.field}>
              <Text style={styles.label}>Senha * (mín. 6 caracteres)</Text>
              <TextInput
                style={styles.input}
                placeholder="Crie uma senha forte"
                placeholderTextColor="#C0C0C0"
                value={form.password}
                onChangeText={set('password')}
                secureTextEntry
              />
            </View>

            {/* Tipo sanguíneo — apenas doador */}
            {userType === 'doador' && (
              <View style={styles.field}>
                <Text style={styles.label}>Tipo sanguíneo *</Text>
                <View style={styles.bloodGrid}>
                  {BLOOD_TYPES.map((type) => {
                    const selected = form.bloodType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.bloodChip, selected && styles.bloodChipOn]}
                        onPress={() => set('bloodType')(type)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.bloodChipText, selected && styles.bloodChipTextOn]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* CNPJ — apenas hospital */}
            {userType === 'hospital' && (
              <View style={styles.field}>
                <Text style={styles.label}>CNPJ *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="00.000.000/0000-00"
                  placeholderTextColor="#C0C0C0"
                  value={form.cnpj}
                  onChangeText={(v) => set('cnpj')(formatarCNPJ(v))}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Estado */}
            <View style={styles.field}>
              <Text style={styles.label}>Estado *</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setEstadoModal(true)}
                activeOpacity={0.8}
              >
                <Text style={form.estado ? styles.selectorValue : styles.selectorPlaceholder}>
                  {estadoLabel}
                </Text>
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>
            </View>

            {/* Município */}
            <View style={styles.field}>
              <Text style={styles.label}>Município *</Text>
              <TouchableOpacity
                style={[styles.selectorBtn, !form.estado && styles.selectorDisabled]}
                onPress={() => {
                  if (!form.estado) {
                    Alert.alert('Atenção', 'Selecione o estado primeiro.');
                    return;
                  }
                  setMunicipioModal(true);
                }}
                activeOpacity={0.8}
              >
                {loadingMunicipios ? (
                  <ActivityIndicator size="small" color="#B71C1C" />
                ) : (
                  <Text style={form.municipio ? styles.selectorValue : styles.selectorPlaceholder}>
                    {form.municipio || 'Selecione seu município'}
                  </Text>
                )}
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>
            </View>

            {/* Telefone */}
            <View style={styles.field}>
              <Text style={styles.label}>WhatsApp (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="(11) 99999-9999"
                placeholderTextColor="#C0C0C0"
                value={form.phone}
                onChangeText={set('phone')}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.btnText}>Criar conta</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Entrar</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal — selecionar Estado */}
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
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  form.estado === item.sigla && styles.modalItemActive,
                ]}
                onPress={() => handleSelectEstado(item)}
                activeOpacity={0.7}
              >
                <View style={styles.modalItemSigla}>
                  <Text style={styles.modalItemSiglaText}>{item.sigla}</Text>
                </View>
                <Text style={[
                  styles.modalItemNome,
                  form.estado === item.sigla && { color: '#B71C1C', fontWeight: '800' },
                ]}>
                  {item.nome}
                </Text>
                {form.estado === item.sigla && (
                  <Text style={styles.modalItemCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal — selecionar Município */}
      <Modal visible={municipioModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione o Município</Text>
            <TouchableOpacity
              onPress={() => { setMunicipioModal(false); setMunicipioSearch(''); }}
            >
              <Text style={styles.modalClose}>Fechar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearchWrap}>
            <TextInput
              style={styles.modalSearch}
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
            keyExtractor={(item) => item}
            contentContainerStyle={styles.modalList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  form.municipio === item && styles.modalItemActive,
                ]}
                onPress={() => handleSelectMunicipio(item)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalItemNome,
                  form.municipio === item && { color: '#B71C1C', fontWeight: '800' },
                ]}>
                  {item}
                </Text>
                {form.municipio === item && (
                  <Text style={styles.modalItemCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>
                  {municipioSearch
                    ? `Nenhum resultado para "${municipioSearch}"`
                    : 'Nenhum município encontrado'}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, padding: 28, paddingTop: 20 },
  back: { marginBottom: 28 },
  backText: { color: '#B71C1C', fontSize: 15, fontWeight: '700' },
  titleBlock: { marginBottom: 20 },
  title: { fontSize: 34, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#9E9E9E', marginTop: 6 },

  // Segmented toggle
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 11,
  },
  typeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: '#9E9E9E' },
  typeBtnTextActive: { color: '#B71C1C' },

  form: { gap: 18 },
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: '800', color: '#424242', letterSpacing: 0.3 },
  input: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },

  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bloodChip: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: '#F7F7F7',
  },
  bloodChipOn: {
    backgroundColor: '#B71C1C',
    borderColor: '#B71C1C',
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  bloodChipText: { color: '#616161', fontWeight: '800', fontSize: 16 },
  bloodChipTextOn: { color: '#FFFFFF' },

  selectorBtn: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  selectorDisabled: { opacity: 0.5 },
  selectorValue: { fontSize: 16, color: '#1A1A1A', flex: 1 },
  selectorPlaceholder: { fontSize: 16, color: '#C0C0C0', flex: 1 },
  chevron: { fontSize: 16, color: '#9E9E9E', marginLeft: 8 },

  btn: {
    backgroundColor: '#B71C1C',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#9E9E9E', fontSize: 14 },
  footerLink: { color: '#B71C1C', fontWeight: '800', fontSize: 14 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 17, fontWeight: '900', color: '#1A1A1A' },
  modalClose: { color: '#B71C1C', fontSize: 15, fontWeight: '700' },
  modalSearchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalSearch: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  modalList: { paddingBottom: 24 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F7F7',
    gap: 12,
  },
  modalItemActive: { backgroundColor: '#FFF5F5' },
  modalItemSigla: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#B71C1C',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalItemSiglaText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  modalItemNome: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  modalItemCheck: { color: '#B71C1C', fontSize: 18, fontWeight: '900' },
  modalEmpty: { padding: 32, alignItems: 'center' },
  modalEmptyText: { color: '#9E9E9E', fontSize: 15 },
});
