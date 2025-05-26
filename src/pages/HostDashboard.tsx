import { useQuiz } from "@/hooks/useQuiz";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Copy, Users, Trophy, Play, Gift, PlusCircle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import WinnerTestButton from "@/components/WinnerTestButton";

const HostDashboard = () => {
  const { 
    nickname,
    gameSession,
    startNewSession,
    teams,
    currentRound,
    startSpecificRound,
    MAX_ROUNDS
  } = useQuiz();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const actualMaxRounds = MAX_ROUNDS || 3;

  // Redirect if not host
  useEffect(() => {
    if (!nickname || nickname !== "HOST") {
      navigate("/");
    }
  }, [nickname, navigate]);

  // Auto-create session when host loads dashboard or if current session is lost
  useEffect(() => {
    const initializeSession = async () => {
      if (!gameSession?.id) {
        try {
          const newSessionId = await startNewSession();
          setSessionId(newSessionId);
        } catch (error) {
          console.error('Failed to create session:', error);
          toast({ title: "Error", description: "Failed to initialize a new session.", variant: "destructive" });
        }
      } else {
        setSessionId(gameSession.id);
      }
    };

    initializeSession();
  }, [gameSession, startNewSession, setSessionId]);

  const handleCopySessionCode = async () => {
    if (sessionId) {
      try {
        await navigator.clipboard.writeText(sessionId);
        setCopiedToClipboard(true);
        toast({
          title: "Session code copied!",
          description: "Share this code with players to join the game.",
          duration: 2000,
        });
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Please copy the code manually.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateNewSession = async () => {
    try {
      setSessionId(''); // Clear current session ID to trigger useEffect or show 'Generating...'
      const newSessionId = await startNewSession();
      setSessionId(newSessionId); // Update with the new session ID
      toast({ title: "New Session Created", description: `Session ID: ${newSessionId}`});
    } catch (error) {
      console.error("Failed to create new session:", error);
      toast({ title: "Error", description: "Could not create a new session.", variant: "destructive"});
    }
  };

  const handleStartSpecificRound = async (roundNumber: number) => {
    if (!sessionId || !startSpecificRound) return;
    
    try {
      await startSpecificRound(roundNumber);
      // Toast is handled within startSpecificRound in QuizContext
    } catch (error) {
      console.error(`Failed to start round ${roundNumber}:`, error);
      toast({
        title: `Failed to start round ${roundNumber}`,
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTotalPlayers = () => {
    if (!gameSession || !gameSession.players) return 0;
    // Filter out the host if the host is part of the players list and has an isHost flag
    return Object.values(gameSession.players).filter(p => !p.isHost).length;
  };
  
  const getTeamPlayers = (teamId: string) => {
    if (!gameSession) return [];
    return Object.values(gameSession.players || {})
      .filter(player => player.teamId === teamId && !player.isHost)
      .map(player => player.nickname);
  };

  const getRoundWinner = (round: number) => {
    if (!gameSession || !gameSession.roundWinners) return null;
    const winners = gameSession.roundWinners[round];
    if (!winners || winners.length === 0) return null;
    return winners.length === 1 ? winners[0] : `${winners.join(', ')} (Tie)`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">Host Dashboard</h1>
          {/* Permanent Scratch Card Link - Always Visible to Host */}
          <Button
            onClick={() => navigate("/scratch-card")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Gift className="h-4 w-4 mr-2" />
            Play Scratch Rewards
          </Button>
        </div>
      </header>

      <main className="container p-6 space-y-6">
        {/* Session Code Card */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Session Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 px-6 py-3 rounded-lg text-2xl font-mono tracking-wider">
                {sessionId || 'Generating...'}
              </div>
              <Button
                variant="outline"
                onClick={handleCopySessionCode}
                className={`transition-all ${copiedToClipboard ? 'bg-green-500 text-white' : 'hover:bg-white/20'}`}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedToClipboard ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-white/70 mb-4">
              Share this code with players to join the game
            </p>
            
            {/* Control Buttons */}
            <div className="flex flex-wrap gap-4 items-center">
              <Button 
                onClick={handleCreateNewSession}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create New Session
              </Button>

              <WinnerTestButton />

              {[...Array(actualMaxRounds)].map((_, index) => {
                const roundNumber = index + 1;
                const gs = gameSession; // shorthand
                
                // Updated logic for canStartThisRound as per user request
                const canStartThisRound = 
                  !!sessionId && 
                  getTotalPlayers() > 0 &&
                  gs?.status !== 'completed' &&
                  !(gs?.currentRound === roundNumber && gs?.currentState?.phase === 'answering');

                return (
                  <Button
                    key={`start-round-${roundNumber}`}
                    onClick={() => handleStartSpecificRound(roundNumber)}
                    disabled={!canStartThisRound}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 flex-grow sm:flex-grow-0"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Round {roundNumber}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Player Overview */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              Players ({getTotalPlayers()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {teams.map((team) => {
                const teamPlayers = getTeamPlayers(team.id);
                return (
                  <div key={team.id} className="bg-white/5 rounded-lg p-4">
                    <div className={`w-8 h-8 ${team.color} rounded-full mb-2`}></div>
                    <h3 className="font-semibold text-white mb-2">{team.name}</h3>
                    <p className="text-sm text-white/70 mb-2">
                      {teamPlayers.length} / {team.maxPlayers} players
                    </p>
                    <div className="space-y-1">
                      {teamPlayers.map((playerName) => (
                        <div key={playerName} className="text-sm text-white/80">
                          {playerName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Round Results - Enhanced with real-time winner display */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Round Results & Winners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((round) => {
                const winner = getRoundWinner(round);
                const isCompleted = winner !== null;
                const isCurrentRound = round === currentRound;
                
                return (
                  <div key={round} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border-l-4 border-quiz-red-500">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        isCompleted ? 'bg-green-600' : isCurrentRound ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}>
                        {round}
                      </div>
                      <span className="font-medium text-lg">Round {round}</span>
                    </div>
                    <div className="text-right">
                      {isCompleted ? (
                        <div>
                          <div className="text-green-400 font-bold text-lg">🏆 WINNER</div>
                          <div className="text-white font-semibold">{winner}</div>
                        </div>
                      ) : isCurrentRound ? (
                        <div className="text-yellow-400 font-semibold">
                          📍 In Progress
                        </div>
                      ) : (
                        <div className="text-white/50">
                          ⏳ Pending
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {gameSession && gameSession.roundWinners && Object.keys(gameSession.roundWinners).length > 0 && (
              <div className="mt-6 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                <h4 className="text-green-400 font-bold mb-2">🎉 Completed Rounds Summary</h4>
                <div className="space-y-2">
                  {Object.entries(gameSession.roundWinners).map(([round, winners]) => (
                    <div key={round} className="flex justify-between items-center">
                      <span className="text-white/80">Round {round}:</span>
                      <span className="text-green-400 font-semibold">
                        {Array.isArray(winners) ? winners.join(', ') : winners}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HostDashboard;
