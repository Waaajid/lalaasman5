import { ref, set, onValue, off, get, update } from 'firebase/database';
import { db } from '../config/firebase';

export interface GameSession {
  id: string;
  hostId: string;
  status: 'waiting' | 'started' | 'in-progress' | 'completed';
  currentRound: number;
  currentQuestionIndex: number;
  teams: {
    [teamId: string]: {
      name: string;
      color: string;
      playerCount: number;
      maxPlayers: number;
      answers: {
        [questionId: string]: string[];
      };
    }
  };
  players: {
    [playerId: string]: {
      nickname: string;
      teamId: string;
      isHost: boolean;
      connected: boolean;
      answers: {
        [questionId: string]: {
          answer: string;
          timeRemaining: number;
        };
      };
    }
  };
  roundWinners: {
    [round: number]: string[];
  };
  currentState: {
    phase: 'waiting' | 'team-selection' | 'answering' | 'showing-results' | 'round-end' | 'completed';
    timeLeft?: number;
    currentQuestion?: number;
  };
  lastUpdated?: number;
}

export const createGameSession = async (sessionId: string, hostId: string, nickname: string): Promise<void> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const initialSession: GameSession = {
    id: sessionId,
    hostId,
    status: 'waiting',
    currentRound: 1,
    currentQuestionIndex: 0,
    teams: {
      crimson: { name: 'Team Crimson', color: 'bg-red-600', playerCount: 0, maxPlayers: 7, answers: {} },
      scarlet: { name: 'Team Scarlet', color: 'bg-red-500', playerCount: 0, maxPlayers: 7, answers: {} },
      ruby: { name: 'Team Ruby', color: 'bg-red-700', playerCount: 0, maxPlayers: 7, answers: {} },
      garnet: { name: 'Team Garnet', color: 'bg-red-800', playerCount: 0, maxPlayers: 7, answers: {} }
    },
    players: {
      [hostId]: {
        nickname,
        isHost: true,
        connected: true,
        teamId: '',
        answers: {}
      }
    },
    roundWinners: {},
    currentState: {
      phase: 'waiting'
    }
  };
  await set(sessionRef, initialSession);
};

export const startGame = async (sessionId: string): Promise<void> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const updates = {
    status: 'started',
    'currentState/phase': 'answering',
    'currentState/currentQuestion': 1,
    lastUpdated: Date.now()
  };
  await update(sessionRef, updates);
};

export const joinGameSession = async (
  sessionId: string, 
  playerId: string,
  nickname: string,
  teamId: string
): Promise<void> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const sessionSnapshot = await get(sessionRef);
  const session = sessionSnapshot.val() as GameSession;

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.status === 'completed') {
    throw new Error('Cannot join a completed game');
  }

  // Check total number of players in session
  const totalPlayers = Object.keys(session.players || {}).length;
  if (totalPlayers >= 28) { // 4 teams × 7 players
    throw new Error('Game room is full (maximum 28 players)');
  }

  // Add player to session
  const playerRef = ref(db, `sessions/${sessionId}/players/${playerId}`);
  await set(playerRef, {
    nickname,
    isHost: false,
    connected: true,
    teamId,
    answers: {}
  });

  // Update team player count
  const teamRef = ref(db, `sessions/${sessionId}/teams/${teamId}/playerCount`);
  const teamSnapshot = await get(teamRef);
  const currentCount = teamSnapshot.val() || 0;
  await set(teamRef, currentCount + 1);
};

export const subscribeToGameSession = (
  sessionId: string,
  callback: (session: GameSession | null) => void
) => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const session = snapshot.val();
    if (!session) return callback(null);

    callback({
      ...session,
      currentState: session.currentState || {
        phase: 'waiting'
      }
    });
  });

  return unsubscribe;
};

export const submitAnswer = async (
  sessionId: string,
  playerId: string,
  questionId: string,
  answer: string,
  timeRemaining: number
): Promise<void> => {
  const answerRef = ref(db, `sessions/${sessionId}/players/${playerId}/answers/${questionId}`);
  
  await set(answerRef, {
    answer,
    timeRemaining
  });

  // Also add to team answers
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const sessionSnapshot = await get(sessionRef);
  const session = sessionSnapshot.val() as GameSession;
  
  if (session && session.players[playerId]) {
    const teamId = session.players[playerId].teamId;
    const teamAnswersRef = ref(db, `sessions/${sessionId}/teams/${teamId}/answers/${questionId}`);
    const teamAnswersSnapshot = await get(teamAnswersRef);
    const teamAnswers = teamAnswersSnapshot.val() || [];
    
    if (!teamAnswers.includes(answer)) {
      teamAnswers.push(answer);
      await set(teamAnswersRef, teamAnswers);
    }
  }
};

