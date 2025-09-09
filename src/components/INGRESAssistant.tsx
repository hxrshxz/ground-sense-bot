"use client";
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
import {
    Search, Camera, Bot, User, X, Mic, Languages, Bell, Server, Info,
    Lightbulb, ShieldCheck, CheckCircle, AlertTriangle, Database,  TrendingUp,  BarChartHorizontal, ArrowDown, ArrowUp, CloudRain, Satellite, BrainCircuit
} from "lucide-react";


//================================================================================
// --- SHIMMER EFFECT COMPONENT ---
//================================================================================
const GeminiShimmerEffect = () => {
  const thinkingPhrases = [
    "Connecting to data source...", "Analyzing groundwater levels...", "Processing sensor data...", "Identifying patterns...", "Generating insights...",
  ];
  const shimmerLines = [
    { width: "95%", delay: 0 }, { width: "100%", delay: 0.1 }, { width: "90%", delay: 0.2 }, { width: "75%", delay: 0.3 },
  ];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % thinkingPhrases.length);
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-start gap-3 max-w-2xl mr-auto">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
        className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft"
      >
        <BrainCircuit className="w-5 h-5 text-white" />
      </motion.div>
      <div className="p-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/60 shadow-soft space-y-3 w-full max-w-md">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
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
            <motion.div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
            <motion.div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }} />
            <motion.div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
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

// --- Mock Database ---
const MOCK_DB = {
  sanganer: {
    block: "Sanganer", district: "Jaipur", state: "Rajasthan", category: "Over-Exploited",
    recharge: 120.5, extraction: 155.8, stage: "129%", trend: [98, 107, 115, 122, 129],
  },
  chaksu: {
    block: "Chaksu", district: "Jaipur", state: "Rajasthan", category: "Critical",
    recharge: 95.2, extraction: 94.1, stage: "99%", trend: [82, 88, 91, 95, 99],
  },
};

// --- Custom Hook for Voice Recognition ---
const useSpeechRecognition = ({ lang }: { lang: string }) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const hasRecognitionSupport = useMemo(() => typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window), []);
  
  useEffect(() => {
    if (!hasRecognitionSupport) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      setText(finalTranscript);
    };
    recognition.onend = () => setIsListening(false);
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [lang, hasRecognitionSupport]);

  const startListening = () => { if (recognitionRef.current && !isListening) { setText(''); recognitionRef.current.start(); setIsListening(true); } };
  const stopListening = () => { if (recognitionRef.current && isListening) { recognitionRef.current.stop(); setIsListening(false); } };
  return { text, startListening, stopListening, isListening, hasRecognitionSupport };
};

