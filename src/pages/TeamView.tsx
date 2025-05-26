
import { useQuiz } from "@/hooks/useQuiz";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Info, Users } from "lucide-react";
import LiveTeamMembers from "@/components/LiveTeamMembers";

const TeamView = () => {
  const { 
    nickname, 
    selectedTeam,
    gameSession,
    sessionError,
    isSessionHost
  } = useQuiz();
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);

  // Redirect to home if no nickname is set
  useEffect(() => {
    if (!nickname) {
      navigate("/");
    }
  }, [nickname, navigate]);

  // Redirect to team selection if no team selected
  useEffect(() => {
    if (!selectedTeam) {
      navigate("/team-selection");
    }
  }, [selectedTeam, navigate]);

  // Monitor game session for start signal
  useEffect(() => {
    if (gameSession) {
      const started = gameSession.status === 'started' || gameSession.status === 'in-progress';
      setGameStarted(started);
      
      if (started) {
        navigate("/quiz");
      }
    }
  }, [gameSession, navigate]);

  const handleViewInstructions = () => {
    navigate("/instructions");
  };

  if (!selectedTeam) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
          <h2 className="font-semibold">Quiz Game - Team View</h2>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleViewInstructions}
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/20"
            >
              <Info className="h-4 w-4 mr-2" />
              How to Play
            </Button>
            <div className="bg-white/20 px-4 py-2 rounded-full">
              <span className="font-medium">Playing as: </span>
              <span className="font-bold">{nickname}</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">You've Joined a Team!</h1>
            <div className={`inline-flex items-center gap-3 ${selectedTeam.color} px-6 py-3 rounded-full mb-6`}>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {selectedTeam.name.split(' ')[1][0]}
                </span>
              </div>
              <span className="text-xl font-bold text-white">{selectedTeam.name}</span>
            </div>
          </div>

          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-white/80">
                  Here are the players who have joined {selectedTeam.name}:
                </p>
                <LiveTeamMembers 
                  teamId={selectedTeam.id}
                  teamName={selectedTeam.name}
                  teamColor={selectedTeam.color}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              {gameStarted ? (
                <div className="space-y-4">
                  <div className="text-2xl">🚀</div>
                  <h3 className="text-xl font-bold text-green-400">Game Started!</h3>
                  <p className="text-white/80">Redirecting to quiz...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl">⏳</div>
                  <h3 className="text-xl font-bold text-yellow-400">Waiting for host to start the game...</h3>
                  <p className="text-white/80">
                    The game will begin once the host starts it. Stay on this page!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeamView;
