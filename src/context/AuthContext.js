import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) setUserProfile(snap.data());
        } catch (_) {}
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const register = async (email, password, profileData) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile = {
      ...profileData,
      uid: cred.user.uid,
      email,
      isAvailable: true,
      totalDonations: 0,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    setUserProfile(profile);
    return cred;
  };

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  const updateProfile = async (data) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), data);
    setUserProfile((prev) => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider
      value={{ user, userProfile, loading, register, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
