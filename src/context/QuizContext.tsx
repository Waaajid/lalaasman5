import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { ref, set, onValue, off, get, update } from 'firebase/database';
import { db } from '../config/firebase';
import { 
  createGameSession, 
  joinGameSession, 
  subscribeToGameSession,
  submitAnswer as submitSessionAnswer, 
  leaveSession,
  GameSession,
} from '../services/gameSession';
import { toast } from '@/hooks/use-toast'; // Import toast

export type GamePhase = 'waiting' | 'team-selection' | 'answering' | 'showing-results' | 'round-end' | 'completed';

interface Team {
  id: string;
  name: string;
  color: string;
  playerCount: number;
  maxPlayers: number;
}

interface Question {
  id: string;
  text: string;
  roundId: number;
}

interface Answer {
  questionId: string;
  answer: string;
  timeRemaining: number;
}

export interface PlayerAnswer { // Added export
  playerId: string;
  teamName: string;
  roundNumber: number;
  questionId: string;
  answer: string;
}

interface RoundResult {
  roundNumber: number;
  winningTeam: string;
  matchedAnswers: {
    [teamName: string]: {
      answer: string;
      players: string[];
      count: number;
    }[];
  };
}

interface TeamScore {
  teamName: string;
  roundsWon: number[];
  diceRollsRemaining: number;
}

interface MultiplayerSession {
  id: string;
  status: 'waiting' | 'in-progress' | 'completed';
  teams: {
    [teamId: string]: {
      name: string;
      players: string[];
      answeredCount: number;
    }
  };
}

interface QuizContextProps {
  // User and team management
  nickname: string;
  setNickname: (nickname: string) => void;
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team | null) => void;
  teams: Team[];
  joinTeam: (teamId: string) => Promise<void>;

  // Game state
  currentRound: number;
  setCurrentRound: (round: number) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (question: number) => void;
  questions: Question[];
  userAnswers: Answer[];
  quizCompleted: boolean;
  setQuizCompleted: (completed: boolean) => void;
  
  // Game actions
  submitAnswer: (questionId: string, answer: string, timeRemaining: number) => void;
  submitPlayerAnswer: (answer: Omit<PlayerAnswer, 'playerId'>) => void;
  processRoundResults: (roundNumber: number) => void;
  resetQuiz: () => Promise<void>;

  // Game data
  playerAnswers: PlayerAnswer[];
  roundResults: RoundResult[];
  teamScores: TeamScore[];
  getRoundWinner: (roundNumber: number) => string | null; 
  getDiceRolls: (teamName: string) => number;

  // Session management
  gameSession: GameSession | null;
  sessionId: string | null;
  isSessionHost: boolean;
  isMultiplayer: boolean;
  multiplayerStatus: 'connecting' | 'connected' | 'disconnected';
  sessionError: string | null;
  
  // Session actions
  startNewSession: () => Promise<string>;
  joinExistingSession: (sessionId: string) => Promise<void>;
  leaveCurrentSession: () => Promise<void>;
  updateGameState: (updates: Partial<GameSession['currentState'] & { 
    currentRound?: number; 
    currentQuestionIndex?: number;
    roundWinners?: Record<number, string[]>; // Ensure this matches GameSession type in gameSession.ts
    status?: GameSession['status'];
    phase?: GamePhase;
  }>) => Promise<void>;

  // Additional actions
  handleAnswerSubmit: (answer: string) => void;
  advanceToNextQuestion: () => void;
  currentPlayer: string | null;
  hostHandleRoundEndAndProceed?: () => Promise<void>; 
  startSpecificRound?: (roundNumber: number) => Promise<void>; // Added for host to start a specific round
  MAX_ROUNDS: number; // Export MAX_ROUNDS
}

// Create the context
const QuizContext = createContext<QuizContextProps | undefined>(undefined);

