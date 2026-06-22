"use client";

import { Loader2, RefreshCw, ExternalLink, Hammer, Terminal, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PreviewFrameProps {
  projectId: string;
}

type PreviewState = 'loading' | 'starting' | 'ready' | 'error' | 'dead';

export function PreviewFrame({ projectId }: PreviewFrameProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<PreviewState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logsPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    if (!showLogs) return;
    try {
      const res = await fetch(`/api/app-builder/projects/${projectId}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || '');
      }
    } catch (e) {
      // ignore log fetch errors
    }
  }, [projectId, showLogs]);

  useEffect(() => {
    if (showLogs) {
      fetchLogs();
      logsPollRef.current = setInterval(fetchLogs, 2000);
    } else {
      if (logsPollRef.current) clearInterval(logsPollRef.current);
    }
    return () => {
      if (logsPollRef.current) clearInterval(logsPollRef.current);
    };
  }, [showLogs, fetchLogs]);

  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  const fetchPreviewUrl = useCallback(async (isBackgroundPing = false) => {
    if (!isBackgroundPing) {
      setState('loading');
    }
    setError(null);
    try {
      const res = await fetch(`/api/app-builder/projects/${projectId}/preview`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao carregar preview");

      setUrl(data.url);

      if (data.status === 'dead') {
        setState('dead');
        // Don't poll - sandbox is permanently gone, AppBuilderBoard will handle recreate
      } else if (data.status === 'starting') {
        setState('starting');
        // Poll again in 4 seconds
        pollRef.current = setTimeout(() => fetchPreviewUrl(false), 4000);
      } else {
        setState('ready');
        // Ping every 15 seconds to keep sandbox alive and detect hibernation
        pollRef.current = setTimeout(() => fetchPreviewUrl(true), 15000);
      }
    } catch (e: any) {
      setError(e.message);
      setState('error');
    }
  }, [projectId]);

  useEffect(() => {
    fetchPreviewUrl();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [fetchPreviewUrl]);

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Browser Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
        <div className="flex gap-1.5 mr-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-[10px] text-gray-500 font-mono flex items-center gap-2 max-w-sm w-full truncate">
            {state === 'starting' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}
            {state === 'ready' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />}
            <span className="truncate">{url ?? '...'}</span>
          </div>
        </div>
        <div className="flex gap-2 ml-2">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className={`p-1.5 rounded-md transition-colors ${showLogs ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
            title="Terminal Sandbox"
          >
            <Terminal className="w-4 h-4" />
          </button>
          <button 
            onClick={() => fetchPreviewUrl()}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
            title="Atualizar prévia"
          >
            <RefreshCw className={`w-4 h-4 ${state === 'loading' || state === 'starting' ? 'animate-spin' : ''}`} />
          </button>
          {url && (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              title="Abrir em nova guia"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {state === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin mb-3" />
            <p className="text-sm font-semibold text-gray-600">Conectando à Sandbox...</p>
          </div>
        )}

        {state === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Hammer className="w-8 h-8 text-blue-600" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400" />
            </div>
            <p className="text-sm font-bold text-gray-800 mb-1">Iniciando o servidor...</p>
            <p className="text-xs text-gray-500 text-center max-w-[220px] leading-relaxed">
              A Sandbox está scaffoldando o projeto e iniciando o Next.js. Isso pode levar alguns segundos.
            </p>
            <div className="mt-4 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-red-800 mb-2">Erro ao carregar a prévia</h3>
            <p className="text-xs text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchPreviewUrl()}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {state === 'dead' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <div className="w-12 h-12 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">Ambiente Expirado</h3>
            <p className="text-xs text-gray-600 mb-4">Este ambiente da Sandbox foi encerrado ou expirou.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            >
              Recriar Ambiente
            </button>
          </div>
        )}

        {state === 'ready' && url && (
          <iframe
            key="iframe"
            src={url}
            className="absolute inset-0 w-full h-full bg-white"
            allow="clipboard-read; clipboard-write; fullscreen"
          />
        )}

        <AnimatePresence>
          {showLogs && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 h-64 bg-slate-900 border-t border-slate-700 shadow-2xl flex flex-col z-50"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-semibold text-slate-300">Sandbox Logs (dev.log)</span>
                </div>
                <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-white transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                {logs || <span className="text-slate-600 italic">Buscando logs...</span>}
                <div ref={logsEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
