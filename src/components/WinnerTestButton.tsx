import { Button } from "./ui/button";
import { useQuiz } from "@/hooks/useQuiz";
import { testWinnerDetermination } from "@/utils/winnerTest";
import { toast } from "@/hooks/use-toast";

const WinnerTestButton = () => {
  const { gameSession, isSessionHost } = useQuiz();

  if (!isSessionHost) return null;

  const handleTestWinner = async () => {
    if (!gameSession?.id) {
      toast({
        title: "No active session",
        description: "Please start a session before testing",
        variant: "destructive",
      });
      return;
    }

    const currentRound = gameSession.currentRound || 1;
    
    try {
      await testWinnerDetermination(gameSession.id, currentRound);
      toast({
        title: "Test data added",
        description: "Simulated players with matching answers added to the current round.",
      });
    } catch (error) {
      console.error("Test error:", error);
      toast({
        title: "Test failed",
        description: "Could not add test data. See console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleTestWinner}
      variant="secondary"
      className="ml-2"
    >
      Test Winner Logic
    </Button>
  );
};

export default WinnerTestButton;
