import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawer } from '../context/DrawerContext';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../navigation/navigationRef';

const DRAWER_WIDTH = 280;
const DURATION = 220;

const ITEMS = [
  { route: 'Home',        label: 'Pedidos',     icon: '🩸' },
  { route: 'Hemocentros', label: 'Hemocentros', icon: '🗺️' },
  { route: 'Donors',      label: 'Doadores',    icon: '👥' },
  { route: 'Profile',     label: 'Perfil',       icon: '👤' },
];

export default function AppDrawer() {
  const { isOpen, close } = useDrawer();
  const { userProfile } = useAuth();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const mounted = useRef(false);

  useEffect(() => {
    if (isOpen) {
      mounted.current = true;
      Animated.parallel([
        Animated.timing(translateX,    { toValue: 0,    duration: DURATION, useNativeDriver: true }),
        Animated.timing(overlayOpacity,{ toValue: 1,    duration: DURATION, useNativeDriver: true }),
      ]).start();
    } else if (mounted.current) {
      Animated.parallel([
        Animated.timing(translateX,    { toValue: -DRAWER_WIDTH, duration: DURATION, useNativeDriver: true }),
        Animated.timing(overlayOpacity,{ toValue: 0,             duration: DURATION, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen && !mounted.current) return null;

  const navigate = (route) => {
    close();
    setTimeout(() => navigationRef.current?.navigate(route), 50);
  };

  const currentRoute = navigationRef.current?.getCurrentRoute()?.name;

  const initial   = userProfile?.name?.charAt(0)?.toUpperCase() || '?';
  const city      = userProfile?.region?.city  || userProfile?.municipio || '';
  const stateCode = userProfile?.region?.state || userProfile?.estado    || '';
  const location  = [city, stateCode].filter(Boolean).join(' - ');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'box-none' : 'none'}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        {/* Header */}
        <SafeAreaView edges={['top']} style={styles.header}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
              {userProfile?.bloodType && (
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodBadgeText}>{userProfile.bloodType}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {userProfile?.name || 'Usuário'}
          </Text>
          {!!location && (
            <Text style={styles.location}>📍 {location}</Text>
          )}
        </SafeAreaView>

        <View style={styles.divider} />

        {/* Nav items */}
        <View style={styles.itemsWrap}>
          {ITEMS.map(({ route, label, icon }) => {
            const isActive = currentRoute === route;
            return (
              <TouchableOpacity
                key={route}
                style={[styles.item, isActive && styles.itemActive]}
                onPress={() => navigate(route)}
                activeOpacity={0.8}
              >
                <Text style={styles.itemIcon}>{icon}</Text>
                <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },

  // Header
  header: {
    backgroundColor: '#B71C1C',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  avatarRow:  { marginBottom: 12 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText:      { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  bloodBadge: {
    position: 'absolute',
    bottom: -3,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  bloodBadgeText: { color: '#B71C1C', fontWeight: '900', fontSize: 11 },
  name:     { fontSize: 17, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  location: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  divider: { height: 1, backgroundColor: '#F0F0F0' },

  // Items
  itemsWrap: { paddingTop: 8, paddingHorizontal: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 2,
  },
  itemActive:      { backgroundColor: '#C0392B' },
  itemIcon:        { fontSize: 20 },
  itemLabel:       { fontSize: 15, fontWeight: '600', color: '#424242' },
  itemLabelActive: { color: '#FFFFFF', fontWeight: '700' },
});
