/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

// Key for storage containing custom Firebase configuration
const LOCAL_STORAGE_CONFIG_KEY = 'community_hero_firebase_config';

/**
 * Retrieves the currently active Firebase configuration.
 * Prioritizes custom configuration supplied in UI/localStorage,
 * falling back to the provisioned applet config, then Vite environment variables.
 */
export const getActiveFirebaseConfig = (): FirebaseConfig | null => {
  // 1. Check LocalStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse Firebase config from localStorage:', err);
  }

  // 2. Check Workspace Applet Config
  if (firebaseAppletConfig && firebaseAppletConfig.apiKey && firebaseAppletConfig.projectId) {
    return firebaseAppletConfig as FirebaseConfig;
  }

  // 3. Check Vite environment variables
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID as string,
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  return null;
};

/**
 * Saves a custom Firebase configuration to local storage.
 */
export const saveFirebaseConfig = (config: FirebaseConfig | null) => {
  if (config) {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY);
  }
};

// State trackers for initialization
let app;
let db: any = null;
let auth: any = null;
let googleProvider: any = null;
let isConfigured = false;

const config = getActiveFirebaseConfig();

if (config) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    const dbId = config.firestoreDatabaseId || '(default)';
    if (dbId && dbId !== '(default)' && dbId !== 'default') {
      db = getFirestore(app, dbId);
    } else {
      db = getFirestore(app);
    }
    
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    isConfigured = true;
    console.log('Firebase initialized successfully from config:', config.projectId, 'database:', dbId);
  } catch (error) {
    console.error('Failed to initialize real Firebase with the provided configuration:', error);
  }
} else {
  console.log('No Firebase configuration active. Running the application strictly in elegant Client-Side Local State Mode.');
}

export { db, auth, googleProvider, isConfigured as isFirebaseConfigured };
