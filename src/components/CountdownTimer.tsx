
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  onTick?: (timeLeft: number) => void;
}

const CountdownTimer = ({ seconds, onComplete, onTick }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isComplete, setIsComplete] = useState(false);
  
  // Reset timer when seconds prop changes (new question)
  useEffect(() => {
    setTimeLeft(seconds);
    setIsComplete(false);
  }, [seconds]);
  
  useEffect(() => {
    if (timeLeft <= 0 && !isComplete) {
      setIsComplete(true);
      onComplete();
      return;
    }
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);
        if (onTick) {
          onTick(newTimeLeft);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [timeLeft, onComplete, onTick, isComplete]);
  
  const progressValue = Math.max(0, (timeLeft / seconds) * 100);
  
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span>Time remaining</span>
        <span className="font-medium">{Math.max(0, timeLeft)}s</span>
      </div>
      <Progress 
        value={progressValue} 
        className="h-2 bg-quiz-red-900"
      />
    </div>
  );
};

export default CountdownTimer;
