import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.root}>
      {/* Painel vermelho superior */}
      <View style={styles.hero}>
        <SafeAreaView style={styles.heroInner}>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>🩸</Text>
            <View>
              <Text style={styles.logoTitle}>HemoAlerta</Text>
              <Text style={styles.logoSub}>Rede de Doação de Sangue</Text>
            </View>
          </View>

          <View style={styles.heroCenter}>
            <View style={styles.dropCircle}>
              <Text style={styles.dropEmoji}>🩸</Text>
            </View>
            <Text style={styles.heroHeadline}>
              Salve{'\n'}vidas.
            </Text>
            <Text style={styles.heroDetail}>
              Cada doação pode salvar até 4 pessoas.{'\n'}
              Seja um herói anônimo.
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Painel branco inferior — sobrepõe o herói */}
      <View style={styles.bottomSheet}>
        <View style={styles.pill} />

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>O-</Text>
            <Text style={styles.statLbl}>Doador{'\n'}universal</Text>
          </View>
          <View style={styles.statLine} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>4x</Text>
            <Text style={styles.statLbl}>Vidas por{'\n'}doação</Text>
          </View>
          <View style={styles.statLine} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>AB+</Text>
            <Text style={styles.statLbl}>Receptor{'\n'}universal</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.88}
        >
          <Text style={styles.btnPrimaryText}>Criar conta grátis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.88}
        >
          <Text style={styles.btnSecondaryText}>Já tenho conta — Entrar</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          Ao continuar, você concorda em usar o app para fins humanitários.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#B71C1C' },

  hero: {
    flex: 1,
    backgroundColor: '#B71C1C',
  },
  heroInner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: { fontSize: 28 },
  logoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  logoSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },

  heroCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  dropCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dropEmoji: { fontSize: 36 },
  heroHeadline: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 58,
    letterSpacing: -1,
  },
  heroDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 14,
    lineHeight: 21,
  },

  /* Bottom sheet */
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 36,
    marginTop: -36,
  },
  pill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 24,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    backgroundColor: '#FFF5F5',
    borderRadius: 18,
    padding: 16,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#B71C1C',
  },
  statLbl: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 15,
  },
  statLine: { width: 1, height: 36, backgroundColor: '#FFCDD2' },

  btnPrimary: {
    backgroundColor: '#B71C1C',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  btnSecondaryText: {
    color: '#424242',
    fontSize: 15,
    fontWeight: '600',
  },
  terms: {
    textAlign: 'center',
    color: '#BDBDBD',
    fontSize: 11,
    marginTop: 16,
    lineHeight: 16,
  },
});
