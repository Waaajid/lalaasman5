
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useQuiz } from "@/hooks/useQuiz";

interface LiveTeamMembersProps {
  teamId: string;
  teamName: string;
  teamColor: string;
}

const LiveTeamMembers = ({ teamId, teamName, teamColor }: LiveTeamMembersProps) => {
  const { gameSession } = useQuiz();
  const [teamMembers, setTeamMembers] = useState<string[]>([]);

  useEffect(() => {
    if (gameSession) {
      const members = Object.values(gameSession.players || {})
        .filter(player => player.teamId === teamId && !player.isHost)
        .map(player => player.nickname);
      
      setTeamMembers(members);
    }
  }, [gameSession, teamId]);

  if (teamMembers.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/5 border-white/10 mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team Members ({teamMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {teamMembers.map((member) => (
            <div key={member} className="text-sm text-white/80 flex items-center gap-2">
              <div className={`w-2 h-2 ${teamColor} rounded-full`}></div>
              {member}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTeamMembers;
