"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search, Camera, Bot, User, X, Mic, Languages, Bell,
    Lightbulb, ShieldCheck, CheckCircle, AlertTriangle, Database, TrendingUp, BarChartHorizontal, ArrowDown, ArrowUp, CloudRain, Satellite, Info
} from "lucide-react";

// --- Mock Database for INGRES Demonstration ---
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
const Toast = ({ message, type, onDismiss }: { message: string; type: string; onDismiss: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-slate-800';
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertTriangle : Info;
  
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

// --- Notification Bell Component ---
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { 
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false); 
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(prev => !prev)} className="rounded-full hover:bg-white/10 relative">
        <Bell className="h-5 w-5 text-slate-600" />
        <span className="absolute top-1 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="absolute top-full z-20 mt-2 w-80 right-0 origin-top-right rounded-xl border border-slate-200 bg-white/90 p-2 shadow-elevated backdrop-blur-sm"
          >
            <div className="font-semibold text-sm text-slate-800 p-2">Proactive Alerts</div>
            <div className="w-full text-left p-3 rounded-lg hover:bg-slate-100/50 transition-colors">
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
    "Over-Exploited": { badge: "bg-red-100 text-red-800 border-red-200", text: "text-red-600" },
    "Critical": { badge: "bg-orange-100 text-orange-800 border-orange-200", text: "text-orange-600" },
  };
  const styles = categoryStyles[data.category] || { badge: "bg-gray-100 text-gray-800 border-gray-200", text: "text-gray-600" };

  return (
    <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm border-slate-200/50 shadow-elevated">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-2xl font-bold text-slate-800">{data.block} Block</p>
            <p className="text-sm text-muted-foreground">{data.district}, {data.state}</p>
          </div>
          <Badge className={styles.badge}>{data.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-gradient-to-br from-sky-50 to-sky-100/50 rounded-lg border border-sky-200/50">
            <p className="text-xs font-semibold text-slate-600">Recharge (MCM)</p>
            <p className="text-lg font-bold text-sky-700 flex items-center justify-center gap-1">
              <ArrowDown className="h-4 w-4 text-green-500"/> {data.recharge}
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg border border-red-200/50">
            <p className="text-xs font-semibold text-slate-600">Extraction (MCM)</p>
            <p className="text-lg font-bold text-red-700 flex items-center justify-center gap-1">
              <ArrowUp className="h-4 w-4 text-red-500"/> {data.extraction}
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200/50">
            <p className="text-xs font-semibold text-slate-600">Extraction Stage</p>
            <p className={`text-lg font-bold ${styles.text}`}>{data.stage}</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4"/> 5-Year Trend
          </h4>
          <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
            <p className="text-center text-xs text-slate-500 py-4">
              [Chart: {data.trend.join("% → ")}%]
            </p>
          </div>
        </div>
        
        <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200 space-y-2">
           <h4 className="text-sm font-semibold text-slate-700">Enriched Data Sources</h4>
           <p className="text-xs text-slate-600 flex items-center gap-2">
             <CloudRain className="h-4 w-4 text-sky-500"/>IMD Data: Below-average rainfall recorded
           </p>
           <p className="text-xs text-slate-600 flex items-center gap-2">
             <Satellite className="h-4 w-4 text-green-500"/>ISRO Data: Increase in water-intensive crops
           </p>
        </div>
        
        {data.category === "Over-Exploited" && (
            <div className="p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 space-y-2">
                <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4"/> AI Advisor
                </h4>
                <p className="text-xs text-slate-700"><b>Forecast:</b> Groundwater level likely to decline by 15% this year.</p>
                <p className="text-xs text-slate-700"><b>Recommendation:</b> Promote micro-irrigation schemes and rainwater harvesting.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- INGRES Command Bar Component ---
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
  onYearChange 
}: {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isListening: boolean;
  onMicClick: () => void;
  hasSpeechSupport: boolean;
  language: string;
  onLanguageChange: () => void;
  activeYear: string;
  onYearChange: (year: string) => void;
}) => {
  const placeholders = useMemo(() => 
    language === 'en-US' 
      ? ["List all critical blocks...", "Show data for Sanganer block...", "Generate report for Rajasthan..."] 
      : ["सभी क्रिटिकल ब्लॉकों की सूची बनाएं...", "संगनेर ब्लॉक का डेटा दिखाएं...", "राजस्थान की रिपोर्ट बनाएं..."], 
    [language]
  );
  
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholders[0]);
  
  useEffect(() => {
    const interval = setInterval(() => 
      setCurrentPlaceholder(p => placeholders[(placeholders.indexOf(p) + 1) % placeholders.length]), 
      3000
    );
    return () => clearInterval(interval);
  }, [placeholders]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div className="w-full max-w-4xl mx-auto">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-primary rounded-3xl blur-lg opacity-20"></div>
        <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-command p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-full flex items-center">
              <Search className="h-6 w-6 text-slate-500 absolute left-4 z-10" />
              <AnimatePresence mode="wait">
                {!inputValue && !isListening && (
                  <motion.p 
                    key={currentPlaceholder}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="absolute left-16 text-base text-slate-500 pointer-events-none z-10"
                  >
                    {currentPlaceholder}
                  </motion.p>
                )}
              </AnimatePresence>
              <Input 
                value={inputValue} 
                onChange={onInputChange}
                className="w-full bg-transparent border-none text-lg h-auto py-5 pl-16 pr-16 text-slate-900 focus-visible:ring-0 placeholder:text-slate-400" 
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              />
              {hasSpeechSupport && (
                <button 
                  onClick={onMicClick}
                  className="absolute right-4 p-2 rounded-full hover:bg-slate-100/80 transition-colors z-10"
                >
                  <Mic className={`h-5 w-5 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                </button>
              )}
            </div>
            <Button 
              onClick={onSubmit}
              className="rounded-2xl h-16 px-8 bg-gradient-primary text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Submit
            </Button>
          </div>
          
          <div className="flex items-center justify-between pl-2 pr-2">
            <div className="flex items-center gap-3">
              <select 
                value={activeYear} 
                onChange={(e) => onYearChange(e.target.value)}
                className="rounded-full bg-slate-100/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              >
                <option>Latest (2025)</option>
                <option>2024</option>
                <option>2023</option>
              </select>
              
              {hasSpeechSupport && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200/50 hover:bg-slate-200/80"
                  onClick={onLanguageChange}
                >
                  <Languages className="h-4 w-4 mr-2" />
                  <span>{language === 'en-US' ? 'EN' : 'HI'}</span>
                </Button>
              )}
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
            <Button 
              variant="ghost" 
              size="sm"
              className="rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200/50 hover:bg-slate-200/80"
              onClick={() => fileInputRef.current?.click()}
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
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    
    useEffect(() => { 
      if (isInView) spring.set(value) 
    }, [spring, value, isInView]);
    
    useEffect(() => { 
      return spring.on("change", (latest) => { 
        if (ref.current) ref.current.textContent = `${Number(latest.toFixed(0)).toLocaleString()}${suffix}` 
      })
    }, [spring, suffix]);
    
    return <span ref={ref} />;
};

// --- Stat Card Component ---
const MemoizedStatCard = React.memo(({ stat }: { stat: any }) => (
    <Card className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-2xl shadow-soft hover:shadow-elevated transition-all duration-300 h-full">
        <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.iconBg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div>
                    <p className="text-3xl font-bold text-slate-800">
                      <AnimatedCounter value={stat.value} />
                    </p>
                    <p className="text-sm text-slate-600 font-medium">{stat.title}</p>
                </div>
            </div>
            <Badge className="absolute top-4 right-4 bg-green-50 text-green-700 border-green-200 font-semibold">
              {stat.change}
            </Badge>
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
  
  useEffect(() => { 
    if (chatContainerRef.current) 
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; 
  }, [chatHistory, isThinking]);
  
  const showToast = (message: string, type = 'info') => { 
    setToast({ message, type, visible: true }); 
  };

  const handleChatSubmit = async (text: string) => {
    if (!text.trim()) return;
    
    setView('chat');
    setChatHistory(prev => [...prev, { id: Date.now(), type: 'user', text }]);
    setInputValue('');
    setIsThinking(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let aiResponse: ChatMessage = { id: Date.now() + 1, type: 'ai' };
    const query = text.toLowerCase();
    const blockKeyword = Object.keys(MOCK_DB).find(key => query.includes(key));

    if (blockKeyword) {
      aiResponse.component = <BlockAssessmentCard data={MOCK_DB[blockKeyword as keyof typeof MOCK_DB]} />;
    } else if (query.includes('critical') && query.includes('block')) {
      aiResponse.text = "Here are the critical blocks: Chaksu (Jaipur), Bassi (Jaipur), Dausa (Dausa). Would you like detailed information about any specific block?";
    } else if (query.includes('report') || query.includes('generate')) {
      aiResponse.text = "I can generate comprehensive reports for any state or district. Which specific region would you like me to analyze?";
    } else {
      aiResponse.text = "I can provide detailed groundwater data for specific blocks like 'Sanganer' or 'Chaksu', generate reports, or list critical areas. What would you like to explore?";
    }
    
    setChatHistory(prev => [...prev, aiResponse]);
    setIsThinking(false);
  };
  
  const stats = useMemo(() => [
    { title: "Over-Exploited Units", value: 660, icon: AlertTriangle, iconColor: "text-red-600", iconBg: "from-red-50 to-red-100", change: "+5.2%" },
    { title: "Critical Units", value: 150, icon: BarChartHorizontal, iconColor: "text-orange-600", iconBg: "from-orange-50 to-orange-100", change: "+2.1%" },
    { title: "Semi-Critical Units", value: 553, icon: ShieldCheck, iconColor: "text-yellow-600", iconBg: "from-yellow-50 to-yellow-100", change: "-1.8%" },
    { title: "Safe Units", value: 3461, icon: Database, iconColor: "text-sky-600", iconBg: "from-sky-50 to-sky-100", change: "+0.5%" },
  ], []);

  const commonCommandBarProps = {
    inputValue, 
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value), 
    onSubmit: () => handleChatSubmit(inputValue),
    isListening, 
    onMicClick: handleMicClick, 
    hasSpeechSupport: hasRecognitionSupport, 
    language, 
    onLanguageChange: handleLanguageChange,
    activeYear: activeYear, 
    onYearChange: setActiveYear,
  };

  const suggestedPrompts = [
    { title: "Block Analysis", text: "Show the status of Sanganer block", icon: Database },
    { title: "Critical Areas", text: "List all critical blocks in Rajasthan", icon: AlertTriangle },
    { title: "Annual Report", text: "Generate the annual report for Punjab", icon: BarChartHorizontal },
  ];

  const renderDashboard = () => (
    <div className="container mx-auto px-6 pt-12 pb-24">
      <div className="absolute top-8 right-8">
        <NotificationBell />
      </div>
      
      <div className="relative text-center max-w-5xl mx-auto mb-16">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-glow/20 rounded-full blur-3xl animate-glow"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-lg text-muted-foreground mb-4 uppercase tracking-wider">Explore Our Ingres Suite</p>
          <h1 className="text-6xl md:text-7xl font-bold text-slate-800 mb-6">
            INGRES AI Assistant
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Your intelligent command center for India's groundwater data.
          </p>
        </motion.div>
      </div>
        
      <div className="mb-16">
        <INGRESCommandBar {...commonCommandBarProps} />
      </div>
        
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={{ 
          visible: { transition: { staggerChildren: 0.1 } } 
        }} 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
      >
        {stats.map((stat, index) => (
          <motion.div 
            key={stat.title} 
            variants={{ 
              hidden: { opacity: 0, y: 20 }, 
              visible: { opacity: 1, y: 0 } 
            }}
            transition={{ delay: index * 0.1 }}
          >
            <MemoizedStatCard stat={stat} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );

  const renderChatView = () => (
     <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-5xl h-[calc(100vh-2rem)] flex flex-col bg-white/80 backdrop-blur-xl border-white/50 shadow-elevated rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-primary rounded-xl">
                    <Bot className="h-6 w-6 text-white"/>
                  </div>
                  <CardTitle className="text-xl text-slate-800">INGRES AI Assistant</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <Button 
                      variant="ghost" 
                      onClick={() => { setView('dashboard'); setChatHistory([]); }}
                      className="hover:bg-slate-100/50"
                    >
                      <X className="h-4 w-4 mr-2"/> End Session
                    </Button>
                </div>
            </CardHeader>
            
            <CardContent ref={chatContainerRef} className="flex-grow p-6 overflow-y-auto space-y-6 bg-gradient-to-b from-white/40 to-white/20">
                {chatHistory.length === 0 && (
                  <motion.div 
                    variants={{ visible: { transition: { staggerChildren: 0.1 } } }} 
                    initial="hidden" 
                    animate="visible" 
                    className="pt-8 pb-12 text-center"
                  >
                    <motion.h3 
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
                      className="text-2xl font-semibold text-slate-700 mb-8"
                    >
                      How can I help you analyze groundwater data?
                    </motion.h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                      {suggestedPrompts.map((prompt, i) => (
                        <motion.button 
                          key={i}
                          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
                          onClick={() => handleChatSubmit(prompt.text)}
                          className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl text-left shadow-soft border border-white/60 hover:bg-white/90 hover:shadow-elevated transition-all duration-300"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-gradient-primary rounded-lg">
                              <prompt.icon className="h-5 w-5 text-white" />
                            </div>
                            <p className="font-semibold text-slate-800">{prompt.title}</p>
                          </div>
                          <p className="text-sm text-slate-600">{prompt.text}</p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                <AnimatePresence>
                  {chatHistory.map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      layout 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex items-start gap-4 max-w-4xl ${msg.type === 'user' ? 'ml-auto justify-end' : 'mr-auto'}`}
                    >
                        {msg.type === 'ai' && (
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft">
                            <Bot className="w-5 h-5 text-white"/>
                          </div>
                        )}
                        <div className="max-w-xl">
                          {msg.type === 'user' ? (
                            <div className="bg-gradient-primary text-white p-4 rounded-3xl rounded-br-lg shadow-soft">
                              <p className="text-sm">{msg.text}</p>
                            </div>
                          ) : (
                            msg.text ? (
                              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-3xl rounded-bl-lg border border-white/60 shadow-soft text-slate-800">
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                              </div>
                            ) : msg.component
                          )}
                        </div>
                        {msg.type === 'user' && (
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-200/80 backdrop-blur-sm flex items-center justify-center shadow-soft">
                            <User className="w-5 h-5 text-slate-600"/>
                          </div>
                        )}
                    </motion.div>
                  ))}
                  
                  {isThinking && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-4"
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft">
                          <Bot className="w-5 h-5 text-white"/>
                        </div>
                        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-sm border border-white/60 shadow-soft">
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-slate-600">Analyzing...</span>
                          </div>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </CardContent>
            
            <div className="border-t border-slate-200/50 bg-white/50 backdrop-blur-sm p-6">
                <INGRESCommandBar {...commonCommandBarProps} />
            </div>
        </Card>
     </div>
  );

  return (  
    <div className="min-h-screen bg-ingres-backdrop text-foreground font-sans relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/30 via-transparent to-sky-200/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-gradient-to-br from-sky-200/20 via-transparent to-purple-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-gradient-to-br from-primary-glow/10 via-transparent to-primary/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Toast Notifications */}
      <AnimatePresence>
        {toast.visible && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onDismiss={() => setToast({ ...toast, visible: false })} 
          />
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={view} 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
            {view === 'dashboard' ? renderDashboard() : renderChatView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};