import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Example: Add a diagnostic submission
export const addDiagnosticSubmission = async (data: any) => {
  try {
    const docRef = await addDoc(collection(db, 'diagnosticSubmissions'), {
      ...data,
      createdAt: new Date(),
      status: 'pending'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding diagnostic submission:', error);
    throw error;
  }
};

// Example: Get user's diagnostics
export const getUserDiagnostics = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'diagnosticSubmissions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user diagnostics:', error);
    throw error;
  }
};

// Example: Get a specific diagnostic
export const getDiagnostic = async (diagnosticId: string) => {
  try {
    const docRef = doc(db, 'diagnosticSubmissions', diagnosticId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Diagnostic not found');
    }
  } catch (error) {
    console.error('Error getting diagnostic:', error);
    throw error;
  }
};

// Example: Update diagnostic status
export const updateDiagnosticStatus = async (diagnosticId: string, status: string) => {
  try {
    const docRef = doc(db, 'diagnosticSubmissions', diagnosticId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating diagnostic status:', error);
    throw error;
  }
};