import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    jQuery: unknown; // Changed from any
    $: unknown;      // Changed from any
  }
}

const ScratchCard = () => {
  const navigate = useNavigate();
  const scratchRef1 = useRef<HTMLDivElement>(null);
  const scratchRef2 = useRef<HTMLDivElement>(null);
  const scratchRef3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadScripts = async () => {
      if (!window.jQuery) {
        const jqueryScript = document.createElement('script');
        jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
        jqueryScript.onload = () => {
          const scratchScript = document.createElement('script');
          scratchScript.src = 'https://cdn.jsdelivr.net/npm/wscratchpad@1.0.0/dist/wscratchpad.min.js';
          scratchScript.onload = () => {
            initializeScratchCards();
          };
          document.head.appendChild(scratchScript);
        };
        document.head.appendChild(jqueryScript);
      } else {
        // jQuery is already loaded, check for wScratchPad
        if (typeof (window.$ as any)?.fn?.wScratchPad !== 'function') {
          const scratchScript = document.createElement('script');
          scratchScript.src = 'https://cdn.jsdelivr.net/npm/wscratchpad@1.0.0/dist/wscratchpad.min.js';
          scratchScript.onload = () => {
            initializeScratchCards();
          };
          document.head.appendChild(scratchScript);
        } else {
          initializeScratchCards();
        }
      }
    };

    const initializeScratchCards = () => {
      // Ensure jQuery and wScratchPad are loaded
      if (typeof window.$ !== 'function' || typeof (window.$ as any)?.fn?.wScratchPad !== 'function') {
        console.error("jQuery or wScratchPad not loaded properly.");
        // Optionally, try loading again or show an error to the user
        // For now, we'll just return to prevent errors.
        return;
      }
      
      const $ = window.$ as any; // Cast to any for jQuery plugin usage. 
                                // For better type safety, consider installing @types/jquery.

      if (scratchRef1.current) {
        $(scratchRef1.current).wScratchPad({
          size: 5, // Brush size
          bg: '#cacaca', // Background of the scratch card (revealed content area color if fg is an image)
          fg: '#6a994e', // Foreground image or color (the scratchable layer)
          realtime: true,
          scratchMove: function(_e: unknown, percent: number) { // Changed e: any to _e: unknown
            if (percent > 50) {
              // Show the content div when 50% is scratched
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
          scratchMove: function(_e: unknown, percent: number) { // Changed e: any to _e: unknown
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
          scratchMove: function(_e: unknown, percent: number) { // Changed e: any to _e: unknown
            if (percent > 50) {
              $(scratchRef3.current).find('.scratch-content').show();
            }
          }
        });
      }
    };

    loadScripts();

    return () => {
      // Cleanup logic: Remove dynamically added scripts and wScratchPad instances
      const scripts = document.querySelectorAll('script[src*="jquery-3.6.0.min.js"], script[src*="wscratchpad.min.js"]');
      scripts.forEach(s => {
        if (document.head.contains(s)) {
          document.head.removeChild(s);
        }
      });

      // If wScratchPad has a destroy method, call it here
      // This depends on the plugin's API. Example:
      // const $ = window.$ as any;
      // if ($ && typeof $.fn.wScratchPad === 'function') {
      //   [scratchRef1, scratchRef2, scratchRef3].forEach(ref => {
      //     if (ref.current && $(ref.current).data('wScratchPad')) {
      //       try {
      //         $(ref.current).wScratchPad('destroy'); // Or 'clear' or similar, check plugin docs
      //       } catch (error) {
      //         console.warn("Could not destroy wScratchPad instance:", error);
      //       }
      //     }
      //   });
      // }
    };
  }, []);

  const handleBackToDashboard = () => {
    navigate("/host-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      <header className="p-4 border-b border-white/10">
        <div className="container mx-auto flex justify-between items-center">
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

      <main className="container mx-auto p-6 flex items-center justify-center min-h-[calc(100vh-100px)]"> {/* Adjust min-height if header size changes */}
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
                className="w-full max-w-xs h-48 mx-auto rounded-lg relative overflow-hidden cursor-pointer shadow-lg"
                // The wScratchPad plugin will take over the background/foreground
              >
                <div 
                  className="scratch-content absolute inset-0 flex items-center justify-center p-4 text-center bg-green-600 text-white font-bold text-sm"
                  style={{ display: 'none' }} // Initially hidden, shown by wScratchPad logic
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
                className="w-full max-w-xs h-48 mx-auto rounded-lg relative overflow-hidden cursor-pointer shadow-lg"
              >
                <div 
                  className="scratch-content absolute inset-0 flex items-center justify-center p-4 text-center bg-red-600 text-white font-bold text-sm"
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
                className="w-full max-w-xs h-48 mx-auto rounded-lg relative overflow-hidden cursor-pointer shadow-lg"
              >
                <div 
                  className="scratch-content absolute inset-0 flex items-center justify-center p-4 text-center bg-green-600 text-white font-bold text-sm"
                  style={{ display: 'none' }}
                >
                  ☕ Free coffee for a week! ☕
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-white/60">
            Scratch each card by moving your mouse or finger across the surface.
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScratchCard;
