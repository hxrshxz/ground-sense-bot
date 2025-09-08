import React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export const ShimmerEffect = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex items-start gap-4"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft">
        <Bot className="w-5 h-5 text-white"/>
      </div>
      <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-sm border border-white/60 shadow-soft space-y-3 w-full max-w-lg">
        {/* Shimmer lines */}
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded animate-shimmer bg-[length:200%_100%]"></div>
          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: '0.1s' }}></div>
          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded animate-shimmer bg-[length:200%_100%] w-3/4" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Typing indicator */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-sm text-slate-600">Analyzing groundwater data...</span>
        </div>
      </div>
    </motion.div>
  );
};