// --- Toast Notification Component ---
const Toast = ({ message, type, onDismiss }: { message: string, type: string, onDismiss: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-slate-800';
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  return (<motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-4 rounded-lg shadow-2xl text-white ${bgColor}`}><Icon className="h-6 w-6" /><span className="text-lg font-medium">{message}</span></motion.div>);
};

// --- HELPER UI COMPONENTS ---
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(prev => !prev)} className="rounded-full hover:bg-slate-200/70 relative">
        <Bell className="h-5 w-5 text-slate-600" />
        <span className="absolute top-1 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full z-20 mt-2 w-80 right-0 origin-top-right rounded-xl border border-slate-200 bg-white/90 p-2 shadow-xl backdrop-blur-sm">
            <div className="font-semibold text-sm text-slate-800 p-2">Proactive Alerts</div>
            <div className="w-full text-left p-3 rounded-lg hover:bg-slate-100">
              <p className="font-medium text-sm text-slate-700">Status Change: Sanganer Block</p>
              <p className="text-xs text-slate-500">This block has shifted from 'Critical' to 'Over-Exploited'.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Block Assessment Card Component ---
const BlockAssessmentCard = ({ data }: { data: any }) => {
  const categoryStyles: Record<string, { badge: string; text: string }> = {
    "Over-Exploited": { badge: "bg-red-100 text-red-800", text: "text-red-600" },
    "Critical": { badge: "bg-orange-100 text-orange-800", text: "text-orange-600" },
  };
  const styles = categoryStyles[data.category] || { badge: "bg-slate-100 text-slate-800", text: "text-slate-600" };

  return (
    <Card className="w-full max-w-lg bg-white/80 backdrop-blur-sm border-slate-200/80 shadow-lg text-slate-900">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-2xl font-bold">{data.block} Block</p>
            <p className="text-sm text-slate-500">{data.district}, {data.state}</p>
          </div>
          <Badge className={styles.badge}>{data.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
            <p className="text-xs font-semibold text-slate-500">Recharge (MCM)</p>
            <p className="text-lg font-bold text-sky-800 flex items-center justify-center gap-1"><ArrowDown className="h-4 w-4 text-green-500"/> {data.recharge}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs font-semibold text-slate-500">Extraction (MCM)</p>
            <p className="text-lg font-bold text-red-800 flex items-center justify-center gap-1"><ArrowUp className="h-4 w-4 text-red-500"/> {data.extraction}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-xs font-semibold text-slate-500">Extraction Stage</p>
            <p className={`text-lg font-bold ${styles.text}`}>{data.stage}</p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><TrendingUp className="h-4 w-4"/> 5-Year Trend</h4>
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200"><p className="text-center text-xs text-slate-500 py-4">[Chart placeholder: {data.trend.join("% → ")}%]</p></div>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
           <h4 className="text-sm font-semibold text-slate-700">Enriched Data</h4>
           <p className="text-xs text-slate-600 flex items-center gap-2"><CloudRain className="h-4 w-4 text-sky-500"/>IMD Data: Below-average rainfall recorded.</p>
           <p className="text-xs text-slate-600 flex items-center gap-2"><Satellite className="h-4 w-4 text-green-500"/>ISRO Data: Increase in water-intensive crops.</p>
        </div>
        {data.category === "Over-Exploited" && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
                <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2"><Lightbulb className="h-4 w-4"/> AI Advisor</h4>
                <p className="text-xs text-slate-700"><b>Forecast:</b> Groundwater level likely to decline.</p>
                <p className="text-xs text-slate-700"><b>Recommendation:</b> Promote micro-irrigation schemes.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Proactive Insight Card Component ---
const ProactiveInsightCard = () => {
  const criticalShifts = 1;
  const regionsMonitored = Object.keys(MOCK_DB).length;
  const highestExtractionStage = MOCK_DB.sanganer.stage;

  return (
    <Card className="w-full max-w-lg bg-white/80 backdrop-blur-sm border-slate-200/80 shadow-lg text-slate-900">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-xl text-slate-900">Proactive Groundwater Insights</h3>
                <p className="text-sm text-slate-500">Summary for Q3 2025</p>
            </div>
            <Badge className="bg-sky-100 text-sky-800">AI Generated</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs font-semibold text-slate-500">Critical Shifts</p>
                <p className="text-lg font-bold text-red-800 flex items-center justify-center gap-1"><AlertTriangle className="h-4 w-4"/> {criticalShifts}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-xs font-semibold text-slate-500">Highest Stage</p>
                <p className="text-lg font-bold text-purple-800">{highestExtractionStage}</p>
            </div>
             <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-semibold text-slate-500">Blocks Analyzed</p>
                <p className="text-lg font-bold text-slate-800">{regionsMonitored}</p>
            </div>
        </div>
        <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4"/> Key Observation</h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-700">
                    The <strong>Sanganer</strong> block has shown a consistent upward trend in extraction, moving it into the 'Over-Exploited' category. This is correlated with an increase in water-intensive crops identified via satellite data and below-average rainfall.
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};


// --- Command Bar Component ---
const INGRESCommandBar = ({ inputValue, onInputChange, onSubmit, isListening, onMicClick, hasSpeechSupport, language, onLanguageChange, activeYear, onYearChange }: any) => {
  const placeholders = useMemo(() => language === 'en-US' ? ["Show data for Sanganer block...", "List all critical blocks..."] : ["संगनेर ब्लॉक का डेटा दिखाएं...", "सभी क्रिटिकल ब्लॉकों की सूची बनाएं..."], [language]);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholders[0]);
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentPlaceholder(p => placeholders[(placeholders.indexOf(p) + 1) % placeholders.length]), 4000);
    return () => clearInterval(interval);
  }, [placeholders]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div className="w-full max-w-3xl mx-auto">
        <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-sky-400 rounded-3xl blur-lg opacity-30"></div>
        <div className="relative bg-white/70 backdrop-blur-xl  border border-white/40 rounded-2xl shadow-lg p-4 space-y-4">
            <div className="flex items-center space-x-4">
                <div className="relative w-full flex items-center">
                    <Search className="h-6 w-6 text-slate-500 absolute left-3" />
                    <AnimatePresence mode="wait">
                    {!inputValue && !isListening && (<motion.p key={currentPlaceholder} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute left-12 text-base text-slate-600 pointer-events-none">{currentPlaceholder}</motion.p>)}
                    </AnimatePresence>
                    <Input value={inputValue} onChange={onInputChange} className="w-full bg-transparent border-none text-xl h-auto py-4 pl-12 pr-12 text-slate-900 focus-visible:ring-0" onKeyDown={(e) => e.key === "Enter" && onSubmit()} />
                    {hasSpeechSupport && (<button onClick={onMicClick} className="absolute right-3 p-2 rounded-full hover:bg-slate-200/60"><Mic className={`h-6 w-6 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} /></button>)}
                </div>
                <Button onClick={onSubmit} className="rounded-xl h-14 px-8 bg-gradient-to-r from-purple-500 to-sky-500 text-white font-semibold">Submit</Button>
            </div>
            <div className="flex items-center justify-between pl-2 pr-1">
                <div className="flex items-center gap-2">
                    <select value={activeYear} onChange={(e) => onYearChange(e.target.value)} className="rounded-full bg-slate-200/70 px-4 py-1.5 text-sm font-medium text-slate-700 border-none focus:ring-0">
                        <option>Latest (2025)</option><option>2024</option><option>2023</option>
                    </select>
                    {hasSpeechSupport && (<Button variant="ghost" className="h-auto px-3 py-1.5 rounded-lg" onClick={onLanguageChange}><Languages className="h-4 w-4 mr-2" /><span>{language === 'en-US' ? 'EN' : 'HI'}</span></Button>)}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                <Button variant="ghost" className="h-auto px-3 py-1.5 rounded-lg" onClick={() => fileInputRef.current?.click()}><Camera className="h-4 w-4 mr-2" /><span>Analyze Map</span></Button>
            </div>
        </div>
        </div>
    </motion.div>
  );
};

