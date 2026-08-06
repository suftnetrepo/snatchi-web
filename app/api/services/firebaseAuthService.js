import admin from 'firebase-admin';
import { logger } from '../utils/logger';

/**
 * Firebase Auth Service
 * 
 * Manages Firebase Authentication user provisioning for booking conversations.
 * Ensures all participants have valid Firebase Auth accounts AND Firestore user documents.
 * 
 * Key features:
 * - Idempotent user lookup by email
 * - Creates Firebase Auth users if they don't exist
 * - Creates corresponding Firestore user documents
 * - Returns Firebase UID for valid participants
 * - Handles errors gracefully without partial state
 */

const DEFAULT_PASSWORD = 'user 12345!';
const DEFAULT_DISPLAY_NAME_SUFFIX = '(Auto-provisioned)';

/**
 * Initialize Firebase Admin SDK if not already initialized
 */
const initializeFirebaseAdmin = () => {
  if (admin.apps.length) return;

  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    } else {
      const serviceAccount = require('../data/snatchichat-firebase-adminsdk-1vpcs-43f8bd737e.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    console.log('[FIREBASE AUTH SERVICE] Firebase Admin initialized successfully');
  } catch (error) {
    console.error('[FIREBASE AUTH SERVICE] Failed to initialize Firebase Admin:', error.message);
    throw error;
  }
};

/**
 * Get Firebase Auth instance lazily
 * @returns {object} Firebase Auth instance
 */
const getFirebaseAuth = () => {
  initializeFirebaseAdmin();
  return admin.auth();
};

/**
 * Get Firestore instance lazily
 * @returns {object} Firestore instance
 */
const getFirestoreDb = () => {
  initializeFirebaseAdmin();
  return admin.firestore();
};

/**
 * Create a Firestore user document
 * @param {string} uid - Firebase Auth UID
 * @param {string} email - User email
 * @param {string} displayName - Display name
 * @returns {Promise<void>}
 */
