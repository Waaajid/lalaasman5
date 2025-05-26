// Comprehensive answer extraction and display utility
import { GameSession } from '../services/gameSession';

export interface PlayerAnswerData {
  playerId: string;
  nickname: string;
  teamId: string;
  teamName: string;
  questionId: string;
  answer: string;
  timeRemaining: number;
}

export interface TeamAnswerSummary {
  teamId: string;
  teamName: string;
  color: string;
  players: Array<{
    nickname: string;
    answers: Array<{
      questionId: string;
      answer: string;
      timeRemaining: number;
    }>;
  }>;
  questionStats: Array<{
    questionId: string;
    questionNumber: number;
    answerCounts: Record<string, number>;
    mostCommonAnswer: string;
    mostCommonCount: number;
    totalResponses: number;
    matchingPercentage: number;
  }>;
  roundPercentage: number;
}

export interface RoundAnswerBreakdown {
  roundNumber: number;
  teams: TeamAnswerSummary[];
  winners: string[];
  allPlayerAnswers: PlayerAnswerData[];
}

/**
 * Extract all player answers for a specific round
 */
export function extractPlayerAnswersForRound(
  gameSession: GameSession,
  roundNumber: number
): PlayerAnswerData[] {
  const playerAnswers: PlayerAnswerData[] = [];
  
  Object.entries(gameSession.players || {}).forEach(([playerId, player]) => {
    if (player.isHost) return; // Skip host
    
    const teamName = gameSession.teams?.[player.teamId]?.name || player.teamId;
    
    Object.entries(player.answers || {}).forEach(([questionId, answerData]) => {
      // Check if this question belongs to the specified round
      if (questionId.startsWith(`r${roundNumber}`)) {
        playerAnswers.push({
          playerId,
          nickname: player.nickname,
          teamId: player.teamId,
          teamName,
          questionId,
          answer: answerData.answer,
          timeRemaining: answerData.timeRemaining
        });
      }
    });
  });
  
  return playerAnswers;
}

/**
 * Calculate team answer statistics for a round
 */
export function calculateTeamAnswerStats(
  gameSession: GameSession,
  roundNumber: number
): TeamAnswerSummary[] {
  const playerAnswers = extractPlayerAnswersForRound(gameSession, roundNumber);
  const teamSummaries: TeamAnswerSummary[] = [];
  
  // Get all active teams (teams with players)
  const activeTeamIds = new Set<string>();
  Object.values(gameSession.players || {}).forEach(player => {
    if (!player.isHost && player.teamId) {
      activeTeamIds.add(player.teamId);
    }
  });
  
  Array.from(activeTeamIds).forEach(teamId => {
    const team = gameSession.teams?.[teamId];
    if (!team) return;
    
    const teamAnswers = playerAnswers.filter(pa => pa.teamId === teamId);
    const teamPlayers = Array.from(new Set(teamAnswers.map(ta => ta.nickname)));
    
    // Group answers by player
    const playerAnswerMap: Record<string, PlayerAnswerData[]> = {};
    teamAnswers.forEach(answer => {
      if (!playerAnswerMap[answer.nickname]) {
        playerAnswerMap[answer.nickname] = [];
      }
      playerAnswerMap[answer.nickname].push(answer);
    });
    
    // Calculate question statistics
    const questions = [`r${roundNumber}q1`, `r${roundNumber}q2`, `r${roundNumber}q3`, `r${roundNumber}q4`];
    const questionStats = questions.map((questionId, index) => {
      const questionAnswers = teamAnswers.filter(ta => ta.questionId === questionId);
      const answerCounts: Record<string, number> = {};
      
      questionAnswers.forEach(qa => {
        const normalizedAnswer = qa.answer.toLowerCase().trim();
        answerCounts[normalizedAnswer] = (answerCounts[normalizedAnswer] || 0) + 1;
      });
      
      const entries = Object.entries(answerCounts);
      const mostCommon = entries.length > 0 
        ? entries.reduce((a, b) => a[1] > b[1] ? a : b)
        : ['', 0];
      
      const mostCommonCount = mostCommon[1];
      const totalResponses = questionAnswers.length;
      const matchingPercentage = totalResponses > 0 ? (mostCommonCount / totalResponses) * 100 : 0;
      
      return {
        questionId,
        questionNumber: index + 1,
        answerCounts,
        mostCommonAnswer: mostCommon[0],
        mostCommonCount,
        totalResponses,
        matchingPercentage
      };
    });
    
    // Calculate round percentage (average of all question percentages)
    const roundPercentage = questionStats.length > 0 
      ? questionStats.reduce((sum, q) => sum + q.matchingPercentage, 0) / questionStats.length
      : 0;
    
    teamSummaries.push({
      teamId,
      teamName: team.name,
      color: team.color,
      players: teamPlayers.map(playerNickname => ({
        nickname: playerNickname,
        answers: (playerAnswerMap[playerNickname] || [])
          .sort((a, b) => a.questionId.localeCompare(b.questionId))
          .map(pa => ({
            questionId: pa.questionId,
            answer: pa.answer,
            timeRemaining: pa.timeRemaining
          }))
      })),
      questionStats,
      roundPercentage
    });
  });
  
  return teamSummaries.sort((a, b) => b.roundPercentage - a.roundPercentage);
}

