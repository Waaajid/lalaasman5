import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

interface Dice3DProps {
  value: number;
  isRolling: boolean;
  size?: 'sm' | 'md' | 'lg';
  onRollComplete?: () => void;
}

const Dice3D: React.FC<Dice3DProps> = ({ 
  value, 
  isRolling, 
  size = 'lg',
  onRollComplete 
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const dotPositions = [
    [], // 0 (not used)
    [5], // 1
    [1, 9], // 2
    [1, 5, 9], // 3
    [1, 3, 7, 9], // 4
    [1, 3, 5, 7, 9], // 5
    [1, 3, 4, 6, 7, 9] // 6
  ];

  const rollAnimation = {
    hidden: { 
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0 
    },
    rolling: {
      rotateX: [0, 360, 720, 1080],
      rotateY: [0, -360, -720, -1080],
      rotateZ: [0, 360, 720, 1080],
      transition: {
        duration: 2,
        ease: "easeOut",
        times: [0, 0.2, 0.5, 1]
      }
    }
  };

  return (
    <motion.div
      className={cn(
        "relative perspective-1000",
        sizeClasses[size]
      )}
      initial="hidden"
      animate={isRolling ? "rolling" : "hidden"}
      variants={rollAnimation}
      onAnimationComplete={onRollComplete}
    >
      <div className={cn(
        "w-full h-full relative transform-style-3d",
        "bg-white rounded-lg shadow-xl transition-transform duration-300",
        value === 6 && "golden-glow"
      )}>
        <div className="absolute grid grid-cols-3 grid-rows-3 gap-1 w-full h-full p-2">
          {[...Array(9)].map((_, index) => {
            const showDot = dotPositions[value]?.includes(index + 1);
            return (
              <div key={index} className="flex items-center justify-center">
                {showDot && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "rounded-full bg-quiz-red-600",
                      size === 'sm' ? 'w-2 h-2' : 'w-3 h-3',
                      value === 6 && "bg-yellow-500"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default Dice3D;
