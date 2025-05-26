
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CountdownTimer from './CountdownTimer';

interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
  onSubmit: (answer: string, timeRemaining: number) => void;
  timerSeconds: number;
}

const QuestionCard = ({ 
  questionNumber, 
  questionText,
  onSubmit,
  timerSeconds
}: QuestionCardProps) => {
  const [answer, setAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timerSeconds);
  
  // Reset states when question changes
  useEffect(() => {
    console.log('QuestionCard: Question changed', { questionNumber, questionText });
    setAnswer('');
    setIsAnswered(false);
    setTimerComplete(false);
    setTimeRemaining(timerSeconds);
  }, [questionNumber, questionText, timerSeconds]);
  
  const handleTimerComplete = () => {
    console.log('QuestionCard: Timer completed');
    setTimerComplete(true);
    if (!isAnswered) {
      console.log('QuestionCard: Auto-submitting empty answer');
      // Auto-submit empty answer when timer completes
      onSubmit('', 0);
    }
  };
  
  const handleSubmit = () => {
    if (!isAnswered && answer.trim()) {
      console.log('QuestionCard: Submitting answer', { answer: answer.trim(), timeRemaining });
      setIsAnswered(true);
      onSubmit(answer.trim(), timeRemaining);
    }
  };
  
  const handleNext = () => {
    console.log('QuestionCard: Next button clicked');
    if (timerComplete) {
      onSubmit('NEXT_QUESTION', 0); // Signal to advance to next question
    }
  };
  
  const canSubmit = answer.trim() && !isAnswered;
  const showWaiting = isAnswered && !timerComplete;
  const showNext = timerComplete;
  
  return (
    <Card className="w-full bg-white/10 backdrop-blur-sm border-none shadow-lg">
      <CardContent className="p-6 space-y-6">
        <div className="text-center mb-4">
          <div className="inline-block bg-quiz-red-500 text-white px-4 py-2 rounded-full font-bold mb-3">
            Question {questionNumber}
          </div>
          <h3 className="text-2xl font-bold text-white mb-6">{questionText}</h3>
        </div>
        
        <CountdownTimer 
          key={`${questionNumber}-${questionText}`}
          seconds={timerSeconds} 
          onComplete={handleTimerComplete}
          onTick={setTimeRemaining}
        />
        
        <div className="space-y-4 pt-4">
          <Input
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => !isAnswered && setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSubmit()}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
            disabled={isAnswered}
          />
          
          {showWaiting && (
            <div className="text-center text-yellow-400 font-medium">
              Waiting for next question...
            </div>
          )}
          
          <Button
            onClick={showNext ? handleNext : handleSubmit}
            disabled={!canSubmit && !showNext}
            className={`w-full ${
              showNext
                ? 'bg-green-600 hover:bg-green-700' 
                : canSubmit
                ? 'bg-quiz-red-600 hover:bg-quiz-red-700'
                : 'bg-quiz-red-600 opacity-50'
            }`}
          >
            {showNext ? "Next Question" : showWaiting ? `Waiting ${Math.max(0, timeRemaining)}s...` : "Submit Answer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
