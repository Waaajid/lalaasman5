import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Info, Users, Target, Trophy } from "lucide-react";

const Instructions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      <header className="p-4 border-b border-white/10">
        <div className="container">
          <h1 className="text-2xl font-bold">Game Instructions</h1>
        </div>
      </header>

      <main className="container p-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Main Message */}
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="h-6 w-6" />
                Important: This is NOT About Right or Wrong!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-lg">
                <p className="text-yellow-400 font-semibold text-xl">
                  This is not about correct or incorrect answers.
                </p>
                <p className="text-white text-xl font-medium">
                  You win by matching your answers with your team's answers.
                </p>
                <p className="text-white/80">
                  The goal is to think like your teammates and give the same responses they would give!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How to Play */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-white/90">
                  • Think about how your teammates would answer
                </p>
                <p className="text-white/90">
                  • Consider common knowledge within your team
                </p>
                <p className="text-white/90">
                  • Match their thinking patterns
                </p>
                <p className="text-white/90">
                  • Communication and shared understanding is key
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Game Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-white/90">
                  • 3 rounds with 4 questions each
                </p>
                <p className="text-white/90">
                  • 12 seconds to answer each question
                </p>
                <p className="text-white/90">
                  • Teams win rounds by having the most matching answers
                </p>
                <p className="text-white/90">
                  • Winners get to play the scratch card game!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Winning Strategy */}
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Winning Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">🤔</div>
                  <h3 className="font-semibold mb-2">Think Together</h3>
                  <p className="text-sm text-white/80">
                    Consider what your team members are likely thinking
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-semibold mb-2">Match Answers</h3>
                  <p className="text-sm text-white/80">
                    The more team members who give the same answer, the better
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🏆</div>
                  <h3 className="font-semibold mb-2">Win Rounds</h3>
                  <p className="text-sm text-white/80">
                    Beat other teams by having the most matching answers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="text-center">
            <Button
              onClick={() => navigate(-1)} // Changed to navigate back
              className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-medium px-8 py-3"
            >
              Back
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Instructions;
