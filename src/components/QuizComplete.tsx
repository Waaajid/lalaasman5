import { Button } from "@/components/ui/button";
import { useQuiz } from "@/hooks/useQuiz";
import { useNavigate } from "react-router-dom";

const QuizComplete = () => {
  const { 
    nickname, 
    selectedTeam, 
    userAnswers, 
    questions, 
    resetQuiz,
    gameSession,
    roundResults,
    teamScores,
    getRoundWinner,
    getDiceRolls
  } = useQuiz();
  
  const navigate = useNavigate();

  const finalResults = teamScores.sort((a, b) => b.roundsWon.length - a.roundsWon.length);
  const winningTeam = finalResults[0];
  
  const handlePlayAgain = () => {
    resetQuiz();
    navigate("/");
  };

  const handleDiceRoll = () => {
    if (selectedTeam && winningTeam && winningTeam.teamName === selectedTeam.name) {
      navigate("/dice-roll");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">
        Quiz Complete! 
      </h2>
      
      <div className="space-y-6 mb-8">
        <div className="text-center">
          <p className="text-2xl mb-2">Great job, <span className="font-bold">{nickname}</span>!</p>
          <p className="text-xl">
            You've completed all rounds of the quiz with{" "}
            <span className={`font-bold ${selectedTeam?.color} bg-opacity-70 px-2 py-1 rounded`}>
              {selectedTeam?.name}
            </span>
          </p>
        </div>
        
        <div className="bg-white/5 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-center">Your Quiz Summary</h3>
          
          <div className="space-y-6">
            {[1, 2, 3].map(roundId => (
              <div key={roundId} className="border-b border-white/20 pb-4 last:border-0">
                <h4 className="text-lg font-medium mb-3">Round {roundId}:</h4>
                <ul className="space-y-2">
                  {questions
                    .filter(q => q.roundId === roundId)
                    .map(question => {
                      const answer = userAnswers.find(a => a.questionId === question.id);
                      return (
                        <li key={question.id} className="flex justify-between">
                          <span className="text-white/80">{question.text}</span>
                          <span className="font-medium">
                            {answer?.answer || "No answer"}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-center pt-4">
        <Button 
          onClick={handlePlayAgain}
          className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-bold px-8 py-3 text-lg"
        >
          Play Again
        </Button>
      </div>

      <div className="mt-8">
        {winningTeam && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl">Overall Winner</h2>
            <div className="inline-block px-8 py-4 bg-quiz-red-600 rounded-full">
              <span className="text-3xl font-bold">{winningTeam.teamName}</span>
            </div>
            <p className="text-xl">
              Won {winningTeam.roundsWon.length} {winningTeam.roundsWon.length === 1 ? 'round' : 'rounds'}
            </p>
          </div>
        )}
        
        <div className="bg-white/10 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Round Results</h3>
          <div className="space-y-4">
            {[1, 2, 3].map(round => {
              const winner = getRoundWinner(round);
              return (
                <div key={round} className="flex items-center justify-between">
                  <span>Round {round}:</span>
                  <span className="font-bold">
                    {winner || 'No winner'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {selectedTeam && winningTeam && (
          <div className="text-center mt-6">
            {winningTeam.teamName === selectedTeam.name ? (
              <>
                <p className="text-xl mb-4">
                  Congratulations! Your team has won {getDiceRolls(selectedTeam.name)} dice rolls!
                </p>
                <Button
                  onClick={handleDiceRoll}
                  className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-bold px-8 py-4 text-xl"
                >
                  Roll the Dice!
                </Button>
              </>
            ) : (
              <>
                <p className="text-xl mb-4">
                  {winningTeam.teamName} has won the dice rolls!
                </p>
                <Button
                  onClick={() => navigate('/dice-roll')}
                  className="bg-quiz-red-500/50 hover:bg-quiz-red-600/50 text-white font-bold px-8 py-4 text-xl"
                >
                  View Dice Rolls
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizComplete;
