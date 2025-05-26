import { useQuiz } from "@/hooks/useQuiz";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect } from "react";

const Onboarding = () => {
  const { 
    nickname, 
    selectedTeam, 
    resetQuiz,
    startNewSession,
    gameSession,
    isSessionHost,
    updateGameState
  } = useQuiz();
  const navigate = useNavigate();
  
  // Redirect if user hasn't completed previous steps
  useEffect(() => {
    if (!nickname) {
      navigate("/");
    } else if (!selectedTeam) {
      navigate("/team-selection");
    }
  }, [nickname, selectedTeam, navigate]);

  const handleStartGame = async () => {
    if (!selectedTeam) {
      navigate("/team-selection");
      return;
    }

    try {
      // Reset quiz state first
      await resetQuiz();

      if (gameSession) {
        // Update game status and phase
        await updateGameState({
          phase: 'answering',
          currentRound: 1,
          currentQuestionIndex: 0
        });

        // Only navigate if the update was successful
        navigate("/quiz");
      } else {
        console.error('No active game session');
        navigate("/team-selection");
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const progressPercentage = (3 / 8) * 100; // Step 3 of 8

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      {/* Progress Bar */}
      <div className="w-full bg-quiz-red-800 p-4">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step 3 of 8</span>
            <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-quiz-red-900"
          />
        </div>
      </div>

      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
          <h2 className="font-semibold">Quiz Game - How to Play</h2>
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
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Welcome to the Ultimate Team Match Quiz!</h1>
            <p className="text-xl text-quiz-red-100">
              Get ready for an exciting team-based quiz experience!
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">How the Game Works</h2>
            <div className="space-y-4 text-lg">
              <div className="flex items-start space-x-3">
                <div className="bg-quiz-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mt-1">
                  1
                </div>
                <p>You'll play <span className="font-bold">3 rounds</span> with <span className="font-bold">4 questions</span> each.</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-quiz-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mt-1">
                  2
                </div>
                <p>Each question must be answered within <span className="font-bold">10 seconds</span>.</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-quiz-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mt-1">
                  3
                </div>
                <p>Teams win rounds by having the <span className="font-bold">most matching answers</span>.</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-quiz-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mt-1">
                  4
                </div>
                <p>The <span className="font-bold">final winning team gets to roll the dice!</span></p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Button
              onClick={handleStartGame}
              className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-bold px-12 py-4 text-xl transition-all duration-300 transform hover:scale-105"
            >
              Start Game
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
