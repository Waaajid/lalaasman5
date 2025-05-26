// Percentage-based winner determination logic
// This replaces the old "2+ matching answers" system with a percentage-based approach

import { GameSession } from '../services/gameSession';

export interface TeamQuestionPerformance {
  teamId: string;
  teamName: string;
  questionId: string;
  totalPlayers: number;
  answerDistribution: { [answer: string]: number };
  highestMatchingCount: number;
  matchingPercentage: number; // 0-100
}

export interface TeamRoundPerformance {
  teamId: string;
  teamName: string;
  roundNumber: number;
  questionPerformances: TeamQuestionPerformance[];
  totalPercentage: number; // Sum of all question percentages for this round
}

export interface TeamOverallPerformance {
  teamId: string;
  teamName: string;
  roundPerformances: TeamRoundPerformance[];
  overallPercentage: number; // Sum of all round percentages
}

/**
 * Calculate team performance for a specific question using percentage-based scoring
 */
export function calculateQuestionPerformance(
  session: GameSession,
  questionId: string,
  teamId: string
): TeamQuestionPerformance {
  const teamName = session.teams?.[teamId]?.name || teamId;
  
  // Get all players in this team who answered this question
  const teamPlayers: Array<GameSession['players'][string]> = [];
  Object.entries(session.players || {}).forEach(([playerId, player]) => {
    if (player.teamId === teamId && !player.isHost && player.answers?.[questionId]) {
      teamPlayers.push(player);
    }
  });

  const totalPlayers = teamPlayers.length;
  
  if (totalPlayers === 0) {
    return {
      teamId,
      teamName,
      questionId,
      totalPlayers: 0,
      answerDistribution: {},
      highestMatchingCount: 0,
      matchingPercentage: 0
    };
  }

  // Count answer frequency
  const answerCounts: { [answer: string]: number } = {};
  teamPlayers.forEach(player => {
    const answer = player.answers?.[questionId]?.answer?.toLowerCase().trim();
    if (answer) {
      answerCounts[answer] = (answerCounts[answer] || 0) + 1;
    }
  });

  // Find the highest matching count
  const highestMatchingCount = Math.max(...Object.values(answerCounts), 0);
  
  // Calculate percentage: (highest matching count / total team players) * 100
  const matchingPercentage = totalPlayers > 0 ? (highestMatchingCount / totalPlayers) * 100 : 0;

  return {
    teamId,
    teamName,
    questionId,
    totalPlayers,
    answerDistribution: answerCounts,
    highestMatchingCount,
    matchingPercentage
  };
}

/**
 * Calculate team performance for an entire round (4 questions)
 */
export function calculateRoundPerformance(
  session: GameSession,
  roundNumber: number,
  teamId: string
): TeamRoundPerformance {
  const teamName = session.teams?.[teamId]?.name || teamId;
  
  // Get all questions for this round (r1q1, r1q2, r1q3, r1q4)
  const questionPerformances: TeamQuestionPerformance[] = [];
  
  for (let questionIndex = 1; questionIndex <= 4; questionIndex++) {
    const questionId = `r${roundNumber}q${questionIndex}`;
    const performance = calculateQuestionPerformance(session, questionId, teamId);
    questionPerformances.push(performance);
  }

  // Sum all question percentages for this round
  const totalPercentage = questionPerformances.reduce(
    (sum, perf) => sum + perf.matchingPercentage, 
    0
  );

  return {
    teamId,
    teamName,
    roundNumber,
    questionPerformances,
    totalPercentage
  };
}

/**
 * Calculate team performance for the entire game (all 3 rounds)
 */
export function calculateOverallPerformance(
  session: GameSession,
  teamId: string
): TeamOverallPerformance {
  const teamName = session.teams?.[teamId]?.name || teamId;
  
  const roundPerformances: TeamRoundPerformance[] = [];
  
  // Calculate performance for all 3 rounds
  for (let roundNumber = 1; roundNumber <= 3; roundNumber++) {
    const roundPerf = calculateRoundPerformance(session, roundNumber, teamId);
    roundPerformances.push(roundPerf);
  }

  // Sum all round percentages for overall score
  const overallPercentage = roundPerformances.reduce(
    (sum, round) => sum + round.totalPercentage, 
    0
  );

  return {
    teamId,
    teamName,
    roundPerformances,
    overallPercentage
  };
}

/**
 * Determine question winner using percentage-based scoring
 */
