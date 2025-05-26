
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    jQuery: any;
    $: any;
  }
}

const ScratchCard = () => {
  const navigate = useNavigate();
  const scratchRef1 = useRef<HTMLDivElement>(null);
  const scratchRef2 = useRef<HTMLDivElement>(null);
  const scratchRef3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load jQuery and wScratchPad
    const loadScripts = async () => {
      // Load jQuery
      if (!window.jQuery) {
        const jqueryScript = document.createElement('script');
        jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
        jqueryScript.onload = () => {
          // Load wScratchPad after jQuery
          const scratchScript = document.createElement('script');
          scratchScript.src = 'https://cdn.jsdelivr.net/npm/wscratchpad@1.0.0/dist/wscratchpad.min.js';
          scratchScript.onload = () => {
            initializeScratchCards();
          };
          document.head.appendChild(scratchScript);
        };
        document.head.appendChild(jqueryScript);
      } else {
        initializeScratchCards();
      }
    };

    const initializeScratchCards = () => {
      const $ = window.jQuery;
      
      if (scratchRef1.current) {
        $(scratchRef1.current).wScratchPad({
          size: 5,
          bg: '#cacaca',
          fg: '#6a994e',
          realtime: true,
          scratchMove: function(e: any, percent: number) {
            if (percent > 50) {
              $(scratchRef1.current).find('.scratch-content').show();
            }
          }
        });
      }

      if (scratchRef2.current) {
        $(scratchRef2.current).wScratchPad({
          size: 5,
          bg: '#cacaca',
          fg: '#bc4749',
          realtime: true,
          scratchMove: function(e: any, percent: number) {
            if (percent > 50) {
              $(scratchRef2.current).find('.scratch-content').show();
            }
          }
        });
      }

      if (scratchRef3.current) {
        $(scratchRef3.current).wScratchPad({
          size: 5,
          bg: '#cacaca',
          fg: '#6a994e',
          realtime: true,
          scratchMove: function(e: any, percent: number) {
            if (percent > 50) {
              $(scratchRef3.current).find('.scratch-content').show();
            }
          }
        });
      }
    };

    loadScripts();

    return () => {
      // Cleanup scripts if needed
    };
  }, []);

  const handleBackToDashboard = () => {
    navigate("/host-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
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

      <main className="container p-6 flex items-center justify-center min-h-[80vh]">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center max-w-4xl w-full">
          <h2 className="text-3xl font-bold mb-6">Scratch to Reveal Your Rewards!</h2>
          <p className="text-lg text-white/80 mb-8">
            Scratch the cards below to see what rewards await the winning teams!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Scratch Card 1 */}
            <div className="relative">
              <h3 className="text-lg font-semibold mb-4">Team Winner Reward</h3>
              <div 
                ref={scratchRef1}
                className="w-64 h-48 mx-auto rounded-lg relative overflow-hidden cursor-pointer"
                style={{ background: '#cacaca' }}
              >
                <div 
                  className="scratch-content absolute inset-0 flex items-center justify-center p-4 text-center bg-green-600 text-white font-bold text-sm hidden"
                  style={{ display: 'none' }}
                >
                  🎉 You can log out at 1 PM! 🎉
                </div>
              </div>
            </div>

            {/* Scratch Card 2 */}
            <div className="relative">
              <h3 className="text-lg font-semibold mb-4">Participation Reward</h3>
              <div 
                ref={scratchRef2}
                className="w-64 h-48 mx-auto rounded-lg relative overflow-hidden cursor-pointer"
                style={{ background: '#cacaca' }}
              >
                <div 
                  className="scratch-content absolute inset-0 flex items-center justify-center p-4 text-center bg-red-600 text-white font-bold text-sm hidden"
                  style={{ display: 'none' }}
                >
                  🍕 Free lunch voucher! 🍕
                </div>
              </div>
            </div>

            {/* Scratch Card 3 */}
            <div className="relative">
              <h3 className="text-lg font-semibold mb-4">Special Bonus</h3>
              <div 
                ref={scratchRef3}
                className="w-64 h-48 mx-auto rounded-lg relative overflow-hidden cursor-pointer"
                style={{ background: '#cacaca' }}
              >
                <div 
                  className="scratch-content absolute inset-0 flex items-center justify-center p-4 text-center bg-green-600 text-white font-bold text-sm hidden"
                  style={{ display: 'none' }}
                >
                  ☕ Free coffee for a week! ☕
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-white/60">
            Scratch each card by moving your mouse or finger across the surface
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScratchCard;