export const advanceToNextQuestion = async (
  sessionId: string,
  currentRound: number,
  currentQuestionIndex: number
): Promise<void> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const questionsPerRound = 4;
  
  console.log('advanceToNextQuestion called:', { sessionId, currentRound, currentQuestionIndex });
  
  if (currentQuestionIndex < questionsPerRound - 1) {
    // Next question in same round
    const updates = {
      currentQuestionIndex: currentQuestionIndex + 1,
      'currentState/currentQuestion': currentQuestionIndex + 2,
      'currentState/phase': 'answering',
      lastUpdated: Date.now()
    };
    console.log('Moving to next question:', updates);
    await update(sessionRef, updates);
  } else if (currentRound < 3) {
    // End of round - calculate winners and show round summary
    const sessionSnapshot = await get(sessionRef);
    const session = sessionSnapshot.val() as GameSession;
    
    if (session) {
      const winners = await calculateRoundWinners(sessionId, currentRound);
      console.log('Round winners calculated:', winners);
      
      // Store round winners
      await publishRoundWinners(sessionId, currentRound, winners);
    }
    
    // Set phase to round-end (this will trigger RoundSummary display)
    const updates = {
      'currentState/phase': 'round-end',
      lastUpdated: Date.now()
    };
    console.log('Setting round-end phase:', updates);
    await update(sessionRef, updates);
  } else {
    // Calculate final round winners before completing
    const sessionSnapshot = await get(sessionRef);
    const session = sessionSnapshot.val() as GameSession;
    
    if (session) {
      const winners = await calculateRoundWinners(sessionId, currentRound);
      console.log('Final round winners calculated:', winners);
      
      // Store final round winners
      await publishRoundWinners(sessionId, currentRound, winners);
    }
    
    // Game complete
    const updates = {
      status: 'completed',
      'currentState/phase': 'completed',
      lastUpdated: Date.now()
    };
    console.log('Game completed:', updates);
    await update(sessionRef, updates);
  }
};

export const calculateRoundWinners = async (
  sessionId: string,
  roundNumber: number
): Promise<string[]> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const snapshot = await get(sessionRef);
  const session = snapshot.val() as GameSession;
  
  if (!session) return [];
  
  // Get all answers for this round
  const roundAnswers: { [teamId: string]: { [answer: string]: number } } = {};
  
  // Count matching answers per team
  Object.entries(session.players || {}).forEach(([playerId, player]) => {
    if (player.isHost) return; // Skip host
    
    const teamId = player.teamId;
    if (!teamId) return;
    
    // Get answers for this round
    Object.entries(player.answers || {}).forEach(([questionId, answerData]) => {
      if (questionId.startsWith(`r${roundNumber}`)) {
        const answer = answerData.answer?.toLowerCase().trim();
        if (!answer) return;
        
        if (!roundAnswers[teamId]) roundAnswers[teamId] = {};
        if (!roundAnswers[teamId][answer]) roundAnswers[teamId][answer] = 0;
        roundAnswers[teamId][answer]++;
      }
    });
  });
  
  // Find teams with most matching answers
  let maxMatches = 0;
  let winningTeams: string[] = [];
  
  Object.entries(roundAnswers).forEach(([teamId, answers]) => {
    const maxTeamMatches = Math.max(...Object.values(answers));
    if (maxTeamMatches >= 2) { // Need at least 2 matching answers
      if (maxTeamMatches > maxMatches) {
        maxMatches = maxTeamMatches;
        winningTeams = [session.teams[teamId]?.name || teamId];
      } else if (maxTeamMatches === maxMatches) {
        winningTeams.push(session.teams[teamId]?.name || teamId);
      }
    }
  });
  
  console.log('Round winners calculation:', { roundNumber, roundAnswers, winningTeams, maxMatches });
  return winningTeams;
};

export const publishRoundWinners = async (
  sessionId: string,
  round: number,
  winners: string[]
): Promise<void> => {
  const winnersRef = ref(db, `sessions/${sessionId}/roundWinners/${round}`);
  await set(winnersRef, winners);
};

export const leaveSession = async (
  sessionId: string,
  playerId: string
): Promise<void> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const snapshot = await get(sessionRef);
  const session = snapshot.val() as GameSession;
  
  if (!session) return;

  const player = session.players[playerId];
  if (!player) return;

  // Decrement team player count if player was on a team
  if (player.teamId && session.teams[player.teamId]) {
    const teamRef = ref(db, `sessions/${sessionId}/teams/${player.teamId}/playerCount`);
    const newCount = Math.max(0, session.teams[player.teamId].playerCount - 1);
    await set(teamRef, newCount);
  }

  // Remove player from session
  const playerRef = ref(db, `sessions/${sessionId}/players/${playerId}`);
  await set(playerRef, null);
};