export function determineQuestionWinner(
  session: GameSession,
  questionId: string
): { winners: string[]; performances: TeamQuestionPerformance[] } {
  // Get all active teams (teams with players)
  const activeTeamIds = new Set<string>();
  Object.values(session.players || {}).forEach(player => {
    if (player.teamId && !player.isHost) {
      activeTeamIds.add(player.teamId);
    }
  });

  // Calculate performance for each team
  const performances = Array.from(activeTeamIds).map(teamId => 
    calculateQuestionPerformance(session, questionId, teamId)
  );

  // Find the highest percentage
  const highestPercentage = Math.max(...performances.map(p => p.matchingPercentage), 0);
  
  // Get all teams with the highest percentage (handles ties)
  const winners = performances
    .filter(p => p.matchingPercentage === highestPercentage && p.matchingPercentage > 0)
    .map(p => p.teamName);

  return { winners, performances };
}

/**
 * Determine round winner using percentage-based scoring
 */
export function determineRoundWinner(
  session: GameSession,
  roundNumber: number
): { winners: string[]; performances: TeamRoundPerformance[] } {
  // Get all active teams (teams with players)
  const activeTeamIds = new Set<string>();
  Object.values(session.players || {}).forEach(player => {
    if (player.teamId && !player.isHost) {
      activeTeamIds.add(player.teamId);
    }
  });

  // Calculate performance for each team for this round
  const performances = Array.from(activeTeamIds).map(teamId => 
    calculateRoundPerformance(session, roundNumber, teamId)
  );

  // Find the highest total percentage for this round
  const highestPercentage = Math.max(...performances.map(p => p.totalPercentage), 0);
  
  // Get all teams with the highest percentage (handles ties)
  const winners = performances
    .filter(p => p.totalPercentage === highestPercentage && p.totalPercentage > 0)
    .map(p => p.teamName);

  return { winners, performances };
}

/**
 * Determine overall game winner using percentage-based scoring
 */
export function determineOverallWinner(
  session: GameSession
): { winners: string[]; performances: TeamOverallPerformance[] } {
  // Get all active teams (teams with players)
  const activeTeamIds = new Set<string>();
  Object.values(session.players || {}).forEach(player => {
    if (player.teamId && !player.isHost) {
      activeTeamIds.add(player.teamId);
    }
  });

  // Calculate overall performance for each team
  const performances = Array.from(activeTeamIds).map(teamId => 
    calculateOverallPerformance(session, teamId)
  );

  // Find the highest overall percentage
  const highestPercentage = Math.max(...performances.map(p => p.overallPercentage), 0);
  
  // Get all teams with the highest percentage (handles ties)
  const winners = performances
    .filter(p => p.overallPercentage === highestPercentage && p.overallPercentage > 0)
    .map(p => p.teamName);

  return { winners, performances };
}

/**
 * Debug function to log detailed performance breakdown
 */
export function logPerformanceBreakdown(session: GameSession, roundNumber?: number): void {
  console.log('\n=== PERFORMANCE BREAKDOWN ===');
  
  // Get all active teams
  const activeTeamIds = new Set<string>();
  Object.values(session.players || {}).forEach(player => {
    if (player.teamId && !player.isHost) {
      activeTeamIds.add(player.teamId);
    }
  });

  if (roundNumber) {
    // Round-specific breakdown
    console.log(`\n🏁 ROUND ${roundNumber} BREAKDOWN:`);
    
    Array.from(activeTeamIds).forEach(teamId => {
      const roundPerf = calculateRoundPerformance(session, roundNumber, teamId);
      console.log(`\n📊 ${roundPerf.teamName} (Round ${roundNumber}):`);
      console.log(`   Total Round %: ${roundPerf.totalPercentage.toFixed(1)}%`);
      
      roundPerf.questionPerformances.forEach((qPerf, index) => {
        console.log(`   Q${index + 1}: ${qPerf.matchingPercentage.toFixed(1)}% (${qPerf.highestMatchingCount}/${qPerf.totalPlayers} players)`);
        Object.entries(qPerf.answerDistribution).forEach(([answer, count]) => {
          console.log(`      "${answer}": ${count} player(s)`);
        });
      });
    });

    const { winners, performances } = determineRoundWinner(session, roundNumber);
    console.log(`\n🏆 ROUND ${roundNumber} WINNER(S): ${winners.join(', ')}`);
  } else {
    // Overall game breakdown
    console.log('\n🎯 OVERALL GAME BREAKDOWN:');
    
    Array.from(activeTeamIds).forEach(teamId => {
      const overallPerf = calculateOverallPerformance(session, teamId);
      console.log(`\n📊 ${overallPerf.teamName} (Overall):`);
      console.log(`   Total Game %: ${overallPerf.overallPercentage.toFixed(1)}%`);
      
      overallPerf.roundPerformances.forEach(roundPerf => {
        console.log(`   Round ${roundPerf.roundNumber}: ${roundPerf.totalPercentage.toFixed(1)}%`);
      });
    });

    const { winners } = determineOverallWinner(session);
    console.log(`\n🏆 OVERALL GAME WINNER(S): ${winners.join(', ')}`);
  }
  
  console.log('=== END BREAKDOWN ===\n');
}
