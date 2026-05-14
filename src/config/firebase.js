import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==============================================================
// CONFIGURAÇÃO DO FIREBASE
// 1. Acesse https://console.firebase.google.com
// 2. Clique em "Adicionar projeto" e crie um projeto "HemoAlerta"
// 3. No menu lateral, clique em "Firestore Database" e crie o banco
// 4. Clique no ícone "</>" para adicionar um app Web
// 5. Copie os dados de firebaseConfig e substitua abaixo
// 6. Em Authentication > Sign-in method, ative "Email/Password"
// 7. Em Firestore > Regras, cole as regras do comentário abaixo
//
// REGRAS DO FIRESTORE (Firestore > Regras > Editar):
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{userId} {
//       allow read: if request.auth != null;
//       allow write: if request.auth != null && request.auth.uid == userId;
//     }
//     match /requests/{requestId} {
//       allow read: if request.auth != null;
//       allow create: if request.auth != null;
//       allow update, delete: if request.auth != null
//         && request.auth.uid == resource.data.requesterUid;
//     }
//   }
// }
// ==============================================================

const firebaseConfig = {
  apiKey: "AIzaSyA098JWgVUhXa56r5kdbmA_-BqluoaW4Hw",
  authDomain: "hemoalerta.firebaseapp.com",
  projectId: "hemoalerta",
  storageBucket: "hemoalerta.firebasestorage.app",
  messagingSenderId: "801808247342",
  appId: "1:801808247342:web:03a6106574d2d486520dbf",
  measurementId: "G-15DTE8Y1GM"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;