// --- Animated Counter ---
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    useEffect(() => { if (isInView) spring.set(value) }, [spring, value, isInView]);
    useEffect(() => { 
        const unsubscribe = spring.on("change", (latest) => { 
            if (ref.current) ref.current.textContent = `${Number(latest.toFixed(0)).toLocaleString()}${suffix}` 
        });
        return () => unsubscribe();
    }, [spring, suffix]);
    return <span ref={ref} />;
};

const MemoizedStatCard = React.memo(({ stat }: { stat: any }) => (
    <Card className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-2xl shadow-lg hover:shadow-xl transition-all h-full">
        <CardContent className="p-5 relative">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.iconColor.replace('text-','from-').replace('-500','-400/20')} ${stat.iconColor.replace('text-','to-').replace('-500','-500/20')}`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-800"><AnimatedCounter value={stat.value} /></p>
                    <p className="text-sm text-slate-600 font-medium">{stat.title}</p>
                </div>
            </div>
            <Badge className="absolute top-4 right-4 bg-green-100 text-green-800 border-green-200 font-semibold">{stat.change}</Badge>
        </CardContent>
    </Card>
));
MemoizedStatCard.displayName = 'MemoizedStatCard';

// --- Main Chat Message Type ---
type ChatMessage = {
  id: number;
  type: string;
  text?: string;
  component?: React.ReactNode;
};

// --- Main INGRES Assistant Component ---
export const INGRESAssistant = () => {
  const [view, setView] = useState('dashboard');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeYear, setActiveYear] = useState('Latest (2025)');
  const [language, setLanguage] = useState('en-US');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

  const { text: voiceText, startListening, stopListening, isListening, hasRecognitionSupport } = useSpeechRecognition({ lang: language });
  
  useEffect(() => { if (voiceText) setInputValue(voiceText); }, [voiceText]);
  
  const handleMicClick = () => isListening ? stopListening() : startListening();
  const handleLanguageChange = () => setLanguage(prev => prev === 'en-US' ? 'hi-IN' : 'en-US');
  
  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [chatHistory, isThinking]);
  
  const showToast = (message: string, type = 'info') => { setToast({ message, type, visible: true }); };

  // --- MODIFIED: handleChatSubmit with Gemini API Integration ---
  const handleChatSubmit = async (text: string) => {
    const query = text.toLowerCase();
    setView('chat');
    setChatHistory(prev => [...prev, { id: Date.now(), type: 'user', text }]);
    setInputValue('');
    setIsThinking(true);
    
    // --- 1. Check for local commands ---
    const blockKeyword = Object.keys(MOCK_DB).find(key => query.includes(key));
    if (blockKeyword) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const aiResponse = { 
            id: Date.now() + 1, 
            type: 'ai', 
            component: <BlockAssessmentCard data={MOCK_DB[blockKeyword as keyof typeof MOCK_DB]} /> 
        };
        setChatHistory(prev => [...prev, aiResponse]);
        setIsThinking(false);
        return;
    }

    if (query.includes("proactive insight") || query.includes("generate a summary") || query.includes("generate a report")) {
         await new Promise(resolve => setTimeout(resolve, 1500));
         const aiResponse = { 
            id: Date.now() + 1, 
            type: 'ai', 
            component: <ProactiveInsightCard />
        };
        setChatHistory(prev => [...prev, aiResponse]);
        setIsThinking(false);
        return;
    }

    // --- 2. Call Gemini API ---
 const API_KEY = "AIzaSyAOwDOc9YeueDaj8sxQsgDjOpKo_FV1pMc";
    if (API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const dataContext = JSON.stringify(MOCK_DB, null, 2);
            const prompt = `You are an AI assistant for INGRES, India's National Groundwater Resource Estimation System. Your knowledge base is the following JSON data about a few groundwater blocks in Rajasthan:\n---\n${dataContext}\n---\nBased ONLY on this data, answer the user's question. If the question is about data you don't have (e.g., Punjab), state that you only have data for the provided blocks in Rajasthan. Be concise and helpful. Use Markdown for formatting (e.g., **bold** for emphasis, lists). User's question: "${text}"`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const aiResponseText = response.text();
            
            const aiResponse = { id: Date.now() + 1, type: 'ai', text: aiResponseText };
            setChatHistory(prev => [...prev, aiResponse]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const aiResponse = { id: Date.now() + 1, type: 'ai', text: "Sorry, I encountered an error while connecting to the AI service. Please try again later." };
            setChatHistory(prev => [...prev, aiResponse]);
        } finally {
            setIsThinking(false);
        }
    } else {
        // --- 3. Fallback logic ---
        await new Promise(resolve => setTimeout(resolve, 1500));
        const aiResponse = { 
            id: Date.now() + 1, 
            type: 'ai', 
            text: "I can provide detailed data for blocks like 'Sanganer' or 'Chaksu'. (Note: Gemini API key not configured)."
        };
        setChatHistory(prev => [...prev, aiResponse]);
        setIsThinking(false);
    }
  };
  
  const stats = useMemo(() => [
    { title: "Over-Exploited Units", value: 660, icon: AlertTriangle, iconColor: "text-red-500", change: "+5.2%" },
    { title: "Critical Units", value: 150, icon: BarChartHorizontal, iconColor: "text-orange-500", change: "+2.1%" },
    { title: "Semi-Critical Units", value: 553, icon: ShieldCheck, iconColor: "text-yellow-500", change: "-1.8%" },
    { title: "Safe Units", value: 3461, icon: Database, iconColor: "text-sky-500", change: "+0.5%" },
  ], []);

  const commonCommandBarProps = {
    inputValue, onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value), onSubmit: () => handleChatSubmit(inputValue),
    isListening, onMicClick: handleMicClick, hasSpeechSupport: hasRecognitionSupport, language, onLanguageChange: handleLanguageChange,
    activeYear: activeYear, onYearChange: setActiveYear,
  };

  const suggestedPrompts = [
    { title: "Get Block Details", text: "Show the status of Sanganer block" },
    { title: "Generate an Insight", text: "Generate a proactive insight summary" },
    { title: "Compare Blocks", text: "Compare the extraction stages of Chaksu and Sanganer" },
    { title: "Ask About Data", text: "List all critical blocks in Punjab" },
  ];

  const renderDashboard = () => (
    <div className="container mx-auto mt-[-80px] px-4 pt-8 pb-24 mt-10">
        <div className="absolute top-8 right-8"><NotificationBell /></div>
        <div className="relative text-center max-w-4xl mx-auto">
             <div className="absolute top-0 right-0 -mr-8 mt-4 w-32 h-32 bg-sky-400/30 rounded-full blur-3xl animate-pulse"></div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-800">INGRES AI Assistant</h1>
            <p className="text-xl text-slate-600 max-w-2xl mt-4 mx-auto">Your intelligent command center for India's groundwater data.</p>
        </div>
        <div className="mt-12"><INGRESCommandBar {...commonCommandBarProps} /></div>
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto">
            {stats.map((stat) => (<motion.div key={stat.title} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}><MemoizedStatCard stat={stat} /></motion.div>))}
        </motion.div>
    </div>
  );

  const renderChatView = () => (
     <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-4xl h-[calc(100vh-4rem)] flex flex-col bg-white/60 backdrop-blur-xl border-white/30 shadow-2xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/80">
                <div className="flex items-center gap-3"><Bot className="h-6 w-6 text-purple-600"/><CardTitle className="text-xl">AI Data Analyst</CardTitle></div>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <Button variant="ghost" onClick={() => { setView('dashboard'); setChatHistory([]); }}><X className="h-4 w-4 mr-2"/> End Chat</Button>
                </div>
            </CardHeader>
            <CardContent ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                {chatHistory.length === 0 && (
                  <motion.div variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible" className="pt-4 pb-8 text-center">
                    <motion.h3 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-lg font-semibold text-slate-700 mb-4">Try one of these sample queries...</motion.h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestedPrompts.map((prompt, i) => (
                        <motion.button key={i} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} onClick={() => handleChatSubmit(prompt.text)} className="p-4 bg-white/60 rounded-lg text-left text-sm font-medium text-slate-800 border shadow-sm hover:bg-slate-100/80 hover:shadow-md">
                          <p className="font-semibold">{prompt.title}</p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
                <AnimatePresence>
                  {chatHistory.map((msg, index) => {
                    const isLastMessage = index === chatHistory.length - 1;
                    return (
                        <motion.div key={msg.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 max-w-2xl ${msg.type === 'user' ? 'ml-auto justify-end' : 'mr-auto'}`}>
                            {msg.type === 'ai' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-sky-100 to-purple-100 flex items-center justify-center"><Bot className="w-5 h-5 text-sky-600"/></div>}
                            <div className="max-w-xl">
                              {msg.type === 'user' ? (<div className="bg-purple-500 text-white p-3 rounded-2xl rounded-br-lg shadow-sm"><p className="text-sm">{msg.text}</p></div>)
                               : (msg.text ? 
                                    <div className="bg-white p-3 rounded-2xl rounded-bl-lg border shadow-sm text-slate-800 prose prose-sm max-w-none">
                                      {/* --- CORRECTED LOGIC --- */}
                                      {msg.type === 'ai' && isLastMessage && !isThinking ? (
                                        <TextGenerateEffect>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                              {msg.text}
                                            </ReactMarkdown>
                                        </TextGenerateEffect>
                                      ) : (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {msg.text}
                                        </ReactMarkdown>
                                      )}
                                    </div> 
                                  : msg.component)}
                            </div>
                            {msg.type === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><User className="w-5 h-5 text-slate-600"/></div>}
                        </motion.div>
                    )
                  })}
                  {isThinking && <GeminiShimmerEffect />}
                </AnimatePresence>
            </CardContent>
            <CardContent className="border-t border-slate-200/80 pt-4">
                <INGRESCommandBar {...commonCommandBarProps} />
            </CardContent>
        </Card>
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans isolate">
      <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden">
        <div className="absolute -top-1/4 left-0 h-[800px] w-[800px] bg-purple-200/30 rounded-full blur-3xl filter animate-blob"></div>
        <div className="absolute -top-1/3 right-0 h-[800px] w-[800px] bg-sky-200/30 rounded-full filter animate-blob animation-delay-2000"></div>
      </div>
      <AnimatePresence>
        {toast.visible && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {view === 'dashboard' ? renderDashboard() : renderChatView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};