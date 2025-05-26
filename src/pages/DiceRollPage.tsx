import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useQuiz } from '@/hooks/useQuiz';
import Dice3D from '@/components/Dice3D';
import { cn } from '@/lib/utils';

interface TeamRoll {
  teamId: string;
  teamName: string;
  color: string;
  rolls: number[];
  totalScore: number;
}

const DiceRollPage: React.FC = () => {
  const navigate = useNavigate();
  const { nickname, selectedTeam, getDiceRolls } = useQuiz();
  const [isRolling, setIsRolling] = useState(false);
  const [rollsRemaining, setRollsRemaining] = useState(
    selectedTeam ? getDiceRolls(selectedTeam.name) : 0
  );
  const [currentRoll, setCurrentRoll] = useState(1);
  const [teamRolls, setTeamRolls] = useState<TeamRoll[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [rollingSound] = useState(() => new Audio('/sounds/dice-roll.mp3'));
  const [successSound] = useState(() => new Audio('/sounds/success.mp3'));

  useEffect(() => {
    // Initialize team rolls
    if (selectedTeam) {
      setTeamRolls([
        {
          teamId: selectedTeam.id,
          teamName: selectedTeam.name,
          color: selectedTeam.color,
          rolls: [],
          totalScore: 0
        }
      ]);
    }
  }, [selectedTeam]);

  const generateDiceRoll = (remainingRolls: number): number => {
    // Ensure at least one 6 in the sequence
    if (remainingRolls === 1 && !teamRolls.find(t => t.teamId === selectedTeam?.id)?.rolls.includes(6)) {
      return 6;
    }
    return Math.floor(Math.random() * 6) + 1;
  };

  const handleRoll = async () => {
    if (rollsRemaining > 0 && !isRolling && selectedTeam) {
      setIsRolling(true);
      rollingSound.play();

      const result = generateDiceRoll(rollsRemaining);
      setCurrentRoll(result);

      // Update team rolls
      setTeamRolls(prev => {
        const teamRoll = prev.find(t => t.teamId === selectedTeam.id);
        if (teamRoll) {
          const newRolls = [...teamRoll.rolls, result];
          return prev.map(t => 
            t.teamId === selectedTeam.id 
              ? { ...t, rolls: newRolls, totalScore: newRolls.reduce((a, b) => a + b, 0) }
              : t
          );
        }
        return prev;
      });

      if (result === 6) {
        setTimeout(() => {
          successSound.play();
        }, 1000);
      }

      // Update remaining rolls
      setTimeout(() => {
        setIsRolling(false);
        setRollsRemaining(prev => prev - 1);

        if (rollsRemaining === 1) {
          setTimeout(() => {
            setShowResults(true);
          }, 1000);
        }
      }, 2000);
    }
  };

  const handleFinish = () => {
    navigate('/');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white"
    >
      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
          <h2 className="font-semibold">Bonus Dice Roll</h2>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 px-4 py-2 rounded-full">
              <span className="font-medium">Playing as: </span>
              <span className="font-bold">{nickname}</span>
            </div>
            {selectedTeam && (
              <div className={`${selectedTeam.color} px-4 py-2 rounded-full`}>
                <span className="font-medium text-white">{selectedTeam.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dice Roll Area */}
          <div className="flex flex-col items-center space-y-8">
            <div className="relative">
              <Dice3D
                value={currentRoll}
                isRolling={isRolling}
                size="lg"
              />
              {currentRoll === 6 && !isRolling && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="text-yellow-400 text-4xl font-bold">
                    ★ LUCKY 6! ★
                  </div>
                </motion.div>
              )}
            </div>

            <div className="text-center space-y-6">
              <div className="space-y-2">
                <motion.p 
                  key={rollsRemaining}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  className="text-2xl font-bold"
                >
                  Rolls Remaining: {rollsRemaining}
                </motion.p>
              </div>

              {!showResults ? (
                <Button
                  onClick={handleRoll}
                  disabled={isRolling || rollsRemaining === 0}
                  className="bg-white text-quiz-red-600 hover:bg-white/90 font-bold text-lg px-8 py-4"
                >
                  {isRolling ? "Rolling..." : "Roll Dice"}
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-bold text-lg px-8 py-4"
                >
                  Finish
                </Button>
              )}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Team Rolls</h3>
            <div className="space-y-4">
              {teamRolls.map((team) => (
                <div key={team.teamId} className={`${team.color} bg-opacity-20 rounded-lg p-4`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">{team.teamName}</h4>
                    <span className="text-lg font-bold">Total: {team.totalScore}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {team.rolls.map((roll, index) => (
                      <div
                        key={index}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          "bg-white/20 font-bold",
                          roll === 6 && "bg-yellow-500 text-white"
                        )}
                      >
                        {roll}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default DiceRollPage;
