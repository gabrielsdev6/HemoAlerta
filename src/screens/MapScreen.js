import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';
import { getHemocentros } from '../services/hemocentroService';

// Coordenadas das capitais — fallback quando a cidade não tem hemocentro
const CAPITAIS = {
  AC: { lat: -9.9754,  lng: -67.8249 },
  AL: { lat: -9.6671,  lng: -35.7351 },
  AP: { lat:  0.0355,  lng: -51.0664 },
  AM: { lat: -3.0768,  lng: -60.0249 },
  BA: { lat: -12.9716, lng: -38.5016 },
  CE: { lat: -3.7435,  lng: -38.5581 },
  DF: { lat: -15.7542, lng: -47.8893 },
  ES: { lat: -20.3155, lng: -40.3128 },
  GO: { lat: -16.6949, lng: -49.2700 },
  MA: { lat: -2.5541,  lng: -44.2956 },
  MT: { lat: -15.5961, lng: -56.0967 },
  MS: { lat: -20.4697, lng: -54.6201 },
  MG: { lat: -19.9167, lng: -43.9345 },
  PA: { lat: -1.4558,  lng: -48.4902 },
  PB: { lat: -7.1195,  lng: -34.8780 },
  PR: { lat: -25.4278, lng: -49.2686 },
  PE: { lat: -8.0522,  lng: -34.9000 },
  PI: { lat: -5.0920,  lng: -42.8034 },
  RJ: { lat: -22.9102, lng: -43.1773 },
  RN: { lat: -5.7945,  lng: -35.2110 },
  RS: { lat: -30.0607, lng: -51.1819 },
  RO: { lat: -8.7612,  lng: -63.9004 },
  RR: { lat:  2.8235,  lng: -60.6758 },
  SC: { lat: -27.5762, lng: -48.5044 },
  SP: { lat: -23.5558, lng: -46.6685 },
  SE: { lat: -10.9099, lng: -37.0510 },
  TO: { lat: -10.1840, lng: -48.3336 },
};

const normalizar = (texto) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// ─── Marcador do mapa ────────────────────────────────────────────────────────
function MarkerPin({ tipo }) {
  const isPace = tipo === 'PACE';
  return (
    <View style={styles.markerWrap}>
      <View style={[styles.markerBubble, isPace && styles.markerBubblePace]}>
        <Text style={styles.markerEmoji}>🏥</Text>
      </View>
      <View style={[styles.markerTail, isPace && styles.markerTailPace]} />
    </View>
  );
}

