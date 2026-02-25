import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, orderBy, onSnapshot, getDocs, serverTimestamp, setDoc } from "firebase/firestore";

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

export interface UserData {
  uid: string;
  email: string | null;
  role: string;
  createdAt: string;
  lastSignIn: string;
}

/**
 * Bootstrap admin user - creates Firestore document if it doesn't exist
 * This handles the case where an admin logs in for the first time but has no Firestore document
 * @returns { success: boolean, message: string, isBootstrap: boolean }
 */
export const bootstrapAdminUser = async (): Promise<{ success: boolean; message: string; isBootstrap: boolean }> => {
  if (!auth.currentUser) {
    return { success: false, message: "No authenticated user", isBootstrap: false };
  }

  const userId = auth.currentUser.uid;
  const userDocRef = doc(db, USERS_COLLECTION, userId);

  try {
    // Check if user document already exists
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // User document exists, no bootstrap needed
      return { success: true, message: "User document already exists", isBootstrap: false };
    }

    // Check custom claims to determine if user should be admin
    const idTokenResult = await auth.currentUser.getIdTokenResult();
    const claims = idTokenResult.claims as CustomClaims;
    const role = claims.role || "content_manager";

    // Create user document in Firestore (bootstrap)
    await setDoc(userDocRef, {
      email: auth.currentUser.email,
      role: role,
      createdAt: serverTimestamp(),
      uid: userId,
      bootstrappedAt: serverTimestamp(),
    });

    console.log(`[Bootstrap] Created user document for ${auth.currentUser.email} with role: ${role}`);
    return { 
      success: true, 
      message: `User document created with role: ${role}`, 
      isBootstrap: true 
    };
  } catch (error) {
    console.error("[Bootstrap] Error creating user document:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to bootstrap user", 
      isBootstrap: false 
    };
  }
};

/**
 * Fetch all users with real-time updates using onSnapshot
 * Includes proper error handling for Permission Denied vs Empty Collection
 * @param callback - Function to call with updated users array
 * @returns unsubscribe function
 */
export const fetchAllUsers = (
  callback: (users: UserData[], error: Error | null, isEmpty: boolean) => void
): (() => void) => {
  const usersCollection = collection(db, USERS_COLLECTION);
  const q = query(usersCollection, orderBy("email", "asc"));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      // Check if collection is empty
      if (snapshot.empty) {
        console.log("[fetchAllUsers] Users collection is empty");
        callback([], null, true);
        return;
      }

      const users: UserData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || null,
          role: data.role || "content_manager",
          createdAt: data.createdAt 
            ? (data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date().toISOString())
            : new Date().toISOString(),
          lastSignIn: data.lastSignIn || "Never",
        };
      });

      console.log(`[fetchAllUsers] Fetched ${users.length} users`);
      callback(users, null, false);
    },
    (error) => {
      // Handle specific Firestore errors
      console.error("[fetchAllUsers] Error fetching users:", error);

      if (error.code === "permission-denied") {
        // Security rules denied the request - user might not be admin
        const permissionError = new Error("Permission Denied: You don't have admin privileges to view users. Check your role in Firestore.");
        callback([], permissionError, false);
      } else if (error.code === "unavailable") {
        // Firestore service unavailable
        const unavailableError = new Error("Service Unavailable: Firestore is temporarily unavailable.");
        callback([], unavailableError, false);
      } else {
        // Generic error
        callback([], error instanceof Error ? error : new Error("Unknown error fetching users"), false);
      }
    }
  );

  return unsubscribe;
};

/**
 * Fetch all users once (non-real-time) - useful for initial load
 * Includes proper error handling
 */
export const fetchAllUsersOnce = async (): Promise<{ 
  users: UserData[]; 
  error: Error | null; 
  isEmpty: boolean 
}> => {
  const usersCollection = collection(db, USERS_COLLECTION);
  const q = query(usersCollection, orderBy("email", "asc"));

  try {
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("[fetchAllUsersOnce] Users collection is empty");
      return { users: [], error: null, isEmpty: true };
    }

    const users: UserData[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || null,
        role: data.role || "content_manager",
        createdAt: data.createdAt 
          ? (data.createdAt instanceof Date ? data.createdAt.toISOString() : new Date().toISOString())
          : new Date().toISOString(),
        lastSignIn: data.lastSignIn || "Never",
      };
    });

    console.log(`[fetchAllUsersOnce] Fetched ${users.length} users`);
    return { users, error: null, isEmpty: false };
  } catch (error) {
    console.error("[fetchAllUsersOnce] Error fetching users:", error);

    if (error instanceof Error && error.name === "FirebaseError") {
      const firebaseError = error as { code?: string };
      
      if (firebaseError.code === "permission-denied") {
        return { 
          users: [], 
          error: new Error("Permission Denied: You don't have admin privileges to view users."), 
          isEmpty: false 
        };
      }
    }

    return { 
      users: [], 
      error: error instanceof Error ? error : new Error("Unknown error fetching users"), 
      isEmpty: false 
    };
  }
};
