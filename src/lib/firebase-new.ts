import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";

// Firebase configuration - loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize main Firebase app
const app = getApps().find(app => app.name === '[DEFAULT]') || initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Initialize secondary Firebase app for creating users without affecting admin session
const secondaryApp = getApps().find(app => app.name === 'secondary') || 
  initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);
export const secondaryDb = getFirestore(secondaryApp);

export const MENU_ITEMS_COLLECTION = "menu_items";
export const USERS_COLLECTION = "users";

export type UserRole = "admin" | "content_manager";

export interface CustomClaims {
  role?: UserRole;
}

export interface UserDocData {
  email: string;
  role: UserRole;
  createdAt: unknown;
  uid: string;
}

/**
 * Hook to check if current user is admin based on Firestore document
 * This is the preferred method as it works with Firestore security rules
 */
export const useAdminStatus = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!auth.currentUser) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, USERS_COLLECTION, auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDocData;
          setIsAdmin(userData.role === 'admin');
        } else {
          // Fallback: check custom claims if no Firestore document
          console.warn('No Firestore user document found, falling back to custom claims');
          const idTokenResult = await auth.currentUser.getIdTokenResult();
          const claims = idTokenResult.claims as CustomClaims;
          setIsAdmin(claims.role === 'admin');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError(err instanceof Error ? err : new Error('Failed to check admin status'));
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChanged(() => {
      checkAdminStatus();
    });

    // Initial check
    checkAdminStatus();

    return () => unsubscribe();
  }, []);

  return { isAdmin, isLoading, error };
};

/**
 * Hook to get user role from Firestore
 */
export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!auth.currentUser) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, USERS_COLLECTION, auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDocData;
          setRole(userData.role);
        } else {
          // Fallback: check custom claims
          const idTokenResult = await auth.currentUser.getIdTokenResult();
          const claims = idTokenResult.claims as CustomClaims;
          setRole(claims.role || null);
        }
      } catch (err) {
        console.error('Error getting user role:', err);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(() => {
      checkUserRole();
    });

    checkUserRole();

    return () => unsubscribe();
  }, []);

  return { role, isLoading };
};

export const getUserRole = async (): Promise<UserRole | null> => {
  if (!auth.currentUser) return null;
  try {
    // First try Firestore
    const userDocRef = doc(db, USERS_COLLECTION, auth.currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserDocData;
      return userData.role;
    }
    
    // Fallback to custom claims
    const idTokenResult = await auth.currentUser.getIdTokenResult();
    const claims = idTokenResult.claims as CustomClaims;
    return claims.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

export const isUserAdmin = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === "admin";
};

export const canUserManageMenu = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === "admin" || role === "content_manager";
};

export interface CreateUserData {
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateUserResult {
  success: boolean;
  uid: string;
  email: string;
  role: string;
}

export const createUserCallable = httpsCallable<CreateUserData, CreateUserResult>(functions, "createUserCallable");

export interface DeleteUserData {
  uid: string;
}

export interface DeleteUserResult {
  success: boolean;
  message: string;
}

export const deleteUserCallable = httpsCallable<DeleteUserData, DeleteUserResult>(functions, "deleteUserCallable");

export interface GetUsersResult {
  success: boolean;
  users: Array<{
    uid: string;
    email: string | null;
    role: string;
    createdAt: string;
    lastSignIn: string;
  }>;
}

export const getUsersCallable = httpsCallable<void, GetUsersResult>(functions, "getUsersCallable");

export interface UpdateUserRoleData {
  uid: string;
  role: UserRole;
}

export interface UpdateUserRoleResult {
  success: boolean;
  message: string;
}

export const updateUserRoleCallable = httpsCallable<UpdateUserRoleData, UpdateUserRoleResult>(functions, "updateUserRoleCallable");
