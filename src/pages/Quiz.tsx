import { useQuiz } from "@/hooks/useQuiz";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import QuestionCard from "@/components/QuestionCard";
import RoundSummary from "@/components/RoundSummary";
import QuizComplete from "@/components/QuizComplete";
import { submitAnswer as submitToFirebase } from "@/services/gameSession";
import { ref, update } from 'firebase/database'; // Added imports for ref and update
import { db } from '@/config/firebase'; // Added import for db

const Quiz = () => {
  const { 
    nickname, 
    selectedTeam,
    questions,
    currentRound,
    setCurrentRound,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    submitPlayerAnswer,
    processRoundResults,
    quizCompleted,
    setQuizCompleted,
    gameSession,
    isSessionHost,
    sessionError,
    advanceToNextQuestion, // Destructured from useQuiz hook
    hostHandleRoundEndAndProceed, // Added this for proper round progression
  } = useQuiz();
  
  const navigate = useNavigate();
  
  const [showingSummary, setShowingSummary] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [waitingForHost, setWaitingForHost] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Filter questions for current round
  const roundQuestions = questions.filter(q => q.roundId === currentRound);
  const currentQuestion = roundQuestions[currentQuestionIndex];
  
  // Calculate progress
  const totalQuestions = questions.length;
  const questionsPerRound = roundQuestions.length;
  const completedQuestions = (currentRound - 1) * questionsPerRound + currentQuestionIndex;
  const progressPercentage = (completedQuestions / totalQuestions) * 100;
  
  // Monitor game session state
  useEffect(() => {
    console.log('Quiz: Game session updated', { gameSession, sessionError });
    
    if (!gameSession && !sessionError) {
      return;
    }
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      navigate("/team-selection");
      return;
    }

    if (gameSession) {
      const { currentState, currentRound: sessionRound, currentQuestionIndex: sessionQuestionIndex, status } = gameSession;
      console.log('Quiz: Session state', { currentState, sessionRound, sessionQuestionIndex, status });

      // Check if game has started
      const started = status === 'started' || status === 'in-progress';
      setGameStarted(started);
      setWaitingForHost(!started);

      if (started) {
        if (sessionRound && sessionRound !== currentRound) {
          console.log('Quiz: Updating round', { from: currentRound, to: sessionRound });
          setCurrentRound(sessionRound);
          setShowingSummary(false);
        }
        
        if (typeof sessionQuestionIndex === 'number' && sessionQuestionIndex !== currentQuestionIndex) {
          console.log('Quiz: Updating question index', { from: currentQuestionIndex, to: sessionQuestionIndex });
          setCurrentQuestionIndex(sessionQuestionIndex);
          setQuestionKey(prev => prev + 1);
          setShowingSummary(false);
        }
        
        switch (currentState?.phase) {
          case 'answering': {
            console.log('Quiz: Phase is answering');
            setShowingSummary(false);
            break;
          }
          case 'round-end': {
            console.log('Quiz: Phase is round-end');
            setShowingSummary(true);
            if (isSessionHost) {
              processRoundResults(currentRound);
            }
            break;
          }
          case 'completed': {
            console.log('Quiz: Phase is completed');
            setQuizCompleted(true);
            break;
          }
        }
      }
    }
  }, [
    gameSession,
    currentRound,
    currentQuestionIndex,
    setCurrentRound,
    setCurrentQuestionIndex,
    navigate,
    setQuizCompleted,
    isSessionHost,
    sessionError,
    processRoundResults
  ]);

  // Redirect if not properly set up
  useEffect(() => {
    if (!nickname) {
      console.log('Quiz: No nickname, redirecting to home');
      navigate("/");
    } else if (!selectedTeam || (!gameSession && sessionError)) {
      console.log('Quiz: No team or session error, redirecting to team selection');
      navigate("/team-selection");
    } else if (gameSession) {
      const currentPlayer = gameSession.players[nickname];
      const team = gameSession.teams[currentPlayer?.teamId];
      if (!currentPlayer?.teamId || !team) {
        console.log('Quiz: Player not properly assigned to team, redirecting');
        navigate("/team-selection");
      }
    }
  }, [nickname, selectedTeam, gameSession, navigate, sessionError]);

  const handleAnswerSubmit = async (answer: string, timeRemaining: number) => {
    console.log('Quiz: Answer submitted', { answer, timeRemaining, currentQuestion });
    
    if (!currentQuestion || !selectedTeam || !gameSession) {
      console.log('Quiz: Missing required data for answer submission');
      return;
    }

    try {
      // Handle "Next Question" signal
      if (answer === 'NEXT_QUESTION') {
        console.log('Quiz: Next question signal received, calling context advanceToNextQuestion');
        // Call the advanceToNextQuestion from the context, which handles Firebase update for all users
        await advanceToNextQuestion(); 
        return;
      }

      // Submit answer to Firebase
      if (answer && answer.trim()) {
        console.log('Quiz: Submitting answer to Firebase');
        await submitToFirebase(gameSession.id, nickname, currentQuestion.id, answer, timeRemaining);
        
        submitPlayerAnswer({
          teamName: selectedTeam.name,
          roundNumber: currentRound,
          questionId: currentQuestion.id,
          answer: answer
        });

        // CRITICAL FIX: Host automatically advances after answer submission
        if (isSessionHost) {
          console.log('Quiz: Host auto-advancing to next question after answer submission');
          setTimeout(async () => {
            try {
              // Use the context's advanceToNextQuestion here as well for consistency
              await advanceToNextQuestion(); 
              console.log('Quiz: Successfully advanced to next question by host after answer');
            } catch (error) {
              console.error('Quiz: Error advancing to next question by host after answer:', error);
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  
  const handleNextRound = async () => {
    try {
      if (isSessionHost && hostHandleRoundEndAndProceed) {
        // Use the context's proper round progression function
        console.log('Quiz: Using hostHandleRoundEndAndProceed for round progression');
        await hostHandleRoundEndAndProceed();
      } else if (currentRound < 3 && gameSession) { 
        // Fallback for non-host or if function not available
        const nextRound = currentRound + 1;
        console.log('Quiz: Moving to next round (fallback)', { from: currentRound, to: nextRound });
        
        if (isSessionHost) {
            const updates = {
                currentRound: nextRound,
                currentQuestionIndex: 0,
                'currentState/phase': 'answering', // Ensure phase is reset
                lastUpdated: Date.now() // Keep track of updates
            };
            const sessionRef = ref(db, `sessions/${gameSession.id}`);
            await update(sessionRef, updates);
            console.log('Quiz: Host advanced to next round in Firebase');
        } else {
            console.log('Quiz: Waiting for host or game session to advance to the next round.');
        }
      } else if (currentRound >= 3) {
        console.log('Quiz: All rounds completed or max rounds reached.');
        if (isSessionHost && gameSession && gameSession.status !== 'completed') {
            const sessionRef = ref(db, `sessions/${gameSession.id}`);
            await update(sessionRef, { status: 'completed', 'currentState/phase': 'completed', lastUpdated: Date.now() });
            console.log('Quiz: Host marked quiz as completed in Firebase.');
        }
        setQuizCompleted(true);
      } else {
        console.log('Quiz: Cannot advance round, gameSession might be null or currentRound is invalid.');
      }
    } catch (error) {
      console.error('Error advancing round:', error);
    }
  };

  // Show waiting screen if game hasn't started
  if (waitingForHost && !gameStarted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
        <header className="p-4 border-b border-white/10">
          <div className="container flex justify-between items-center">
            <h2 className="font-semibold">Quiz Game</h2>
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
          <div className="text-center">
            <div className="text-6xl mb-6">⏳</div>
            <h1 className="text-3xl font-bold mb-4">Waiting for host to start the game...</h1>
            <p className="text-xl text-white/80">
              Please wait while the host starts the quiz.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
        <header className="p-4 border-b border-white/10">
          <div className="container flex justify-between items-center">
            <h2 className="font-semibold">Quiz Game - Results</h2>
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
          <QuizComplete />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      {/* Progress Bar */}
      <div className="w-full bg-quiz-red-800 p-4">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Round {currentRound} - Question {currentQuestionIndex + 1} of {questionsPerRound}
            </span>
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
          <h2 className="font-semibold">Quiz Game - Round {currentRound}</h2>
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
          {showingSummary ? (
            <RoundSummary 
              roundNumber={currentRound} 
              onNextRound={handleNextRound} 
            />
          ) : currentQuestion ? (
            <QuestionCard
              key={questionKey}
              questionNumber={currentQuestionIndex + 1}
              questionText={currentQuestion.text}
              onSubmit={handleAnswerSubmit}
              timerSeconds={12}
            />
          ) : (
            <div className="text-center">
              <p className="text-xl mb-4">No questions available.</p>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/20"
              >
                Return to Welcome Screen
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Quiz;
