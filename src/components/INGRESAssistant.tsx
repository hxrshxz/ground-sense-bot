"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView, useSpring } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BlockAssessmentCard } from "./BlockAssessmentCard";
import { groundwaterDB } from "../data/groundWaterData";
import {
  Search,
  Camera,
  Bot,
  User,
  X,
  Mic,
  Languages,
  Bell,
  Server,
  Info,
  Lightbulb,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Database,
  TrendingUp,
  BarChartHorizontal,
  ArrowDown,
  ArrowUp,
  CloudRain,
  Satellite,
  BrainCircuit,
  VolumeX,
  Volume2,
} from "lucide-react";
import { GroundwaterComparisonChart } from "./GroundWaterComponent";
import AIResponseRenderer from "./ai-components/AIResponseRenderer";
import AIResponseRendererV2 from "./ai-components/AIResponseRendererV2";
import GroundwaterAnalysisRenderer from "./ai-components/GroundwaterAnalysisRenderer";
const StateDeepDiveCard = React.lazy(() => import("./cards/StateDeepDiveCard"));
import { PUNJAB_PROFILE } from "@/data/stateGroundwaterData";
import { getAIResponse } from "../services/aiResponseServiceV2";
import { GeminiApiService } from "../services/geminiApi";
import {
  MAP_ANALYSIS_PROMPT,
  SAMPLE_MAP_ANALYSIS_RESPONSE,
} from "../data/mapAnalysisPrompt";
import { MapAnalysisDialog } from "./MapAnalysisDialog";
import { useApiKey } from "./ApiKeyContext";
import { pickProfileByText } from "@/lib/stateDetection";
import { STATE_PROFILE_MAP } from "@/data/stateGroundwaterData";
const GroundwaterExtractionVisualization = React.lazy(
  () => import("./GroundwaterExtractionVisualization")
);
// Prefer root-level versions for now (avoid duplicate definitions under /cards if both exist)
// Removed individual thematic cards in favor of unified StateDeepDiveCard experience
// (CropRecommendationCard, PolicyRechargeCard, RainfallImpactCard deprecated inline)
const StateComparisonCard = React.lazy(
  () => import("./cards/StateComparisonCard")
);

//================================================================================
// --- LISTENING INDICATOR COMPONENT ---
//================================================================================
const ListeningIndicator = () => {
  return (
    <div className="fixed bottom-24 right-24 z-50 flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping"></div>
        <div className="relative rounded-full bg-green-600 p-4 flex items-center justify-center shadow-lg">
          <Mic className="h-6 w-6 text-white" />
        </div>
      </div>
      <span className="ml-3 font-medium text-green-600 bg-white/80 px-3 py-1 rounded-full shadow-sm">
        Listening...
      </span>
    </div>
  );
};

