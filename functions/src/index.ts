/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createUser, deleteUser, getUsers, updateUserRole, verifyAdmin, initializeAdmin } from "./admin";

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// ============================================
// Callable Functions for User Management
// ============================================

/**
 * Create a new user with custom claims (admin/content_manager role)
 * Only callable by authenticated admins
 */
export const createUserCallable = onCall(
  { cors: ["http://localhost:5173", "https://your-project.firebaseapp.com"] },
  async (request) => {
    // Check if the caller is authenticated
    if (!request.auth) {
      throw new Error("Unauthorized: Authentication required");
    }

    const { email, password, role } = request.data;

    // Validate input
    if (!email || !password || !role) {
      throw new Error("Missing required fields: email, password, role");
    }

    if (!["admin", "content_manager"].includes(role)) {
      throw new Error("Invalid role. Must be 'admin' or 'content_manager'");
    }

    // Verify the caller has admin privileges
    const isAdmin = await verifyAdmin(request.auth.uid);
    if (!isAdmin) {
      throw new Error("Unauthorized: Only admins can create users");
    }

    logger.info(`Creating user with email: ${email} and role: ${role}`, {
      uid: request.auth.uid,
    });

    return await createUser({ email, password, role });
  }
);

/**
 * Delete a user with admin protection logic
 * Prevents Admin from deleting other Admins
 */
export const deleteUserCallable = onCall(
  { cors: ["http://localhost:5173", "https://your-project.firebaseapp.com"] },
  async (request) => {
    // Check if the caller is authenticated
    if (!request.auth) {
      throw new Error("Unauthorized: Authentication required");
    }

    const { uid } = request.data;

    if (!uid) {
      throw new Error("Missing required field: uid");
    }

    // Verify the caller has admin privileges
    const isAdmin = await verifyAdmin(request.auth.uid);
    if (!isAdmin) {
      throw new Error("Unauthorized: Only admins can delete users");
    }

    logger.info(`Deleting user: ${uid}`, {
      requestedBy: request.auth.uid,
    });

    // Pass the calling user's UID for permission check
    return await deleteUser({ uid }, request.auth.uid);
  }
);

/**
 * Get all users with their roles
 */
export const getUsersCallable = onCall(
  { cors: ["http://localhost:5173", "https://your-project.firebaseapp.com"] },
  async (request) => {
    // Check if the caller is authenticated
    if (!request.auth) {
      throw new Error("Unauthorized: Authentication required");
    }

    // Verify the caller has admin privileges
    const isAdmin = await verifyAdmin(request.auth.uid);
    if (!isAdmin) {
      throw new Error("Unauthorized: Only admins can view users");
    }

    logger.info(`Getting all users`, {
      requestedBy: request.auth.uid,
    });

    return await getUsers();
  }
);

/**
 * Update a user's role
 */
export const updateUserRoleCallable = onCall(
  { cors: ["http://localhost:5173", "https://your-project.firebaseapp.com"] },
  async (request) => {
    // Check if the caller is authenticated
    if (!request.auth) {
      throw new Error("Unauthorized: Authentication required");
    }

    const { uid, role } = request.data;

    if (!uid || !role) {
      throw new Error("Missing required fields: uid, role");
    }

    if (!["admin", "content_manager"].includes(role)) {
      throw new Error("Invalid role. Must be 'admin' or 'content_manager'");
    }

    // Verify the caller has admin privileges
    const isAdmin = await verifyAdmin(request.auth.uid);
    if (!isAdmin) {
      throw new Error("Unauthorized: Only admins can update user roles");
    }

    logger.info(`Updating user role: ${uid} to ${role}`, {
      requestedBy: request.auth.uid,
    });

    return await updateUserRole(uid, role, request.auth.uid);
  }
);

// ============================================
// Auth - Update lastSignInAt on Login (Callable)
// ============================================

/**
 * Callable Function: Update lastSignInAt in Firestore
 * 
 * This is called from the client after successful login to sync
 * the Auth lastSignInTime to Firestore lastSignInAt field.
 * 
 * This provides:
 * - Real-time updates for Admin dashboard
 * - Redundant storage for querying/sorting
 * - Immediate reflection of login time
 * 
 * Note: Firebase Auth already tracks metadata.lastSignInTime automatically.
 * This function syncs it to Firestore for dashboard display.
 * 
 * Usage from client:
 * const updateLastSignIn = httpsCallable(functions, 'updateLastSignIn');
 * await updateLastSignIn();
 */
export const updateLastSignIn = onCall(
  { cors: ["http://localhost:5173", "https://your-project.firebaseapp.com"] },
  async (request) => {
    // Check if the caller is authenticated
    if (!request.auth) {
      throw new Error("Unauthorized: Authentication required");
    }

    const uid = request.auth.uid;

    try {
      // Initialize admin and get instances
      const { auth, db } = initializeAdmin();

      // Get the user from Auth to get the latest lastSignInTime
      const userRecord = await auth.getUser(uid);
      const lastSignInTime = userRecord.metadata.lastSignInTime;

      // Parse the timestamp (Auth returns ISO string)
      const lastSignInAt = lastSignInTime ? new Date(lastSignInTime) : new Date();

      // Update Firestore document
      await db.collection("users").doc(uid).set(
        {
          lastSignInAt: lastSignInAt,
          lastSignIn: lastSignInAt.toISOString(), // Keep for backward compatibility
        },
        { merge: true }
      );

      logger.info(`Updated lastSignInAt for user ${uid}`, {
        lastSignInAt: lastSignInAt.toISOString(),
      });

      return {
        success: true,
        lastSignInAt: lastSignInAt.toISOString(),
      };
    } catch (error) {
      logger.error("Error updating lastSignInAt:", error);
      // Don't throw - this is a non-critical update
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);
