import admin from 'firebase-admin';
import { logger } from '../utils/logger';
import firebaseAuthService from './firebaseAuthService';

/**
 * Booking Chat Service
 * 
 * Manages Firebase Firestore conversations for job bookings (Scheduler).
 * Reuses existing Firebase chat infrastructure for group conversations.
 * 
 * Key features:
 * - Provisions Firebase Auth accounts for all participants before creating conversation
 * - Creates group conversations when a booking is created
 * - Idempotent: uses schedule_<id> as unique conversation identifier
 * - Automatically adds system message with booking details
 * - Manages participant list using Firebase UIDs (Engineer, Integrator, Engineer's Integrator)
 * 
 * CRITICAL: 
 * - Firestore access is lazy-loaded to avoid initialization errors
 * - Firebase Admin must be initialized before methods are called, but NOT before module load
 * - All participants must have valid Firebase Auth accounts before conversation is created
 */

const BOOKING_CHAT_TYPE = 'schedule';

/**
 * Get Firestore instance lazily
 * Called only when methods are invoked, ensuring Firebase Admin has been initialized
 * @returns {object} Firestore database instance
 * @throws {Error} If Firebase Admin is not initialized
 */
const getFirestoreDb = () => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized. Ensure Firebase is configured before using chat services.');
  }
  return admin.firestore();
};

/**
 * Resolve unique participant list (removes duplicates)
 * @param {string} engineerId - User ID of engineer
 * @param {string} bookingIntegratorId - Integrator ID making the booking
 * @param {string} engineerIntegratorId - Integrator ID that owns the engineer
 * @returns {array} Unique list of participant IDs
 */
const resolveUniqueParticipants = (engineerId, bookingIntegratorId, engineerIntegratorId) => {
  const participants = new Set();
  
  // Add engineer
  if (engineerId) participants.add(engineerId);
  
  // Add booking integrator
  if (bookingIntegratorId) participants.add(bookingIntegratorId);
  
  // Add engineer's integrator (if different from booking integrator)
  if (engineerIntegratorId && engineerIntegratorId.toString() !== bookingIntegratorId.toString()) {
    participants.add(engineerIntegratorId);
  }
  
  return Array.from(participants);
};

/**
 * Build conversation metadata for booking
 * @param {string} scheduleId - MongoDB Schedule ID
 * @param {string} title - Booking title
 * @param {array} participantIds - List of participant user/integrator IDs
 * @param {string} createdBy - User who created the booking
 * @returns {object} Conversation metadata
 */
const buildConversationMetadata = (scheduleId, title, participantIds, createdBy) => {
  const timestamp = admin.firestore.Timestamp.now();
  
  return {
    id: `schedule_${scheduleId}`,
    type: BOOKING_CHAT_TYPE,
    scheduleId,
    title,
    participantIds,
    createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastMessage: null,
    lastMessageTimestamp: null,
    lastMessageSentBy: null,
    active: true,
    // Initialize unread counts for all participants
    unreadCount: participantIds.reduce((acc, participantId) => {
      acc[participantId] = 0;
      return acc;
    }, {})
  };
};

/**
 * Get existing booking conversation
 * Tries to find conversation with the schedule ID key
 * @param {string} scheduleId - MongoDB Schedule ID
 * @returns {object|null} Existing conversation or null
 */
