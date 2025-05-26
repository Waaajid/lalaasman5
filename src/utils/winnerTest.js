// Test utility to debug winner determination issues
import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

/**
 * This function simulates having multiple players in the same team
 * answering the same question with the same answer to test the 
 * winner determination logic.
 */
export const simulateMatchingAnswers = async (sessionId, teamId, roundNumber, matchingAnswer) => {
  if (!sessionId || !teamId || !roundNumber || !matchingAnswer) {
    console.error('Missing parameters for simulateMatchingAnswers');
    return;
  }

  try {
    // Create base question ID for this round
    const questionId = `r${roundNumber}q1`;
    
    // Get current session state
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const snapshot = await get(sessionRef);
    const session = snapshot.val();
    
    if (!session) {
      console.error('Session not found');
      return;
    }

    // Create two simulated players with the same answer in the same team
    const player1Id = `test_player1_${Date.now()}`;
    const player2Id = `test_player2_${Date.now()}`;
    
    // Add players to session
    await set(ref(db, `sessions/${sessionId}/players/${player1Id}`), {
      nickname: 'Test Player 1',
      isHost: false,
      connected: true,
      teamId,
      answers: {
        [questionId]: {
          answer: matchingAnswer,
          timeRemaining: 10
        }
      }
    });
    
    await set(ref(db, `sessions/${sessionId}/players/${player2Id}`), {
      nickname: 'Test Player 2',
      isHost: false,
      connected: true,
      teamId,
      answers: {
        [questionId]: {
          answer: matchingAnswer,
          timeRemaining: 10
        }
      }
    });
    
    // Add the answers to the team's answers collection
    await set(ref(db, `sessions/${sessionId}/teams/${teamId}/answers/${questionId}`), [matchingAnswer]);
    
    // Increment team player count
    const currentPlayerCount = session.teams[teamId]?.playerCount || 0;
    await set(ref(db, `sessions/${sessionId}/teams/${teamId}/playerCount`), currentPlayerCount + 2);
    
    console.log('Successfully simulated matching answers for testing');
    return { player1Id, player2Id };
  } catch (error) {
    console.error('Error simulating matching answers:', error);
  }
};

export const testWinnerDetermination = async (sessionId, roundNumber) => {
  // First, add test players with matching answers
  const teamId = 'crimson'; // Using the Crimson team for testing
  const matchingAnswer = 'test answer ' + Date.now();
  
  await simulateMatchingAnswers(sessionId, teamId, roundNumber, matchingAnswer);
  
  console.log('Test data added, now check if winner determination works correctly!');
  console.log('Go to the host dashboard and end the round to see if the winner is determined.');
};
