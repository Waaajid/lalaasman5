import { ref, set, get, update } from 'firebase/database';
import { db } from '../config/firebase';
import { GameSession } from './gameSession';

const SIMULATED_PLAYERS = [
  // Team Crimson
  { nickname: 'Alice', team: 'crimson' },
  { nickname: 'Bob', team: 'crimson' },
  { nickname: 'Charlie', team: 'crimson' },
  { nickname: 'David', team: 'crimson' },
  { nickname: 'Eve', team: 'crimson' },
  // Team Scarlet
  { nickname: 'Frank', team: 'scarlet' },
  { nickname: 'Grace', team: 'scarlet' },
  { nickname: 'Henry', team: 'scarlet' },
  { nickname: 'Ivy', team: 'scarlet' },
  { nickname: 'Jack', team: 'scarlet' },
  // Team Ruby
  { nickname: 'Kate', team: 'ruby' },
  { nickname: 'Liam', team: 'ruby' },
  { nickname: 'Mia', team: 'ruby' },
  { nickname: 'Noah', team: 'ruby' },
  { nickname: 'Olivia', team: 'ruby' },
  // Team Garnet
  { nickname: 'Peter', team: 'garnet' },
  { nickname: 'Quinn', team: 'garnet' },
  { nickname: 'Rachel', team: 'garnet' },
  { nickname: 'Sam', team: 'garnet' },
  { nickname: 'Taylor', team: 'garnet' },
];

// Common answers that some players might give to test matching
const COMMON_ANSWERS = {
  'r1q1': ['May 30th', 'May 30', '30th May', 'May 30, 2025'],
  'r1q2': ['dev', 'development', 'staging'],
  'r1q3': ['AIsha', 'Aisha', 'AI Assistant'],
  'r1q4': ['12', 'twelve', '10', 'ten'],
  'r2q1': ['Avengers', 'Batman', 'Superman'],
  'r2q2': ['Tesco', 'Sainsburys', 'Waitrose'],
  'r2q3': ['Slack', 'Teams', 'Discord'],
  'r2q4': ['May 6th', 'May 6', '6th May'],
  'r3q1': ['Greenwich', 'Leicester Square', 'Southwark'],
  'r3q2': ['Water', 'H2O', 'h2o'],
  'r3q3': ['1', 'one', '5'],
  'r3q4': ['June 15th', 'June 15', '15th June'],
};

export const addSimulatedPlayers = async (sessionId: string) => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const session = (await get(sessionRef)).val() as GameSession;
  
  if (!session) throw new Error('Session not found');

  // Add all simulated players
  const updates: Record<string, any> = {};
  
  for (const player of SIMULATED_PLAYERS) {
    // Add player to session
    updates[`players/${player.nickname}`] = {
      nickname: player.nickname,
      teamId: player.team,
      isHost: false,
      connected: true,
      answers: {}
    };
    
    // Update team player count
    const currentCount = session.teams[player.team].playerCount || 0;
    updates[`teams/${player.team}/playerCount`] = currentCount + 1;
  }
  
  await update(ref(db, `sessions/${sessionId}`), updates);
};

export const simulateAnswers = async (sessionId: string, questionId: string) => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const session = (await get(sessionRef)).val() as GameSession;
  
  if (!session) throw new Error('Session not found');

  const updates: Record<string, any> = {};
  const possibleAnswers = COMMON_ANSWERS[questionId as keyof typeof COMMON_ANSWERS] || [];
  
  for (const player of SIMULATED_PLAYERS) {
    // 70% chance to give a common answer, 30% chance for random/unique answer
    const giveCommonAnswer = Math.random() < 0.7;
    let answer: string;
    
    if (giveCommonAnswer && possibleAnswers.length > 0) {
      // Pick one of the common answers randomly
      answer = possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];
    } else {
      // Generate a unique answer
      answer = `Answer-${Math.floor(Math.random() * 1000)}`;
    }
    
    // Add player's answer
    updates[`players/${player.nickname}/answers/${questionId}`] = {
      answer,
      timeRemaining: Math.floor(Math.random() * 8) + 1 // Random time between 1-9 seconds
    };
    
    // Add answer to team's answers
    const teamAnswersRef = `teams/${player.team}/answers/${questionId}`;
    if (!session.teams[player.team].answers?.[questionId]) {
      updates[teamAnswersRef] = [answer];
    } else {
      updates[teamAnswersRef] = [...session.teams[player.team].answers[questionId], answer];
    }
  }
  
  await update(ref(db, `sessions/${sessionId}`), updates);
};