/**
 * Get complete round breakdown with winners and explanations
 */
export function getRoundAnswerBreakdown(
  gameSession: GameSession,
  roundNumber: number
): RoundAnswerBreakdown {
  const teams = calculateTeamAnswerStats(gameSession, roundNumber);
  const winners = gameSession.roundWinners?.[roundNumber] || [];
  const allPlayerAnswers = extractPlayerAnswersForRound(gameSession, roundNumber);
  
  return {
    roundNumber,
    teams,
    winners,
    allPlayerAnswers
  };
}

/**
 * Generate human-readable explanation of why teams won
 */
export function generateWinnerExplanation(breakdown: RoundAnswerBreakdown): string {
  if (breakdown.winners.length === 0) {
    return "No winners determined for this round.";
  }
  
  if (breakdown.winners.length === 1) {
    const winnerTeam = breakdown.teams.find(t => t.teamName === breakdown.winners[0]);
    if (winnerTeam) {
      return `${winnerTeam.teamName} won with ${winnerTeam.roundPercentage.toFixed(1)}% team matching average. Their best questions were: ${
        winnerTeam.questionStats
          .sort((a, b) => b.matchingPercentage - a.matchingPercentage)
          .slice(0, 2)
          .map(q => `Q${q.questionNumber} (${q.matchingPercentage.toFixed(1)}%)`)
          .join(', ')
      }.`;
    }
  }
  
  const winnerTeams = breakdown.teams.filter(t => breakdown.winners.includes(t.teamName));
  const winnerPercentages = winnerTeams.map(t => `${t.teamName}: ${t.roundPercentage.toFixed(1)}%`);
  
  return `Tie between ${breakdown.winners.join(' and ')} with matching percentages: ${winnerPercentages.join(', ')}.`;
}

/**
 * Debug log all answers for troubleshooting
 */
export function debugLogAllAnswers(gameSession: GameSession, roundNumber: number): void {
  console.log(`\n🔍 DEBUG: ALL ANSWERS FOR ROUND ${roundNumber}`);
  console.log('==========================================');
  
  const breakdown = getRoundAnswerBreakdown(gameSession, roundNumber);
  
  breakdown.teams.forEach(team => {
    console.log(`\n📋 ${team.teamName} (${team.players.length} players):`);
    console.log(`   Round Average: ${team.roundPercentage.toFixed(1)}%`);
    
    team.questionStats.forEach(qStat => {
      console.log(`\n   📝 Question ${qStat.questionNumber} (${qStat.questionId}):`);
      console.log(`      Total Responses: ${qStat.totalResponses}`);
      console.log(`      Answer Distribution:`, qStat.answerCounts);
      console.log(`      Most Common: "${qStat.mostCommonAnswer}" (${qStat.mostCommonCount}/${qStat.totalResponses} = ${qStat.matchingPercentage.toFixed(1)}%)`);
    });
    
    console.log(`\n   👥 Individual Player Answers:`);
    team.players.forEach(player => {
      console.log(`      ${player.nickname}:`);
      player.answers.forEach(answer => {
        const qNum = answer.questionId.slice(-1);
        console.log(`        Q${qNum}: "${answer.answer}" (${answer.timeRemaining}s left)`);
      });
    });
  });
  
  console.log(`\n🏆 WINNERS: ${breakdown.winners.join(', ')}`);
  console.log(`💡 EXPLANATION: ${generateWinnerExplanation(breakdown)}`);
}
