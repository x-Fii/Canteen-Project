import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin
const initializeAdmin = () => {
  if (getApps().length === 0) {
    // Use service account from environment variables
    // In production, you'd use Firebase Admin SDK with service account
    // For now, we initialize with default credentials
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle private key - replace escaped newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return {
    auth: getAuth(),
    db: getFirestore(),
  };
};

// User roles enum
export type UserRole = "admin" | "content_manager";

interface CreateUserData {
  email: string;
  password: string;
  role: UserRole;
}

interface DeleteUserData {
  uid: string;
}

/**
 * Create a new user in Firebase Auth with custom claims
 * Also creates a document in the users collection
 */
export const createUser = async (data: CreateUserData) => {
  const { auth, db } = initializeAdmin();

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: data.email,
      password: data.password,
    });

    // Set custom claims (role)
    await auth.setCustomUserClaims(userRecord.uid, { role: data.role });

    // Create user document in Firestore users collection
    await db.collection("users").doc(userRecord.uid).set({
      email: data.email,
      role: data.role,
      createdAt: FieldValue.serverTimestamp(),
      uid: userRecord.uid,
    });

    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      role: data.role,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create user";
    console.error("Error creating user:", error);
    throw new Error(errorMessage);
  }
};

/**
 * Delete a user from Firebase Auth and Firestore
 * Includes logic check to prevent Admin from deleting other Admins
 */
export const deleteUser = async (data: DeleteUserData, callingUserUid: string) => {
  const { auth, db } = initializeAdmin();

  try {
    // Get the user to be deleted
    const userToDelete = await auth.getUser(data.uid);

    // Get the calling user's custom claims to check their role
    const callingUser = await auth.getUser(callingUserUid);
    const callingUserClaims = callingUser.customClaims as { role?: string } | undefined;
    const callingUserRole = callingUserClaims?.role || "";

    // Get the target user's custom claims
    const targetUserClaims = userToDelete.customClaims as { role?: string } | undefined;
    const targetUserRole = targetUserClaims?.role || "";

    // Logic check: Prevent Admin from deleting other Admins
    // Only allow if:
    // - Calling user is super_admin (regardless of target role)
    // - Calling user is admin and target is NOT admin (can delete content_managers)
    if (callingUserRole === "admin" && targetUserRole === "admin") {
      throw new Error("Admins cannot delete other Admins. Please use Firebase Auth console.");
    }

    if (callingUserRole === "admin" && targetUserRole === "super_admin") {
      throw new Error("You cannot delete a Super Admin.");
    }

    // Delete user from Firebase Auth
    await auth.deleteUser(data.uid);

    // Delete user document from Firestore
    await db.collection("users").doc(data.uid).delete();

    return {
      success: true,
      message: `User ${userToDelete.email} deleted successfully`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
    console.error("Error deleting user:", error);
    throw new Error(errorMessage);
  }
};

/**
 * Get all users with their roles
 */
export const getUsers = async () => {
  const { auth, db } = initializeAdmin();

  try {
    // Get all users from Firebase Auth
    const listUsersResult = await auth.listUsers();

    // Get all user documents from Firestore
    const usersSnapshot = await db.collection("users").get();
    const firestoreUsers: Record<string, { role: string; createdAt: unknown }> = {};
    
    usersSnapshot.forEach((doc) => {
      firestoreUsers[doc.id] = doc.data() as { role: string; createdAt: unknown };
    });

    // Combine auth users with firestore data
    const users = listUsersResult.users.map((user) => {
      const firestoreData = firestoreUsers[user.uid] || {};
      const customClaims = user.customClaims as { role?: string } | undefined;
      
      return {
        uid: user.uid,
        email: user.email,
        role: customClaims?.role || firestoreData.role || "content_manager",
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime,
      };
    });

    return {
      success: true,
      users,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to get users";
    console.error("Error getting users:", error);
    throw new Error(errorMessage);
  }
};

/**
 * Update user's role custom claims
 */
export const updateUserRole = async (uid: string, newRole: UserRole, callingUserUid: string) => {
  const { auth, db } = initializeAdmin();

  try {
    // Get the calling user's role
    const callingUser = await auth.getUser(callingUserUid);
    const callingUserClaims = callingUser.customClaims as { role?: string } | undefined;
    const callingUserRole = callingUserClaims?.role || "";

    // Get the target user's current role
    const targetUser = await auth.getUser(uid);
    const targetUserClaims = targetUser.customClaims as { role?: string } | undefined;
    const targetUserRole = targetUserClaims?.role || "";

    // Prevent admin from modifying other admins
    if (callingUserRole === "admin" && targetUserRole === "admin") {
      throw new Error("Admins cannot modify other Admins.");
    }

    // Update custom claims
    await auth.setCustomUserClaims(uid, { role: newRole });

    // Update Firestore document
    await db.collection("users").doc(uid).update({
      role: newRole,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: callingUserUid,
    });

    return {
      success: true,
      message: `User role updated to ${newRole}`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update user role";
    console.error("Error updating user role:", error);
    throw new Error(errorMessage);
  }
};

/**
 * Verify if user has admin privileges
 */
export const verifyAdmin = async (uid: string): Promise<boolean> => {
  const { auth } = initializeAdmin();

  try {
    const user = await auth.getUser(uid);
    const claims = user.customClaims as { role?: string } | undefined;
    return claims?.role === "admin" || claims?.role === "super_admin";
  } catch {
    return false;
  }
};
