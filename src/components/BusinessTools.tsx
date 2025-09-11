"use client";
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

import { Server } from "lucide-react";
import { INGRESAssistant } from "./INGRESAssistant";
import { ApiKeyProvider } from "./ApiKeyContext";

// Import your main tool component
// --- Lamp Effect Component ---
const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex min-h-[48rem] flex-col items-center justify-center overflow-hidden bg-slate-950 w-full z-0",
        className
      )}
    >
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0 ">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[30rem] bg-gradient-conic from-cyan-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute w-[100%] left-0 bg-slate-950 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-40 h-[100%] left-0 bg-slate-950 bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-cyan-500 text-white [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute w-40 h-[100%] right-0 bg-slate-950 bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-slate-950 h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-slate-950 blur-2xl"></div>
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-cyan-500 opacity-50 blur-3xl"></div>
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-cyan-400 blur-2xl"
        ></motion.div>
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-cyan-400 "
        ></motion.div>

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-slate-950 "></div>
      </div>

      <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
};

// --- Main Ingres Tools Component ---
export const BusinessTools = () => {
  // --- State to manage which tool is active in the toggle ---
  const [activeTool, setActiveTool] = useState("dba");

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: ["easeOut"] },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const tools = useMemo(
    () => [
      // { id: "dba", label: "AI DBA", icon: Server },
    ],
    []
  );

  const successStories = useMemo(
    () => [
      {
        name: "Amit Sharma",
        business: "Sharma Engineering",
        benefit: "80% Faster Queries",
        details:
          "The AI DBA identified slow queries and suggested indexes that drastically improved our app's performance.",
      },
      {
        name: "Priya Singh",
        business: "Singh Handicrafts",
        benefit: "99.9% Uptime",
        details:
          "Automated monitoring and alerts help us proactively manage our Ingres database, preventing downtime.",
      },
      {
        name: "Rajesh Patel",
        business: "Patel Steel Works",
        benefit: "50% Time Saved",
        details:
          "AI-powered automation for routine maintenance tasks freed up our DBAs to focus on strategic initiatives.",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* --- HERO SECTION WITH LAMP EFFECT --- */}
      <LampContainer>
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-5xl font-medium tracking-tight text-transparent md:text-7xl"
        >
          AI-Driven chatbot for INGRESS Portal
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
          className="mt-4 font-normal text-base text-slate-400 max-w-lg text-center mx-auto"
        >
An AI-powered chatbot assistant for monitoring and analyzing groundwater levels, seamlessly integrated with Ingress Database for real-time data insights.
        </motion.p>
      </LampContainer>

      {/* --- Overlapping Content Wrapper for a blended effect --- */}
      <div className="relative z-10 mt-[-14rem] rounded-t-3xl bg-slate-50 shadow-2xl">
        <div className="container mx-auto px-4 py-24 space-y-24">
          <section>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-12"
            >
              <motion.h2
                variants={fadeIn}
                className="text-3xl md:text-4xl font-bold"
              ></motion.h2>
              <motion.p
                variants={fadeIn}
                className="text-lg text-slate-600 mt-2"
              ></motion.p>
            </motion.div>

            {/* --- The Toggle UI --- */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex justify-center mb-8"
            >
              <div className="flex space-x-2 rounded-full bg-slate-200/80 p-1.5">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className="relative rounded-full px-4 sm:px-6 py-2.5 text-sm sm:text-base font-semibold transition-colors"
                  >
                    {activeTool === tool.id && (
                      <motion.div
                        layoutId="activeToolPill"
                        className="absolute inset-0 bg-white shadow-md"
                        style={{ borderRadius: 9999 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                        }}
                      />
                    )}
                    <span
                      className={`relative z-10 flex items-center gap-2 ${
                        activeTool === tool.id
                          ? "text-sky-600"
                          : "text-slate-600"
                      }`}
                    >
                      <tool.icon className="h-5 w-5" />
                      {tool.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* --- Conditionally render the active tool --- */}
            <div className="min-h-[600px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTool}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTool === "dba" && (
                    <ApiKeyProvider>
                      <INGRESAssistant />
                    </ApiKeyProvider>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
