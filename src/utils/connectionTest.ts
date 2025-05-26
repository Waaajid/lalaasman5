// Test utility to verify Firebase connection and user joining
import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    const testRef = ref(db, 'test');
    await set(testRef, { timestamp: Date.now(), test: 'connection' });
    const snapshot = await get(testRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

export const testUserJoinFlow = async (sessionId: string, nickname: string): Promise<{
  success: boolean;
  sessionExists: boolean;
  userAdded: boolean;
  error?: string;
}> => {
  try {
    // Check if session exists
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const sessionSnapshot = await get(sessionRef);
    const sessionExists = sessionSnapshot.exists();
    
    if (!sessionExists) {
      return { success: false, sessionExists: false, userAdded: false, error: 'Session not found' };
    }
    
    // Try to add user
    const playerRef = ref(db, `sessions/${sessionId}/players/${nickname}`);
    await set(playerRef, {
      nickname,
      isHost: false,
      connected: true,
      teamId: '',
      answers: {}
    });
    
    // Verify user was added
    const playerSnapshot = await get(playerRef);
    const userAdded = playerSnapshot.exists();
    
    return { success: userAdded, sessionExists, userAdded };
  } catch (error) {
    return { 
      success: false, 
      sessionExists: false, 
      userAdded: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const debugSessionState = async (sessionId: string): Promise<void> => {
  try {
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const snapshot = await get(sessionRef);
    
    if (snapshot.exists()) {
      const session = snapshot.val();
      console.log('Session Debug Info:', {
        id: sessionId,
        status: session.status,
        playerCount: Object.keys(session.players || {}).length,
        players: Object.keys(session.players || {}),
        teams: Object.keys(session.teams || {}),
        currentRound: session.currentRound,
        phase: session.currentState?.phase
      });
    } else {
      console.log('Session does not exist:', sessionId);
    }
  } catch (error) {
    console.error('Error debugging session:', error);
  }
};
