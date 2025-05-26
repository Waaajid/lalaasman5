
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "@/hooks/useQuiz";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [inputValue, setInputValue] = useState("");
  const { setNickname } = useQuiz();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContinue = () => {
    if (!inputValue.trim()) {
      toast({
        title: "Nickname required",
        description: "Please enter a nickname to continue",
        variant: "destructive",
      });
      return;
    }
    
    const trimmedInput = inputValue.trim();
    
    // Check if user entered HOST (no visible hint about this)
    if (trimmedInput.toUpperCase() === "HOST") {
      setNickname("HOST");
      navigate("/host-dashboard");
      return;
    }
    
    setNickname(trimmedInput);
    navigate("/team-selection");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleContinue();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quiz-red-700 to-quiz-red-900">
      <div className="w-full max-w-md px-8 py-12 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">Quiz Game</h1>
            <p className="text-quiz-red-100">Enter a nickname to get started</p>
          </div>
          
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Your nickname"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:border-white"
              maxLength={20}
            />
            
            <Button 
              onClick={handleContinue}
              className="w-full bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-medium transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.97]"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
