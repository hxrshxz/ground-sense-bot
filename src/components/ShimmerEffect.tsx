import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, BrainCircuit } from "lucide-react"; // Using BrainCircuit for a more "thinking" vibe

// An array of phrases to cycle through, giving a sense of progress
const thinkingPhrases = [
  "Connecting to data source...",
  "Analyzing groundwater levels...",
  "Processing sensor data...",
  "Identifying patterns...",
  "Generating insights...",
];

// An array to define the shimmer lines, making them feel more random and generative
const shimmerLines = [
  { width: "95%", delay: 0 },
  { width: "100%", delay: 0.1 },
  { width: "90%", delay: 0.2 },
  { width: "75%", delay: 0.3 },
];

export const ShimmerEffect = () => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // This effect handles the cycling of the "thinking" phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % thinkingPhrases.length);
    }, 2000); // Change phrase every 2 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  // Framer Motion variants for the staggered animation of the shimmer lines
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Each child will animate 0.15s after the previous one
      },
    },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-start gap-4"
    >
      {/* Pulsing Bot Icon */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft"
      >
        <BrainCircuit className="w-5 h-5 text-white" />
      </motion.div>

      <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-sm border border-white/60 shadow-soft space-y-3 w-full max-w-lg overflow-hidden">
        {/* Generative Shimmer Lines */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2 overflow-hidden"
        >
          {shimmerLines.map((line, index) => (
            <motion.div
              key={index}
              variants={lineVariants}
              className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded animate-shimmer bg-[length:200%_100%]"
              style={{ width: line.width, animationDelay: `${line.delay}s` }}
            />
          ))}
        </motion.div>

        {/* Dynamic Thinking Indicator */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex space-x-1">
            <motion.div className="w-2 h-2 bg-primary/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="w-2 h-2 bg-primary/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }} />
            <motion.div className="w-2 h-2 bg-primary/60 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
          </div>

          <div className="text-sm text-slate-600 w-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentPhraseIndex}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="block"
              >
                {thinkingPhrases[currentPhraseIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};