//================================================================================
// --- SHIMMER EFFECT COMPONENT ---
//================================================================================
const GeminiShimmerEffect = () => {
  const thinkingPhrases = [
    "Connecting to data source...",
    "Analyzing groundwater levels...",
    "Processing sensor data...",
    "Identifying patterns...",
    "Generating insights...",
  ];
  const shimmerLines = [
    { width: "95%", delay: 0 },
    { width: "100%", delay: 0.1 },
    { width: "90%", delay: 0.2 },
    { width: "75%", delay: 0.3 },
  ];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex(
        (prevIndex) => (prevIndex + 1) % thinkingPhrases.length
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };
  const lineVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-start gap-3 max-w-2xl mr-auto"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
        className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft"
      >
        <BrainCircuit className="w-5 h-5 text-white" />
      </motion.div>
      <div className="p-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/60 shadow-soft space-y-3 w-full max-w-md">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {shimmerLines.map((line, index) => (
            <motion.div
              key={index}
              variants={lineVariants}
              className="h-3 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded animate-shimmer bg-[length:200%_100%]"
              style={{ width: line.width, animationDelay: `${line.delay}s` }}
            />
          ))}
        </motion.div>
        <div className="flex items-center gap-2 pt-1">
          <div className="flex space-x-1">
            <motion.div
              className="w-1.5 h-1.5 bg-purple-400/60 rounded-full"
              animate={{ y: [0, -2, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-purple-400/60 rounded-full"
              animate={{ y: [0, -2, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.1,
              }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-purple-400/60 rounded-full"
              animate={{ y: [0, -2, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2,
              }}
            />
          </div>
          <div className="text-xs text-slate-600 w-full overflow-hidden">
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

//================================================================================
// --- INGRES ASSISTANT COMPONENT AND ITS HELPERS ---
//================================================================================

// --- Custom Hook for Voice Recognition ---
const useSpeechRecognition = ({ lang }: { lang: string }) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const hasRecognitionSupport = useMemo(
    () =>
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window),
    []
  );

  useEffect(() => {
    if (!hasRecognitionSupport) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal)
          finalTranscript += event.results[i][0].transcript;
      }
      setText(finalTranscript);
    };
    recognition.onend = () => setIsListening(false);
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [lang, hasRecognitionSupport]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setText("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  return {
    text,
    startListening,
    stopListening,
    isListening,
    hasRecognitionSupport,
  };
};

// --- Toast Notification Component ---
const Toast = ({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: string;
  onDismiss: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-slate-800";
  const Icon =
    type === "success" ? CheckCircle : type === "error" ? AlertTriangle : Info;
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-4 rounded-lg shadow-2xl text-white ${bgColor}`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-lg font-medium">{message}</span>
    </motion.div>
  );
};

// --- HELPER UI COMPONENTS ---
// const NotificationBell = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       )
//         setIsOpen(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <div ref={dropdownRef} className="relative">
//       <Button
//         variant="ghost"
//         size="icon"
//         onClick={() => setIsOpen((prev) => !prev)}
//         className="rounded-full hover:bg-slate-200/70 relative"
//       >
//         <Bell className="h-5 w-5 text-slate-600" />
//         <span className="absolute top-1 right-1.5 flex h-2 w-2">
//           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
//           <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
//         </span>
//       </Button>
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             className="absolute top-full z-20 mt-2 w-80 right-0 origin-top-right rounded-xl border border-slate-200 bg-white/90 p-2 shadow-xl backdrop-blur-sm"
//           >
//             <div className="font-semibold text-sm text-slate-800 p-2">
//               Proactive Alerts
//             </div>
//             <div className="w-full text-left p-3 rounded-lg hover:bg-slate-100">
//               <p className="font-medium text-sm text-slate-700">
//                 Status Change: Delhi Block
//               </p>
//               <p className="text-xs text-slate-500">
//                 This block has shifted from 'Critical' to 'Over-Exploited'.
//               </p>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// --- Proactive Insight Card Component ---
const ProactiveInsightCard = () => {
  const criticalShifts = 1;
  const regionsMonitored = Object.keys(groundwaterDB).length;
  const delhiData = groundwaterDB.delhi;
  const highestExtractionStage =
    delhiData && delhiData.type === "Block" ? delhiData.stage : "N/A";

  return (
    <Card className="w-full max-w-lg bg-white/80 backdrop-blur-sm border-slate-200/80 shadow-lg text-slate-900">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-xl text-slate-900">
              Proactive Groundwater Insights
            </h3>
            <p className="text-sm text-slate-500">Summary for Q3 2025</p>
          </div>
          <Badge className="bg-sky-100 text-sky-800">AI Generated</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs font-semibold text-slate-500">
              Critical Shifts
            </p>
            <p className="text-lg font-bold text-red-800 flex items-center justify-center gap-1">
              <AlertTriangle className="h-4 w-4" /> {criticalShifts}
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-xs font-semibold text-slate-500">
              Highest Stage
            </p>
            <p className="text-lg font-bold text-purple-800">
              {highestExtractionStage}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-500">
              Blocks Analyzed
            </p>
            <p className="text-lg font-bold text-slate-800">
              {regionsMonitored}
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" /> Key Observation
          </h4>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-700">
              The <strong>Delhi</strong> block has shown a consistent upward
              trend in extraction, moving it into the 'Over-Exploited' category.
              This is correlated with an increase in urban usage, industrial
              demand, and below-average rainfall in the region.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Command Bar Component ---
const INGRESCommandBar = ({
  inputValue,
  onInputChange,
  onSubmit,
  isListening,
  onMicClick,
  hasSpeechSupport,
  language,
  onLanguageChange,
  activeYear,
  onYearChange,
  isCoPilotMode,
  onCoPilotModeChange,
  onFileSelect,
  isMapAnalysisOpen,
  setIsMapAnalysisOpen,
}: any) => {
  const placeholders = useMemo(
    () =>
      language === "en-US"
        ? [
            "Show data for Delhi block...",
            "List all critical blocks...",
            "Compare Amritsar and Ludhiana...",
            "Why is groundwater declining in Delhi?",
            "What caused water scarcity in Delhi?",
            "Show rainfall impact on groundwater...",
            "Explain depletion causes in Ludhiana...",
            "Compare groundwater levels of 2020-2024...",
            "What policy changes can improve recharge?",
            "How do cropping patterns affect extraction?",
          ]
        : ["संगनेर ब्लॉक का डेटा दिखाएं...", "جميع بلوكوں کی فہرست بنائیں..."],
    [language]
  );
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholders[0]);

  useEffect(() => {
    const interval = setInterval(
      () =>
        setCurrentPlaceholder(
          (p) =>
            placeholders[(placeholders.indexOf(p) + 1) % placeholders.length]
        ),
      4000
    );
    return () => clearInterval(interval);
  }, [placeholders]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice type setter for Co-Pilot Mode
  function setVoiceType(value: string): void {
    // This function is passed as a prop to INGRESCommandBar,
    // so it should update the parent's voiceType state.
    // In the parent (INGRESAssistant), setVoiceType is a useState setter.
    // Here, we expect it to be provided via props, so just call the prop.
    // If you need to handle local state, you can add useState here.
    // But in this context, it's a prop function, so do nothing here.
    // (This placeholder is not needed in INGRESCommandBar itself.)
    // If you want to support local state, uncomment below:
    // setVoiceType(value);
    // Otherwise, this will be provided by parent.
  }
  return (
    <motion.div className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-sky-400 rounded-3xl blur-lg opacity-30"></div>
        <div className="relative bg-white/70 backdrop-blur-xl  border border-white/40 rounded-2xl shadow-lg p-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-full flex items-center">
              <Search className="h-6 w-6 text-slate-500 absolute left-3" />
              <AnimatePresence mode="wait">
                {!inputValue && !isListening && (
                  <motion.p
                    key={currentPlaceholder}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-12 text-base text-slate-600 pointer-events-none"
                  >
                    {currentPlaceholder}
                  </motion.p>
                )}
              </AnimatePresence>
              <Input
                value={inputValue}
                onChange={onInputChange}
                className="w-full bg-transparent border-none text-xl h-auto py-4 pl-12 pr-12 text-slate-900 focus-visible:ring-0"
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              />
              {hasSpeechSupport && (
                <button
                  onClick={onMicClick}
                  className={`absolute right-3 p-2 rounded-full transition-all duration-200 ${
                    isListening
                      ? "bg-green-100 shadow-md"
                      : "hover:bg-slate-200/60"
                  }`}
                >
                  <Mic
                    className={`h-6 w-6 ${
                      isListening
                        ? "text-green-600 animate-pulse"
                        : "text-slate-500"
                    }`}
                  />
                </button>
              )}
            </div>
            <Button
              onClick={onSubmit}
              className="px-4 py-2 rounded-lg text-white [background:linear-gradient(90deg,#3b82f6_0%,#2563eb_100%)]"
            >
              Submit
            </Button>
          </div>

          {/* Popular queries suggestion buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/50 hover:bg-white text-purple-700 border-purple-200"
              onClick={() => {
                const query = "Compare Amritsar and Ludhiana";
                onInputChange({ target: { value: query } } as any);
                onSubmit();
              }}
            >
              Compare Amritsar & Ludhiana
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/50 hover:bg-white text-blue-700 border-blue-200"
              onClick={() => {
                const query =
                  "What crops should I grow in a water-scarce region ?";
                onInputChange({ target: { value: query } } as any);
                onSubmit();
              }}
            >
              Crop recommendations
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/50 hover:bg-white text-emerald-700 border-emerald-200"
              onClick={() => {
                const query = "Show rainfall impact on groundwater";
                onInputChange({ target: { value: query } } as any);
                onSubmit();
              }}
            >
              Rainfall Impact
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/50 hover:bg-white text-amber-700 border-amber-200"
              onClick={() => {
                const query = "What policy changes can improve recharge?";
                onInputChange({ target: { value: query } } as any);
                onSubmit();
              }}
            >
              Policy Recommendations
            </Button>
          </div>

          <div className="flex items-center justify-between pl-2 pr-1">
            <div className="flex items-center gap-2">
              {/* <select
                value={activeYear}
                onChange={(e) => onYearChange(e.target.value)}
                className="rounded-full bg-slate-200/70 px-4 py-1.5 text-sm font-medium text-slate-700 border-none focus:ring-0"
              >
                <option>Latest (2025)</option>
                <option>2024</option>
                <option>2023</option>
              </select> */}
              {hasSpeechSupport && (
                <Button
                  variant="ghost"
                  className="h-auto px-3 py-1.5 rounded-lg"
                  onClick={onLanguageChange}
                >
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-slate-700" />
                    <select
                      value={language}
                      onChange={(e) => onLanguageChange(e.target.value)}
                      className="rounded-lg bg-slate-200/70 px-3 py-1.5 text-sm font-medium text-slate-700 border-none focus:ring-0"
                    >
                      <option value="en-US">English</option>
                      <option value="hi-IN">Hindi</option>
                      <option value="bn-IN">Bengali</option>
                      <option value="gu-IN">Gujarati</option>
                      <option value="ta-IN">Tamil</option>
                      <option value="te-IN">Telugu</option>
                      <option value="mr-IN">Marathi</option>
                      <option value="kn-IN">Kannada</option>
                      <option value="ml-IN">Malayalam</option>
                      <option value="pa-IN">Punjabi</option>
                      <option value="ur-IN">Urdu</option>
                    </select>
                  </div>
                </Button>
              )}

              {/* Co-Pilot Mode toggle */}
              <Button
                variant={isCoPilotMode ? "default" : "ghost"}
                className={`h-auto px-3 py-1.5 rounded-lg ${
                  isCoPilotMode
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "text-slate-700 hover:bg-slate-200/70"
                }`}
                onClick={() => onCoPilotModeChange(!isCoPilotMode)}
              >
                <div className="flex items-center gap-2">
                  {isCoPilotMode ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                  <span>Co-Pilot {isCoPilotMode ? "On" : "Off"}</span>
                </div>
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={onFileSelect}
            />
            <Button
              variant="ghost"
              className="h-auto px-3 py-1.5 rounded-lg"
              onClick={() => setIsMapAnalysisOpen(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              <span>Analyze Map</span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Animated Counter ---
const AnimatedCounter = ({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  useEffect(() => {
    if (isInView) spring.set(value);
  }, [spring, value, isInView]);
  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current)
        ref.current.textContent = `${Number(
          latest.toFixed(0)
        ).toLocaleString()}${suffix}`;
    });
    return () => unsubscribe();
  }, [spring, suffix]);
  return <span ref={ref} />;
};

const MemoizedStatCard = React.memo(({ stat }: { stat: any }) => (
  <Card className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-2xl shadow-lg hover:shadow-xl transition-all h-full">
    <CardContent className="p-5 relative">
      <div className="flex items-center gap-4">
        <div
          className={`p-2 rounded-lg bg-gradient-to-br ${stat.iconColor
            .replace("text-", "from-")
            .replace("-500", "-400/20")} ${stat.iconColor
            .replace("text-", "to-")
            .replace("-500", "-500/20")}`}
        >
          <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">
            <AnimatedCounter value={stat.value} />
          </p>
          <p className="text-sm text-slate-600 font-medium">{stat.title}</p>
        </div>
      </div>
      <Badge className="absolute top-4 right-4 bg-green-100 text-green-800 border-green-200 font-semibold">
        {stat.change}
      </Badge>
    </CardContent>
  </Card>
));
MemoizedStatCard.displayName = "MemoizedStatCard";

// --- Main Chat Message Type ---
type ChatMessage = {
  id: number;
  type: string;
  text?: string;
  component?: React.ReactNode;
  imageData?: string;
};

// --- FIX: Updated component to manage animation and markdown rendering ---
const AnimatedMarkdownMessage = ({ text }: { text: string }) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  // --- 1. Create a clean, plain-text version of the message for animation ---
  const plainText = useMemo(() => {
    // This regex removes common markdown characters like *, _, #, `, [, ], (, )
    // to prevent them from showing during the animation.
    return text.replace(/[*_#`[\]()]/g, "");
  }, [text]);

  // When the text content changes, reset the animation state
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
            // --- 2. Animate the CLEAN text ---
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
          {/* --- 3. Display the ORIGINAL text with formatting --- */}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Replace your existing HydrogeologicalAnalysisChart component with this complete and corrected version ---
const HydrogeologicalAnalysisChart = () => {
  // --- State to manage the active chart view ---
  const [activeSeries, setActiveSeries] = useState("all"); // 'all' is the default view

  // --- Enriched data with netBalance calculated automatically ---
  const data = [
    {
      month: "Apr",
      extraction: 5300,
      recharge: 3108,
      waterQuality: 92,
      declineRate: 0.25,
    },
    {
      month: "May",
      extraction: 6150,
      recharge: 1800,
      waterQuality: 89,
      declineRate: 0.31,
    },
    {
      month: "Jun",
      extraction: 5800,
      recharge: 4500,
      waterQuality: 87,
      declineRate: 0.28,
    },
    {
      month: "Jul",
      extraction: 4700,
      recharge: 8200,
      waterQuality: 91,
      declineRate: 0.18,
    },
    {
      month: "Aug",
      extraction: 4100,
      recharge: 7800,
      waterQuality: 90,
      declineRate: 0.15,
    },
    {
      month: "Sep",
      extraction: 3900,
      recharge: 6500,
      waterQuality: 88,
      declineRate: 0.22,
    },
  ].map((d) => ({ ...d, netBalance: d.recharge - d.extraction }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg w-64 font-sans">
          <p className="font-bold text-slate-800 text-lg mb-2">
            {label} 2025 Summary
          </p>
          <div className="space-y-2">
            {payload.map((pld: any) => (
              <div
                key={pld.dataKey}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center">
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: pld.stroke || pld.fill }}
                  ></div>
                  <span className="text-slate-600">{pld.name}:</span>
                </div>
                <span className="font-semibold text-slate-800">{`${pld.value.toLocaleString()}${
                  pld.unit || ""
                }`}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // --- Replace the entire return statement of your HydrogeologicalAnalysisChart with this new version ---
  // --- Replace the entire return statement of your HydrogeologicalAnalysisChart with this new version ---
  return (
    // --- CHANGE 1: Added `relative` and `overflow-hidden` to the main container ---
    <div className="relative overflow-hidden w-full bg-white/80 p-6 rounded-2xl border my-4 backdrop-blur-md shadow-xl font-sans">
      {/* --- CHANGE 2: Added the absolutely positioned top border --- */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 to-purple-800"></div>

      {/* Title and Subtitle Section (no changes here) */}
      <div>
        <h3 className="font-bold text-xl text-slate-800 mb-1 ml-2">
          Interactive Groundwater Analysis
        </h3>
        <p className="text-sm text-slate-500 mb-4 ml-2">
          Delhi Block – Six Month Summary (2025)
        </p>
      </div>

      {/* Interactive Filter Buttons (no changes here) */}
      <div className="flex items-center justify-center gap-2 mb-4 p-1 bg-slate-100 rounded-full">
        <button
          onClick={() => setActiveSeries("all")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
            activeSeries === "all"
              ? "bg-slate-800 text-white shadow"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveSeries("extraction")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
            activeSeries === "extraction"
              ? "bg-red-500 text-white shadow"
              : "text-red-700 hover:bg-red-100"
          }`}
        >
          Extraction
        </button>
        <button
          onClick={() => setActiveSeries("recharge")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
            activeSeries === "recharge"
              ? "bg-green-500 text-white shadow"
              : "text-green-700 hover:bg-green-100"
          }`}
        >
          Recharge
        </button>
        <button
          onClick={() => setActiveSeries("netBalance")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
            activeSeries === "netBalance"
              ? "bg-amber-600 text-white shadow"
              : "text-amber-700 hover:bg-amber-100"
          }`}
        >
          Net Balance
        </button>
        <button
          onClick={() => setActiveSeries("waterQuality")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
            activeSeries === "waterQuality"
              ? "bg-purple-500 text-white shadow"
              : "text-purple-700 hover:bg-purple-100"
          }`}
        >
          Water Quality
        </button>
      </div>

      {/* The Chart Itself (no changes here) */}
      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 20, left: -10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="colorExtraction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRecharge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNetBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="colorWaterQuality"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
              tick={{ fill: "#64748b" }}
            />
            <YAxis
              yAxisId="left"
              unit=" m³"
              width={80}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b" }}
              tickFormatter={(value) =>
                new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  compactDisplay: "short",
                }).format(value)
              }
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              unit="%"
              domain={[80, 100]}
              width={50}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b" }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(241, 245, 249, 0.7)" }}
            />

            {(activeSeries === "all" || activeSeries === "extraction") && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="extraction"
                name="Extraction"
                unit=" m³"
                fill="url(#colorExtraction)"
                stroke="#ef4444"
                strokeWidth={3}
              />
            )}
            {(activeSeries === "all" || activeSeries === "recharge") && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="recharge"
                name="Recharge"
                unit=" m³"
                fill="url(#colorRecharge)"
                stroke="#22c55e"
                strokeWidth={3}
              />
            )}
            {(activeSeries === "all" || activeSeries === "netBalance") && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="netBalance"
                name="Net Balance"
                unit=" m³"
                fill="url(#colorNetBalance)"
                stroke="#d97706"
                strokeWidth={3}
              />
            )}
            {(activeSeries === "all" || activeSeries === "waterQuality") && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="waterQuality"
                name="Water Quality"
                unit="%"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
// --- Main INGRES Assistant Component ---
export const INGRESAssistant = ({
  embedded = false,
}: {
  embedded?: boolean;
}) => {
  const [view, setView] = useState("dashboard");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  // --- 1. Replace your old handler function with this corrected version ---
  const handleFakeMapAnalysis = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // This is the new logic to auto-open the chat window
    setView("chat");

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: "user",
      text: `Analyzing map: ${file.name}`,
    };

    // --- THIS IS THE CRUCIAL FIX ---
    // This now ADDS the message to the end of the previous history instead of replacing it.
    setChatHistory((previousChatHistory) => [
      ...previousChatHistory,
      userMessage,
    ]);

    setIsThinking(true);

    setTimeout(() => {
      const graphMessage: ChatMessage = {
        id: Date.now() + 1,
        type: "bot",
        component: <HydrogeologicalAnalysisChart />, // Or your preferred graph component name
      };

      // Use the functional update form to guarantee the latest state
      setChatHistory((previousChatHistory) => [
        ...previousChatHistory,
        graphMessage,
      ]);
      setIsThinking(false);
    }, 4000);

    // Clear the file input for the next use
    if (event.target) {
      event.target.value = "";
    }
  };

  // Handle image analysis from MapAnalysisDialog
  const handleImageAnalysis = async (imageData: string) => {
    setView("chat");

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: "user",
      text: "Analyzing uploaded INGRES map image with comprehensive groundwater analysis...",
      imageData: imageData,
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
      // If no API key, immediately fallback to predefined sample
      if (!apiKey) {
        console.warn(
          "⚠️ No API key provided. Using offline fallback groundwater analysis sample."
        );
        const fallbackResponse = JSON.stringify(
          SAMPLE_MAP_ANALYSIS_RESPONSE,
          null,
          2
        );
        const detectedProfile =
          pickProfileByText(fallbackResponse) || PUNJAB_PROFILE;
        setChatHistory((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            component: (
              <React.Suspense
                fallback={
                  <div className="text-xs text-slate-500">
                    Loading deep dive...
                  </div>
                }
              >
                <StateDeepDiveCard state={detectedProfile} />
              </React.Suspense>
            ),
          },
        ]);
        setIsThinking(false);
        return;
      }

      // Try the live Gemini analysis first
      try {
        const geminiService = new GeminiApiService(apiKey);
        const response = await geminiService.analyzeImage(imageData, true);

        // If response doesn't look like JSON, wrap into a JSON shell to allow renderer heuristics
        const normalizedResponse =
          /"graphs"|"problem_districts"|"sector_usage"/.test(response)
            ? response
            : JSON.stringify({ summary: response }, null, 2);

        setChatHistory((prev) => {
          const detectedProfile =
            pickProfileByText(normalizedResponse) || PUNJAB_PROFILE;
          const alreadyRendered = prev
            .slice(-6)
            .some(
              (m) =>
                (m as any).component &&
                JSON.stringify((m as any).component)?.includes(
                  "StateDeepDiveCard"
                )
            );
          if (alreadyRendered) return prev; // avoid duplication entirely
          return [
            ...prev,
            {
              id: Date.now() + 1,
              type: "ai",
              component: (
                <React.Suspense
                  fallback={
                    <div className="text-xs text-slate-500">
                      Loading deep dive...
                    </div>
                  }
                >
                  <StateDeepDiveCard state={detectedProfile} />
                </React.Suspense>
              ),
            },
            {
              id: Date.now() + 2,
              type: "ai",
              text: "Deep dive generated from live analysis. Multi-chart renderer suppressed per configuration.",
            },
          ];
        });
      } catch (apiError) {
        console.error(
          "Gemini analysis failed, falling back to sample:",
          apiError
        );
        const fallbackResponse = JSON.stringify(
          {
            _fallback: true,
            _reason: (apiError as Error)?.message || "Unknown API error",
            ...SAMPLE_MAP_ANALYSIS_RESPONSE,
          },
          null,
          2
        );
        setChatHistory((prev) => {
          const detectedProfile =
            pickProfileByText(fallbackResponse) || PUNJAB_PROFILE;
          const alreadyRendered = prev
            .slice(-6)
            .some(
              (m) =>
                (m as any).component &&
                JSON.stringify((m as any).component)?.includes(
                  "StateDeepDiveCard"
                )
            );
          if (alreadyRendered) return prev;
          return [
            ...prev,
            {
              id: Date.now() + 1,
              type: "ai",
              component: (
                <React.Suspense
                  fallback={
                    <div className="text-xs text-slate-500">
                      Loading deep dive...
                    </div>
                  }
                >
                  <StateDeepDiveCard state={detectedProfile} />
                </React.Suspense>
              ),
            },
            {
              id: Date.now() + 2,
              type: "ai",
              text: "(Fallback) Deep dive rendered. Multi-chart renderer suppressed due to API error.",
            },
          ];
        });
      }
    } catch (outerError) {
      console.error("Unexpected image analysis failure:", outerError);
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          text: "A critical error occurred while processing the map. Please refresh and try again.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const [isThinking, setIsThinking] = useState(false);
  const [currentComparison, setCurrentComparison] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [activeYear, setActiveYear] = useState("Latest (2025)");
  const [language, setLanguage] = useState("en-US");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState({
    message: "",
    type: "info",
    visible: false,
  });

  // Co-Pilot Mode state variables
  const [isCoPilotMode, setIsCoPilotMode] = useState(false);
  const [currentDataContext, setCurrentDataContext] = useState<any | null>(
    null
  );
  const [isListeningForFollowUp, setIsListeningForFollowUp] = useState(false);
  const [showListeningIndicator, setShowListeningIndicator] = useState(false);
  const [isMapAnalysisOpen, setIsMapAnalysisOpen] = useState(false);

  const { apiKey } = useApiKey();
  const {
    text: voiceText,
    startListening,
    stopListening,
    isListening,
    hasRecognitionSupport,
  } = useSpeechRecognition({ lang: language });

  // Text-to-speech function for Co-Pilot Mode with enhanced human-like voice
  const speakText = (text: string, onEnd?: () => void) => {
    if (!isCoPilotMode) return;

    // Stop any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Get available voices
    const voices = window.speechSynthesis.getVoices();

    // Find the best natural-sounding voice based on language
    let selectedVoice;

    if (language.startsWith("en")) {
      // Look for high-quality English voices in this order of preference
      const preferredVoiceNames = [
        "Google UK English Female", // Very natural-sounding
        "Microsoft Aria Online (Natural)",
        "Microsoft Libby Online (Natural)",
        "Apple Samantha",
        "Apple Moira",
        "Daniel",
        "Samantha",
        "Karen",
        "Google US English",
        "Alex",
      ];

      // Try to find one of the preferred voices
      for (const voiceName of preferredVoiceNames) {
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) {
          selectedVoice = voice;
          break;
        }
      }

      // If no preferred voice found, try to find any natural-sounding voice
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            (voice.name.toLowerCase().includes("natural") ||
              voice.name.toLowerCase().includes("premium") ||
              voice.name.toLowerCase().includes("enhanced")) &&
            voice.lang.startsWith("en")
        );
      }
    } else if (language.startsWith("hi")) {
      // For Hindi, find the best available voice
      const preferredHindiVoices = [
        "Google हिन्दी",
        "Microsoft Swara Online (Natural)",
        "Lekha",
      ];

      for (const voiceName of preferredHindiVoices) {
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) {
          selectedVoice = voice;
          break;
        }
      }
    }

    // If still no voice found, use any voice matching the language
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) =>
        voice.lang.startsWith(language.split("-")[0])
      );
    }

    // If a voice was found, use it
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Optimize parameters for natural speech
    utterance.rate = 0.92; // Slightly slower for more clarity
    utterance.pitch = 1.0; // Natural pitch

    // Process text for more natural speech patterns
    // Add slight pauses at punctuation for more natural speech rhythm
    text = text.replace(/([.,!?;:])/g, "$1 ");

    // Add longer pauses for paragraph breaks
    text = text.replace(/\n\n/g, ".\n\n");

    // Add emphasis to important terms
    text = text.replace(
      /\b(critical|severe|important|significant|Over-Exploited|Critical|Safe)\b/g,
      " $1 "
    );

    // Convert numerical data for better speech
    text = text.replace(/(\d+)%/g, "$1 percent");
    text = text.replace(/(\d+)\.(\d+)/g, "$1 point $2");

    // Humanize time references
    text = text.replace(/(\d{4})-(\d{4})/g, "$1 to $2");

    // Insert occasional filler words for more natural speech
    const sentences = text.split(/(?<=[.!?])\s+/);
    const processedSentences = sentences.map((sentence, index) => {
      // Add filler words to about 10% of sentences
      if (index > 0 && index % 10 === 0) {
        const fillers = [
          "Now, ",
          "So, ",
          "Well, ",
          "You see, ",
          "Actually, ",
          "Essentially, ",
        ];
        const randomFiller =
          fillers[Math.floor(Math.random() * fillers.length)];
        return randomFiller + sentence;
      }
      return sentence;
    });

    utterance.text = processedSentences.join(" ");

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Function to call Gemini API with context awareness for Co-Pilot Mode
  const callGeminiAPI = async (query: string) => {
    if (!apiKey) {
      setToast({
        message: "API key is required to use Co-Pilot Mode",
        type: "error",
        visible: true,
      });
      return null;
    }

    try {
      setIsThinking(true);

      // Prepare context-aware prompt with detailed response guidance
      let contextualPrompt = query;

      // Add context from current data if available
      if (currentDataContext) {
        contextualPrompt += `\n\nCurrent context: ${JSON.stringify(
          currentDataContext
        )}`;
      }

      // Add instructions for more detailed responses when in co-pilot mode
      if (isCoPilotMode) {
        contextualPrompt += `\n\n
Please provide a comprehensive and detailed response suitable for natural human speech with the following characteristics:
1. Use conversational language that flows naturally when spoken aloud
2. Avoid technical jargon unless necessary, and explain any technical terms
3. For groundwater analysis, include:
   - Simplified explanations of trends and patterns
   - Clear comparisons between regions or time periods
   - Practical implications for stakeholders
4. Structure your response with:
   - A brief introduction summarizing the key points
   - Main content with logical flow between ideas
   - A concise conclusion with actionable insights
5. Use natural transitions and speech patterns a human expert would use
6. Include pauses (with commas and periods) at natural breaking points
7. Keep sentences relatively short and easy to follow when spoken
8. Be Concise and Format Well: Use Markdown for clarity (bolding, lists, etc.) to make the information easy to digest


Your response should sound like it's coming from a knowledgeable human analyst explaining the information in a clear, conversational manner.`;
      }

      // Call Gemini APIPrompt =
      const geminiService = new GeminiApiService(apiKey);
      const response = await geminiService.generateResponse(contextualPrompt);

      return response.text;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setToast({
        message: "Error getting response from Co-Pilot",
        type: "error",
        visible: true,
      });
      return null;
    } finally {
      setIsThinking(false);
    }
  };

  // Initialize speech synthesis voices
  useEffect(() => {
    // Safari requires this to be manually triggered to load voices
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Load voices on first render
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };

      // Check if voices are already loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        // Set up event listener for when voices are loaded
        window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

        // Initial call to load voices
        loadVoices();

        // Cleanup event listener
        return () => {
          window.speechSynthesis.removeEventListener(
            "voiceschanged",
            loadVoices
          );
        };
      }
    }
  }, []);

  useEffect(() => {
    if (voiceText) setInputValue(voiceText);
  }, [voiceText]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      setShowListeningIndicator(false);
      setIsListeningForFollowUp(false);

      // In Co-Pilot Mode, submit the voice text immediately after stopping
      if (isCoPilotMode && voiceText) {
        setInputValue(voiceText);
        // Use a slight delay to allow the UI to update
        setTimeout(() => {
          handleChatSubmit(voiceText);
        }, 300);
      }
    } else {
      // If starting listening and we're in Co-Pilot Mode, provide a voice prompt
      if (isCoPilotMode) {
        speakText(
          "I'm listening now. How can I assist with your groundwater data analysis?",
          () => {
            startListening();
            setShowListeningIndicator(true);
          }
        );
      } else {
        startListening();
        setShowListeningIndicator(true);
      }
    }
  };
  const handleLanguageChange = () =>
    setLanguage((prev) => (prev === "en-US" ? "hi-IN" : "en-US"));

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
  }, [chatHistory, isThinking]);

  // Update input value with voice text when using speech recognition
  useEffect(() => {
    if (voiceText) {
      setInputValue(voiceText);

      // In Co-Pilot Mode, if listening for follow-up, auto-submit the question
      if (
        isCoPilotMode &&
        isListeningForFollowUp &&
        voiceText.trim().length > 5
      ) {
        // Stop listening to prevent duplicate submissions
        stopListening();
        setShowListeningIndicator(false);
        setIsListeningForFollowUp(false);

        // Submit the question
        handleChatSubmit(voiceText);
      }
    }
  }, [voiceText, isCoPilotMode, isListeningForFollowUp]);

  // Play welcome message when Co-Pilot Mode is toggled on
  useEffect(() => {
    if (isCoPilotMode) {
      speakText(
        "Voice assistant activated. I'll provide detailed spoken responses to help you analyze groundwater data."
      );
    }
  }, [isCoPilotMode]);

  // Helper function to directly trigger the Punjab vs Rajasthan comparison
  const showPunjabRajasthanComparison = () => {
    const punjabRajasthanResponse = getAIResponse(
      "Punjab Rajasthan comparison"
    );
    if (punjabRajasthanResponse) {
      const response = {
        id: Date.now() + 1,
        type: "ai",
        component: <AIResponseRendererV2 response={punjabRajasthanResponse} />,
      };
      setChatHistory((prev) => [...prev, response]);
    } else {
      console.error("Failed to get Punjab Rajasthan comparison response");
    }
  };

  const showToast = (message: string, type = "info") => {
    setToast({ message, type, visible: true });
  };

  const handleChatSubmit = async (text: string) => {
    if (!text.trim()) return;
    const query = text.toLowerCase();
    setView("chat");
    setChatHistory((prev) => [...prev, { id: Date.now(), type: "user", text }]);
    setInputValue("");
    setIsThinking(true);

    // Deep dive manual command: "deep dive <state>" or "state deep dive <state>"
    const deepDiveMatch = query.match(
      /^(?:state\s+)?deep\s*dive\s+([a-z ]{3,40})$/i
    );
    if (deepDiveMatch) {
      const candidate = deepDiveMatch[1].trim();
      const profile =
        pickProfileByText(candidate) || STATE_PROFILE_MAP[candidate];
      if (profile) {
        const already = chatHistory
          .slice(-8)
          .some(
            (m) =>
              (m as any).component &&
              JSON.stringify((m as any).component)?.includes(
                "StateDeepDiveCard"
              ) &&
              JSON.stringify((m as any).component)?.includes(profile.name)
          );
        if (!already) {
          setChatHistory((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: "ai",
              component: (
                <React.Suspense
                  fallback={
                    <div className="text-xs text-slate-500">
                      Loading deep dive...
                    </div>
                  }
                >
                  <StateDeepDiveCard state={profile} />
                </React.Suspense>
              ),
            },
          ]);
        }
        setIsThinking(false);
        return;
      }
    }

    try {
      console.log("Processing query:", text, "Lowercase:", text.toLowerCase());

      // EARLY: Map analysis trigger with predefined comprehensive prompt
      if (
        query.includes("analyzing uploaded ingres map") ||
        query.includes("analyze map") ||
        query.includes("comprehensive groundwater analysis") ||
        (query.includes("ingres") &&
          query.includes("map") &&
          query.includes("analysis")) ||
        (query.includes("groundwater") &&
          query.includes("map") &&
          query.includes("analysis"))
      ) {
        console.log(
          "🗺️ Triggering comprehensive map analysis with predefined prompt"
        );

        // Show thinking message
        await new Promise((r) => setTimeout(r, 800));

        // Use Gemini API with the predefined MAP_ANALYSIS_PROMPT
        const geminiService = new GeminiApiService(apiKey);
        let response;

        try {
          // Apply the comprehensive MAP_ANALYSIS_PROMPT directly
          const result = await geminiService.generateResponse(
            MAP_ANALYSIS_PROMPT +
              "\n\nBased on the INGRES groundwater portal data, provide a comprehensive analysis with interactive charts showing extraction vs recharge, sector usage, annual trends, and policy recommendations. Include the JSON structure with graph data as specified in the prompt."
          );
          response = result.text;
        } catch (error) {
          console.error("Map analysis failed:", error);
          response =
            "I apologize, but I encountered an error while generating the comprehensive groundwater analysis. Please ensure you have provided a valid API key and try again.";
        }

        const analysisResponse = {
          id: Date.now() + 1,
          type: "ai",
          component: <GroundwaterAnalysisRenderer response={response} />,
        };

        setChatHistory((prev) => [...prev, analysisResponse]);
        if (isCoPilotMode) {
          speakText(
            "Generated comprehensive INGRES groundwater analysis with interactive visualizations and policy recommendations.",
            () => {
              setIsListeningForFollowUp(true);
              setShowListeningIndicator(true);
              startListening();
            }
          );
        }
        setIsThinking(false);
        return;
      }

      // EARLY: Crop recommendation trigger
      if (
        (query.includes("what crops") ||
          query.includes("crop recommendation") ||
          query.includes("water-scarce crops") ||
          query.includes("drought crops")) &&
        (query.includes("water") ||
          query.includes("scarce") ||
          query.includes("drought"))
      ) {
        await new Promise((r) => setTimeout(r, 800));
        const cropResponse = {
          id: Date.now() + 1,
          type: "ai",
          component: (
            <React.Suspense
              fallback={
                <div className="p-4 text-sm text-muted-foreground">
                  Loading crop recommendations…
                </div>
              }
            >
              <React.Suspense
                fallback={
                  <div className="text-xs text-slate-500">
                    Loading deep dive...
                  </div>
                }
              >
                <StateDeepDiveCard
                  state={
                    pickProfileByText("crop recommendations") || PUNJAB_PROFILE
                  }
                />
              </React.Suspense>
            </React.Suspense>
          ),
        };
        setChatHistory((prev) => [...prev, cropResponse]);
        if (isCoPilotMode) {
          speakText(
            "Showing water-efficient crop recommendations for drought-prone regions.",
            () => {
              setIsListeningForFollowUp(true);
              setShowListeningIndicator(true);
              startListening();
            }
          );
        }
        setIsThinking(false);
        return;
      }

      // EARLY: Policy recharge trigger
      if (
        (query.includes("policy") &&
          (query.includes("recharge") || query.includes("improve"))) ||
        query.includes("policy changes recharge") ||
        query.includes("regulatory reforms")
      ) {
        await new Promise((r) => setTimeout(r, 800));
        const policyResponse = {
          id: Date.now() + 1,
          type: "ai",
          component: (
            <React.Suspense
              fallback={
                <div className="p-4 text-sm text-muted-foreground">
                  Loading policy recommendations…
                </div>
              }
            >
              <React.Suspense
                fallback={
                  <div className="text-xs text-slate-500">
                    Loading deep dive...
                  </div>
                }
              >
                <StateDeepDiveCard
                  state={pickProfileByText("policy recharge") || PUNJAB_PROFILE}
                />
              </React.Suspense>
            </React.Suspense>
          ),
        };
        setChatHistory((prev) => [...prev, policyResponse]);
        if (isCoPilotMode) {
          speakText(
            "Displaying policy interventions to improve groundwater recharge rates.",
            () => {
              setIsListeningForFollowUp(true);
              setShowListeningIndicator(true);
              startListening();
            }
          );
        }
        setIsThinking(false);
        return;
      }

      // EARLY: Rainfall impact trigger
      if (
        (query.includes("rainfall") &&
          (query.includes("impact") ||
            query.includes("contribution") ||
            query.includes("recharge"))) ||
        query.includes("rainfall impact") ||
        query.includes("recharge sources")
      ) {
        await new Promise((r) => setTimeout(r, 800));
        const rainfallResponse = {
          id: Date.now() + 1,
          type: "ai",
          component: (
            <React.Suspense
              fallback={
                <div className="p-4 text-sm text-muted-foreground">
                  Loading rainfall analysis…
                </div>
              }
            >
              <React.Suspense
                fallback={
                  <div className="text-xs text-slate-500">
                    Loading deep dive...
                  </div>
                }
              >
                <StateDeepDiveCard
                  state={pickProfileByText("rainfall impact") || PUNJAB_PROFILE}
                />
              </React.Suspense>
            </React.Suspense>
          ),
        };
        setChatHistory((prev) => [...prev, rainfallResponse]);
        if (isCoPilotMode) {
          speakText(
            "Analyzing rainfall contribution to groundwater recharge across assessment blocks.",
            () => {
              setIsListeningForFollowUp(true);
              setShowListeningIndicator(true);
              startListening();
            }
          );
        }
        setIsThinking(false);
        return;
      }

      // EARLY: State comparison trigger (Punjab vs Rajasthan)
      if (
        (query.includes("punjab") && query.includes("rajasthan")) ||
        query.includes("state comparison") ||
        (query.includes("comparison") &&
          (query.includes("punjab") || query.includes("rajasthan")))
      ) {
        await new Promise((r) => setTimeout(r, 800));
        const stateResponse = {
          id: Date.now() + 1,
          type: "ai",
          component: (
            <React.Suspense
              fallback={
                <div className="p-4 text-sm text-muted-foreground">
                  Loading state comparison…
                </div>
              }
            >
              <StateComparisonCard />
            </React.Suspense>
          ),
        };
        setChatHistory((prev) => [...prev, stateResponse]);
        if (isCoPilotMode) {
          speakText(
            "Comparing groundwater depletion patterns between Punjab and Rajasthan states.",
            () => {
              setIsListeningForFollowUp(true);
              setShowListeningIndicator(true);
              startListening();
            }
          );
        }
        setIsThinking(false);
        return;
      }

      // EARLY: Policy recharge intent
      const policyIntent =
        (query.includes("recharge") || query.includes("aquifer")) &&
        (query.includes("policy") ||
          query.includes("measure") ||
          query.includes("intervention") ||
          query.includes("strategy") ||
          query.includes("actions")) &&
        (query.includes("improve") ||
          query.includes("increase") ||
          query.includes("boost") ||
          query.includes("enhance"));
      if (policyIntent) {
        const response = {
          id: Date.now() + 1,
          type: "ai",
          component: (
            <React.Suspense
              fallback={
                <div className="text-xs text-slate-500">
                  Loading deep dive...
                </div>
              }
            >
              <StateDeepDiveCard
                state={pickProfileByText("policy recharge") || PUNJAB_PROFILE}
              />
            </React.Suspense>
          ),
        };
        setChatHistory((prev) => [...prev, response]);
        if (isCoPilotMode) {
          speakText(
            "Displayed recharge policy stack ranked by impact and feasibility.",
            () => {
              setIsListeningForFollowUp(true);
              setShowListeningIndicator(true);
              startListening();
            }
          );
        }
        setIsThinking(false);
        return;
      }

      // EARLY: Rainfall impact intent
      const rainfallIntent =
        ((query.includes("rainfall") || query.includes("monsoon")) &&
          (query.includes("impact") ||
            query.includes("affect") ||
            query.includes("influence") ||
            query.includes("effect")) &&
          (query.includes("recharge") || query.includes("groundwater"))) ||
        query.includes("rainfall impact") ||
        query.includes("rainfall recharge split");
      if (rainfallIntent) {
        const response = {
          id: Date.now() + 1,
          type: "ai",
          component: (
            <React.Suspense
              fallback={
                <div className="text-xs text-slate-500">
                  Loading deep dive...
                </div>
              }
            >
              <StateDeepDiveCard
                state={pickProfileByText("rainfall impact") || PUNJAB_PROFILE}
              />
            </React.Suspense>
          ),
        };
        setChatHistory((prev) => [...prev, response]);
        if (isCoPilotMode) {
          speakText(
            "Displayed rainfall to recharge pathway breakdown with overdraft stress index.",
            () => {
              setIsListeningForFollowUp(true);
              setShowListeningIndicator(true);
              startListening();
            }
          );
        }
        setIsThinking(false);
        return;
      }

      // EARLY: Specific Ludhiana & Amritsar extraction visualization trigger
      const extractionVizMatch =
        (query.includes("increasing") ||
          query.includes("rise") ||
          query.includes("why") ||
          query.includes("trend")) &&
        (query.includes("groundwater") || query.includes("extraction")) &&
        ((query.includes("ludhiana") && query.includes("amritsar")) ||
          query.includes("ludhiana and amritsar")) &&
        (query.includes("extraction") ||
          query.includes("over-exploited") ||
          query.includes("overexploited"));
      if (extractionVizMatch) {
        const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023];
        const ludhiana = [165, 172, 178, 183, 188, 193, 198];
        const amritsar = [173, 176, 179, 181, 183, 185, 188];
        const projectionYears = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
        const projectionLudhiana = [202, 206, 209, 213, 217, 220, 224];
        const projectionAmritsar = [190, 192, 195, 198, 201, 204, 207];
        const factorWeights = {
          paddyCropping: 9,
          freeElectricity: 8,
          privateTubewells: 8,
          industryGrowth: 6,
          urbanExpansion: 5,
        };
        const vizResponse = {
          id: Date.now() + 1,
          type: "ai",
          component: (
            <div className="space-y-6">
              <React.Suspense
                fallback={
                  <div className="p-4 text-sm text-muted-foreground">
                    Loading visualization…
                  </div>
                }
              >
                <GroundwaterExtractionVisualization
                  years={years}
                  ludhiana={ludhiana}
                  amritsar={amritsar}
                  projectionYears={projectionYears}
                  projectionLudhiana={projectionLudhiana}
                  projectionAmritsar={projectionAmritsar}
                  factorWeights={factorWeights}
                />
              </React.Suspense>
              <div className="prose dark:prose-invert max-w-none text-sm">
                <h3>Summary</h3>
                <p>
                  <strong>Why increasing?</strong> Persistent water-intensive
                  paddy cultivation, subsidized/free power encouraging longer
                  pump hours, dense private tubewell proliferation, expanding
                  agro-processing demand, and gradual urban growth are
                  compounding abstraction pressure.
                </p>
                <p>
                  <strong>Risk trajectory:</strong> If unmitigated, extraction
                  could exceed 220% of recharge in Ludhiana and move past 205%
                  in Amritsar by 2030, pushing deeper aquifer stress, higher
                  lift energy, and localized quality deterioration.
                </p>
                <p>
                  <strong>Recommended levers:</strong> Crop diversification
                  (paddy → maize / pulses), pre-monsoon pumping regulation,
                  metered incentive schemes, managed aquifer recharge (check dam
                  desilting, recharge shafts), and integrated tubewell registry
                  + abstraction caps.
                </p>
              </div>
            </div>
          ),
        };
        setChatHistory((prev) => [...prev, vizResponse]);
        if (isCoPilotMode) {
          speakText(
            "Displayed extraction trajectory and drivers for Ludhiana and Amritsar with projections to 2030.",
            () => {
              setIsListeningForFollowUp(true);
              setShowListeningIndicator(true);
              startListening();
            }
          );
        }
        setIsThinking(false);
        return;
      }

      // Predefined structured response fallback (runs only if not matched earlier)
      const aiResponse = getAIResponse(text);
      if (aiResponse) {
        await new Promise((r) => setTimeout(r, 800));
        const response = {
          id: Date.now() + 1,
          type: "ai",
          component: <AIResponseRendererV2 response={aiResponse} />,
        };
        setChatHistory((prev) => [...prev, response]);
        if (isCoPilotMode) {
          setCurrentDataContext(aiResponse);
          const summary = `Here's information about ${
            aiResponse.title || "your query"
          }. ${
            aiResponse.components
              ? `I've prepared ${aiResponse.components.length} visualizations for you.`
              : ""
          }`;
          speakText(summary, () => {
            setIsListeningForFollowUp(true);
            setShowListeningIndicator(true);
            startListening();
          });
        }
        setIsThinking(false);
        return;
      }

      // --- 1. LOGIC FOR SINGLE BLOCK REPORT ---
      const blockKeyword = Object.keys(groundwaterDB).find(
        (key) =>
          query.includes(key) &&
          groundwaterDB[key as keyof typeof groundwaterDB].type === "Block"
      );
      if (blockKeyword) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const blockData =
          groundwaterDB[blockKeyword as keyof typeof groundwaterDB];
        const aiResponse = {
          id: Date.now() + 1,
          type: "ai",
          component: <BlockAssessmentCard data={blockData} />,
        };
        setChatHistory((prev) => [...prev, aiResponse]);

        // Store the current data context for Co-Pilot Mode
        if (isCoPilotMode) {
          setCurrentDataContext(blockData);
          // Speak a summary of the block data - handle different types safely
          let summary = `Here's information about this groundwater block.`;
          if (blockData.type === "Block") {
            summary = `Here's information about ${blockData.block} in ${blockData.district}. This is a ${blockData.category} block with groundwater extraction of ${blockData.extraction.total} hectare meters.`;
          }
          speakText(summary, () => {
            // Start listening for follow-up questions after speaking
            setIsListeningForFollowUp(true);
            setShowListeningIndicator(true);
            startListening();
          });
        }

        setIsThinking(false);
        return;
      }

      // --- 2. LOGIC FOR COMPARISON CHART ---
      // (Visualization for Ludhiana & Amritsar extraction handled earlier)
      if (
        query.includes("compare") &&
        (query.includes("ludhiana") ||
          query.includes("jalandhar") ||
          query.includes("amritsar"))
      ) {
        const locations = [];
        if (query.includes("ludhiana")) locations.push("Ludhiana");
        if (query.includes("jalandhar")) locations.push("Jalandhar");
        if (query.includes("amritsar")) locations.push("Amritsar");

        if (locations.length < 2) {
          // Handle case where only one location is mentioned in a compare query
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const aiResponse = {
            id: Date.now() + 1,
            type: "ai",
            text: `Please specify at least two locations to compare. For example: "Compare Ludhiana and Jalandhar".`,
          };
          setChatHistory((prev) => [...prev, aiResponse]);
          setIsThinking(false);
          return;
        }

        const years = [2020, 2021, 2022, 2023, 2024];

        // Create the properly structured data for the chart
        const formattedData: {
          [key: string]: {
            extraction: number[];
            recharge: number[];
            net: number[];
          };
        } = {};
        locations.forEach((loc) => {
          const locationKey = loc.toLowerCase();
          const locationData = groundwaterDB[locationKey];

          if (
            locationData &&
            locationData.type === "District" &&
            Array.isArray(locationData.extraction)
          ) {
            formattedData[loc] = {
              extraction: locationData.extraction,
              recharge: locationData.recharge,
              net: locationData.net,
            };
          } else {
            // Fallback data if actual data isn't available
            const extractionData = [0.72, 0.75, 0.78, 0.81, 0.83];
            const rechargeData = [0.55, 0.53, 0.51, 0.5, 0.48];
            const netData = extractionData.map(
              (ext, i) => ext - rechargeData[i]
            );

            formattedData[loc] = {
              extraction: extractionData,
              recharge: rechargeData,
              net: netData,
            };
          }
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const summaryText = {
          extraction: `This chart shows groundwater extraction trends for ${locations.join(
            " and "
          )} from 2020 to 2024. The data indicates increasing extraction rates.`,
          recharge: `The recharge trends for ${locations.join(
            " and "
          )} show a concerning decline over the last 5 years, potentially due to reduced rainfall and increased paved surfaces.`,
          net: `Net water availability is the difference between recharge and extraction. Negative values indicate overdraft conditions that are not sustainable.`,
        };

        const aiResponse = {
          id: Date.now() + 1,
          type: "ai",
          component: (
            <GroundwaterComparisonChart
              locations={locations}
              years={years}
              data={formattedData}
              summary={summaryText}
              onFollowUp={handleChatSubmit}
            />
          ),
        };

        setChatHistory((prev) => [...prev, aiResponse]);

        // Store the current data context for Co-Pilot Mode
        if (isCoPilotMode) {
          setCurrentDataContext({
            locations,
            years,
            data: formattedData,
            summary: summaryText,
          });
          // Speak a summary of the comparison
          const locationsList = locations.join(" and ");
          const summary = `Here's a comparison of groundwater data between ${locationsList}. ${summaryText.extraction}`;
          speakText(summary, () => {
            // Start listening for follow-up questions after speaking
            setIsListeningForFollowUp(true);
            setShowListeningIndicator(true);
            startListening();
          });
        }

        setIsThinking(false);
        return;
      }

      // --- 3. LOGIC FOR PROACTIVE INSIGHTS ---
      if (
        query.includes("proactive insight") ||
        query.includes("generate a summary")
      ) {
        // Your logic for ProactiveInsightCard would go here
        // For now, let's add a placeholder response
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const aiResponse = {
          id: Date.now() + 1,
          type: "ai",
          text: "Generating a proactive insight summary is a planned feature!",
        };
        setChatHistory((prev) => [...prev, aiResponse]);
        setIsThinking(false);
        return;
      }

      if (
        query.includes("proactive insight") ||
        query.includes("generate a summary") ||
        query.includes("generate a report")
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const aiResponse = {
          id: Date.now() + 1,
          type: "ai",
          component: <ProactiveInsightCard />,
        };
        setChatHistory((prev) => [...prev, aiResponse]);
        setIsThinking(false);
        return;
      }

      // --- 4. STRUCTURED AI RESPONSES ---
      // We already tried getAIResponse at the beginning of this function, so this is unnecessary.
      // The AI structured response would have been handled already if it matched.

      // --- SPECIAL LOGIC FOR CO-PILOT MODE CONTEXTUAL QUERIES ---
      if (
        isCoPilotMode &&
        currentDataContext &&
        (query.includes("explain") ||
          query.includes("why") ||
          query.includes("how") ||
          query.includes("what") ||
          query.includes("tell me more"))
      ) {
        // Call Gemini API with context-aware prompt
        const response = await callGeminiAPI(text);

        if (response) {
          const aiResponse = {
            id: Date.now() + 1,
            type: "ai",
            text: response,
          };

          setChatHistory((prev) => [...prev, aiResponse]);

          // Speak the response
          speakText(response);
          setIsThinking(false);
          return;
        }
      }

      const API_KEY =
        import.meta.env.VITE_GEMINI_API_KEY ||
        "AIzaSyDSqFidFieMz6EVw1HnFBuYlJ_jtGm22A8";
      if (API_KEY) {
        try {
          const genAI = new GoogleGenerativeAI(API_KEY);
          // Prefer configurable model; fall back to latest stable naming conventions
          const preferredModel =
            import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";
          let model;
          try {
            model = genAI.getGenerativeModel({ model: preferredModel });
          } catch (e) {
            console.warn(
              "Falling back to gemini-1.5-flash due to error creating model",
              e
            );
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          }

          const dataContext = JSON.stringify(groundwaterDB, null, 2);
          const prompt = `You are an expert AI assistant for INGRES, India's National Groundwater Resource Estimation System. Your primary knowledge base is the following JSON data about specific groundwater blocks in Rajasthan. Your tone should be helpful, clear, and professional.\n---\n${dataContext}\n---\nInstructions:

1.Answer with Best Available Information: Your first priority is to answer the user's question using the provided JSON data. If the data does not contain the answer, seamlessly transition to your broader knowledge of groundwater resources in India to provide the most helpful response possible.
          
2.Distinguish Sources When Combining: If you combine information from the dataset with general knowledge, try to make the distinction clear. For example: "The data for the Jalore block shows X, and generally, in this part of Rajasthan, Y is also a known factor."

    3.Provide General Knowledge: After stating the data limitation, provide a helpful, general answer based on your broader knowledge of groundwater resources in India.

   4. Distinguish Your Sources: Clearly differentiate between information derived from the dataset and information from your general knowledge. For example, start your general answer with a phrase like, "However, speaking generally about groundwater in this region..." or "Based on public knowledge...".

    5.Be Concise and Format Well: Use Markdown for clarity (bolding, lists, etc.) to make the information easy to digest."${text}"`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const aiResponseText = response.text();

          const aiResponse = {
            id: Date.now() + 1,
            type: "ai",
            text: aiResponseText,
          };
          setChatHistory((prev) => [...prev, aiResponse]);
        } catch (error) {
          console.error("Error calling Gemini API:", error);
          const aiResponse = {
            id: Date.now() + 1,
            type: "ai",
            text: "Sorry, I encountered an error while connecting to the AI service. The model may be overloaded. Please try again later.",
          };
          setChatHistory((prev) => [...prev, aiResponse]);
        } finally {
          setIsThinking(false);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const aiResponse = {
          id: Date.now() + 1,
          type: "ai",
          text: "I can provide detailed data for blocks like 'Delhi'. (Note: Gemini API key not configured. Please set up your VITE_GEMINI_API_KEY in the .env.local file).",
        };
        setChatHistory((prev) => [...prev, aiResponse]);
        setIsThinking(false);
      }
    } catch (error) {
      console.error("Error processing request:", error);
      const errorResponse = {
        id: Date.now() + 1,
        type: "ai",
        component: (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-red-700">
                Sorry, I encountered an error
              </h3>
            </div>
            <p className="text-red-600">
              I was unable to process your request. Please try again later or
              rephrase your question.
            </p>
          </div>
        ),
      };
      setChatHistory((prev) => [...prev, errorResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  const stats = useMemo(
    () => [
      {
        title: "Over-Exploited Units",
        value: 660,
        icon: AlertTriangle,
        iconColor: "text-red-500",
        change: "+5.2%",
      },
      {
        title: "Critical Units",
        value: 150,
        icon: BarChartHorizontal,
        iconColor: "text-orange-500",
        change: "+2.1%",
      },
      {
        title: "Semi-Critical Units",
        value: 553,
        icon: ShieldCheck,
        iconColor: "text-yellow-500",
        change: "-1.8%",
      },
      {
        title: "Safe Units",
        value: 3461,
        icon: Database,
        iconColor: "text-sky-500",
        change: "+0.5%",
      },
    ],
    []
  );

  const commonCommandBarProps = {
    inputValue,
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setInputValue(e.target.value),
    onSubmit: () => handleChatSubmit(inputValue),
    isListening,
    onMicClick: handleMicClick,
    hasSpeechSupport: hasRecognitionSupport,
    language,
    onLanguageChange: handleLanguageChange,
    activeYear: activeYear,
    onYearChange: setActiveYear,
    isCoPilotMode,
    onCoPilotModeChange: setIsCoPilotMode,
    showListeningIndicator,
    isListeningForFollowUp,
  };

  const suggestedPrompts = [
    {
      title: "Get Block Details",
      text: "Show the status of Delhi block",
      description: "Fetch a detailed visual report for a specific block.",
    },
    {
      title: "List Critical Areas",
      text: "List all 'Over-Exploited' blocks in Punjab",
      description: "Filter and view blocks by category and state.",
    },
    {
      title: "Compare Two Areas",
      text: "Compare groundwater extraction in Ludhiana and Jalandhar over the last 5 years.",
      description: "Analyze historical trends between two geographical areas.",
    },
    {
      title: "Predict Future Trends",
      text: "Forecast the groundwater level for my block for the next 6 months",
      description: "Use predictive analytics to see future possibilities.",
    },
    {
      title: "Get AI Recommendations",
      text: "What crops should I plant in a 'Critical' zone in Haryana?",
      description: "Receive actionable advice based on current data.",
    },
  ];

  const renderDashboard = () => (
    <div
      className={`container mx-auto px-4 pt-8 pb-24 ${
        embedded ? "mt-0" : "mt-10"
      }`}
    >
      {!embedded && (
        <div className="absolute top-8 right-8">
          {/* <NotificationBell /> */}
        </div>
      )}
      <div className="relative text-center max-w-4xl mx-auto">
        {!embedded && (
          <div className="absolute top-0 right-0 -mr-8 mt-4 w-32 h-32 bg-sky-400/30 rounded-full blur-3xl animate-pulse"></div>
        )}
        <h1
          className={`font-bold text-slate-800 ${
            embedded ? "text-3xl" : "text-5xl md:text-7xl"
          }`}
        >
          INGRES AI Assistant
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mt-4 mx-auto">
          Your intelligent command center for India's groundwater data.
        </p>
      </div>
      <div className="mt-12">
        <INGRESCommandBar
          {...commonCommandBarProps}
          onFileSelect={handleFakeMapAnalysis}
          isMapAnalysisOpen={isMapAnalysisOpen}
          setIsMapAnalysisOpen={setIsMapAnalysisOpen}
        />
      </div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.title}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <MemoizedStatCard stat={stat} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );

  // --- Located inside the INGRESAssistant component ---
  const renderChatView = () => (
    <div
      className={`flex items-center justify-center min-h-screen p-4 ${
        embedded ? "p-2" : "md:p-6"
      }`}
    >
      {" "}
      {/* CHANGED: Added more padding on larger screens */}
      {/* CHANGED: Increased max-width and adjusted height for a bigger chat window */}
      <Card
        className={`w-full flex flex-col shadow-2xl rounded-2xl ${
          embedded
            ? "h-full max-w-none bg-slate-800/90 border-slate-700"
            : "max-w-5xl h-[calc(100vh-1rem)] bg-white/60 backdrop-blur-xl border-white/30"
        }`}
      >
        <CardHeader
          className={`flex flex-row items-center justify-between ${
            embedded
              ? "border-slate-700 bg-slate-800/50"
              : "border-slate-200/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-xl">AI Data Analyst</CardTitle>
            {/* Development button - only show in development mode */}
          </div>
          <div className="flex items-center gap-2">
            {/* {!embedded && <NotificationBell />} */}
            <Button
              variant="ghost"
              onClick={() => {
                setView("dashboard");
                setChatHistory([]);
              }}
            >
              <X className="h-4 w-4 mr-2" /> End Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent
          ref={chatContainerRef}
          className={`flex-grow overflow-y-auto space-y-6 ${
            embedded ? "p-3" : "p-6"
          }`}
        >
          {" "}
          {/* CHANGED: Increased padding and spacing */}
          {chatHistory.length === 0 && (
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              initial="hidden"
              animate="visible"
              className="pt-4 pb-8 text-center"
            >
              <motion.h3
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="text-lg font-semibold text-slate-700 mb-4"
              >
                Try one of these sample queries...
              </motion.h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedPrompts.map((prompt, i) => (
                  <motion.button
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    onClick={() => handleChatSubmit(prompt.text)}
                    className={`p-4 rounded-lg text-left text-sm font-medium border shadow-sm hover:shadow-md ${
                      embedded
                        ? "bg-slate-700/50 text-slate-200 border-slate-600 hover:bg-slate-600/50"
                        : "bg-white/60 text-slate-800 hover:bg-slate-100/80"
                    }`}
                  >
                    <p className="font-semibold">{prompt.title}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          <AnimatePresence>
            // --- Replace your old chat mapping logic with this new version ---
            {chatHistory.map((msg, index) => {
              const isLastMessage = index === chatHistory.length - 1;
              // --- NEW: This line checks if the message contains a component (like our graph) ---
              const isGraphMessage = !!msg.component;

              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-4 ${
                    msg.type === "user" ? "ml-auto justify-end" : "mr-auto"
                  } w-full`} // The outer container is now full-width
                >
                  {msg.type === "ai" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-sky-600" />
                    </div>
                  )}

                  {/*
              --- THIS IS THE CRUCIAL FIX ---
              This div now applies a different width based on whether it's a graph or not.
            */}
                  <div className={isGraphMessage ? "w-full" : "max-w-2xl"}>
                    {msg.type === "user" ? (
                      <div className="bg-purple-500 text-white p-3 rounded-2xl rounded-br-lg shadow-sm">
                        <p className="text-base">{msg.text}</p>
                      </div>
                    ) : msg.component ? (
                      // If it's a graph component, render it directly without extra styling
                      msg.component
                    ) : (
                      // If it's an AI text message, render it inside the styled bubble
                      <div
                        className={`p-4 rounded-2xl rounded-bl-lg border shadow-sm prose prose-base max-w-none ${
                          embedded
                            ? "bg-slate-700/50 text-slate-200 border-slate-600"
                            : "bg-white text-slate-800"
                        }`}
                      >
                        {isLastMessage ? (
                          <AnimatedMarkdownMessage text={msg.text || ""} />
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.type === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                </motion.div>
              );
            })}
            {isThinking && <GeminiShimmerEffect />}
          </AnimatePresence>
        </CardContent>
        <CardContent
          className={`${
            embedded
              ? "border-slate-700 bg-slate-800/50"
              : "border-slate-200/80"
          } pt-4`}
        >
          <INGRESCommandBar
            {...commonCommandBarProps}
            onFileSelect={handleFakeMapAnalysis}
            isMapAnalysisOpen={isMapAnalysisOpen}
            setIsMapAnalysisOpen={setIsMapAnalysisOpen}
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div
      className={`min-h-screen text-slate-900 font-sans isolate ${
        embedded ? "bg-slate-900" : "bg-slate-100"
      }`}
    >
      {!embedded && (
        <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
          <div className="absolute -top-1/4 left-0 h-[800px] w-[800px] bg-purple-200/30 rounded-full blur-3xl filter animate-blob"></div>
          <div className="absolute -top-1/3 right-0 h-[800px] w-[800px] bg-sky-200/30 rounded-full filter animate-blob animation-delay-2000"></div>
        </div>
      )}
      <AnimatePresence>
        {toast.visible && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast({ ...toast, visible: false })}
          />
        )}
      </AnimatePresence>

      {/* Listening Indicator */}
      <AnimatePresence>
        {showListeningIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <ListeningIndicator />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {view === "dashboard" ? renderDashboard() : renderChatView()}
        </motion.div>
      </AnimatePresence>

      {/* Map Analysis Dialog */}
      <MapAnalysisDialog
        isOpen={isMapAnalysisOpen}
        onClose={() => setIsMapAnalysisOpen(false)}
        onImageAnalysis={handleImageAnalysis}
      />
    </div>
  );
};
