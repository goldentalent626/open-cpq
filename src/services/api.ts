import { db, auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail as firebaseSendPasswordResetEmail 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { BaseResource, Quote, PriceListItem, CompositeComponent, SoftwareAsset } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- AUTH ---

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message || 'Credenziali non valide. Riprova.');
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Errore durante il logout.');
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email, {
      url: window.location.origin,
    });
  } catch (error: any) {
    throw new Error(error.message || "Errore durante l'invio dell'email di recupero.");
  }
};

export const getCurrentUser = async () => {
  return auth.currentUser;
};

// --- RESOURCES ---

export const fetchResources = async (): Promise<BaseResource[]> => {
  const path = 'resources';
  try {
    const q = query(collection(db, path), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BaseResource[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const createResource = async (resource: Omit<BaseResource, 'id'>) => {
  const path = 'resources';
  try {
    const resourceWithDate = { ...resource, updatedAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, path), resourceWithDate);
    return { ...resourceWithDate, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const updateResource = async (id: string, resource: Partial<BaseResource>) => {
  const path = `resources/${id}`;
  try {
    const resourceWithDate = { ...resource, updatedAt: new Date().toISOString() };
    await updateDoc(doc(db, 'resources', id), resourceWithDate);
    return { ...resourceWithDate, id } as BaseResource;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const deleteResource = async (id: string) => {
  const path = `resources/${id}`;
  try {
    await deleteDoc(doc(db, 'resources', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};

// --- PRICELISTS (ITEMS) ---

export const fetchPricelistItems = async (): Promise<PriceListItem[]> => {
  const path = 'pricelist_items';
  try {
    const q = query(collection(db, path), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PriceListItem[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const createPricelistItem = async (item: Omit<PriceListItem, 'id'>) => {
  const path = 'pricelist_items';
  try {
    const docRef = await addDoc(collection(db, path), item);
    return { ...item, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const updatePricelistItem = async (item: PriceListItem) => {
  const path = `pricelist_items/${item.id}`;
  try {
    const { id, ...data } = item;
    await setDoc(doc(db, 'pricelist_items', id), data);
    return item;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const deletePricelistItem = async (id: string) => {
  const path = `pricelist_items/${id}`;
  try {
    await deleteDoc(doc(db, 'pricelist_items', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};

// --- SOFTWARE ASSETS ---

export const fetchSoftwareAssets = async (): Promise<SoftwareAsset[]> => {
  const path = 'software_assets';
  try {
    const q = query(collection(db, path), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SoftwareAsset[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const createSoftwareAsset = async (asset: Omit<SoftwareAsset, 'id'>) => {
  const path = 'software_assets';
  try {
    const docRef = await addDoc(collection(db, path), asset);
    return { ...asset, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

// --- COMPOSITE COMPONENTS (KITS) ---

export const fetchComponents = async (): Promise<CompositeComponent[]> => {
  const path = 'composite_components';
  try {
    const q = query(collection(db, path), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CompositeComponent[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const createCompositeComponent = async (component: Omit<CompositeComponent, 'id'>) => {
  const path = 'composite_components';
  try {
    const componentWithDate = { ...component, updatedAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, path), componentWithDate);
    return { ...componentWithDate, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const deleteCompositeComponent = async (id: string) => {
  const path = `composite_components/${id}`;
  try {
    await deleteDoc(doc(db, 'composite_components', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};

// --- QUOTES ---

export const fetchQuotes = async (): Promise<Quote[]> => {
  const path = 'quotes';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Quote[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const saveQuote = async (quote: Quote) => {
  const path = `quotes/${quote.id}`;
  try {
    const isNew = !quote.id || quote.id.includes('temp') || quote.id.startsWith('Q-');
    let finalQuote = { ...quote };
    
    if (isNew) {
      // Create new document with auto-generated ID
      const docRef = await addDoc(collection(db, 'quotes'), quote);
      finalQuote.id = docRef.id;
    } else {
      // Update existing document
      await setDoc(doc(db, 'quotes', quote.id), quote);
    }
    
    return finalQuote;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};
