import { useQuiz } from "@/hooks/useQuiz";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Copy, Users, Trophy, Play, Gift, PlusCircle, RefreshCw, Sparkles } from "lucide-react"; // Added Sparkles
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white"> {/* Updated background */}
      <header className="p-4 border-b border-white/10 sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md"> {/* Made header sticky */}
        <div className="container flex justify-between items-center mx-auto"> {/* Centered container */}
          <h1 className="text-3xl font-bold tracking-tight">Host Dashboard</h1> {/* Enhanced title */}
          {/* Updated Scratch Card Link Button */}
          <Button
            onClick={() => window.open("https://lalaasman5.vercel.app/host-dashboard", "_blank")}
            className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5" // Enhanced styling
          >
            <Sparkles className="h-5 w-5 mr-2 text-yellow-700" /> {/* Using Sparkles icon */}
            Scratch and Reveal
          </Button>
        </div>
      </header>

      <main className="container p-6 space-y-8 mx-auto"> {/* Centered container & increased spacing */}
        {/* Session Code Card - Enhanced Look */}
        <Card className="bg-slate-800/60 border-slate-700 shadow-xl rounded-xl overflow-hidden"> {/* Enhanced styling */}
          <CardHeader className="bg-slate-700/50 p-4"> {/* Header styling */}
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-sky-400" /> {/* Icon styling */}
              Game Session
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6"> {/* Increased padding */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4"> {/* Responsive layout & gap */}
              <div className="bg-slate-700 px-6 py-4 rounded-lg text-3xl font-mono tracking-wider text-sky-300 shadow-inner w-full sm:w-auto text-center"> {/* Enhanced styling */}
                {sessionId || 'Generating...'}
              </div>
              <Button
                variant="outline"
                onClick={handleCopySessionCode}
                className={`transition-all duration-300 ease-in-out text-base px-6 py-3 rounded-lg shadow-md hover:shadow-lg border-sky-500 text-sky-300 hover:bg-sky-500 hover:text-slate-900 w-full sm:w-auto ${copiedToClipboard ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' : ''}`} // Enhanced styling
              >
                <Copy className="h-5 w-5 mr-2" />
                {copiedToClipboard ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>
            <p className="text-slate-400 mb-6 text-center sm:text-left"> {/* Adjusted text color and alignment */}
              Share this code with players to join. Total Players: <span className="font-bold text-sky-300">{getTotalPlayers()}</span>
            </p>
            
            {/* Control Buttons - Enhanced Look */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center"> {/* Responsive grid */}
              <Button 
                onClick={handleCreateNewSession}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 col-span-full sm:col-span-1" // Enhanced styling & span
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                New Session
              </Button>

              <WinnerTestButton />

              {[...Array(actualMaxRounds)].map((_, index) => {
                const roundNumber = index + 1;
                const gs = gameSession;
                
                const canStartThisRound = 
                  !!sessionId && 
                  getTotalPlayers() > 0 &&
                  gs?.status !== 'completed' &&
                  !(gs?.currentRound === roundNumber && gs?.currentState?.phase === 'answering');
                
                const isRoundActive = gs?.currentRound === roundNumber && (gs?.currentState?.phase === 'answering' || gs?.currentState?.phase === 'showing-results');
                // Corrected: Ensure isRoundCompleted is a boolean
                const isRoundCompleted = !!(gs?.roundWinners && gs.roundWinners[roundNumber] && gs.roundWinners[roundNumber].length > 0);

                return (
                  <Button
                    key={`start-round-${roundNumber}`}
                    onClick={() => handleStartSpecificRound(roundNumber)}
                    disabled={!canStartThisRound || isRoundActive || isRoundCompleted}
                    className={`font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 flex-grow ${
                      isRoundCompleted ? 'bg-slate-500 cursor-not-allowed' : 
                      isRoundActive ? 'bg-amber-500 text-amber-900 cursor-not-allowed' : 
                      'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } disabled:opacity-70 disabled:cursor-not-allowed`} // Enhanced styling & conditions
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {isRoundCompleted ? `Round ${roundNumber} Done` : isRoundActive ? `Round ${roundNumber} Active` : `Start Round ${roundNumber}`}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Player Overview - Enhanced Look */}
        <Card className="bg-slate-800/60 border-slate-700 shadow-xl rounded-xl overflow-hidden"> {/* Enhanced styling */}
          <CardHeader className="bg-slate-700/50 p-4"> {/* Header styling */}
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-lime-400" /> {/* Icon styling */}
              Team Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6"> {/* Increased padding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Responsive grid & gap */}
              {teams.map((team) => {
                const teamPlayers = getTeamPlayers(team.id);
                return (
                  <div key={team.id} className="bg-slate-700/70 rounded-lg p-5 shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1"> {/* Enhanced styling & hover effect */}
                    <div className="flex items-center mb-3">
                      <div className={`w-10 h-10 ${team.color} rounded-full mr-3 shadow-md`}></div> {/* Larger team color indicator */}
                      <h3 className="font-bold text-lg text-white truncate">{team.name}</h3> {/* Bolded and larger team name */}
                    </div>
                    <p className="text-sm text-slate-300 mb-3"> {/* Adjusted text color */}
                      Players: <span className="font-semibold text-lime-300">{teamPlayers.length}</span> / {team.maxPlayers}
                    </p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2"> {/* Max height and scroll for player list */}
                      {teamPlayers.length > 0 ? teamPlayers.map((playerName) => (
                        <div key={playerName} className="text-sm text-slate-200 bg-slate-600/50 px-2 py-1 rounded-md truncate"> {/* Player name styling */}
                          {playerName}
                        </div>
                      )) : <p className="text-xs text-slate-400 italic">No players yet</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Round Results - Enhanced with real-time winner display and improved look */}
        <Card className="bg-slate-800/60 border-slate-700 shadow-xl rounded-xl overflow-hidden"> {/* Enhanced styling */}
          <CardHeader className="bg-slate-700/50 p-4"> {/* Header styling */}
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" /> {/* Icon styling */}
              Round Winners & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6"> {/* Increased padding & spacing */}
            {[...Array(actualMaxRounds)].map((_, index) => { // Use actualMaxRounds
              const round = index + 1;
              const winnerData = gameSession?.roundWinners ? gameSession.roundWinners[round] : null;
              const winner = winnerData && winnerData.length > 0 ? winnerData.join(', ') : null;
              
              const isCompleted = !!winner;
              const isCurrentRound = gameSession?.currentRound === round && gameSession?.currentState?.phase !== 'round-end' && !isCompleted;
              const isPending = !isCompleted && !isCurrentRound && (gameSession?.currentRound || 0) < round;
              let statusText = "⏳ Pending";
              let statusColor = "bg-slate-600 text-slate-300";
              let borderColor = "border-slate-500";
              let winnerComponent = null;

              if (isCompleted) {
                statusText = "✅ Completed";
                statusColor = "bg-green-600/30 text-green-300";
                borderColor = "border-green-500";
                winnerComponent = (
                  <div className="mt-1">
                    <div className="text-sm text-yellow-300">WINNER:</div>
                    <div className="text-lg font-bold text-yellow-400 truncate">{winner}</div>
                  </div>
                );
              } else if (isCurrentRound) {
                statusText = `🔵 In Progress (Q: ${ (gameSession?.currentQuestionIndex ?? 0) + 1 })`;
                statusColor = "bg-sky-600/30 text-sky-300";
                borderColor = "border-sky-500";
              } else if ((gameSession?.currentRound || 0) > round && !isCompleted) {
                statusText = "🟡 Awaiting Results"; // Past round, but no winner declared yet (edge case)
                statusColor = "bg-amber-600/30 text-amber-300";
                borderColor = "border-amber-500";
              }
              
              return (
                <div key={round} className={`p-4 rounded-lg shadow-md border-l-4 transition-all duration-300 ease-in-out ${borderColor} ${isCompleted ? 'bg-slate-700/50' : 'bg-slate-700/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${
                        isCompleted ? 'bg-green-500 text-white' : isCurrentRound ? 'bg-sky-500 text-white animate-pulse' : 'bg-slate-500 text-slate-300'
                      }`}>
                        {round}
                      </div>
                      <span className="font-semibold text-xl text-white">Round {round}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                      {statusText}
                    </div>
                  </div>
                  {winnerComponent}
                </div>
              );
            })}
            
            {/* Overall Game Status (Optional: if you want a summary) */}
            {gameSession?.status === 'completed' && (
              <div className="mt-6 p-5 bg-green-700/30 rounded-lg border border-green-500/50 text-center shadow-lg">
                <h4 className="text-2xl font-bold text-green-300 mb-2">🎉 Quiz Completed! 🎉</h4>
                <p className="text-green-200">All rounds are finished. Check individual round winners above.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HostDashboard;
