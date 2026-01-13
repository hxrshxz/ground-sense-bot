"use client";

import { CornerRightUp, Mic, Globe, StopCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { motion, AnimatePresence } from "framer-motion";

interface AIInputWithLoadingProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  loadingDuration?: number;
  thinkingDuration?: number;
  onSubmit?: (value: string) => void | Promise<void>;
  className?: string;
  autoAnimate?: boolean;
  showMic?: boolean;
  showLanguageToggle?: boolean;
  onLanguageChange?: (language: string) => void;
  currentLanguage?: string;
  // Voice recognition props
  voiceText?: string;
  isListening?: boolean;
  onStartListening?: () => void;
  onStopListening?: () => void;
  hasRecognitionSupport?: boolean;
}

const LANGUAGES = [
  { code: "en-US", label: "English", short: "EN" },
  { code: "hi-IN", label: "Hindi", short: "HI" },
  { code: "bn-IN", label: "Bengali", short: "BN" },
  { code: "gu-IN", label: "Gujarati", short: "GU" },
  { code: "ta-IN", label: "Tamil", short: "TA" },
  { code: "te-IN", label: "Telugu", short: "TE" },
  { code: "mr-IN", label: "Marathi", short: "MR" },
  { code: "pa-IN", label: "Punjabi", short: "PA" },
];

