// Test utility to demonstrate the new percentage-based winner system
import { 
  determineQuestionWinner, 
  determineRoundWinner, 
  determineOverallWinner,
  logPerformanceBreakdown 
} from './percentageWinners';
import { GameSession } from '../services/gameSession';

/**
 * Creates a test scenario that demonstrates how the new percentage system works
 */
export function createTestScenario(): GameSession {
  // Create a mock game session with 3 teams and different scenarios
  const testSession: GameSession = {
    id: 'test-session',
    hostId: 'host',
    status: 'in-progress',
    currentRound: 1,
    currentQuestionIndex: 0,
    teams: {
      crimson: { 
        name: 'Team Crimson', 
        color: 'bg-red-600', 
        playerCount: 4, 
        maxPlayers: 7, 
        answers: {} 
      },
      scarlet: { 
        name: 'Team Scarlet', 
        color: 'bg-red-500', 
        playerCount: 5, 
        maxPlayers: 7, 
        answers: {} 
      },
      ruby: { 
        name: 'Team Ruby', 
        color: 'bg-red-700', 
        playerCount: 3, 
        maxPlayers: 7, 
        answers: {} 
      }
    },
    players: {
      // Team Crimson - 4 players
      'crimson1': {
        nickname: 'CrimsonPlayer1',
        teamId: 'crimson',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'London', timeRemaining: 10 },
          'r1q2': { answer: 'Pizza', timeRemaining: 8 },
          'r1q3': { answer: 'Blue', timeRemaining: 7 },
          'r1q4': { answer: 'Summer', timeRemaining: 9 }
        }
      },
      'crimson2': {
        nickname: 'CrimsonPlayer2',
        teamId: 'crimson',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'London', timeRemaining: 9 },
          'r1q2': { answer: 'Pizza', timeRemaining: 7 },
          'r1q3': { answer: 'Blue', timeRemaining: 6 },
          'r1q4': { answer: 'Winter', timeRemaining: 8 }
        }
      },
      'crimson3': {
        nickname: 'CrimsonPlayer3',
        teamId: 'crimson',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'London', timeRemaining: 8 },
          'r1q2': { answer: 'Burger', timeRemaining: 6 },
          'r1q3': { answer: 'Red', timeRemaining: 5 },
          'r1q4': { answer: 'Summer', timeRemaining: 7 }
        }
      },
      'crimson4': {
        nickname: 'CrimsonPlayer4',
        teamId: 'crimson',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'Paris', timeRemaining: 7 },
          'r1q2': { answer: 'Pizza', timeRemaining: 5 },
          'r1q3': { answer: 'Blue', timeRemaining: 4 },
          'r1q4': { answer: 'Summer', timeRemaining: 6 }
        }
      },

      // Team Scarlet - 5 players
      'scarlet1': {
        nickname: 'ScarletPlayer1',
        teamId: 'scarlet',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'London', timeRemaining: 10 },
          'r1q2': { answer: 'Pizza', timeRemaining: 9 },
          'r1q3': { answer: 'Blue', timeRemaining: 8 },
          'r1q4': { answer: 'Summer', timeRemaining: 7 }
        }
      },
      'scarlet2': {
        nickname: 'ScarletPlayer2',
        teamId: 'scarlet',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'London', timeRemaining: 9 },
          'r1q2': { answer: 'Pizza', timeRemaining: 8 },
          'r1q3': { answer: 'Blue', timeRemaining: 7 },
          'r1q4': { answer: 'Summer', timeRemaining: 6 }
        }
      },
      'scarlet3': {
        nickname: 'ScarletPlayer3',
        teamId: 'scarlet',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'London', timeRemaining: 8 },
          'r1q2': { answer: 'Pizza', timeRemaining: 7 },
          'r1q3': { answer: 'Blue', timeRemaining: 6 },
          'r1q4': { answer: 'Summer', timeRemaining: 5 }
        }
      },
      'scarlet4': {
        nickname: 'ScarletPlayer4',
        teamId: 'scarlet',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'Paris', timeRemaining: 7 },
          'r1q2': { answer: 'Burger', timeRemaining: 6 },
          'r1q3': { answer: 'Red', timeRemaining: 5 },
          'r1q4': { answer: 'Winter', timeRemaining: 4 }
        }
      },
      'scarlet5': {
        nickname: 'ScarletPlayer5',
        teamId: 'scarlet',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'London', timeRemaining: 6 },
          'r1q2': { answer: 'Pizza', timeRemaining: 5 },
          'r1q3': { answer: 'Green', timeRemaining: 4 },
          'r1q4': { answer: 'Summer', timeRemaining: 3 }
        }
      },

      // Team Ruby - 3 players
      'ruby1': {
        nickname: 'RubyPlayer1',
        teamId: 'ruby',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'London', timeRemaining: 10 },
          'r1q2': { answer: 'Pizza', timeRemaining: 9 },
          'r1q3': { answer: 'Blue', timeRemaining: 8 },
          'r1q4': { answer: 'Summer', timeRemaining: 7 }
        }
      },
      'ruby2': {
        nickname: 'RubyPlayer2',
        teamId: 'ruby',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'London', timeRemaining: 9 },
          'r1q2': { answer: 'Pizza', timeRemaining: 8 },
          'r1q3': { answer: 'Blue', timeRemaining: 7 },
          'r1q4': { answer: 'Summer', timeRemaining: 6 }
        }
      },
      'ruby3': {
        nickname: 'RubyPlayer3',
        teamId: 'ruby',
        isHost: false,
        connected: true,
        answers: {
          'r1q1': { answer: 'London', timeRemaining: 8 },
          'r1q2': { answer: 'Pizza', timeRemaining: 7 },
          'r1q3': { answer: 'Blue', timeRemaining: 6 },
          'r1q4': { answer: 'Summer', timeRemaining: 5 }
        }
      }
    },
    roundWinners: {},
    currentState: {
      phase: 'answering'
    }
  };

  return testSession;
}