// Create the provider component
export function QuizProvider({ children }: { children: ReactNode }) {
  const [nickname, setNickname] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]); 
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isMultiplayer = !!sessionId;
  const [multiplayerStatus, setMultiplayerStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSessionHost, setIsSessionHost] = useState(false);
  const [teams, setTeams] = useState<Team[]>([
    { id: 'crimson', name: 'Team Crimson', color: 'bg-red-600', playerCount: 0, maxPlayers: 7 },
    { id: 'scarlet', name: 'Team Scarlet', color: 'bg-red-500', playerCount: 0, maxPlayers: 7 },
    { id: 'ruby', name: 'Team Ruby', color: 'bg-red-700', playerCount: 0, maxPlayers: 7 },
    { id: 'garnet', name: 'Team Garnet', color: 'bg-red-800', playerCount: 0, maxPlayers: 7 }
  ]);
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);

  const MAX_ROUNDS = 3;

  // Define a more specific type for Firebase updates
  type FirebaseUpdatePayload = {
    'currentState/phase'?: GamePhase;
    'currentState/timeLeft'?: number;
    'currentState/currentQuestionId'?: string; 
    currentRound?: number;
    currentQuestionIndex?: number;
    roundWinners?: Record<number, string[]>; 
    status?: GameSession['status'];
    lastUpdated?: number;
  };

  const handleUpdateGameState = useCallback(async (updates: Parameters<QuizContextProps['updateGameState']>[0]) => {
    if (!sessionId) {
      return;
    }
    
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const firebaseUpdates: FirebaseUpdatePayload = {}; 

    // Direct properties from the extended part of 'updates' type
    if (updates.phase !== undefined) firebaseUpdates['currentState/phase'] = updates.phase;
    if (updates.currentRound !== undefined) firebaseUpdates.currentRound = updates.currentRound;
    if (updates.currentQuestionIndex !== undefined) firebaseUpdates.currentQuestionIndex = updates.currentQuestionIndex;
    if (updates.roundWinners !== undefined) firebaseUpdates.roundWinners = updates.roundWinners;
    if (updates.status !== undefined) firebaseUpdates.status = updates.status;

    // Properties from GameSession['currentState']
    if ('timeLeft' in updates && updates.timeLeft !== undefined) firebaseUpdates['currentState/timeLeft'] = updates.timeLeft;
    
    if ('currentQuestion' in updates && updates.currentQuestion !== undefined) {
      if (updates.currentQuestion === null) {
        // Handle null case explicitly if needed, e.g., by setting currentQuestionId to null or omitting it
        // firebaseUpdates['currentState/currentQuestionId'] = null; // Or undefined, or skip
      } else if (typeof updates.currentQuestion === 'string') {
        firebaseUpdates['currentState/currentQuestionId'] = updates.currentQuestion;
      } else if (typeof updates.currentQuestion === 'object' && updates.currentQuestion && 'id' in updates.currentQuestion && typeof (updates.currentQuestion as Question).id === 'string') { // Added null check for updates.currentQuestion
        firebaseUpdates['currentState/currentQuestionId'] = (updates.currentQuestion as Question).id;
      }
    }

    firebaseUpdates.lastUpdated = Date.now();
    
    await update(sessionRef, firebaseUpdates);
  }, [sessionId]);

  // Update team player counts whenever game session changes
  useEffect(() => {
    if (gameSession && gameSession.teams) {
      setTeams(prevTeams => 
        prevTeams.map(team => {
          const sessionTeam = gameSession.teams[team.id];
          return sessionTeam 
            ? { ...team, playerCount: sessionTeam.playerCount }
            : { ...team, playerCount: 0 };
        })
      );
    }
  }, [gameSession]);

  // Effect to synchronize local currentQuestionIndex with gameSession in multiplayer
  useEffect(() => {
    if (isMultiplayer && gameSession && typeof gameSession.currentQuestionIndex === 'number') {
      if (gameSession.currentQuestionIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(gameSession.currentQuestionIndex);
      }
    }
    if (isMultiplayer && gameSession && typeof gameSession.currentRound === 'number') {
      if (gameSession.currentRound !== currentRound) {
        setCurrentRound(gameSession.currentRound);
      }
    }
    if (isMultiplayer && gameSession && gameSession.status === 'completed') {
        if (!quizCompleted) setQuizCompleted(true);
    } else if (isMultiplayer && gameSession && gameSession.status !== 'completed') {
        if (quizCompleted) setQuizCompleted(false);
    }

  }, [gameSession, isMultiplayer, currentQuestionIndex, currentRound, quizCompleted]);


  // Effect to update local scores and results based on Firebase gameSession.roundWinners
  useEffect(() => {
    if (gameSession?.roundWinners) {
      const newTeamScores: TeamScore[] = [];
      const newRoundResults: RoundResult[] = [];

      Object.entries(gameSession.roundWinners).forEach(([roundStr, winnerTeamNamesArray]) => { // winnerTeamNamesArray is string[]
        const roundNumber = parseInt(roundStr, 10);

        // Handle the array of winner names. For now, assume the first is primary if multiple.
        if (winnerTeamNamesArray && winnerTeamNamesArray.length > 0) {
          const primaryWinnerName = winnerTeamNamesArray[0]; // Taking the first winner

          // Update TeamScores
          let scoreEntry = newTeamScores.find(s => s.teamName === primaryWinnerName);
          if (!scoreEntry) {
            scoreEntry = { teamName: primaryWinnerName, roundsWon: [], diceRollsRemaining: 0 };
            newTeamScores.push(scoreEntry);
          }
          if (!scoreEntry.roundsWon.includes(roundNumber)) {
            scoreEntry.roundsWon.push(roundNumber);
          }
          scoreEntry.diceRollsRemaining = scoreEntry.roundsWon.length;

          // Update RoundResults (local state for UI that might use it)
          newRoundResults.push({
            roundNumber,
            winningTeam: primaryWinnerName, // Storing single winner string here
            matchedAnswers: {}, // Detailed matchedAnswers would need more data or recalculation
          });
        }
      });
      setTeamScores(newTeamScores);
      // Sort results by round number for consistent display
      newRoundResults.sort((a, b) => a.roundNumber - b.roundNumber);
      setRoundResults(newRoundResults);
    } else {
      // If no roundWinners in gameSession, reset local scores/results
      setTeamScores([]);
      setRoundResults([]);
    }
  }, [gameSession?.roundWinners]);

  // Updated questions list as requested
  const questions: Question[] = [
    { id: 'r1q1', text: 'What is the company results party date? (dd/mm)', roundId: 1 },
    { id: 'r1q2', text: 'What is the missing domain in https://???.conducttr.com/projects?', roundId: 1 },
    { id: 'r1q3', text: 'What is the name of our AI-built colleague on LinkedIn?', roundId: 1 },
    { id: 'r1q4', text: 'How many clocks are there in our office?', roundId: 1 },
    { id: 'r2q1', text: 'What franchise movie is currently running in cinemas?', roundId: 2 },
    { id: 'r2q2', text: 'What is the nearest store to the office?', roundId: 2 },
    { id: 'r2q3', text: 'What is our internal communication tool?', roundId: 2 },
    { id: 'r2q4', text: 'When was the last bank holiday? (dd/mm)', roundId: 2 },
    { id: 'r3q1', text: 'What place do non-Londoners often mispronounce?', roundId: 3 },
    { id: 'r3q2', text: 'What does two hydrogen and one oxygen make?', roundId: 3 },
    { id: 'r3q3', text: 'What is 1 + 0 × 5?', roundId: 3 },
    { id: 'r3q4', text: 'When is the Conducttr conference? (dd/mm)', roundId: 3 },
  ];

  const joinTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team || !sessionId) {
      throw new Error('Invalid team selection');
    }

    try {
      // Get current session state
      const sessionRef = ref(db, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      const currentSession = snapshot.val() as GameSession;

      if (!currentSession) {
        throw new Error('Session not found');
      }
      
      // Check total players in session
      const totalPlayers = Object.keys(currentSession.players || {}).length;
      if (totalPlayers >= 28) {
        throw new Error('Game room is full (maximum 28 players)');
      }
      
      // Calculate new player count
      const newPlayerCount = (currentSession.teams[teamId]?.playerCount ?? 0) + 1;
      
      if (newPlayerCount > team.maxPlayers) {
        throw new Error('Team is full');
      }

      // Update team in Firebase
      const updates = {
        [`/sessions/${sessionId}/teams/${teamId}/playerCount`]: newPlayerCount,
        [`/sessions/${sessionId}/players/${nickname}/teamId`]: teamId
      };
      
      await update(ref(db), updates);
      
      // Update local state
      setSelectedTeam(team);
    } catch (error) {
      console.error('Failed to join team:', error);
      throw error;
    }
  };

  const resetQuiz = async () => {
    // Reset local quiz state
    setCurrentRound(1);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setPlayerAnswers([]);
    setRoundResults([]);
    setTeamScores([]);
    
    // Update game session if it exists
    if (sessionId) {
      try {
        // Reset the entire game state
        const sessionRef = ref(db, `sessions/${sessionId}`);
        const sessionSnapshot = await get(sessionRef);
        const session = sessionSnapshot.val() as GameSession;
        
        if (session) {
          // Preserve teams and players but reset game state
          const updates = {
            status: 'in-progress',
            currentRound: 1,
            currentQuestionIndex: 0,
            roundWinners: {},
            currentState: {
              phase: 'answering',
            },
            lastUpdated: Date.now()
          };
          
          await update(sessionRef, updates);
        }
      } catch (error) {
        console.error('Failed to reset game session:', error);
        setSessionError(error instanceof Error ? error.message : 'Failed to reset session');
      }
    }
  };

  const submitPlayerAnswer = useCallback((answer: Omit<PlayerAnswer, 'playerId'>) => {
    const playerId = nickname; // Using nickname as playerId for simplicity
    setPlayerAnswers(prev => [...prev, { ...answer, playerId }]);
  }, [nickname]);

  const processRoundResults = useCallback((roundNumber: number) => {
    const roundAnswers = playerAnswers.filter(a => a.roundNumber === roundNumber);
    
    const answersByTeam: { [teamName: string]: { [answer: string]: string[] } } = {};
    roundAnswers.forEach(answer => {
      if (!answersByTeam[answer.teamName]) {
        answersByTeam[answer.teamName] = {};
      }
      if (!answersByTeam[answer.teamName][answer.answer]) {
        answersByTeam[answer.teamName][answer.answer] = [];
      }
      answersByTeam[answer.teamName][answer.answer].push(answer.playerId);
    });

    const matchedAnswersOutput: RoundResult['matchedAnswers'] = {};
    // Stores data for determining winner, including tie-breaking info
    let winningTeamCandidates: { teamName: string; topMatchCount: number; totalMatchedPlayers: number }[] = [];

    Object.entries(answersByTeam).forEach(([teamName, answers]) => {
      const teamMatches = Object.entries(answers)
        .map(([answer, players]) => ({
          answer,
          players,
          count: players.length
        }))
        .filter(match => match.count >= 2) // Only keep answers with 2 or more matches
        .sort((a, b) => b.count - a.count);

      matchedAnswersOutput[teamName] = teamMatches;

      if (teamMatches.length > 0) {
        const topMatchCountCurrentTeam = teamMatches[0].count;
        const totalMatchedPlayersCurrentTeam = teamMatches.reduce((sum, match) => sum + match.players.length, 0);

        if (winningTeamCandidates.length === 0 || topMatchCountCurrentTeam > winningTeamCandidates[0].topMatchCount) {
          winningTeamCandidates = [{ teamName, topMatchCount: topMatchCountCurrentTeam, totalMatchedPlayers: totalMatchedPlayersCurrentTeam }];
        } else if (topMatchCountCurrentTeam === winningTeamCandidates[0].topMatchCount) {
          winningTeamCandidates.push({ teamName, topMatchCount: topMatchCountCurrentTeam, totalMatchedPlayers: totalMatchedPlayersCurrentTeam });
        }
      }
    });

    let finalWinningTeam = '';
    if (winningTeamCandidates.length === 1) {
      finalWinningTeam = winningTeamCandidates[0].teamName;
    } else if (winningTeamCandidates.length > 1) {
      // Tie-breaking: Sort by totalMatchedPlayers in descending order
      winningTeamCandidates.sort((a, b) => b.totalMatchedPlayers - a.totalMatchedPlayers);
      // Check if the top one after sorting by totalMatchedPlayers is strictly greater than the next, or if it's the only one left
      if (winningTeamCandidates.length === 1 || winningTeamCandidates[0].totalMatchedPlayers > (winningTeamCandidates[1]?.totalMatchedPlayers ?? -1)) {
        finalWinningTeam = winningTeamCandidates[0].teamName;
      } else {
         // If still tied on totalMatchedPlayers (e.g., multiple teams have same topMatchCount and same totalMatchedPlayers),
         // default to the first one among these. A more sophisticated rule could be added if needed.
        finalWinningTeam = winningTeamCandidates[0].teamName;
      }
    }
    
    const roundResult: RoundResult = {
      roundNumber,
      winningTeam: finalWinningTeam,
      matchedAnswers: matchedAnswersOutput
    };

    setRoundResults(prev => [...prev, roundResult]);

    setTeamScores(prev => {
      const existing = prev.find(s => s.teamName === finalWinningTeam);
      if (finalWinningTeam) { // Ensure a winning team is determined
        if (existing) {
          return prev.map(score =>
            score.teamName === finalWinningTeam
              ? {
                ...score,
                roundsWon: [...score.roundsWon, roundNumber],
                diceRollsRemaining: 1
              }
              : score
          );
        }
        return [...prev, {
          teamName: finalWinningTeam,
          roundsWon: [roundNumber],
          diceRollsRemaining: 1
        }];
      }
      return prev; // No winner, no score change
    });
  }, [playerAnswers]);

  const getRoundWinner = useCallback((roundNumber: number) => {
    const result = roundResults.find(r => r.roundNumber === roundNumber);
    return result?.winningTeam ?? null;
  }, [roundResults]);

  const getDiceRolls = useCallback((teamName: string) => {
    return teamScores.find(s => s.teamName === teamName)?.diceRollsRemaining ?? 0;
  }, [teamScores]);

  useEffect(() => {
    return () => {
      // Cleanup any active session subscription
      if (sessionId) {
        leaveSession(sessionId, nickname).catch(console.error);
      }
    };
  }, [sessionId, nickname]);

  const startNewSession = useCallback(async () => {
    try {
      const newSessionId = Math.random().toString(36).substring(2, 15);
      await createGameSession(newSessionId, nickname, nickname);
      setSessionId(newSessionId);
      setIsSessionHost(true);
      setCurrentPlayer(nickname);
      
      // Subscribe to session updates
      const unsubscribe = subscribeToGameSession(newSessionId, (session) => {
        setGameSession(session);
      });
      
      return newSessionId;
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to create session');
      throw error;
    }
  }, [nickname]);

  const joinExistingSession = useCallback(async (joinSessionId: string) => {
    try {
      await joinGameSession(joinSessionId, nickname, nickname, selectedTeam?.id || '');
      setSessionId(joinSessionId);
      setIsSessionHost(false);
      
      // Subscribe to session updates
      const unsubscribe = subscribeToGameSession(joinSessionId, (session) => {
        setGameSession(session);
      });
      
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to join session');
      throw error;
    }
  }, [nickname, selectedTeam]);

  const leaveCurrentSession = useCallback(async () => {
    if (sessionId) {
      await leaveSession(sessionId, nickname);
      setSessionId(null);
      setGameSession(null);
      setIsSessionHost(false);
      setCurrentPlayer(null);
    }
  }, [sessionId, nickname]);

  const submitAnswer = useCallback((questionId: string, answer: string, timeRemaining: number) => {
    setUserAnswers(prev => [...prev, { questionId, answer, timeRemaining }]); // Local state for single player

    if (isMultiplayer && sessionId && nickname && gameSession) {
      // Use consistent player ID to ensure answers update the same player record
      // When testing with a single player in multiple tabs, use nickname as is
      
      // submitSessionAnswer (from gameSession.ts) expects 5 arguments.
      // It internally resolves teamId and uses questionId for round context.
      submitSessionAnswer( 
        sessionId,
        nickname, // Use consistent nickname to ensure answers for the same player update rather than create new entries
        questionId,
        answer,
        timeRemaining
      )
      .then(() => {
        console.log(`Answer submitted for Q:${questionId} by player: ${nickname}`);
      })
      .catch(error => {
        console.error("Failed to submit answer to Firebase:", error);
        setSessionError(error instanceof Error ? error.message : 'Failed to submit answer');
        toast({ title: "Error Submitting Answer", description: "Could not save your answer. Please try again.", variant: "destructive" });
      });
    }
  }, [sessionId, nickname, isMultiplayer, gameSession, setUserAnswers, setSessionError]);

  const handleAnswerSubmit = useCallback(async (answerText: string) => {
    const currentQuesIndex = gameSession?.currentQuestionIndex ?? currentQuestionIndex;
    const currentRd = gameSession?.currentRound ?? currentRound;
    const roundQuestions = questions.filter(q => q.roundId === currentRd);
    
    if (roundQuestions && roundQuestions.length > currentQuesIndex) {
      const currentQuestion = roundQuestions[currentQuesIndex];
      if (currentQuestion) {
        submitAnswer(currentQuestion.id, answerText, 0 /* TODO: Adjust timeRemaining if available */);
      }
    }
    // Advancing question is now explicitly done by advanceToNextQuestion
  }, [currentQuestionIndex, currentRound, questions, submitAnswer, gameSession]);

  const advanceToNextQuestion = useCallback(async () => {
    if (isMultiplayer && sessionId && gameSession) {
        const currentQuestionsForThisRound = questions.filter(q => q.roundId === gameSession.currentRound);
        const nextQuestionIndexWithinRound = gameSession.currentQuestionIndex + 1;

        const updates: Partial<GameSession['currentState'] & { currentQuestionIndex?: number, phase?: GamePhase }> = {};

        if (nextQuestionIndexWithinRound >= currentQuestionsForThisRound.length) {
            updates.phase = 'round-end';
        } else {
            updates.currentQuestionIndex = nextQuestionIndexWithinRound;
            if (gameSession.currentState?.phase !== 'answering') {
                updates.phase = 'answering';
            }
        }

        if (Object.keys(updates).length > 0) {
            try {
                // Cast updates to the expected type for handleUpdateGameState
                await handleUpdateGameState(updates as Parameters<QuizContextProps['updateGameState']>[0]);
            } catch (error) {
                console.error("Error advancing question/round:", error);
                setSessionError(error instanceof Error ? error.message : 'Failed to advance');
            }
        }
    } else { 
        const currentQuestionsForThisRound = questions.filter(q => q.roundId === currentRound);
        const nextLocalQuestionIndex = currentQuestionIndex + 1;

        if (nextLocalQuestionIndex >= currentQuestionsForThisRound.length) {
            processRoundResults(currentRound); // Process results for the round that just ended
            if (currentRound < MAX_ROUNDS) {
                setCurrentRound(prev => prev + 1);
                setCurrentQuestionIndex(0);
            } else {
                setQuizCompleted(true);
            }
        } else {
            setCurrentQuestionIndex(nextLocalQuestionIndex);
        }
    }
  }, [
    currentQuestionIndex, 
    currentRound, 
    sessionId, 
    isMultiplayer, 
    gameSession, 
    questions, 
    handleUpdateGameState, 
    processRoundResults, 
    setQuizCompleted, 
    setCurrentRound, 
    setCurrentQuestionIndex 
  ]);

  const determineAndStoreRoundWinner = useCallback(async (roundToProcess: number, currentSessionData: GameSession) => {
    if (!isMultiplayer || !sessionId || !currentSessionData || !currentSessionData.players) return null;

    // Import the new percentage-based winner determination
    const { determineRoundWinner, logPerformanceBreakdown } = await import('../utils/percentageWinners');
    
    // Use the new percentage-based scoring system
    const { winners, performances } = determineRoundWinner(currentSessionData, roundToProcess);
    
    // Log detailed breakdown for debugging
    console.log(`🎯 QuizContext: NEW PERCENTAGE-BASED WINNER CALCULATION for Round ${roundToProcess}:`);
    logPerformanceBreakdown(currentSessionData, roundToProcess);
    
    console.log('QuizContext: Final determined winners:', winners);

    // Store the winner(s) in Firebase
    const winnerUpdateForFirebase: Record<number, string[]> = {
         ...(currentSessionData.roundWinners || {}),
         [roundToProcess]: winners // Store as an array
    };

    try {
        await handleUpdateGameState({ roundWinners: winnerUpdateForFirebase });
        console.log(`Round ${roundToProcess} winner determined:`, winners);
    } catch (error) {
        console.error(`Error storing winner for round ${roundToProcess}:`, error);
        setSessionError(error instanceof Error ? error.message : 'Failed to store winner');
    }
    
    return winners.length > 0 ? winners[0] : null;
  }, [sessionId, isMultiplayer, handleUpdateGameState, setSessionError]);

  const hostHandleRoundEndAndProceed = useCallback(async () => {
    if (!isSessionHost || !sessionId || !gameSession) return;

    const roundJustEnded = gameSession.currentRound;

    // 1. Determine and store winner if not already stored
    if (!gameSession.roundWinners || !gameSession.roundWinners[roundJustEnded]) {
         await determineAndStoreRoundWinner(roundJustEnded, gameSession);
         // Wait a brief moment for Firebase to propagate and gameSession to update via subscription
         await new Promise(resolve => setTimeout(resolve, 500)); 
    }
    
    // 2. Decide next phase based on the potentially updated gameSession
    const currentGSession = gameSessionRef.current; // Use a ref to get latest gameSession if needed
                                                // Or rely on the slight delay and subscription.
                                                // For simplicity, using gameSession from state here.

    if (currentGSession && currentGSession.currentRound < MAX_ROUNDS) {
        const nextRoundNumber = currentGSession.currentRound + 1;
        await handleUpdateGameState({
            currentRound: nextRoundNumber,
            currentQuestionIndex: 0,
            phase: 'answering',
        });
    } else {
        await handleUpdateGameState({
            phase: 'completed',
            status: 'completed' 
        });
    }
  }, [isSessionHost, sessionId, gameSession, determineAndStoreRoundWinner, handleUpdateGameState]);
  
  const gameSessionRef = useRef(gameSession);
  useEffect(() => {
    gameSessionRef.current = gameSession;
  }, [gameSession]);

  const startSpecificRound = useCallback(async (roundNumber: number) => {
    if (!isSessionHost || !sessionId) {
      toast({
        title: "Error",
        description: "You must be a host and in a session to start a round.",
        variant: "destructive",
      });
      return;
    }

    // Potentially add logic here to ensure previous rounds are complete if desired,
    // or allow starting any round directly. For now, allows direct start.

    try {
      await handleUpdateGameState({
        currentRound: roundNumber,
        currentQuestionIndex: 0,
        phase: 'answering',
        status: 'in-progress' // Ensure game is marked as in-progress
      });
      toast({
        title: `Round ${roundNumber} Started!`,
        description: "Players can now answer questions for this round.",
      });
    } catch (error) {
      console.error(`Failed to start round ${roundNumber}:`, error);
      toast({
        title: `Failed to start round ${roundNumber}`,
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [isSessionHost, sessionId, handleUpdateGameState]);


  const contextValue: QuizContextProps = {
    nickname,
    setNickname,
    selectedTeam,
    setSelectedTeam,
    teams,
    joinTeam,
    currentRound, 
    setCurrentRound,
    currentQuestionIndex, 
    setCurrentQuestionIndex,
    questions,
    userAnswers,
    submitAnswer,
    quizCompleted,
    setQuizCompleted,
    resetQuiz,
    playerAnswers,
    roundResults, 
    teamScores, 
    submitPlayerAnswer,
    processRoundResults, 
    getRoundWinner,
    getDiceRolls,
    sessionId,
    isMultiplayer,
    multiplayerStatus,
    gameSession,
    sessionError,
    startNewSession,
    joinExistingSession,
    leaveCurrentSession,
    isSessionHost,
    updateGameState: handleUpdateGameState,
    handleAnswerSubmit,
    advanceToNextQuestion,
    currentPlayer,
    hostHandleRoundEndAndProceed: isSessionHost ? hostHandleRoundEndAndProceed : undefined,
    startSpecificRound: isSessionHost ? startSpecificRound : undefined, // Add to context
    MAX_ROUNDS, // Add MAX_ROUNDS to context value
  };

  return <QuizContext.Provider value={contextValue}>{children}</QuizContext.Provider>;
}

// Export the context
export { QuizContext };