const getExistingConversation = async (scheduleId) => {
  try {
    const db = getFirestoreDb();
    const conversationId = `schedule_${scheduleId}`;
    const docRef = db.collection('chats').doc(conversationId);
    const doc = await docRef.get();
    
    if (doc.exists) {
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    
    return null;
  } catch (error) {
    logger.error(`Error retrieving existing booking conversation for schedule ${scheduleId}:`, error);
    return null;
  }
};

/**
 * Create new booking conversation
 * Creates Firebase Firestore conversation document with booking metadata
 * @param {string} scheduleId - MongoDB Schedule ID
 * @param {string} title - Booking title
 * @param {array} participantIds - List of participant IDs
 * @param {string} createdBy - User who created the booking
 * @returns {object|null} Created conversation or null if error
 */
const createBookingConversation = async (scheduleId, title, participantIds, createdBy) => {
  try {
    const db = getFirestoreDb();
    const conversationId = `schedule_${scheduleId}`;
    const metadata = buildConversationMetadata(scheduleId, title, participantIds, createdBy);
    
    const docRef = db.collection('chats').doc(conversationId);
    await docRef.set(metadata);
    
    logger.info(`Created booking conversation ${conversationId} for schedule ${scheduleId}`);
    
    return {
      id: conversationId,
      ...metadata
    };
  } catch (error) {
    logger.error(`Error creating booking conversation for schedule ${scheduleId}:`, error);
    throw error;
  }
};

/**
 * Send system message to booking conversation
 * Creates an automated message welcoming participants and explaining purpose
 * @param {string} conversationId - Firebase conversation ID
 * @param {string} title - Booking title for context
 * @returns {boolean} Success indicator
 */
const sendBookingSystemMessage = async (conversationId, title) => {
  try {
    const db = getFirestoreDb();
    const timestamp = admin.firestore.Timestamp.now();
    
    const systemMessage = {
      _id: `system_${timestamp.toMillis()}`,
      senderId: 'system',
      text: `Booking conversation created for: ${title}\n\nUse this conversation to discuss:\n\n• Job requirements\n• Scheduling\n• Equipment\n• Price Offer\n• Site access\n• Questions before arrival`,
      timestamp,
      isRead: false,
      user: {
        _id: 'system',
        name: 'System'
      },
      isSystemMessage: true
    };
    
    const messagesRef = db.collection('chats').doc(conversationId).collection('messages');
    await messagesRef.add(systemMessage);
    
    logger.info(`Sent system message to booking conversation ${conversationId}`);
    
    return true;
  } catch (error) {
    logger.error(`Error sending system message to conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * Create or retrieve booking conversation (idempotent)
 * 
 * Main entry point for booking chat creation.
 * 
 * Flow:
 * 1. Check if conversation exists (idempotency)
 * 2. If not, provision Firebase Auth users for all participants
 * 3. Create new conversation with Firebase UIDs
 * 4. Send system message
 * 5. Return conversation
 * 
 * CRITICAL: Booking is NOT created/saved until all participants have Firebase Auth accounts
 * and the conversation is successfully created. Failures result in no chat_id update.
 * 
 * @param {object} params - Parameters object
 * @param {string} params.scheduleId - MongoDB Schedule ID
 * @param {string} params.title - Booking title
 * @param {object} params.engineer - Engineer participant { userId, email, displayName }
 * @param {object} params.bookingIntegrator - Booking creator { userId, email, displayName }
 * @param {object} params.engineerIntegrator - Engineer's integrator { userId, email, displayName }
 * @returns {object|null} Booking conversation or null if creation failed
 */
const createOrGetBookingConversation = async ({
  scheduleId,
  title,
  engineer,
  bookingIntegrator,
  engineerIntegrator
}) => {
  try {
    // Validate required parameters
    if (!scheduleId || !title) {
      throw new Error('scheduleId and title are required');
    }

    // Check if conversation already exists (idempotency)
    const existingConversation = await getExistingConversation(scheduleId);
    if (existingConversation) {
      logger.info(`Booking conversation already exists for schedule ${scheduleId}`);
      return existingConversation;
    }

    // Build unique participant list (remove duplicates by email)
    const participantSet = new Set();
    const participantsWithInfo = [];

    if (engineer?.email) {
      participantSet.add(engineer.email);
      participantsWithInfo.push({
        email: engineer.email,
        displayName: engineer.displayName || 'Engineer'
      });
    }

    if (bookingIntegrator?.email && !participantSet.has(bookingIntegrator.email)) {
      participantSet.add(bookingIntegrator.email);
      participantsWithInfo.push({
        email: bookingIntegrator.email,
        displayName: bookingIntegrator.displayName || 'Booking Integrator'
      });
    }

    if (engineerIntegrator?.email && !participantSet.has(engineerIntegrator.email)) {
      participantSet.add(engineerIntegrator.email);
      participantsWithInfo.push({
        email: engineerIntegrator.email,
        displayName: engineerIntegrator.displayName || "Engineer's Integrator"
      });
    }

    if (participantsWithInfo.length === 0) {
      throw new Error('No valid participant emails found for booking conversation');
    }

    logger.info(`Provisioning Firebase Auth for ${participantsWithInfo.length} participants for schedule ${scheduleId}`);

    // CRITICAL: Provision Firebase Auth users for all participants
    // This ensures all participants have valid Firebase UIDs before conversation creation
    // If ANY participant fails, NO conversation is created (all-or-nothing)
    let firebaseUIDs;
    try {
      firebaseUIDs = await firebaseAuthService.provisionParticipantUIDs(participantsWithInfo);
    } catch (authError) {
      // Do not create conversation if participant provisioning fails
      logger.error(`Firebase Auth provisioning failed for schedule ${scheduleId}:`, authError);
      throw authError;
    }

    logger.info(`Successfully provisioned Firebase Auth for ${firebaseUIDs.length} participants`);

    // Create new conversation with Firebase UIDs as participants
    const conversation = await createBookingConversation(
      scheduleId,
      title,
      firebaseUIDs,
      bookingIntegrator?.userId || bookingIntegrator?.email
    );

    // Send system message
    try {
      await sendBookingSystemMessage(conversation.id, title);
    } catch (messageError) {
      // Log but don't fail - conversation exists even if system message failed
      logger.error(`Failed to send system message but conversation created: ${messageError.message}`);
    }

    return conversation;
  } catch (error) {
    logger.error(`Error in createOrGetBookingConversation for schedule ${scheduleId}:`, error);
    // Return null instead of throwing - don't fail booking creation if chat fails
    return null;
  }
};

export default {
  createOrGetBookingConversation,
  getExistingConversation,
  resolveUniqueParticipants
};
