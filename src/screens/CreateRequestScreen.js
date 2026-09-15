import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { notifyCompatibleDonors } from '../services/notificationService';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const URGENCY_OPTIONS = [
  { key: 'normal',        label: 'Normal',       color: '#2E7D32', bg: '#E8F5E9' },
  { key: 'urgente',       label: 'Urgente',       color: '#E65100', bg: '#FFF3E0' },
  { key: 'muito_urgente', label: 'Muito Urgente', color: '#C62828', bg: '#FFEBEE' },
  { key: 'critico',       label: '⚠ Crítico',     color: '#4A148C', bg: '#F3E5F5' },
];

export default function CreateRequestScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  const [form, setForm] = useState({
    bloodType: '',
    urgency: 'urgente',
    hospital: '',
    patientName: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (value) => setForm((p) => ({ ...p, [field]: value }));

  // Region is inherited from the user profile — not editable per request
  const municipio = userProfile?.municipio || '';
  const estado = userProfile?.estado || '';
  const codMunicipio = userProfile?.codMunicipio || null;

  const handleSubmit = async () => {
    if (!form.bloodType || !form.hospital.trim()) {
      Alert.alert('Atenção', 'Preencha o tipo sanguíneo e o hospital.');
      return;
    }
    if (!municipio) {
      Alert.alert('Região não configurada', 'Configure sua região em Perfil antes de criar um pedido.');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'requests'), {
        bloodType: form.bloodType,
        urgency: form.urgency,
        hospital: form.hospital.trim(),
        municipio,
        estado,
        codMunicipio,
        patientName: form.patientName.trim(),
        notes: form.notes.trim(),
        requesterUid: user.uid,
        requesterName: userProfile?.name || 'Anônimo',
        requesterPhone: userProfile?.phone || '',
        status: 'open',
        createdAt: new Date().toISOString(),
      });

      // Fire-and-forget: notify compatible donors in the same municipality
      notifyCompatibleDonors({
        bloodType: form.bloodType,
        municipio,
        hospital: form.hospital.trim(),
        urgency: form.urgency,
      });

      Alert.alert(
        '✅ Pedido publicado!',
        'Doadores compatíveis em ' + municipio + ' serão notificados.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelWrap}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Pedido</Text>
        <View style={{ width: 72 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Região herdada (read-only) */}
          <Text style={styles.sectionLabel}>REGIÃO DO PEDIDO</Text>
          <View style={styles.regionBox}>
            <Text style={styles.regionIcon}>📍</Text>
            <Text style={styles.regionText}>
              {municipio ? `${municipio} - ${estado}` : 'Região não configurada'}
            </Text>
          </View>

          {/* Tipo sanguíneo */}
          <Text style={styles.sectionLabel}>TIPO NECESSÁRIO *</Text>
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

          {/* Urgência */}
          <Text style={styles.sectionLabel}>NÍVEL DE URGÊNCIA *</Text>
          <View style={styles.urgencyGrid}>
            {URGENCY_OPTIONS.map((opt) => {
              const selected = form.urgency === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.urgencyChip,
                    { borderColor: selected ? opt.color : '#E0E0E0' },
                    selected && { backgroundColor: opt.bg },
                  ]}
                  onPress={() => set('urgency')(opt.key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.urgencyDot, { backgroundColor: opt.color }]} />
                  <Text style={[styles.urgencyText, { color: selected ? opt.color : '#9E9E9E' }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hospital */}
          <Text style={styles.sectionLabel}>HOSPITAL / LOCAL *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Hospital das Clínicas"
            placeholderTextColor="#C0C0C0"
            value={form.hospital}
            onChangeText={set('hospital')}
            autoCapitalize="words"
          />

          {/* Paciente */}
          <Text style={styles.sectionLabel}>NOME DO PACIENTE (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome do paciente"
            placeholderTextColor="#C0C0C0"
            value={form.patientName}
            onChangeText={set('patientName')}
            autoCapitalize="words"
          />

          {/* Observações */}
          <Text style={styles.sectionLabel}>OBSERVAÇÕES (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Informações adicionais..."
            placeholderTextColor="#C0C0C0"
            value={form.notes}
            onChangeText={set('notes')}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.btnText}>🩸  Publicar Pedido</Text>
            }
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Doadores compatíveis em {municipio || 'sua região'} serão notificados automaticamente.
          </Text>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },

  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cancelWrap: { width: 72 },
  cancelText: { color: '#B71C1C', fontSize: 15, fontWeight: '700' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },

  scroll: { padding: 20 },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#BDBDBD',
    letterSpacing: 1, marginTop: 22, marginBottom: 10,
  },

  regionBox: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1.5,
    borderColor: '#BBDEFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  regionIcon: { fontSize: 18 },
  regionText: { fontSize: 15, color: '#1565C0', fontWeight: '700', flex: 1 },

  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bloodChip: {
    borderWidth: 2, borderColor: '#E0E0E0', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 18, backgroundColor: '#FFFFFF',
  },
  bloodChipOn: {
    backgroundColor: '#B71C1C', borderColor: '#B71C1C',
    shadowColor: '#B71C1C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 5, elevation: 3,
  },
  bloodChipText: { color: '#9E9E9E', fontWeight: '800', fontSize: 16 },
  bloodChipTextOn: { color: '#FFFFFF' },

  urgencyGrid: { gap: 8 },
  urgencyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 2, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: '#FFFFFF',
  },
  urgencyDot: { width: 10, height: 10, borderRadius: 5 },
  urgencyText: { fontWeight: '700', fontSize: 15 },

  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EEEEEE',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1A1A1A',
  },
  textarea: { minHeight: 90 },

  btn: {
    backgroundColor: '#B71C1C', borderRadius: 16, paddingVertical: 17,
    alignItems: 'center', marginTop: 28,
    shadowColor: '#B71C1C', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  disclaimer: { textAlign: 'center', color: '#BDBDBD', fontSize: 12, marginTop: 12, lineHeight: 18 },
});