export function AIInputWithLoading({
  id = "ai-input-with-loading",
  placeholder = "Ask me anything!",
  minHeight = 48,
  maxHeight = 200,
  loadingDuration = 3000,
  thinkingDuration = 1000,
  onSubmit,
  className,
  autoAnimate = false,
  showMic = true,
  showLanguageToggle = true,
  onLanguageChange,
  currentLanguage = "en-US",
  // Voice recognition props
  voiceText = "",
  isListening: externalIsListening,
  onStartListening,
  onStopListening,
  hasRecognitionSupport = true
}: AIInputWithLoadingProps) {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(autoAnimate);
  const [isAnimating, setIsAnimating] = useState(autoAnimate);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const runAnimation = () => {
      if (!isAnimating) return;
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, thinkingDuration);
      }, loadingDuration);
    };

    if (isAnimating) {
      runAnimation();
    }

    return () => clearTimeout(timeoutId);
  }, [isAnimating, loadingDuration, thinkingDuration]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || submitted) {
      console.log("[AIInput] Submit blocked - empty input or already submitted", { inputValue: inputValue.trim(), submitted });
      return;
    }
    
    console.log("[AIInput] Submitting:", inputValue);
    setSubmitted(true);
    
    try {
      await onSubmit?.(inputValue);
      console.log("[AIInput] Submit successful");
    } catch (error) {
      console.error("[AIInput] Submit error:", error);
    }
    
    setInputValue("");
    adjustHeight(true);
    
    setTimeout(() => {
      setSubmitted(false);
    }, loadingDuration);
  };

  // Use external voice recognition if provided, otherwise fall back to internal state
  const isVoiceRecording = externalIsListening !== undefined ? externalIsListening : isRecording;

  // Effect to update input value when voice text changes
  useEffect(() => {
    if (voiceText && voiceText.trim()) {
      setInputValue(voiceText);
      adjustHeight();
    }
  }, [voiceText, adjustHeight]);

  // Sync internal recording state with external listening state
  useEffect(() => {
    if (externalIsListening !== undefined) {
      setIsRecording(externalIsListening);
    }
  }, [externalIsListening]);

  const handleMicClick = () => {
    console.log("[AIInput] Mic clicked, isRecording:", isVoiceRecording);
    if (isVoiceRecording) {
      // Stop listening
      if (onStopListening) {
        onStopListening();
      }
      setIsRecording(false);
    } else {
      // Start listening
      if (onStartListening) {
        onStartListening();
      }
      setIsRecording(true);
    }
  };

  const handleLanguageSelect = (langCode: string) => {
    console.log("[AIInput] Language selected:", langCode);
    setSelectedLanguage(langCode);
    setShowLangDropdown(false);
    onLanguageChange?.(langCode);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentLang = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];
  const hasContent = inputValue.trim() !== "";

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-2xl w-full mx-auto">
        {/* Main Input Container - Light/Transparent Theme */}
        <div className={cn(
          "relative rounded-2xl border bg-white/50 backdrop-blur-lg border-white/30 p-3 shadow-xl transition-all duration-300",
          isRecording && "border-red-400/70 bg-red-50/50"
        )}>
          
          {/* Voice Recording UI */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col items-center justify-center w-full py-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-sm text-slate-700">{formatTime(recordingTime)}</span>
                </div>
                <div className="w-full h-10 flex items-center justify-center gap-0.5 px-4">
                  {[...Array(32)].map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 rounded-full bg-slate-400 animate-pulse"
                      style={{
                        height: `${Math.max(15, Math.random() * 100)}%`,
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: `${0.5 + Math.random() * 0.5}s`,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text Input */}
          <div className={cn(
            "transition-all duration-300",
            isRecording ? "h-0 overflow-hidden opacity-0" : "opacity-100"
          )}>
            <Textarea
              id={id}
              placeholder={placeholder}
              className={cn(
                "w-full bg-transparent border-none rounded-xl px-4 py-3",
                "placeholder:text-slate-600",
                "text-slate-800 resize-none text-base leading-[1.4]",
                "focus-visible:outline-none focus-visible:ring-0",
                `min-h-[${minHeight}px]`
              )}
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={submitted || isRecording}
            />
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between pt-2">
            {/* Left Side Actions */}
            <div className={cn(
              "flex items-center gap-1 transition-opacity duration-300",
              isRecording ? "opacity-0 invisible" : "opacity-100 visible"
            )}>
              
              {/* Language Toggle */}
              {showLanguageToggle && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowLangDropdown(!showLangDropdown)}
                    className={cn(
                      "rounded-full transition-all flex items-center gap-1.5 px-3 py-1.5 border h-8",
                      showLangDropdown
                        ? "bg-blue-50 border-blue-300 text-blue-600"
                        : "bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-medium">{currentLang.short}</span>
                  </button>

                  {/* Language Dropdown */}
                  <AnimatePresence>
                    {showLangDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between",
                              selectedLanguage === lang.code
                                ? "bg-blue-50 text-blue-600"
                                : "text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <span>{lang.label}</span>
                            <span className="text-xs opacity-60">{lang.short}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right Side - Submit/Mic Button */}
            <button
              onClick={() => {
                if (isVoiceRecording) {
                  handleMicClick();
                } else if (hasContent) {
                  handleSubmit();
                } else if (showMic && hasRecognitionSupport) {
                  handleMicClick();
                }
              }}
              className={cn(
                "h-9 w-9 rounded-full transition-all duration-200 flex items-center justify-center",
                isVoiceRecording
                  ? "bg-red-100 hover:bg-red-200 text-red-500"
                  : hasContent
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              )}
              type="button"
              disabled={submitted && !isVoiceRecording}
            >
              {submitted && !isVoiceRecording ? (
                <div
                  className="w-4 h-4 bg-blue-600 rounded-sm animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              ) : isVoiceRecording ? (
                <StopCircle className="w-5 h-5" />
              ) : hasContent ? (
                <CornerRightUp className="w-4 h-4" />
              ) : showMic && hasRecognitionSupport ? (
                <Mic className="w-5 h-5" />
              ) : (
                <CornerRightUp className={cn("w-4 h-4 opacity-30")} />
              )}
            </button>
          </div>
        </div>

        {/* Status Text - Only show during recording */}
        {isVoiceRecording && (
          <p className="text-center mt-2 h-4 text-xs text-slate-500">
            Listening... Click stop to finish.
          </p>
        )}
      </div>
    </div>
  );
}
