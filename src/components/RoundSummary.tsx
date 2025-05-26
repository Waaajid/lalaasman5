import { Button } from "@/components/ui/button";
import { useQuiz } from "@/hooks/useQuiz";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';
import { PlayerAnswer } from '@/context/QuizContext'; // Added import for PlayerAnswer

interface RoundSummaryProps {
  roundNumber: number;
  onNextRound: () => void;
}

interface ConfettiOptions {
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  origin?: { x?: number; y?: number };
  particleCount?: number;
  zIndex?: number;
}

const RoundSummary = ({ roundNumber, onNextRound }: RoundSummaryProps) => {
  const { gameSession, isSessionHost } = useQuiz();
  const [timeLeft, setTimeLeft] = useState(20); // 20-second timer
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  
  // Get round winners from game session
  const roundWinners = gameSession?.roundWinners?.[roundNumber] || [];
  console.log(`Round ${roundNumber} winners from gameSession:`, roundWinners);
  
  // Create a collection of team IDs that have players (teams with actual participation)
  const teamsWithPlayers = new Set<string>();
  Object.values(gameSession?.players || {}).forEach(player => {
    if (player.teamId && !player.isHost) {
      teamsWithPlayers.add(player.teamId);
    }
  });
  
  // If there's only one team with players and no winners yet assigned,
  // consider the only active team as the winner
  const activeTeams = Array.from(teamsWithPlayers);
  const singleTeamWinner = activeTeams.length === 1 ? 
    gameSession?.teams?.[activeTeams[0]]?.name : null;
    
  // If no winners but only one team is playing, use that team as the winner
  const effectiveWinners = roundWinners.length > 0 ? 
    roundWinners : 
    (singleTeamWinner ? [singleTeamWinner] : []);
    
  const hasWinners = effectiveWinners.length > 0;
  
  useEffect(() => {
    if (hasWinners) {
      // Fire confetti when winners are announced
      const count = 200;
      const defaults: ConfettiOptions = {
        origin: { y: 0.7 },
        zIndex: 1000,
      };

      function fire(particleRatio: number, opts: ConfettiOptions) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [hasWinners]);

  // 20-second auto-advance timer
  useEffect(() => {
    if (!isSessionHost || !autoAdvanceEnabled) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-advance when timer reaches 0
          onNextRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSessionHost, autoAdvanceEnabled, onNextRound]);

  const handleManualAdvance = () => {
    setAutoAdvanceEnabled(false);
    onNextRound();
  };

  // Group answers by team for comparison
  const teamAnswers: Record<string, { answer: string, count: number }[]> = {};
  
  const allAnswersForRound: PlayerAnswer[] = [];
  // Aggregate answers for each team
  Object.entries(gameSession?.teams || {}).forEach(([teamId, team]) => {
    // Skip teams with undefined or empty names
    if (!team.name || team.name.trim() === '') {
      return;
    }
    
    const answers = team.answers || {};
    const roundAnswers = Object.entries(answers)
      .filter(([questionId]) => questionId.startsWith(`r${roundNumber}`))
      .map(([_, answers]) => answers)
      .flat();

    // Count frequency of each answer
    const answerCounts = roundAnswers.reduce((acc, answer) => {
      const normalizedAnswer = answer.toLowerCase().trim();
      acc[normalizedAnswer] = (acc[normalizedAnswer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by count
    const matchedAnswers = Object.entries(answerCounts)
      .map(([answer, count]) => ({ answer, count }))
      .sort((a, b) => b.count - a.count);
    
    // Store all answers if there's only one active team, otherwise filter to just matching answers
    const activeTeamCount = teamsWithPlayers.size;
    if (activeTeamCount === 1 && teamsWithPlayers.has(teamId)) {
      teamAnswers[team.name] = matchedAnswers; // Show all answers for the only participating team
      console.log("Only one team playing - showing all answers:", matchedAnswers);
    } else {
      teamAnswers[team.name] = matchedAnswers.filter(({ count }) => count >= 2); // Only show matching answers for multiple teams
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-8 bg-white/10 backdrop-blur-sm rounded-xl"
    >
      <h2 className="text-3xl font-bold text-center mb-8">Round {roundNumber} Complete!</h2>
      
      <AnimatePresence>
        {hasWinners ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <h3 className="text-xl mb-4">🏆 Round {roundNumber} Winner{roundWinners.length > 1 ? 's' : ''}:</h3>
            <div className="space-y-2">
              {effectiveWinners.map((winner, index) => (
                <motion.div 
                  key={winner}
                  className="inline-block mx-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-2xl font-bold text-white">🎉 {winner} 🎉</span>
                </motion.div>
              ))}
            </div>
            {effectiveWinners.length > 1 && (
              <p className="text-lg mt-4 text-yellow-300">
                Tied for most matching answers!
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="text-6xl mb-4">🤷‍♂️</div>
            <p className="text-xl">No winning team this round</p>
            <p className="text-lg mt-2 text-quiz-red-200">
              {/* Check if any teams have submitted answers at all */}
              {Object.values(gameSession?.teams || {}).some(team => 
                Object.keys(team.answers || {}).some(qId => qId.startsWith(`r${roundNumber}`))
              ) ? 
                "Teams need at least 2 matching answers to win" : 
                "No answers were submitted this round"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <h3 className="text-xl font-bold mb-4">Team Performance</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(teamAnswers).map(([teamName, answers]) => {
            const isWinner = roundWinners.includes(teamName);
            return (
              <motion.div 
                key={teamName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border-2 ${
                  isWinner 
                    ? 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border-yellow-500' 
                    : 'bg-white/5 border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    {isWinner && <span className="text-yellow-400">👑</span>}
                    {teamName}
                    {isWinner && <span className="text-yellow-400">👑</span>}
                  </h4>
                  {isWinner || (singleTeamWinner && singleTeamWinner === teamName) ? (
                    <span className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      WINNER
                    </span>
                  ) : null}
                </div>
                {answers.length > 0 ? (
                  <ul className="space-y-2">
                    {answers.map(({ answer, count }, index) => (
                      <motion.li 
                        key={answer}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          transition: { delay: index * 0.1 }
                        }}
                        className={`flex justify-between items-center px-3 py-2 rounded ${
                          isWinner && index === 0 
                            ? 'bg-yellow-500/20 border border-yellow-500/50' 
                            : 'bg-white/10'
                        }`}
                      >
                        <span className="capitalize">{answer}</span>
                        <span className={`px-2 py-1 rounded-full text-sm font-bold ${
                          isWinner && index === 0 
                            ? 'bg-yellow-500 text-yellow-900' 
                            : 'bg-quiz-red-500 text-white'
                        }`}>
                          {count} match{count > 1 ? 'es' : ''}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/60">No matching answers</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {isSessionHost && (
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="space-y-4">
            {autoAdvanceEnabled && timeLeft > 0 && (
              <div className="text-center">
                <p className="text-lg text-white/80 mb-2">
                  Auto-advancing in <span className="font-bold text-yellow-400">{timeLeft}</span> seconds
                </p>
                <div className="w-full bg-white/20 rounded-full h-2 max-w-xs mx-auto">
                  <div 
                    className="bg-quiz-red-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / 20) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <Button
              onClick={handleManualAdvance}
              className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-bold px-8 py-3 text-lg"
            >
              {roundNumber < 3 ? "Start Next Round" : "View Final Results"}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RoundSummary;
