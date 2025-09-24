/**
 * Firestore service layer - replaces Supabase client
 * Provides type-safe database operations for DiagnosticPro
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  CollectionReference,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { firestore } from '@/integrations/firebase';

// Type definitions for Firestore collections (converted from Supabase schema)
export interface DiagnosticSubmission {
  id?: string;
  analysisStatus?: string | null;
  createdAt?: Timestamp | string;
  email: string;
  equipmentType?: string | null;
  errorCodes?: string | null;
  frequency?: string | null;
  fullName: string;
  locationEnvironment?: string | null;
  make?: string | null;
  mileageHours?: string | null;
  model?: string | null;
  modifications?: string | null;
  orderId?: string | null;
  paidAt?: Timestamp | string | null;
  paymentId?: string | null;
  paymentStatus?: string | null;
  phone?: string | null;
  previousRepairs?: string | null;
  problemDescription?: string | null;
  serialNumber?: string | null;
  shopQuoteAmount?: number | null;
  shopRecommendation?: string | null;
  symptoms?: string[] | null;
  troubleshootingSteps?: string | null;
  updatedAt?: Timestamp | string;
  urgencyLevel?: string | null;
  usagePattern?: string | null;
  userId?: string | null;
  whenStarted?: string | null;
  year?: string | null;
}

export interface Order {
  id?: string;
  amount: number;
  analysis?: string | null;
  analysisCompletedAt?: Timestamp | string | null;
  createdAt?: Timestamp | string;
  currency: string;
  customerEmail: string;
  emailStatus?: string | null;
  errorMessage?: string | null;
  paidAt?: Timestamp | string | null;
  processingStatus?: string | null;
  redirectReady?: boolean | null;
  redirectUrl?: string | null;
  retryCount?: number | null;
  status: string;
  stripeSessionId?: string | null;
  submissionId?: string | null;
  updatedAt?: Timestamp | string;
  userId?: string | null;
}

export interface EmailLog {
  id?: string;
  createdAt?: Timestamp | string;
  error?: string | null;
  messageId?: string | null;
  status: string;
  subject: string;
  submissionId?: string | null;
  toEmail: string;
}

// Collection references
const diagnosticSubmissionsRef = collection(firestore, 'diagnosticSubmissions') as CollectionReference<DiagnosticSubmission>;
const ordersRef = collection(firestore, 'orders') as CollectionReference<Order>;
const emailLogsRef = collection(firestore, 'emailLogs') as CollectionReference<EmailLog>;

// Utility function to convert Firestore timestamps
function convertTimestamps<T extends DocumentData>(data: T): T {
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate().toISOString();
    }
  });
  return converted;
}

/**
 * Diagnostic Submissions Service
 */
export const diagnosticSubmissionsService = {
  async create(data: Omit<DiagnosticSubmission, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string; data: DiagnosticSubmission }> {
    const submission = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(diagnosticSubmissionsRef, submission);
    const docSnap = await getDoc(docRef);

    return {
      id: docRef.id,
      data: convertTimestamps({ id: docRef.id, ...docSnap.data() } as DiagnosticSubmission)
    };
  },

  async getById(id: string): Promise<DiagnosticSubmission | null> {
    const docRef = doc(diagnosticSubmissionsRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return convertTimestamps({ id: docSnap.id, ...docSnap.data() } as DiagnosticSubmission);
  },

  async update(id: string, data: Partial<DiagnosticSubmission>): Promise<void> {
    const docRef = doc(diagnosticSubmissionsRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async getByEmail(email: string): Promise<DiagnosticSubmission[]> {
    const q = query(
      diagnosticSubmissionsRef,
      where('email', '==', email),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc =>
      convertTimestamps({ id: doc.id, ...doc.data() } as DiagnosticSubmission)
    );
  },

  async getRecent(limitCount = 10): Promise<DiagnosticSubmission[]> {
    const q = query(
      diagnosticSubmissionsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc =>
      convertTimestamps({ id: doc.id, ...doc.data() } as DiagnosticSubmission)
    );
  }
};

/**
 * Orders Service
 */
export const ordersService = {
  async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ id: string; data: Order }> {
    const order = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(ordersRef, order);
    const docSnap = await getDoc(docRef);

    return {
      id: docRef.id,
      data: convertTimestamps({ id: docRef.id, ...docSnap.data() } as Order)
    };
  },

  async getById(id: string): Promise<Order | null> {
    const docRef = doc(ordersRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return convertTimestamps({ id: docSnap.id, ...docSnap.data() } as Order);
  },

  async update(id: string, data: Partial<Order>): Promise<void> {
    const docRef = doc(ordersRef, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async getBySubmissionId(submissionId: string): Promise<Order | null> {
    const q = query(
      ordersRef,
      where('submissionId', '==', submissionId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return convertTimestamps({ id: doc.id, ...doc.data() } as Order);
  },

  async getRecent(limitCount = 10): Promise<Order[]> {
    const q = query(
      ordersRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc =>
      convertTimestamps({ id: doc.id, ...doc.data() } as Order)
    );
  }
};

/**
 * Email Logs Service
 */
export const emailLogsService = {
  async create(data: Omit<EmailLog, 'id' | 'createdAt'>): Promise<{ id: string; data: EmailLog }> {
    const emailLog = {
      ...data,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(emailLogsRef, emailLog);
    const docSnap = await getDoc(docRef);

    return {
      id: docRef.id,
      data: convertTimestamps({ id: docRef.id, ...docSnap.data() } as EmailLog)
    };
  },

  async getById(id: string): Promise<EmailLog | null> {
    const docRef = doc(emailLogsRef, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    return convertTimestamps({ id: docSnap.id, ...docSnap.data() } as EmailLog);
  },

  async getBySubmissionId(submissionId: string): Promise<EmailLog[]> {
    const q = query(
      emailLogsRef,
      where('submissionId', '==', submissionId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc =>
      convertTimestamps({ id: doc.id, ...doc.data() } as EmailLog)
    );
  },

  async getRecent(limitCount = 10): Promise<EmailLog[]> {
    const q = query(
      emailLogsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc =>
      convertTimestamps({ id: doc.id, ...doc.data() } as EmailLog)
    );
  }
};

// Export all services as a single object for convenience
export const firestoreServices = {
  diagnosticSubmissions: diagnosticSubmissionsService,
  orders: ordersService,
  emailLogs: emailLogsService,
};

// Health check function
export async function checkFirestoreHealth(): Promise<boolean> {
  try {
    const q = query(diagnosticSubmissionsRef, limit(1));
    await getDocs(q);
    return true;
  } catch (error) {
    console.error('Firestore health check failed:', error);
    return false;
  }
}