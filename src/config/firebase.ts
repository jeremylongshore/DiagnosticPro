import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "diagnostic-pro-prod",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:298932670545:web:d710527356371228556870",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "diagnostic-pro-prod.firebasestorage.app",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "diagnostic-pro-prod.firebaseapp.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "298932670545",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VQW6LFYQPS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Functions
export const functions = getFunctions(app);

export default app;