import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { navigationRef } from './navigationRef';

import WelcomeScreen       from '../screens/WelcomeScreen';
import LoginScreen         from '../screens/LoginScreen';
import RegisterScreen      from '../screens/RegisterScreen';
import HomeScreen          from '../screens/HomeScreen';
import DonorHomeScreen     from '../screens/DonorHomeScreen';
import DonorsScreen        from '../screens/DonorsScreen';
import ProfileScreen       from '../screens/ProfileScreen';
import CreateRequestScreen from '../screens/CreateRequestScreen';
import BloodBanksScreen    from '../screens/BloodBanksScreen';
import MapScreen           from '../screens/MapScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function HomeTab(props) {
  const { userProfile } = useAuth();
  if (userProfile?.userType === 'doador') return <DonorHomeScreen {...props} />;
  return <HomeScreen {...props} />;
}

// Tab bar oculta — navegação acontece via drawer customizado
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Home"        component={HomeTab} />
      <Tab.Screen name="Hemocentros" component={MapScreen} />
      <Tab.Screen name="Donors"      component={DonorsScreen} />
      <Tab.Screen name="Profile"     component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome"  component={WelcomeScreen} />
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs"     component={MainTabs} />
      <Stack.Screen
        name="CreateRequest"
        component={CreateRequestScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="BloodBanks" component={BloodBanksScreen} />
      <Stack.Screen name="Map"        component={MapScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#C62828' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