const createFirestoreUserDoc = async (uid, email, displayName = '') => {
  console.log('[FIREBASE AUTH SERVICE] createFirestoreUserDoc:', { uid, email, displayName });
  
  try {
    const db = getFirestoreDb();
    const timestamp = admin.firestore.Timestamp.now();
    
    const userDoc = {
      email,
      displayName: displayName || `${email.split('@')[0]} ${DEFAULT_DISPLAY_NAME_SUFFIX}`,
      photoURL: '',
      createdAt: timestamp,
      invitedBy: '',
      passwordNeedsReset: false,
      rooms: [], // Empty array - rooms will be added when user joins chats
      lastSeen: timestamp,
      status: 'offline'
    };
    
    console.log('[FIREBASE AUTH SERVICE] Writing Firestore user doc:', {
      path: `users/${uid}`,
      data: userDoc
    });
    
    await db.collection('users').doc(uid).set(userDoc);
    
    console.log('[FIREBASE AUTH SERVICE] Firestore user doc created:', { uid, email });
  } catch (error) {
    console.error('[FIREBASE AUTH SERVICE] Error creating Firestore user doc:', {
      uid,
      email,
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Check if a Firebase Auth user exists by email
 * @param {string} email - User email address
 * @returns {object|null} Firebase user object or null if not found
 */
const findFirebaseUserByEmail = async (email) => {
  console.log('[FIREBASE AUTH SERVICE] findFirebaseUserByEmail:', email);
  
  try {
    const auth = getFirebaseAuth();
    const user = await auth.getUserByEmail(email);
    
    console.log('[FIREBASE AUTH SERVICE] User found:', { email, uid: user.uid });
    return user;
  } catch (error) {
    // User does not exist (this is not an error, it's expected)
    if (error.code === 'auth/user-not-found') {
      console.log('[FIREBASE AUTH SERVICE] User not found:', email);
      return null;
    }
    // Other errors are genuine problems
    console.error('[FIREBASE AUTH SERVICE] Error in findFirebaseUserByEmail:', {
      email,
      code: error.code,
      message: error.message
    });
    throw error;
  }
};

/**
 * Create a Firebase Auth user
 * Used for provisioning new participants who don't have Firebase accounts
 * @param {string} email - User email address
 * @param {string} displayName - Optional display name
 * @returns {object} Created Firebase user object with UID
 */
const createFirebaseAuthUser = async (email, displayName = '') => {
  console.log('[FIREBASE AUTH SERVICE] createFirebaseAuthUser:', { email, displayName });
  
  try {
    const auth = getFirebaseAuth();
    
    const userRecord = await auth.createUser({
      email,
      password: DEFAULT_PASSWORD,
      displayName: displayName || `${email.split('@')[0]} ${DEFAULT_DISPLAY_NAME_SUFFIX}`,
      emailVerified: false
    });
    
    console.log('[FIREBASE AUTH SERVICE] Firebase Auth user created:', {
      email,
      uid: userRecord.uid,
      displayName: userRecord.displayName
    });
    
    logger.info(`Created Firebase Auth user for ${email}: ${userRecord.uid}`);
    
    return userRecord;
  } catch (error) {
    // If user was created between check and creation attempt, get them
    if (error.code === 'auth/email-already-exists') {
      console.warn('[FIREBASE AUTH SERVICE] Email already exists during creation (race condition), retrieving:', email);
      logger.warn(`Email ${email} already exists in Firebase Auth, retrieving user`);
      return await findFirebaseUserByEmail(email);
    }
    
    console.error('[FIREBASE AUTH SERVICE] Error creating Firebase user:', {
      email,
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
};

/**
 * Ensure a Firebase Auth user exists for the given email
 * Idempotent: returns existing user if found, creates new if not
 * **CRITICAL**: Also creates corresponding Firestore user document
 * 
 * This is the main entry point for participant provisioning.
 * 
 * @param {string} email - Participant email address
 * @param {string} displayName - Optional display name for new users
 * @returns {string} Firebase UID for the user
 * @throws {Error} If user lookup/creation fails
 */
const ensureFirebaseAuthUser = async (email, displayName = '') => {
  if (!email) {
    throw new Error('Email is required to provision Firebase Auth user');
  }

  try {
    // Step 1: Check if user already exists in Firebase Auth
    let user = await findFirebaseUserByEmail(email);
    
    if (user) {
      console.log('[FIREBASE AUTH SERVICE] Firebase Auth user already exists:', { email, uid: user.uid });
      
      // Step 1b: Ensure Firestore user doc also exists (idempotent)
      try {
        const db = getFirestoreDb();
        const userDocRef = db.collection('users').doc(user.uid);
        const userDocSnap = await userDocRef.get();
        
        if (!userDocSnap.exists()) {
          console.log('[FIREBASE AUTH SERVICE] Firestore user doc missing for existing Auth user, creating:', { email, uid: user.uid });
          await createFirestoreUserDoc(user.uid, email, displayName);
        } else {
          console.log('[FIREBASE AUTH SERVICE] Firestore user doc already exists:', { email, uid: user.uid });
        }
      } catch (firestoreError) {
        console.warn('[FIREBASE AUTH SERVICE] Failed to verify/create Firestore doc for existing user:', {
          email,
          uid: user.uid,
          error: firestoreError.message
        });
        // Don't fail the entire operation if Firestore doc creation fails for existing user
        // User can still be added to chat, just might have missing details
      }
      
      logger.info(`Firebase Auth user already exists for ${email}: ${user.uid}`);
      return user.uid;
    }
    
    // Step 2: Create new Firebase Auth user if not found
    console.log('[FIREBASE AUTH SERVICE] Creating new Firebase Auth user:', email);
    logger.info(`Creating Firebase Auth user for ${email}`);
    user = await createFirebaseAuthUser(email, displayName);
    
    // Step 3: Create corresponding Firestore user document
    console.log('[FIREBASE AUTH SERVICE] Creating Firestore user doc for new user:', { email, uid: user.uid });
    await createFirestoreUserDoc(user.uid, email, user.displayName || displayName);
    
    console.log('[FIREBASE AUTH SERVICE] Successfully ensured user exists in both Auth and Firestore:', {
      email,
      uid: user.uid
    });
    
    return user.uid;
  } catch (error) {
    console.error('[FIREBASE AUTH SERVICE] Failed to ensure Firebase user:', {
      email,
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    logger.error(`Failed to ensure Firebase Auth user for ${email}:`, error);
    throw error;
  }
};

/**
 * Provision Firebase Auth UIDs for multiple participants
 * Idempotent operation that ensures all participants have valid Firebase accounts
 * 
 * @param {array} participants - Array of participant objects with email and displayName
 *   Each participant should have: { email: string, displayName?: string }
 * @returns {array} Array of Firebase UIDs in same order as input
 * @throws {Error} If any participant fails provisioning (all-or-nothing)
 */
const provisionParticipantUIDs = async (participants) => {
  console.log('[FIREBASE AUTH SERVICE] provisionParticipantUIDs called:', {
    participantCount: participants.length,
    emails: participants.map(p => p.email)
  });

  if (!Array.isArray(participants) || participants.length === 0) {
    console.error('[FIREBASE AUTH SERVICE] Invalid participants array');
    throw new Error('Participants array is required and must not be empty');
  }

  const uids = [];
  const failedParticipants = [];

  try {
    // Provision each participant sequentially
    for (const participant of participants) {
      console.log(`[FIREBASE AUTH SERVICE] Processing participant: ${participant.email}`);
      
      try {
        const uid = await ensureFirebaseAuthUser(participant.email, participant.displayName);
        uids.push(uid);
        
        console.log(`[FIREBASE AUTH SERVICE] Participant provisioned:`, {
          email: participant.email,
          uid
        });
      } catch (error) {
        console.error(`[FIREBASE AUTH SERVICE] Failed to provision participant:`, {
          email: participant.email,
          error: error.message,
          code: error.code
        });
        
        failedParticipants.push({
          email: participant.email,
          error: error.message
        });
      }
    }

    // If any participant failed, throw error with details
    if (failedParticipants.length > 0) {
      const errorMsg = `Failed to provision Firebase Auth for ${failedParticipants.length} participant(s): ${
        failedParticipants.map(p => `${p.email} (${p.error})`).join(', ')
      }`;
      console.error('[FIREBASE AUTH SERVICE] Provisioning failed:', errorMsg);
      throw new Error(errorMsg);
    }

    console.log('[FIREBASE AUTH SERVICE] All participants provisioned successfully:', {
      count: uids.length,
      uids
    });

    return uids;
  } catch (error) {
    console.error('[FIREBASE AUTH SERVICE] Fatal error in provisioning:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export {
  ensureFirebaseAuthUser,
  provisionParticipantUIDs,
  findFirebaseUserByEmail,
  createFirebaseAuthUser
};
