"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Check, XCircle } from "lucide-react";
import { useChatStore } from "@/lib/stores/chatStore";
import { useWMSOrchestrator } from "@/containers/admin/hooks/useWMSOrchestrator";

export function VoiceAssistantOverlay({ workspace, dashboard }: { workspace: any, dashboard: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<"idle" | "listening" | "processing" | "speaking" | "confirming">("idle");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [pendingAction, setPendingAction] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(typeof window !== 'undefined' ? window.speechSynthesis : null);
  
  const { addMessage } = useChatStore();
  
  // Replace with real orchestrator
  const { callGeminiAI } = useWMSOrchestrator(
    workspace?.promptSettings?.storeLayout || [],
    () => {}
  );

  useEffect(() => {
    const handleStart = () => {
      setIsOpen(true);
      startListening();
    };
    window.addEventListener("start-voice-chat", handleStart);
    return () => window.removeEventListener("start-voice-chat", handleStart);
  }, []);

  const initRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    return recognition;
  };

  const startListening = () => {
    const recognition = initRecognition();
    if (!recognition) return;
    
    setTranscript("");
    setState("listening");
    
    recognition.onresult = (e: any) => {
      let currentTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        currentTranscript += e.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onend = () => {
      if (state === "listening") {
        processInput();
      }
    };

    try {
      recognition.start();
    } catch (e) {}
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processInput = async () => {
    // Save user message to DB
    setState("processing");
    const finalTranscript = transcript.trim();
    if (!finalTranscript) {
      closeOverlay();
      return;
    }

    await addMessage({
      workspaceId: workspace.id,
      dashboardId: dashboard.id,
      role: "user",
      content: finalTranscript,
    });

    // Call AI
    const result = await callGeminiAI(finalTranscript, []);
    
    await addMessage({
      workspaceId: workspace.id,
      dashboardId: dashboard.id,
      role: "assistant",
      content: result.reply,
      metadata: result.logs.length > 0 ? { action: result.logs.join(", ") } : undefined
    });

    setAiResponse(result.reply);
    
    // Check if it's a confirmation question
    const isConfirmation = result.reply.toLowerCase().includes("você quer") || result.reply.includes("?");
    if (isConfirmation) {
      setPendingAction(true);
    }

    speak(result.reply, isConfirmation);
  };

  const speak = (text: string, askForConfirmation: boolean) => {
    if (!synthesisRef.current) return;
    
    synthesisRef.current.cancel(); // stop anything playing
    
    setState("speaking");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.pitch = 1;
    utterance.rate = 1.1; // Slightly faster for AI feel
    
    utterance.onend = () => {
      if (askForConfirmation) {
        startConfirmationListening();
      } else {
        setTimeout(closeOverlay, 1500); // Close after 1.5s if no confirmation needed
      }
    };
    
    synthesisRef.current.speak(utterance);
  };

  const startConfirmationListening = () => {
    setState("confirming");
    setTranscript("");
    const recognition = initRecognition();
    if (!recognition) return;
    
    recognition.onresult = (e: any) => {
      const currentTranscript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setTranscript(currentTranscript);
    };

    recognition.onend = () => {
      const finalTranscript = transcript.trim().toLowerCase();
      if (finalTranscript.includes("sim") || finalTranscript.includes("claro") || finalTranscript.includes("pode")) {
         // Proceed
         speak("Confirmado. Executando ação.", false);
      } else if (finalTranscript.includes("não") || finalTranscript.includes("cancela")) {
         speak("Ação cancelada.", false);
      } else {
         closeOverlay();
      }
    };

    try { recognition.start(); } catch (e) {}
  };

  const closeOverlay = () => {
    stopListening();
    if (synthesisRef.current) synthesisRef.current.cancel();
    setIsOpen(false);
    setState("idle");
    setTranscript("");
    setAiResponse("");
    setPendingAction(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-xl text-white"
      >
        <button onClick={closeOverlay} className="absolute top-8 right-8 p-3 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-8 h-8 text-white/50" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl px-8 text-center space-y-12">
          
          {/* Main Orb / Visualizer */}
          <div className="relative flex items-center justify-center w-48 h-48">
            <motion.div
              animate={{ 
                scale: state === "listening" || state === "confirming" ? [1, 1.2, 1] : 
                       state === "processing" ? [1, 0.9, 1.1, 1] : 
                       state === "speaking" ? [1, 1.4, 0.8, 1.2, 1] : 1,
                opacity: state === "processing" ? [0.5, 1, 0.5] : 1
              }}
              transition={{ repeat: Infinity, duration: state === "speaking" ? 0.8 : 1.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-30"
            />
            <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50">
               {state === "processing" ? (
                 <div className="flex space-x-2">
                   <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
               ) : (
                 <Mic className="w-10 h-10 text-white" />
               )}
            </div>
          </div>

          {/* Status Text */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium text-blue-300 uppercase tracking-widest">
              {state === "listening" && "Ouvindo..."}
              {state === "processing" && "Processando..."}
              {state === "speaking" && "Resposta da IA"}
              {state === "confirming" && "Aguardando Confirmação..."}
            </h3>

            {/* Transcription / Response */}
            <p className="text-3xl md:text-4xl font-light text-white leading-tight min-h-[4rem]">
              {(state === "listening" || state === "confirming") && transcript}
              {state === "speaking" && aiResponse}
              {state === "processing" && "..."}
            </p>
          </div>

          {/* Action Buttons for Confirming state */}
          {state === "confirming" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-6 mt-12"
            >
              <button 
                onClick={() => { stopListening(); speak("Ação cancelada.", false); }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium"
              >
                <XCircle className="w-5 h-5" /> Cancelar
              </button>
              <button 
                onClick={() => { stopListening(); speak("Confirmado. Executando ação.", false); }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors font-medium"
              >
                <Check className="w-5 h-5" /> Confirmar
              </button>
            </motion.div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
