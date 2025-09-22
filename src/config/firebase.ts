import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "diagnostic-pro-prod",
  appId: "1:298932670545:web:d710527356371228556870",
  storageBucket: "diagnostic-pro-prod.firebasestorage.app",
  apiKey: "AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg",
  authDomain: "diagnostic-pro-prod.firebaseapp.com",
  messagingSenderId: "298932670545",
  measurementId: "G-VQW6LFYQPS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;