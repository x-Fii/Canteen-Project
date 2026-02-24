import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration - loaded from environment variables for security
// Ensure .env.local is properly configured
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Validate configuration
const validateConfig = () => {
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
  const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missing.length > 0) {
    console.error(`Firebase config missing required fields: ${missing.join(', ')}`);
    console.warn('Please ensure .env.local is properly configured');
  }
};

validateConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Collection name constants
export const MENU_ITEMS_COLLECTION = "menu_items";
export const ADMIN_USERS_COLLECTION = "admin_users";
