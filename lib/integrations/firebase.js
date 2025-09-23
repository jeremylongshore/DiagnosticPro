/**
 * Firebase configuration and authentication
 * Simple email/password auth for new backend
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
// Firebase config
const firebaseConfig = {
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'diagnosticpro-cloud-run',
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'REPLACE_WITH_FIREBASE_KEY',
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'diagnosticpro-cloud-run'}.firebaseapp.com`,
    appId: '1:123456789:web:abcdef123456',
};
// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    }
    catch (error) {
        console.error('Sign in failed:', error);
        throw error;
    }
}
/**
 * Create new user account
 */
export async function signUp(email, password) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    }
    catch (error) {
        console.error('Sign up failed:', error);
        throw error;
    }
}
/**
 * Sign out current user
 */
export async function logOut() {
    try {
        await signOut(auth);
    }
    catch (error) {
        console.error('Sign out failed:', error);
        throw error;
    }
}
/**
 * Get current user
 */
export function getCurrentUser() {
    return auth.currentUser;
}
/**
 * Get current user's ID token
 */
export async function getIdToken() {
    const user = getCurrentUser();
    if (!user)
        return null;
    try {
        return await user.getIdToken();
    }
    catch (error) {
        console.error('Failed to get ID token:', error);
        return null;
    }
}
/**
 * Listen to auth state changes
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}
/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured() {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    return !!(projectId && apiKey && apiKey !== 'REPLACE_WITH_FIREBASE_KEY');
}
// Export auth instance for direct use if needed
export { auth };