/**
 * Runs a complete test showing how the percentage system works
 */
export function runPercentageSystemDemo(): void {
  console.log('\n🎯 PERCENTAGE-BASED WINNER SYSTEM DEMO');
  console.log('=====================================\n');

  const testSession = createTestScenario();

  console.log('📊 SCENARIO BREAKDOWN:');
  console.log('• Team Crimson: 4 players');
  console.log('• Team Scarlet: 5 players'); 
  console.log('• Team Ruby: 3 players\n');

  // Test individual questions
  console.log('🔍 INDIVIDUAL QUESTION ANALYSIS:');
  console.log('--------------------------------');

  for (let questionIndex = 1; questionIndex <= 4; questionIndex++) {
    const questionId = `r1q${questionIndex}`;
    const { winners, performances } = determineQuestionWinner(testSession, questionId);
    
    console.log(`\n📝 Question ${questionIndex} (${questionId}):`);
    performances.forEach(perf => {
      console.log(`   ${perf.teamName}: ${perf.matchingPercentage.toFixed(1)}% (${perf.highestMatchingCount}/${perf.totalPlayers} players)`);
      Object.entries(perf.answerDistribution).forEach(([answer, count]) => {
        console.log(`      "${answer}": ${count} player(s)`);
      });
    });
    console.log(`   🏆 Winner(s): ${winners.join(', ')}`);
  }

  // Test round winner
  console.log('\n🏁 ROUND 1 WINNER ANALYSIS:');
  console.log('---------------------------');
  
  const { winners: roundWinners, performances: roundPerformances } = determineRoundWinner(testSession, 1);
  
  roundPerformances.forEach(perf => {
    console.log(`\n📊 ${perf.teamName}:`);
    console.log(`   Total Round Percentage: ${perf.totalPercentage.toFixed(1)}%`);
    perf.questionPerformances.forEach((qPerf, index) => {
      console.log(`   Q${index + 1}: ${qPerf.matchingPercentage.toFixed(1)}%`);
    });
  });
  
  console.log(`\n🏆 ROUND 1 WINNER(S): ${roundWinners.join(', ')}`);

  // Show why this is better than the old system
  console.log('\n💡 WHY THIS SYSTEM IS BETTER:');
  console.log('-----------------------------');
  console.log('• Old system: Required 2+ matching answers, then compared raw numbers');
  console.log('• New system: Rewards consistency and teamwork percentage');
  console.log('• Example: Team Ruby (3/3 = 100%) beats Team Scarlet (4/5 = 80%)');
  console.log('• Even though Team Scarlet has more raw matches, Team Ruby has better teamwork');
  console.log('• This encourages teams to work together rather than just be larger\n');
}