// ─── Card de hemocentro (modo lista) ─────────────────────────────────────────
function HemocentroCard({ item, onDirections, onSchedule }) {
  return (
    <View style={styles.listCard}>
      <View style={styles.listCardHeader}>
        <View style={[styles.tipoPill, item.tipo === 'PACE' && styles.tipoPillPace]}>
          <Text style={[styles.tipoPillText, item.tipo === 'PACE' && styles.tipoPillTextPace]}>
            {item.tipo}
          </Text>
        </View>
      </View>

      <Text style={styles.listNome}>{item.nome}</Text>

      {!!item.endereco && (
        <Text style={styles.listRow}>📍  {item.endereco}</Text>
      )}
      {!!item.horario && (
        <Text style={styles.listRow}>⏰  {item.horario}</Text>
      )}
      {!!item.telefone && (
        <Text style={styles.listRow}>📞  {item.telefone}</Text>
      )}

      {item.tipo === 'PACE' && (
        <View style={styles.paceWarning}>
          <Text style={styles.paceWarningText}>
            ⚠️ Funciona apenas alguns dias por mês. Confirme a data pelo site antes de ir.
          </Text>
        </View>
      )}

      <View style={styles.listActions}>
        <TouchableOpacity
          style={styles.btnDirections}
          onPress={() => onDirections(item)}
          activeOpacity={0.85}
        >
          <Text style={styles.btnDirectionsText}>🗺  Como Chegar</Text>
        </TouchableOpacity>

        {item.urlAgendamento ? (
          <TouchableOpacity
            style={styles.btnSchedule}
            onPress={() => onSchedule(item)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnScheduleText}>📅  Agendar Doação</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.btnScheduleDisabled}>
            <Text style={styles.btnScheduleDisabledText}>📞 Ligue para agendar</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Tela principal ──────────────────────────────────────────────────────────
export default function MapScreen({ navigation }) {
  const drawerCtx = useDrawer();
  const { userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const [viewMode, setViewMode] = useState('lista'); // 'lista' | 'mapa'
  const [selected, setSelected] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const city      = userProfile?.region?.city      || userProfile?.municipio || '';
  const state     = userProfile?.region?.state     || userProfile?.estado    || '';
  const stateName = userProfile?.region?.stateName || state;
  const cityNorm  = userProfile?.region?.cityNormalized || normalizar(city);

  // Todos os hemocentros da região (para a lista)
  const allHemocentros = useMemo(() => {
    if (!city || !state) return [];
    return getHemocentros(city, state);
  }, [city, state]);

  // Subconjunto com coordenadas válidas (para o mapa)
  const hemocentrosComCoords = useMemo(
    () => allHemocentros.filter((h) => h.lat != null && h.lng != null),
    [allHemocentros],
  );

  const showingStateWide = useMemo(
    () => allHemocentros.length > 0 && !allHemocentros.some((h) => h.cidadeNormalizada === cityNorm),
    [allHemocentros, cityNorm],
  );

  const initialRegion = useMemo(() => {
    if (hemocentrosComCoords.length > 0) {
      return {
        latitude: hemocentrosComCoords[0].lat,
        longitude: hemocentrosComCoords[0].lng,
        latitudeDelta: showingStateWide ? 3 : 0.3,
        longitudeDelta: showingStateWide ? 3 : 0.3,
      };
    }
    const cap = CAPITAIS[state] || { lat: -15.7942, lng: -47.8822 };
    return { latitude: cap.lat, longitude: cap.lng, latitudeDelta: 3, longitudeDelta: 3 };
  }, [hemocentrosComCoords, state, showingStateWide]);

  const handleMapReady = () => {
    setMapReady(true);
    if (hemocentrosComCoords.length > 1) {
      mapRef.current?.fitToCoordinates(
        hemocentrosComCoords.map((h) => ({ latitude: h.lat, longitude: h.lng })),
        { edgePadding: { top: 80, right: 40, bottom: 80, left: 40 }, animated: true },
      );
    }
  };

  const openDirections = (h) =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`);

  const openSchedule = (h) => {
    if (h.urlAgendamento) Linking.openURL(h.urlAgendamento);
  };

  const scopeLabel = showingStateWide ? stateName : city;

  // Tela de tab (sem histórico): mostra ☰ para abrir drawer
  // Tela empilhada via navigate('Map'): mostra ← para voltar
  const renderLeftBtn = () => {
    if (navigation.canGoBack()) {
      return (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={() => drawerCtx.open()} style={styles.backBtn}>
        <Text style={styles.backArrow}>☰</Text>
      </TouchableOpacity>
    );
  };

  // ── Sem região ──────────────────────────────────────────────────────────────
  if (!city || !state) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          {renderLeftBtn()}
          <Text style={styles.headerTitle}>Hemocentros</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.centerEmoji}>📍</Text>
          <Text style={styles.centerTitle}>Região não configurada</Text>
          <Text style={styles.centerSub}>
            Vá em Perfil → Editar perfil para selecionar seu estado e município.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {renderLeftBtn()}

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Hemocentros</Text>
          <Text style={styles.headerSub}>📍 {scopeLabel}</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* ── Toggle Lista / Mapa ── */}
      <View style={styles.toggleWrap}>
        {[
          { key: 'lista', label: '📋  Lista' },
          { key: 'mapa',  label: '🗺️  Mapa' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.toggleBtn, viewMode === key && styles.toggleBtnActive]}
            onPress={() => { setViewMode(key); setSelected(null); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, viewMode === key && styles.toggleTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Banner — estado inteiro ── */}
      {showingStateWide && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            📭 Nenhum hemocentro em {city}. Mostrando do estado de {stateName}.
          </Text>
        </View>
      )}

      {/* ══ MODO LISTA ══════════════════════════════════════════════════════ */}
      {viewMode === 'lista' && (
        <FlatList
          data={allHemocentros}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <HemocentroCard
              item={item}
              onDirections={openDirections}
              onSchedule={openSchedule}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.centerEmoji}>😕</Text>
              <Text style={styles.centerTitle}>Nenhum hemocentro encontrado</Text>
              <Text style={styles.centerSub}>
                Não há hemocentros cadastrados para {city} ou {stateName}.
              </Text>
            </View>
          }
        />
      )}

      {/* ══ MODO MAPA ═══════════════════════════════════════════════════════ */}
      {viewMode === 'mapa' && (
        <View style={styles.mapWrap}>
          {!mapReady && (
            <View style={styles.mapLoader}>
              <ActivityIndicator size="large" color="#B71C1C" />
              <Text style={styles.mapLoaderText}>Carregando mapa...</Text>
            </View>
          )}

          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onMapReady={handleMapReady}
            onPress={() => setSelected(null)}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {hemocentrosComCoords.map((h) => (
              <Marker
                key={h.id}
                coordinate={{ latitude: h.lat, longitude: h.lng }}
                onPress={() => setSelected(h)}
                tracksViewChanges={false}
              >
                <MarkerPin tipo={h.tipo} />
              </Marker>
            ))}
          </MapView>

          {/* Legenda */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#B71C1C' }]} />
              <Text style={styles.legendLabel}>Hemocentro / Núcleo</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E65100' }]} />
              <Text style={styles.legendLabel}>PACE</Text>
            </View>
          </View>

          {/* Bottom sheet (marcador selecionado) */}
          {selected && (
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <View style={styles.sheetHandle}>
                <View style={styles.sheetPill} />
                <TouchableOpacity onPress={() => setSelected(null)} style={styles.sheetCloseBtn}>
                  <Text style={styles.sheetCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                <View style={[styles.tipoPill, selected.tipo === 'PACE' && styles.tipoPillPace]}>
                  <Text style={[styles.tipoPillText, selected.tipo === 'PACE' && styles.tipoPillTextPace]}>
                    {selected.tipo}
                  </Text>
                </View>

                <Text style={styles.sheetNome}>{selected.nome}</Text>

                {[
                  { icon: '📍', value: selected.endereco },
                  { icon: '⏰', value: selected.horario },
                  { icon: '📞', value: selected.telefone || 'Não informado' },
                ].map(({ icon, value }) => (
                  <Text key={icon} style={styles.sheetRow}>{icon}  {value}</Text>
                ))}

                {selected.tipo === 'PACE' && (
                  <View style={styles.paceWarning}>
                    <Text style={styles.paceWarningText}>
                      ⚠️ Funciona apenas alguns dias por mês. Confirme a data pelo site antes de ir.
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={styles.btnDirections}
                  onPress={() => openDirections(selected)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnDirectionsText}>🗺  Como Chegar</Text>
                </TouchableOpacity>

                {selected.urlAgendamento ? (
                  <TouchableOpacity
                    style={styles.btnSchedule}
                    onPress={() => openSchedule(selected)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnScheduleText}>📅  Agendar Doação</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.btnScheduleDisabled}>
                    <Text style={styles.btnScheduleDisabledText}>📞 Ligue para agendar</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F7' },

  // Header
  header: {
    backgroundColor: '#B71C1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
  },
  backBtn: { width: 40 },
  backArrow: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Toggle Lista / Mapa
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    margin: 12,
    borderRadius: 12,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#9E9E9E' },
  toggleTextActive: { color: '#B71C1C' },

  // Banner
  banner: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#F9A825',
    marginTop: -4,
  },
  bannerText: { fontSize: 13, color: '#795548', lineHeight: 18 },

  // ── Lista ────────────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },

  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  listCardHeader: { marginBottom: 8 },
  listNome: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 22,
  },
  listRow: { fontSize: 13, color: '#616161', marginBottom: 4, lineHeight: 19 },

  listActions: { flexDirection: 'row', gap: 10, marginTop: 14 },

  // ── Mapa ─────────────────────────────────────────────────────────────────
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    zIndex: 10,
  },
  mapLoaderText: { marginTop: 12, color: '#9E9E9E', fontSize: 15 },

  // Marcadores
  markerWrap: { alignItems: 'center' },
  markerBubble: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#B71C1C',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  markerBubblePace: { backgroundColor: '#E65100' },
  markerEmoji: { fontSize: 22 },
  markerTail: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10,
    borderStyle: 'solid',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#B71C1C', marginTop: -1,
  },
  markerTailPace: { borderTopColor: '#E65100' },

  // Legenda
  legend: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    gap: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 3, elevation: 3,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: '#424242', fontWeight: '600' },

  // Bottom Sheet (modo mapa)
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '55%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 8,
  },
  sheetHandle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: 12, paddingHorizontal: 20, marginBottom: 4,
  },
  sheetPill: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' },
  sheetCloseBtn: { position: 'absolute', right: 20, padding: 4 },
  sheetCloseText: { fontSize: 18, color: '#9E9E9E', fontWeight: '700' },
  sheetScroll: { paddingHorizontal: 20, maxHeight: 200 },
  sheetNome: { fontSize: 17, fontWeight: '900', color: '#1A1A1A', marginBottom: 10, marginTop: 8, lineHeight: 22 },
  sheetRow: { fontSize: 13, color: '#616161', marginBottom: 5, lineHeight: 19 },
  sheetActions: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },

  // ── Tipo chip ─────────────────────────────────────────────────────────────
  tipoPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 4,
  },
  tipoPillPace: { backgroundColor: '#FFF3E0' },
  tipoPillText: { fontSize: 12, fontWeight: '800', color: '#B71C1C' },
  tipoPillTextPace: { color: '#E65100' },

  // ── Aviso PACE ────────────────────────────────────────────────────────────
  paceWarning: {
    backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12,
    marginTop: 8, borderLeftWidth: 3, borderLeftColor: '#E65100',
  },
  paceWarningText: { fontSize: 12, color: '#E65100', lineHeight: 17 },

  // ── Botões (lista e bottom sheet) ─────────────────────────────────────────
  btnDirections: {
    flex: 1, backgroundColor: '#B71C1C', borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
    shadowColor: '#B71C1C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  btnDirectionsText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  btnSchedule: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#B71C1C',
  },
  btnScheduleText: { color: '#B71C1C', fontWeight: '800', fontSize: 13 },
  btnScheduleDisabled: {
    flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center',
    backgroundColor: '#F7F7F7', borderWidth: 1.5, borderColor: '#EEEEEE',
  },
  btnScheduleDisabledText: { color: '#9E9E9E', fontWeight: '700', fontSize: 12 },

  // ── Estado vazio / sem região ─────────────────────────────────────────────
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  centerEmoji: { fontSize: 52, marginBottom: 12 },
  centerTitle: { fontSize: 18, fontWeight: '800', color: '#424242', textAlign: 'center' },
  centerSub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
