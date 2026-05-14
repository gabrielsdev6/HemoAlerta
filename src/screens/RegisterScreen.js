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
import { useAuth } from '../context/AuthContext';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', bloodType: '', city: '', phone: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (value) => setForm((p) => ({ ...p, [field]: value }));

  const handleRegister = async () => {
    const { name, email, password, bloodType, city } = form;
    if (!name.trim() || !email.trim() || !password || !bloodType || !city.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, {
        name: name.trim(), bloodType, city: city.trim(), phone: form.phone.trim(),
      });
    } catch (error) {
      let msg = 'Erro ao cadastrar.';
      if (error.code === 'auth/email-already-in-use') msg = 'E-mail já cadastrado.';
      if (error.code === 'auth/invalid-email') msg = 'E-mail inválido.';
      if (error.code === 'auth/weak-password') msg = 'Senha muito fraca (mín. 6 caracteres).';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Junte-se à rede de doadores 🩸</Text>
          </View>

          <View style={styles.form}>
            {/* Nome */}
            <View style={styles.field}>
              <Text style={styles.label}>Nome completo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome"
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

            {/* Tipo sanguíneo */}
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

            {/* Cidade */}
            <View style={styles.field}>
              <Text style={styles.label}>Cidade *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: São Paulo - SP"
                placeholderTextColor="#C0C0C0"
                value={form.city}
                onChangeText={set('city')}
                autoCapitalize="words"
              />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, padding: 28, paddingTop: 20 },
  back: { marginBottom: 28 },
  backText: { color: '#B71C1C', fontSize: 15, fontWeight: '700' },
  titleBlock: { marginBottom: 30 },
  title: { fontSize: 34, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#9E9E9E', marginTop: 6 },
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
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
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
});
