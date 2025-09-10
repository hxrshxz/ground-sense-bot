"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  onAnimationComplete,
}: {
  words: string;
  className?: string;
  onAnimationComplete?: () => void; // This is the new callback prop
}) => {
  const [scope, animate] = useAnimate();
  let wordsArray = words.split(" ");
  
  useEffect(() => {
    const animateText = async () => {
      // Hide all spans initially
      await animate("span", { opacity: 0 }, { duration: 0 });
      // Animate spans to visible one by one
      await animate(
        "span",
        { opacity: 1 },
        {
          duration: 0.5, // Adjust duration of each word animation
          delay: stagger(0.1), // Adjust delay between words
        }
      );
      // --- FIX: Call the callback when animation is done ---
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    };
    animateText();
  }, [scope, animate, onAnimationComplete, words]); // Rerun animation if words change

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className="dark:text-white text-black opacity-0"
            >
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn("font-normal", className)}>
      <div className="mt-4">
        <div className=" dark:text-white text-black leading-snug tracking-wide">
          {renderWords()}
        </div>
      </div>
    </div>
  );
};