import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// This component will show a typing animation and then reveal the formatted content
export const AnimatedAIContent = ({ content }: { content: string }) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  // Create a plain-text version of the content for animation
  const plainText = React.useMemo(() => {
    // Remove markdown characters for cleaner animation
    return content.replace(/[*_#`[\]()]/g, "");
  }, [content]);

  // Reset animation when content changes
  useEffect(() => {
    setAnimationComplete(false);
  }, [content]);

  return (
    <AnimatePresence mode="wait">
      {!animationComplete ? (
        <motion.div
          key="animating"
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <TextGenerateEffect
            words={plainText}
            onAnimationComplete={() => setAnimationComplete(true)}
          />
        </motion.div>
      ) : (
        <motion.div
          key="formatted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// This component handles text that isn't markdown
export const AnimatedAIText = ({ text }: { text: string }) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  // Reset animation when text changes
  useEffect(() => {
    setAnimationComplete(false);
  }, [text]);

  return (
    <AnimatePresence mode="wait">
      {!animationComplete ? (
        <motion.div
          key="animating"
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <TextGenerateEffect
            words={text}
            onAnimationComplete={() => setAnimationComplete(true)}
          />
        </motion.div>
      ) : (
        <motion.div
          key="formatted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.2 } }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
