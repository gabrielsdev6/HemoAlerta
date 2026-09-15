import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (error) {
      let msg = 'E-mail ou senha incorretos.';
      if (error.code === 'auth/invalid-email') msg = 'E-mail inválido.';
      if (error.code === 'auth/user-disabled') msg = 'Esta conta foi desativada.';
      if (error.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Aguarde alguns minutos.';
      Alert.alert('Erro ao entrar', msg);
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
            <Text style={styles.title}>Entrar</Text>
            <Text style={styles.subtitle}>Bem-vindo de volta ao HemoAlerta 🩸</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#C0C0C0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                  placeholder="Sua senha"
                  placeholderTextColor="#C0C0C0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPass(!showPass)}
                >
                  <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.btnText}>Entrar</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Cadastre-se grátis</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, padding: 28, paddingTop: 20 },
  back: { marginBottom: 32 },
  backText: { color: '#B71C1C', fontSize: 15, fontWeight: '700' },
  titleBlock: { marginBottom: 36 },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: '#9E9E9E', marginTop: 6 },
  form: { gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '800', color: '#424242', letterSpacing: 0.3 },
  input: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputRow: { flexDirection: 'row' },
  eyeBtn: {
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  eyeIcon: { fontSize: 18 },
  btn: {
    backgroundColor: '#B71C1C',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: { color: '#9E9E9E', fontSize: 14 },
  footerLink: { color: '#B71C1C', fontWeight: '800', fontSize: 14 },
});
