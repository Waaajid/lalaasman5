import { Button } from "@/components/ui/button";
import { useQuiz } from "@/hooks/useQuiz";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';
import {
  getRoundAnswerBreakdown,
  generateWinnerExplanation,
  debugLogAllAnswers,
  type RoundAnswerBreakdown
} from '@/utils/answerExtraction';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Target, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface RoundSummaryProps {
  roundNumber: number;
  onNextRound: () => void;
}

const RoundSummary = ({ roundNumber, onNextRound }: RoundSummaryProps) => {
  const { gameSession, isSessionHost, nickname } = useQuiz();
  const [timeLeft, setTimeLeft] = useState(20);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [breakdown, setBreakdown] = useState<RoundAnswerBreakdown | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Calculate breakdown when component loads
  useEffect(() => {
    if (gameSession) {
      const roundBreakdown = getRoundAnswerBreakdown(gameSession, roundNumber);
      setBreakdown(roundBreakdown);
      
      // Debug log for troubleshooting
      debugLogAllAnswers(gameSession, roundNumber);
      
      // Auto-expand current user's team
      const currentPlayer = gameSession.players?.[nickname];
      if (currentPlayer?.teamId) {
        setExpandedTeams(new Set([currentPlayer.teamId]));
      }
    }
  }, [gameSession, roundNumber, nickname]);

  // Confetti effect for winners
  useEffect(() => {
    if (breakdown && breakdown.winners.length > 0) {
      const currentPlayer = gameSession?.players?.[nickname];
      const currentTeamName = currentPlayer?.teamId ? gameSession?.teams?.[currentPlayer.teamId]?.name : null;
      
      if (currentTeamName && breakdown.winners.includes(currentTeamName)) {
        // User's team won - trigger confetti
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        
        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          
          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }
          
          const particleCount = 50 * (timeLeft / duration);
          
          confetti({
            particleCount,
            startVelocity: 30,
            spread: 360,
            origin: {
              x: randomInRange(0.1, 0.3),
              y: Math.random() - 0.2
            }
          });
          confetti({
            particleCount,
            startVelocity: 30,
            spread: 360,
            origin: {
              x: randomInRange(0.7, 0.9),
              y: Math.random() - 0.2
            }
          });
        }, 250);
      }
    }
  }, [breakdown, gameSession, nickname]);

  // Auto-advance timer for host
  useEffect(() => {
    if (!isSessionHost || !autoAdvanceEnabled) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
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

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const currentPlayer = gameSession?.players?.[nickname];
  const currentTeamName = currentPlayer?.teamId ? gameSession?.teams?.[currentPlayer.teamId]?.name : null;
  const isUserInWinningTeam = breakdown?.winners.includes(currentTeamName || '') || false;

  if (!breakdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Calculating round results...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6"
    >
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold"
          >
            Round {roundNumber} Results
          </motion.h1>
          
          {/* Winner Announcement */}
          {breakdown.winners.length > 0 && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`p-6 rounded-xl shadow-xl ${isUserInWinningTeam ? 'bg-yellow-500/20 border-2 border-yellow-400' : 'bg-slate-700/50'}`}
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <Trophy className="h-8 w-8 text-yellow-400" />
                <h2 className="text-2xl font-bold">
                  {breakdown.winners.length === 1 ? 'Winner' : 'Winners'}
                </h2>
              </div>
              <p className="text-3xl font-bold text-yellow-400 mb-2">
                {breakdown.winners.join(' & ')}
              </p>
              <p className="text-lg opacity-90">
                {generateWinnerExplanation(breakdown)}
              </p>
              {isUserInWinningTeam && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xl font-bold text-yellow-300 mt-3"
                >
                  🎉 Congratulations! Your team won this round! 🎉
                </motion.p>
              )}
            </motion.div>
          )}
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{breakdown.teams.length}</p>
              <p className="text-sm opacity-75">Active Teams</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{breakdown.allPlayerAnswers.length}</p>
              <p className="text-sm opacity-75">Total Answers</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {breakdown.teams.length > 0 ? breakdown.teams[0].roundPercentage.toFixed(1) : 0}%
              </p>
              <p className="text-sm opacity-75">Highest Team %</p>
            </CardContent>
          </Card>
        </div>

        {/* Toggle Details Button */}
        <div className="text-center">
          <Button
            onClick={() => setShowAllDetails(!showAllDetails)}
            variant="outline"
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            {showAllDetails ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All Answers & Details
              </>
            )}
          </Button>
        </div>

        {/* Team Results */}
        <AnimatePresence>
          {showAllDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {breakdown.teams.map((team, index) => {
                const isWinner = breakdown.winners.includes(team.teamName);
                const isUserTeam = currentTeamName === team.teamName;
                const isExpanded = expandedTeams.has(team.teamId);
                
                return (
                  <motion.div
                    key={team.teamId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`border-2 transition-all duration-300 ${
                      isWinner ? 'border-yellow-400 bg-yellow-500/10' :
                       isUserTeam ? 'border-blue-400 bg-blue-500/10' :
                       'border-slate-700 bg-slate-800/60'
                    }`}>
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => toggleTeamExpansion(team.teamId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 ${team.color} rounded-full`}></div>
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {team.teamName}
                                {isWinner && <Trophy className="h-5 w-5 text-yellow-400" />}
                                {isUserTeam && <span className="text-sm text-blue-400">(Your Team)</span>}
                              </CardTitle>
                              <p className="text-sm opacity-75">
                                {team.players.length} players • {team.roundPercentage.toFixed(1)}% average
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">#{index + 1}</span>
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <CardContent className="space-y-4">
                              {/* Question Breakdown */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {team.questionStats.map(qStat => (
                                  <div key={qStat.questionId} className="bg-slate-700/50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-semibold">Q{qStat.questionNumber}</span>
                                      <span className="text-sm bg-slate-600 px-2 py-1 rounded">
                                        {qStat.matchingPercentage.toFixed(1)}%
                                      </span>
                                    </div>
                                    <p className="text-xs opacity-75 mb-1">
                                      Most common: "{qStat.mostCommonAnswer}"
                                    </p>
                                    <p className="text-xs opacity-75">
                                      {qStat.mostCommonCount}/{qStat.totalResponses} players matched
                                    </p>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Individual Player Answers */}
                              <div className="space-y-3">
                                <h4 className="font-semibold text-lg">Individual Player Answers:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {team.players.map(player => (
                                    <div key={player.nickname} className="bg-slate-700/30 p-3 rounded-lg">
                                      <h5 className="font-medium mb-2 flex items-center gap-2">
                                        {player.nickname}
                                        {player.nickname === nickname && (
                                          <span className="text-xs bg-blue-500 px-2 py-1 rounded">You</span>
                                        )}
                                      </h5>
                                      <div className="space-y-1">
                                        {player.answers.map(answer => {
                                          const qNum = answer.questionId.slice(-1);
                                          return (
                                            <div key={answer.questionId} className="text-sm">
                                              <span className="font-medium">Q{qNum}:</span> "{answer.answer}"
                                              <Clock className="inline h-3 w-3 ml-2 opacity-60" />
                                              <span className="text-xs opacity-60">{answer.timeRemaining}s</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Host Controls */}
        {isSessionHost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Clock className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-semibold">
                  Auto-advance in: {timeLeft}s
                </span>
              </div>
              <Button
                onClick={handleManualAdvance}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3"
              >
                Continue to {roundNumber < 3 ? `Round ${roundNumber + 1}` : 'Final Results'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default RoundSummary;
