import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ScratchCard = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/host-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 text-white"> {/* Changed background */}
      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center mx-auto">
          <h1 className="text-2xl font-bold">Scratch Card Rewards</h1>
          <Button
            onClick={handleBackToDashboard}
            variant="outline"
            className="bg-transparent border-white text-white hover:bg-white/20"
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container p-6 flex items-center justify-center min-h-[calc(100vh-100px)] mx-auto"> {/* Adjusted min-height */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center max-w-2xl w-full">
          <h2 className="text-3xl font-bold mb-6">Access the Scratch Card Game!</h2>
          <p className="text-lg text-white/80 mb-8">
            The interactive scratch card experience has been moved. Click the link below to reveal your rewards!
          </p>
          
          <a
            href="https://quiz-red-ready.vercel.app/scratch-card"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl transition-colors duration-300"
          >
            Go to Scratch Card Page
          </a>

          <div className="mt-8 text-sm text-white/60">
            You will be redirected to the live version of the scratch card game.
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScratchCard;
