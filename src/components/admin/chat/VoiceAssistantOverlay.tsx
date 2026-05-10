"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Check, XCircle } from "lucide-react";
import { useChatStore } from "@/lib/stores/chatStore";
import { useWMSOrchestrator } from "@/containers/admin/hooks/useWMSOrchestrator";
import { cn } from "@/lib/utils";

export function VoiceAssistantOverlay({ workspace, dashboard, onTabChange }: {
  workspace: any,
  dashboard: any,
  onTabChange?: (tab: any) => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<"idle" | "listening" | "processing" | "speaking" | "confirming" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [pendingAction, setPendingAction] = useState<any>(null);
  const stateRef = useRef(state);
  const transcriptRef = useRef("");

  // Sync refs with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const recognitionRef = useRef<any>(null);

  const { addMessage } = useChatStore();

  // Replace with real orchestrator
  const { callGeminiAI } = useWMSOrchestrator(
    workspace?.promptSettings?.storeLayout || [],
    () => { }
  );

  useEffect(() => {
    const handleStart = () => {
      console.log("[VoiceAssistant] start-voice-chat event received");
      setIsOpen(true);
      startListening();
      if (onTabChange) onTabChange('chat_history');
      if ((window as any).setViewModeAI) (window as any).setViewModeAI("chat");
    };
    window.addEventListener("start-voice-chat", handleStart);
    return () => window.removeEventListener("start-voice-chat", handleStart);
  }, [onTabChange]);

  const initRecognition = () => {
    // Always recreate to avoid "already started" or stuck state errors
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
    }

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

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      console.warn("[VoiceAssistant] Context is NOT secure.");
    }

    return recognition;
  };

  const startListening = () => {
    const recognition = initRecognition();
    if (!recognition) return;

    console.log("[VoiceAssistant] Starting recognition...");
    setTranscript("");
    setState("listening");

    // Diagnostic: Try to access raw hardware first
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => console.log("[VoiceAssistant] Hardware Access: SUCCESS (Mic is reachable)"))
      .catch(err => console.error("[VoiceAssistant] Hardware Access: FAILED", err.name, err.message));


    // Timeout to prevent eternal listening if no speech detected
    const silenceTimer = setTimeout(() => {
      if (state === "listening" && !transcript) {
        console.log("[VoiceAssistant] Silence timeout reached");
        stopListening();
        // speak("Parece que você não disse nada. Encerrando.", false);
        setTimeout(closeOverlay, 2000);
      }
    }, 8000); // 8 seconds of total silence before giving up

    recognition.onresult = (e: any) => {
      let currentTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        currentTranscript += e.results[i][0].transcript;
      }
      console.log("[VoiceAssistant] Interim transcript:", currentTranscript);
      setTranscript(currentTranscript);
      transcriptRef.current = currentTranscript; // Update ref immediately
    };

    recognition.onstart = () => {
      console.log("[VoiceAssistant] Recognition session started successfully");
    };

    recognition.onaudiostart = () => {
      console.log("[VoiceAssistant] Audio capturing started");
    };

    recognition.onerror = (e: any) => {
      console.error("[VoiceAssistant] Recognition error:", e.error, e.message);
      if (e.error === 'no-speech') {
        // Handled by onend or silence timer
      } else if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setState("error");
        const isNotSecure = !window.isSecureContext && window.location.hostname !== 'localhost';
        if (isNotSecure) {
          setAiResponse("Erro: Conexão Insegura (HTTP). Use localhost ou HTTPS.");
        } else {
          setAiResponse("Acesso ao microfone negado ou bloqueado pelo sistema.");
        }
        setTimeout(closeOverlay, 7000);
      } else {
        setState("error");
        setAiResponse("Erro no microfone. Verifique as permissões.");
        setTimeout(closeOverlay, 3000);
      }
    };

    recognition.onend = () => {
      console.log("[VoiceAssistant] Recognition ended. Current logical state:", stateRef.current);
      clearTimeout(silenceTimer);
      if (stateRef.current === "listening") {
        processInput();
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("[VoiceAssistant] Start error:", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Stop listening error:", e);
      }
    }
  };

  const parseLocalCommand = (text: string) => {
    const t = text.toLowerCase().trim();

    // 1. CREATE PRODUCT Pattern
    // Supports: "adicionar [novo] produto [nome] [preço [valor]]", "criar produto [nome]..."
    const productRegex = /(?:adicionar|criar|novo)\s+(?:novo\s+)?produto\s+(.*?)(?:\s+(?:com\s+)?preço\s+(\d+))?$/i;
    const productMatch = t.match(productRegex);

    if (productMatch) {
      const name = productMatch[1]?.trim();
      const price = productMatch[2] ? parseInt(productMatch[2]) : 0;

      if (name && name.length > 0) {
        return {
          action: 'CREATE_PRODUCT',
          item: {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            price: price,
            category: "Geral",
            description: "Adicionado via comando de voz"
          },
          reply: `Entendido! Estou adicionando "${name}" ao catálogo${price ? ` com o preço de R$ ${price}` : ''}.`
        };
      } else {
        // If they just said "adicionar produto" without a name
        return {
          reply: "Claro! Qual o nome do produto que você deseja adicionar?"
        };
      }
    }

    // 2. CLEAR CHAT Pattern
    if (t.includes("limpar") && (t.includes("chat") || t.includes("histórico") || t.includes("conversa"))) {
      return {
        action: 'CLEAR_CHAT',
        reply: "Tudo bem, estou limpando o histórico da conversa para você."
      };
    }

    // 3. HELP Pattern
    if (t === "ajuda" || t.includes("o que você faz") || t.includes("comandos")) {
      return {
        reply: "Eu posso te ajudar a gerenciar seu estoque! Tente dizer: 'Adicionar produto Sofá preço 1200' ou 'Limpar histórico'. O que deseja fazer agora?"
      };
    }

    return null;
  };

  const processInput = async (retryCount = 0) => {
    // Save user message to DB
    setState("processing");
    const finalTranscript = transcriptRef.current.trim();

    if (!finalTranscript) {
      // If nothing heard, don't just close. Give feedback.
      setAiResponse("Desculpe, não consegui ouvir nada. Pode repetir?");
      setTimeout(closeOverlay, 3000);
      return;
    }

    await addMessage({
      workspaceId: workspace.id,
      dashboardId: dashboard.id,
      role: "user",
      content: finalTranscript,
    });

    try {
      // 1. Try local parsing first (Save credits!)
      const localResult = parseLocalCommand(finalTranscript);
      let result: any = localResult;

      if (!result) {
        // 2. Call AI if local parsing fails
        try {
          result = await callGeminiAI(finalTranscript, []);
        } catch (aiError) {
          console.error("AI API Failed:", aiError);
          result = {
            reply: "Tive um problema com a conexão da IA, mas posso tentar te ajudar com comandos diretos. Tente dizer: 'Adicionar produto [nome] preço [valor]'.",
            commands: []
          };
        }
      }

      // Handle special commands from result (Local or AI)
      if (result.commands || result.action) {
        const commands = result.commands || [result];
        const createProductCmd = commands.find((c: any) => c.action === 'CREATE_PRODUCT');
        if (createProductCmd && (window as any).handleProductSubmitAI) {
          await (window as any).handleProductSubmitAI(createProductCmd.item);
          if (!localResult) { // If it was AI, enhance the reply
            result.reply = `Produto "${createProductCmd.item.name}" adicionado ao catálogo! ${result.reply}`;
          }

          // Add follow-up message in chat (Messagerie style)
          setTimeout(async () => {
            await addMessage({
              workspaceId: workspace.id,
              dashboardId: dashboard.id,
              role: "assistant",
              content: `📦 **${createProductCmd.item.name}** foi criado! Deseja adicionar uma foto ou uma descrição detalhada agora? Você pode digitar aqui ou me enviar os detalhes.`
            });
          }, 1000);
        }
      }

      await addMessage({
        workspaceId: workspace.id,
        dashboardId: dashboard.id,
        role: "assistant",
        content: result.reply,
        metadata: result.logs.length > 0 ? { action: result.logs.join(", ") } : undefined
      });

      setAiResponse(result.reply);

      // Auto-switch to chat history if tab change is available
      if (onTabChange) {
        onTabChange('chat_history');
      }

      // Check if it's a confirmation question
      const isConfirmation = result.reply.toLowerCase().includes("você quer") || result.reply.includes("?");
      if (isConfirmation) {
        setPendingAction(true);
        setState("confirming");
      } else {
        // If no confirmation needed, just finish and close
        setState("idle");
        setTimeout(closeOverlay, 1000);
      }
    } catch (error) {
      console.error("Process Input Error:", error);
      if (retryCount < 1) {
        console.log("Retrying AI call...");
        return processInput(retryCount + 1);
      }

      const errorReply = "Tive um problema ao processar seu pedido (IA Indisponível). Tente usar o comando direto: 'Adicionar produto [nome] preço [valor]'.";
      setAiResponse(errorReply);

      await addMessage({
        workspaceId: workspace.id,
        dashboardId: dashboard.id,
        role: "assistant",
        content: errorReply
      });

      setState("error");
      setTimeout(closeOverlay, 4000);
    }
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
      const finalTranscript = transcriptRef.current.trim().toLowerCase();
      if (finalTranscript.includes("sim") || finalTranscript.includes("claro") || finalTranscript.includes("pode")) {
        setAiResponse("Confirmado. Executando ação.");
        setTimeout(closeOverlay, 1500);
      } else if (finalTranscript.includes("não") || finalTranscript.includes("cancela")) {
        setAiResponse("Ação cancelada.");
        setTimeout(closeOverlay, 1500);
      } else {
        closeOverlay();
      }
    };

    try { recognition.start(); } catch (e) { }
  };

  const closeOverlay = () => {
    stopListening();
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
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[999] w-full max-w-lg px-4"
      >
        <div className="bg-gray-900/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-6 flex items-center gap-6 overflow-hidden">

          {/* Minimal Orb */}
          <div className="relative flex shrink-0 items-center justify-center w-16 h-16">
            <motion.div
              animate={{
                scale: state === "listening" || state === "confirming" ? [1, 1.3, 1] :
                  state === "processing" ? [1, 0.9, 1.1, 1] :
                    state === "speaking" ? [1, 1.5, 0.8, 1.2, 1] : 1,
                opacity: state === "processing" ? [0.4, 0.8, 0.4] : 0.6
              }}
              transition={{ repeat: Infinity, duration: state === "speaking" ? 0.6 : 1.2, ease: "easeInOut" }}
              className="absolute inset-0 bg-blue-500 rounded-full blur-xl"
            />
            <div className={cn(
              "relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300",
              state === "listening" ? "bg-rose-500" : "bg-blue-600"
            )}>
              {state === "processing" ? (
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                {state === "listening" && "Ouvindo..."}
                {state === "processing" && "Pensando..."}
                {state === "speaking" && "IA Falando"}
                {state === "confirming" && "Confirme"}
                {state === "error" && "Erro de Permissão"}
              </span>
              <button onClick={closeOverlay} className="text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={cn(
              "text-lg font-medium leading-snug truncate",
              state === "error" ? "text-rose-400" : "text-white"
            )}>
              {(state === "listening" || state === "confirming") && (transcript || "Diga algo...")}
              {(state === "speaking" || state === "error") && aiResponse}
              {state === "processing" && "Analisando seu pedido..."}
            </p>
          </div>

          {/* Confirmation Controls (Compact) */}
          {state === "confirming" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { stopListening(); setAiResponse("Ação cancelada."); setTimeout(closeOverlay, 1000); }}
                className="p-2.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => { stopListening(); setAiResponse("Confirmado."); setTimeout(closeOverlay, 1000); }}
                className="p-2.5 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
