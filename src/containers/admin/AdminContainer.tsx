"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import dynamic from "next/dynamic";

import { useToast } from "@/lib/state/toast-context";
import { AdminShellAde } from "@/components/admin/ade/AdminShellAde";
import { AdminHeaderAde } from "@/components/admin/ade/AdminHeaderAde";
// import { AdminSidebar } from "../../components/admin/ade/AdminSidebar";
import { TileGridAde } from "@/containers/admin/ade/TileGridAde";
import { NotesPanelAde } from "@/containers/admin/ade/NotesPanelAde";
import { ContactsPanelAde } from "@/containers/admin/ade/ContactsPanelAde";
import { FilesPlaceholderAde } from "@/containers/admin/ade/FilesPlaceholderAde";
import { EmptyStateAde } from "@/components/ui/EmptyStateAde";
import { AddPromptModal } from "@/components/admin/ade/AddPromptModal";
import { AddContactModal } from "@/components/admin/ade/AddContactModal";
import { CreateBlankDashboardModal } from "@/components/admin/ade/CreateBlankDashboardModal";
import { AddWorkspaceModal } from "@/components/admin/ade/AddWorkspaceModal";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { TradeRankingMeter } from "@/components/admin/ade/TradeRankingMeter";
import { PaymentEmailModal } from "@/components/ui/PaymentEmailModal";
import { TileDetailModal } from "@/components/ui/prompt-tiles/TileDetailModal";
import { ContactDetailModal } from "@/components/admin/ade/ContactDetailModal";
import { WorkspaceDetailModal } from "@/components/admin/ade/WorkspaceDetailModal";
import { AdminNavigation, type NavTab } from "@/components/admin/ade/AdminNavigation";
import { AddOrderModal } from "@/components/admin/ade/AddOrderModal";
import { AddProductModal } from "@/components/admin/ade/AddProductModal";
import { AdminChatView } from "@/components/admin/chat/AdminChatView";
import { ChatBoard } from "@/components/admin/ade/ChatBoard";
import { VoiceAssistantOverlay } from "@/components/admin/chat/VoiceAssistantOverlay";
import { SaaSLimitsModal } from "@/components/admin/ade/SaaSLimitsModal";
import { useTranslation } from "@/lib/hooks/useTranslation";

// ---------------------------------------------------------------------------
// Heavy tab-specific boards — loaded lazily so they don't inflate the initial
// bundle. Each is only ever rendered when its tab is active.
// ---------------------------------------------------------------------------
const BoardSkeleton = () => (
  <div className="w-full h-64 animate-pulse rounded-xl bg-white/5" />
);

const BookReaderModal = dynamic(
  () => import("@/components/admin/ade/BookReaderModal").then(m => ({ default: m.BookReaderModal })),
  { ssr: false }
);
const BookWriterView = dynamic(
  () => import("@/components/love-writers/BookWriterView").then(m => ({ default: m.BookWriterView })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const BookLibrarySection = dynamic(
  () => import("@/components/love-writers/BookLibrarySection").then(m => ({ default: m.BookLibrarySection })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const LogisticsBoard = dynamic(
  () => import("@/components/admin/ade/LogisticsBoard").then(m => ({ default: m.LogisticsBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const StoreLayoutGrid = dynamic(
  () => import("@/components/admin/ade/StoreLayoutGrid").then(m => ({ default: m.StoreLayoutGrid })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const FurnitureStoreBoard = dynamic(
  () => import("@/components/admin/ade/FurnitureStoreBoard").then(m => ({ default: m.FurnitureStoreBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const FurniturePublicStore = dynamic(
  () => import("@/components/admin/ade/FurniturePublicStore").then(m => ({ default: m.FurniturePublicStore })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const ClientsBoard = dynamic(
  () => import("@/components/admin/ade/ClientsBoard").then(m => ({ default: m.ClientsBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const StaffBoard = dynamic(
  () => import("@/components/admin/ade/StaffBoard").then(m => ({ default: m.StaffBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const FurnitureAnalyticsBoard = dynamic(
  () => import("@/components/admin/ade/FurnitureAnalyticsBoard").then(m => ({ default: m.FurnitureAnalyticsBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const GlobalUsersBoard = dynamic(
  () => import("@/components/admin/ade/GlobalUsersBoard").then(m => ({ default: m.GlobalUsersBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const MembersBoard = dynamic(
  () => import("@/components/admin/ade/MembersBoard").then(m => ({ default: m.MembersBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const MentoringKanbanBoard = dynamic(
  () => import("@/components/admin/ade/MentoringKanbanBoard").then(m => ({ default: m.MentoringKanbanBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const MentoringScheduleBoard = dynamic(
  () => import("@/components/admin/ade/MentoringScheduleBoard").then(m => ({ default: m.MentoringScheduleBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const MentoringInsightsBoard = dynamic(
  () => import("@/components/admin/ade/MentoringInsightsBoard").then(m => ({ default: m.MentoringInsightsBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const MentoringProfileBoard = dynamic(
  () => import("@/components/admin/ade/MentoringProfileBoard").then(m => ({ default: m.MentoringProfileBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const SmartSurveyBoard = dynamic(
  () => import("@/components/admin/ade/SmartSurveyBoard").then(m => ({ default: m.SmartSurveyBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);
const AiBlogBoard = dynamic(
  () => import("@/modules/ai-blog/components/AiBlogBoard").then(m => ({ default: m.AiBlogBoard })),
  { ssr: false, loading: () => <BoardSkeleton /> }
);


// Zustand stores
import {
  useUIStore,
  useAuthStore,
  useWorkspaceStore,
  useCurrentWorkspace,
  useCurrentDashboard,
  useWorkspaceActions,
  useContent,
  useIsHydrated,
} from "@/lib/stores";

// Custom hooks
import {
  useModalState,
  useAppearanceManagement,
  usePaymentFlow,
  useFurnitureSystem,
} from "@/containers/admin/hooks";

import { useUpdateTile } from "@/lib/state/query/tile.queries";

export function AdminContainer() {
  // SSR-safe hydration
  const hydrated = useIsHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlWorkspaceId = searchParams?.get("workspaceId") || null;
  const { push } = useToast();
  const { t } = useTranslation();

  // Zustand stores
  const { 
    appearance, 
    setBaseColor, 
    modals, 
    openSaaSLimits, 
    closeSaaSLimits,
    openAddPrompt,
    closeAddPrompt,
    openAddContact,
    closeAddContact,
    openCreateBlankDashboard,
    closeCreateBlankDashboard,
    openAddWorkspace,
    closeAddWorkspace,
    openBulkUpload,
    closeBulkUpload,
    openWorkspaceDetail,
    closeWorkspaceDetail,
    setSelectedTile,
    setSelectedContact,
    openPreview,
    closePreview,
  } = useUIStore();
  const auth = useAuthStore();
  const currentWorkspace = useCurrentWorkspace();
  const currentDashboard = useCurrentDashboard();
  const workspaceActions = useWorkspaceActions();
  const content = useContent();
  const workspaces = useWorkspaceStore((state) => state.workspaces);

  // Handle ML Sync Success Notification
  const mlSuccess = searchParams?.get("ml_success");
  useEffect(() => {
    if (mlSuccess === "true") {
      push({
        title: "Mercado Livre Sincronizado",
        description: "A conexão mestre foi estabelecida com sucesso.",
        variant: "success"
      });
      // Clean URL
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("ml_success");
      router.replace(`/admin?${newParams.toString()}`);
    }
  }, [mlSuccess, push, router, searchParams]);

  // UI Store actions (declaradas abaixo com todas as outras)

  // Custom hooks
  const payment = usePaymentFlow();
  const { handleCustomizeBackground, handleSetBackground } =
    useAppearanceManagement(currentDashboard || undefined);

  const updateTileMutation = useUpdateTile();

  // Shared ref for workspace tracking (prevents side effects on every render)
  const prevWsIdRef = useRef<string | null>(null);

  // Furniture System Hook
  const furniture = useFurnitureSystem(currentDashboard, currentWorkspace);

  useEffect(() => {
    if (currentWorkspace?.promptSettings?.templateId?.startsWith("template_furniture")) {
        furniture.populateDefaults();
        
        // Expose handlers to window for AI access
        (window as any).handleProductSubmitAI = furniture.handleProductSubmit;
        (window as any).handleOrderSubmitAI = furniture.handleOrderSubmit;
    }
    return () => {
        delete (window as any).handleProductSubmitAI;
        delete (window as any).handleOrderSubmitAI;
    };
  }, [currentWorkspace?.id, furniture.handleProductSubmit, furniture.handleOrderSubmit]);



  // Sequential Writer Logic (Client-Side Orchestration)
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Book Writer State
  const [openBookId, setOpenBookId] = useState<string | null>(null);
  const [openBookMode, setOpenBookMode] = useState<"create" | "library">("library");

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>("arcs");
  const [localViewMode, setLocalViewMode] = useState<"chat" | "menu" | null>(null);

  const viewMode = localViewMode || currentDashboard?.layoutMode || "menu";
  const setViewMode = (mode: "chat" | "menu") => {
    setLocalViewMode(mode);
    if (currentWorkspace && currentDashboard) {
      workspaceActions.updateDashboard(currentWorkspace.id, currentDashboard.id, { layoutMode: mode });
    }
  };

    // Synchronize activeTab when workspace changes to select the appropriate start tab
    useEffect(() => {
      if (!currentWorkspace) return;
      const templateId = currentWorkspace.promptSettings?.templateId;
      if (templateId === "template_io_mentoring") {
        setActiveTab("mentoring_profile" as any);
      } else if (templateId === "template_love_writers") {
        setActiveTab("library");
      } else if (templateId === "template_trade_ranking") {
        setActiveTab("ranking");
      } else if (templateId?.startsWith("template_furniture")) {
        setActiveTab("store");
      } else if (templateId === "template_smart_survey") {
        setActiveTab("survey");
      } else if (templateId === "template_ai_blog") {
        setActiveTab("blog" as any);
      } else {
        setActiveTab("arcs");
      }
    }, [currentWorkspace?.id]);

  // Expose setViewMode to window for voice assistant access
  useEffect(() => {
    (window as any).setViewModeAI = setViewMode;
    return () => {
      delete (window as any).setViewModeAI;
    };
  }, [setViewMode]);

  // AI Voice Commands Event Listeners
  useEffect(() => {
    const handleNavigate = (e: CustomEvent) => {
      const dest = e.detail?.destination;
      if (!dest) return;
      if (dest === 'chat') {
        setViewMode('chat');
        setActiveTab("chat_history" as NavTab);
      } else if (dest === 'menu') {
        setViewMode('menu');
      } else if (['arcs', 'store', 'layout', 'logistics', 'clients', 'staff', 'notes', 'files', 'characters', 'library', 'ranking', 'mentoring_tasks', 'mentoring_schedule', 'mentoring_insights', 'mentoring_notes', 'survey'].includes(dest)) {
        setActiveTab(dest as NavTab);
        setViewMode('menu');
      } else if (dest === 'credits') {
        openSaaSLimits();
      } else if (dest === 'profile') {
        const userBtn = document.querySelector('.cl-userButtonTrigger');
        if (userBtn) (userBtn as HTMLElement).click();
      }
    };

    const handleCreateClient = (e: CustomEvent) => {
      setActiveTab('clients');
      setViewMode('menu');
      openAddContact();
      push({
         title: "Assistente de Voz",
         description: `Iniciando cadastro do cliente: ${e.detail?.name}. Complete as informações.`,
         variant: "default"
      });
    };

    window.addEventListener('ai-navigate', handleNavigate as EventListener);
    window.addEventListener('ai-create-client', handleCreateClient as EventListener);

    return () => {
      window.removeEventListener('ai-navigate', handleNavigate as EventListener);
      window.removeEventListener('ai-create-client', handleCreateClient as EventListener);
    };
  }, [setViewMode, setActiveTab, openSaaSLimits, openAddContact, push]);

  // Mentoring AI Event Listeners
  useEffect(() => {
    const handleCreateTask = async (e: any) => {
      if (!currentWorkspace?.id) return;
      try {
        await fetch("/api/mentoring/tasks", {
          method: "POST",
          body: JSON.stringify({
            workspaceId: currentWorkspace.id,
            ...e.detail
          })
        });
        push({
          title: "Mentoria",
          description: `Nova tarefa criada: "${e.detail?.title}"`,
          variant: "success"
        });
      } catch (err) { console.error(err); }
    };

    const handleScheduleSession = async (e: any) => {
      if (!currentWorkspace?.id) return;
      try {
        await fetch("/api/mentoring/sessions", {
          method: "POST",
          body: JSON.stringify({
            workspaceId: currentWorkspace.id,
            ...e.detail
          })
        });
        push({
          title: "Mentoria",
          description: `Nova sessão agendada: "${e.detail?.title}"`,
          variant: "success"
        });
      } catch (err) { console.error(err); }
    };

    window.addEventListener('ai-create-task', handleCreateTask);
    window.addEventListener('ai-schedule-session', handleScheduleSession);

    return () => {
      window.removeEventListener('ai-create-task', handleCreateTask);
      window.removeEventListener('ai-schedule-session', handleScheduleSession);
    };
  }, [currentWorkspace?.id, push]);

  // Sync local view mode when dashboard changes
  useEffect(() => {
    if (currentDashboard?.layoutMode) {
      setLocalViewMode(currentDashboard.layoutMode);
    }
  }, [currentDashboard?.id, currentDashboard?.layoutMode]);

  // Sync Dashboard Background Color with UI Store
  useEffect(() => {
    if (currentDashboard?.bgColor && currentDashboard.bgColor !== appearance.baseColor) {
      console.log(`[AdminContainer] 🎨 Syncing dashboard color: ${currentDashboard.bgColor}`);
      setBaseColor(currentDashboard.bgColor);
    }
  }, [currentDashboard?.id, currentDashboard?.bgColor, setBaseColor, appearance.baseColor]);

  // Sync activeTab and template context
  useEffect(() => {
      if (!currentWorkspace || !hydrated) return;
      const templateId = currentWorkspace.promptSettings?.templateId;
      
      // Deterministic tab management when switching workspaces
      const getInitialTab = (tid: string): NavTab => {
          if (tid === "template_trade_ranking") return "ranking";
          if (tid?.startsWith("template_furniture")) return "store" as any;
          if (tid === "template_love_writers") return "library";
          if (tid === "template_io_mentoring") return "mentoring_profile" as any;
          if (tid === "template_smart_survey") return "survey";
          if (tid === "template_ai_blog") return "blog" as any;
          return "arcs";
      };

      // If active tab doesn't exist for the current template, or we just switched workspace
      if (prevWsIdRef.current !== currentWorkspace.id) {
          setActiveTab(getInitialTab(templateId || ""));
          prevWsIdRef.current = currentWorkspace.id;
          return;
      }

      // Individual cases if user manually navigates to 'arcs' but we want to redirect once
      if (templateId === "template_trade_ranking" && activeTab === "arcs") setActiveTab("ranking");
      if (templateId === "template_furniture_logistics" && activeTab === "arcs") setActiveTab("logistics" as any);
      if (templateId === "template_furniture_layout" && activeTab === "arcs") setActiveTab("layout" as any);
      if (templateId === "template_furniture_store" && activeTab === "arcs") setActiveTab("store" as any);
      if (templateId === "template_io_mentoring" && activeTab === "arcs") setActiveTab("mentoring_profile" as any);
      if (templateId === "template_smart_survey" && activeTab === "arcs") setActiveTab("survey");
      if (templateId === "template_ai_blog" && activeTab === "arcs") setActiveTab("blog" as any);

  }, [currentWorkspace?.id, hydrated]);

  // Count of tiles with content — used to re-trigger sequential generation after each completion
  const tilesWithContentCount = currentDashboard?.tiles?.filter(t => t.content && t.content.trim().length > 0).length ?? 0;

  useEffect(() => {

    const generateNextTile = async () => {
      console.log("[SequentialWriter] 🔍 Check cycle started", {
          isGenerating,
          workspaceId: currentWorkspace?.id,
          dashboardId: currentDashboard?.id,
          tilesCount: currentDashboard?.tiles?.length,
          tilesWithContentCount
      });

      // 1. Validate Context
      if (
        !currentWorkspace ||
        currentWorkspace.promptSettings?.templateId !== "template_love_writers" ||
        !currentDashboard
      ) {
        return;
      }

      // 2. Find next empty tile (Draft)
      // Fallback: If currentDashboard.tiles is suspiciously empty, log it and wait
      const dashboardTiles = currentDashboard.tiles || [];
      if (dashboardTiles.length <= 1 && currentWorkspace.promptSettings?.templateId === "template_love_writers") {
          console.log("[SequentialWriter] ⚠️ Dashboard tiles count is low (1 or 0). Waiting for store/DB sync...", { tilesCount: dashboardTiles.length });
          return;
      }

      const tiles = [...dashboardTiles].sort((a, b) => a.orderIndex - b.orderIndex);
      const nextTile = tiles.find(t => 
        (!t.content || t.content.trim().length === 0) && 
        t.status !== "error" && 
        t.status !== "completed"
      );

      if (!nextTile) {
          console.log("[SequentialWriter] ✅ All tiles have content. Loop finished or waiting for next arcs.");
          return;
      }
      
      if (isGenerating) {
          console.log("[SequentialWriter] ⏳ Already generating, skipping this check.");
          return;
      }

      // Capture stable IDs before any async work
      const capturedWorkspaceId = currentWorkspace.id;
      const capturedDashboardId = currentDashboard.id;

      // 2b. Check Usage Limits
      if (!auth.canPerformAction("createTile")) {
          console.warn("[SequentialWriter] 🚫 Limit reached for createTile");
          setGenerationError("Você atingiu o limite de geração de blocos para o seu plano.");
          return;
      }

      if (generationError) {
          console.log("[SequentialWriter] 🛑 Stopping due to previous error.");
          return;
      }

      console.log(`[SequentialWriter] 🚀 Preparing to generate next arc: "${nextTile.title}" (Arc ${nextTile.orderIndex + 1})`);
      setIsGenerating(true);

      try {
        console.log(`[SequentialWriter] Starting generation for tile: ${nextTile.title}`);

        // 3. Prepare Prompt with Context (All Workspace Variables + Previous Arc)
        const previousTile = tiles.find(t => t.orderIndex === nextTile.orderIndex - 1);
        const previousContent = previousTile?.content || "This is the beginning of the story.";

        // Robust variable replacement (handles {user_name}, {partner_name}, {meeting_story}, and {previous_arc})
        const workspaceVariables = currentWorkspace.promptSettings?.promptVariables || [];
        const variableMap: Record<string, string> = {
          "{previous_arc}": previousContent,
        };

        workspaceVariables.forEach(v => {
          const [key, ...valParts] = v.split(":");
          if (key && valParts.length > 0) {
            variableMap[`{${key.trim()}}`] = valParts.join(":").trim();
          }
        });

        let contextualizedPrompt = nextTile.prompt;
        Object.entries(variableMap).forEach(([placeholder, value]) => {
          contextualizedPrompt = contextualizedPrompt.replaceAll(placeholder, value);
        });

        // 4. Call streaming API (SSE) — shows progress and keeps connection alive
        const response = await fetch("/api/generate/tile-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: contextualizedPrompt,
            title: nextTile.title,
            model: "gpt-4o-mini",
            maxTokens: 2000, // Increased for books
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `API error ${response.status}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulated = "";
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.replace("data: ", "").trim();
                if (dataStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    accumulated += parsed.text;
                    // Update tile progressively so user sees content appearing
                    useWorkspaceStore.getState().updateTileInDashboard(
                      capturedWorkspaceId,
                      capturedDashboardId,
                      nextTile.id,
                      { content: accumulated },
                      nextTile
                    );
                  }
                  if (parsed.done) done = true;
                } catch {}
              }
            }
          }
        }

        if (accumulated) {
          // 5. Final store update (ensures complete content in local store)
          useWorkspaceStore.getState().updateTileInDashboard(
            capturedWorkspaceId,
            capturedDashboardId,
            nextTile.id,
            { content: accumulated, status: "completed" },
            nextTile
          );

          // 6. DB Persistence (Server-side update)
          if (auth.user?.id) {
            console.log(`[SequentialWriter] 💾 Persisting tile ${nextTile.id} to database...`);
            try {
              await updateTileMutation.mutateAsync({
                tileId: nextTile.id,
                workspaceId: capturedWorkspaceId,
                dashboardId: capturedDashboardId,
                updates: {
                  content: accumulated,
                  status: "completed",
                  updatedAt: new Date().toISOString()
                }
              });
              console.log("[SequentialWriter] ✅ Tile persisted successfully");
            } catch (persistError) {
              console.error("[SequentialWriter] ❌ Failed to persist tile:", persistError);
            }
          }

          // 7. Consume Usage
          auth.consumeUsage("createTile");

          console.log(`[SequentialWriter] Completed tile: ${nextTile.title}`);
        }

      } catch (e: any) {
        console.error("[SequentialWriter] Loop Error:", e);
        const errorMsg = e.message || "Erro desconhecido na geração";
        
        // 1. Mark tile as failed in store so it's skipped in next cycle
        useWorkspaceStore.getState().updateTileInDashboard(
            capturedWorkspaceId,
            capturedDashboardId,
            nextTile.id,
            { status: "error" },
            nextTile
        );

        // 2. Mark as failed in DB if possible
        if (auth.user?.id) {
            updateTileMutation.mutate({
                tileId: nextTile.id,
                workspaceId: capturedWorkspaceId,
                dashboardId: capturedDashboardId,
                updates: { status: "error" }
            });
        }

        // 3. Stop the loop and alert
        setGenerationError(errorMsg);
        setIsGenerating(false);
        
        const isQuotaError = errorMsg.toLowerCase().includes("quota") || errorMsg.includes("429");

        push({
            title: isQuotaError ? "Saldo OpenAI Insuficiente" : "Geração Interrompida",
            description: isQuotaError 
                ? "Sua conta da OpenAI (Platform) está sem saldo ou atingiu o limite. Verifique seu faturamento em platform.openai.com."
                : errorMsg,
            variant: "destructive"
        });
      } finally {
        setIsGenerating(false);
      }
    };

    // Run the loop (delay allows store to settle after updates)
    const timeoutDuration = isGenerating ? 8000 : 1000; 
    const timer = setTimeout(generateNextTile, timeoutDuration);
    return () => clearTimeout(timer);

  }, [currentWorkspace?.id, currentDashboard?.id, tilesWithContentCount, isGenerating, workspaces.length]); // Added workspaces.length to track new creations

  // UI actions from stores
  // (Consolidated at the top of the component)

  // Shared ref for dashboard updates (prevents race conditions)
  const isUpdatingDashboardRef = useRef(false);

  // Dashboard data isolation - no automatic sync needed
  // Each dashboard manages its own data independently

  // Apply dashboard background when current dashboard changes
  useEffect(() => {
    console.log("[DEBUG] AdminContainer background effect triggered:", {
      currentDashboardId: currentDashboard?.id,
      bgColor: currentDashboard?.bgColor,
      hasBgColor: !!currentDashboard?.bgColor,
      currentDashboard: !!currentDashboard,
    });

    if (currentDashboard?.bgColor && typeof window !== "undefined") {
      console.log(
        "[DEBUG] AdminContainer setting background to:",
        currentDashboard.bgColor
      );
      // Ensure UI store is synced with the dashboard's color
      // This updates both the store (for sidebar/theme) and the document.body
      setBaseColor(currentDashboard.bgColor);
    } else {
      console.log(
        "[DEBUG] AdminContainer not setting background - missing bgColor or not in browser"
      );
    }
  }, [currentDashboard, setBaseColor]); // Added setBaseColor to dependencies

  // Force sync on page load/refresh to ensure latest data from localStorage
  useEffect(() => {
    console.log("[AdminContainer] 🚀 Page loaded/refreshed - forcing sync");
    workspaceActions.refreshWorkspaces();

    // Direct read from localStorage to ensure visual consistency immediately
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("insights_active_dashboard");
        if (raw) {
          const { workspaceId, dashboardId } = JSON.parse(raw);
          const workspacesRaw = localStorage.getItem("insights_workspaces");
          if (workspacesRaw) {
            const workspaces = JSON.parse(workspacesRaw);
            const workspace = workspaces.find((w: any) => w.id === workspaceId);
            const dashboard = workspace?.dashboards.find(
              (d: any) => d.id === dashboardId
            );

            if (dashboard?.bgColor) {
              console.log(
                "[AdminContainer] 🎨 Applying saved bgColor from localStorage:",
                dashboard.bgColor
              );
              // Update UI store to ensure all components (sidebar, etc.) get the correct tokens
              setBaseColor(dashboard.bgColor);
            }
          }
        }
      } catch (e) {
        console.error(
          "[AdminContainer] Failed to read/apply saved appearance:",
          e
        );
      }
    }
  }, []);

  // (Debug logs removed — were firing on every render)

  // Convert workspaces to sidebar format
  const workspacesForSidebar = workspaces.map((ws) => ({
    sessionId: ws.id,
    name: ws.name,
    generatedAt: ws.createdAt,
    tilesCount: ws.dashboards.reduce(
      (sum, d) => sum + (d.tiles?.length || 0),
      0
    ),
    notesCount: ws.dashboards.reduce(
      (sum, d) => sum + (d.notes?.length || 0),
      0
    ),
    contactsCount: ws.dashboards.reduce(
      (sum, d) => sum + (d.contacts?.length || 0),
      0
    ),
    dashboardsCount: ws.dashboards.length,
    isActive: ws.id === currentWorkspace?.id,
  }));

  // Convert dashboards for header
  const dashboardsForHeader =
    currentWorkspace?.dashboards.map((d) => ({
      id: d.id,
      name: d.name,
      isActive: d.id === currentDashboard?.id,
    })) || [];

  // Event handlers
  const handleContactsChanged = useCallback(async () => {

    try {
      // Load fresh dashboard data directly from localStorage
      const { loadWorkspacesWithDashboards } = await import(
        "@/lib/storage/dashboards-store"
      );
      const workspaces = loadWorkspacesWithDashboards();
      const workspaceEntity = workspaces.find(
        (w) => w.id === currentWorkspace?.id
      );

      if (workspaceEntity && currentWorkspace && currentDashboard) {
        const freshDashboard = workspaceEntity.dashboards.find(
          (d) => d.id === currentDashboard.id
        );

        if (freshDashboard) {
          console.log("[AdminContainer] Fresh dashboard data:", {
            contactsCount: freshDashboard.contacts?.length || 0,
          });

          // Update React state immediately
          workspaceActions.updateDashboard(
            currentWorkspace.id,
            freshDashboard.id,
            freshDashboard
          );

          console.log("[AdminContainer] ✅ Contacts refreshed immediately");
        }
      }
    } catch (error) {
      console.error("[AdminContainer] ❌ Failed to refresh contacts:", error);
    }
  }, [currentWorkspace, currentDashboard, workspaceActions.updateDashboard]);

  const handleNotesChanged = useCallback(async () => {

    try {
      // Load fresh dashboard data directly from localStorage
      const { loadWorkspacesWithDashboards } = await import(
        "@/lib/storage/dashboards-store"
      );
      const workspaces = loadWorkspacesWithDashboards();
      const workspaceEntity = workspaces.find(
        (w) => w.id === currentWorkspace?.id
      );

      if (workspaceEntity && currentWorkspace && currentDashboard) {
        const freshDashboard = workspaceEntity.dashboards.find(
          (d) => d.id === currentDashboard.id
        );

        if (freshDashboard) {
          console.log("[AdminContainer] Fresh dashboard data:", {
            notesCount: freshDashboard.notes?.length || 0,
          });

          // Update React state immediately
          workspaceActions.updateDashboard(
            currentWorkspace.id,
            freshDashboard.id,
            freshDashboard
          );

          console.log("[AdminContainer] ✅ Notes refreshed immediately");
        }
      }
    } catch (error) {
      console.error("[AdminContainer] ❌ Failed to refresh notes:", error);
    }
  }, [currentWorkspace, currentDashboard, workspaceActions.updateDashboard]);

  // Handle adding custom prompts
  const handleAddPrompt = useCallback(
    async (promptData: {
      title: string;
      description: string;
      useMaxPrompt: boolean;
      requestSize: "small" | "medium" | "large";
    }) => {
      console.log("[DEBUG] AdminContainer.handleAddPrompt called:", promptData);
      if (!currentWorkspace || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before adding prompts.",
          variant: "destructive",
        });
        return;
      }

      try {
        console.log(
          "[DEBUG] AdminContainer.handleAddPrompt calling content.createSinglePrompt"
        );
        const tile = await content.createSinglePrompt(currentDashboard.id, {
          title: promptData.title,
          prompt: promptData.description,
          useMaxPrompt: promptData.useMaxPrompt,
          requestSize: promptData.requestSize,
        });
        console.log(
          "[DEBUG] AdminContainer.handleAddPrompt tile created:",
          tile
        );

        push({
          title: "Prompt added successfully",
          description: `Generated insight: ${tile.title}`,
          variant: "success",
        });
      } catch (error) {
        console.error("[DEBUG] AdminContainer.handleAddPrompt error:", error);
        push({
          title: "Failed to add prompt",
          description:
            error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    },
    [currentWorkspace, currentDashboard, content, push]
  );

  // Determine what to show
  const hasWorkspace = !!currentWorkspace;
  const hasDashboard = !!currentDashboard;
  const hasTiles = content.tiles.length > 0;

  const companyHeading =
    currentWorkspace?.salesRepCompany || currentWorkspace?.name || "Book Project";

  // Get data from current dashboard
  const allTiles = currentDashboard?.tiles || [];
  const allContacts = currentDashboard?.contacts || [];
  const allNotes = currentDashboard?.notes || [];

  // Logic handled by useFurnitureSystem hook



  // Filter tiles for sequential writer (Love Writers)
  // Show empty tiles during generation so user sees progress; otherwise only show completed
  const displayedTiles =
    currentWorkspace?.promptSettings?.templateId === "template_love_writers"
      ? isGenerating
        ? allTiles
        : allTiles.filter(t => t.content && t.content.trim().length > 0)
      : allTiles;

  return (
    <AdminShellAde
      appearance={appearance}
      viewMode={viewMode}
      chatOverlay={
        <AdminChatView
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSetActiveWorkspace={(id) => {
              const ws = workspaces.find((w) => w.id === id);
              if (ws) workspaceActions.setCurrentWorkspace(ws);
          }}
          viewMode={viewMode}
          onSwitchToMenu={() => setViewMode("menu")}
          onSwitchToChat={() => {
              setViewMode("chat");
              setActiveTab("chat_history" as NavTab);
          }}
          onOpenWorkspaceDetail={() => openWorkspaceDetail(currentWorkspace?.id || "")}
          onSetSpecificColor={handleSetBackground}
          onOpenSaaSLimits={openSaaSLimits}
        />
      }
      navigation={
        <AdminNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          templateId={currentWorkspace?.promptSettings?.templateId}
          onSwitchToChat={() => setViewMode("chat")}
          userRole={auth.user?.globalRole || "user"}
          currentUserRole={currentWorkspace?.userId === auth.user?.id ? "mentor" : "mentee"}
        />
      }
      // Top Header Props
      onOpenWorkspaceDetail={() => openWorkspaceDetail(currentWorkspace?.id || "")}
      onDeleteWorkspace={(workspaceId) => {
        workspaceActions.deleteWorkspace(workspaceId);
        push({ 
          title: "Workspace deleted", 
          description: "The workspace and all its data have been removed.", 
          variant: "default" 
        });
      }}
      onSetSpecificColor={handleSetBackground}
    >
      {!hasWorkspace ? (
        <EmptyStateAde
          title="No workspace found"
          description="Generate a new workspace from the home page."
          action={{
            label: "Go to Home",
            onClick: () => router.push("/"),
          }}
        />
      ) : !hasDashboard ? (
        <EmptyStateAde
          title="No dashboard selected"
          description="Select or create a dashboard to get started."
          action={{
            label: "Create Dashboard",
            onClick: () =>
              workspaceActions.createDashboard(currentWorkspace?.id || "", {
                name: "Default Dashboard",
              }),
          }}
        />
      ) : (
        <>
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0 py-4">
              {/* Conditional Tab Rendering */}
              {activeTab === "library" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <BookLibrarySection
                    workspaceId={currentWorkspace.id}
                    dashboardId={currentDashboard?.id}
                    dashboardName={currentDashboard?.name}
                    workspaceName={currentWorkspace.name}
                    onOpenBook={(id, mode) => {
                      setOpenBookId(id);
                      setOpenBookMode(mode);
                    }}
                  />
                </div>
              )}

              {activeTab === "ranking" && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {(() => {
                     const isTradeRanking = currentWorkspace.promptSettings?.templateId === "template_trade_ranking";
                     let rankingData = null;
                     const rankingVar = currentWorkspace.promptSettings?.promptVariables?.find(v => v.startsWith("ranking_data:"));
                     if (rankingVar) {
                       try {
                         rankingData = JSON.parse(rankingVar.replace("ranking_data:", ""));
                       } catch (e) {
                         console.error("Failed to parse ranking data", e);
                       }
                     }
                     return (
                       <div className="space-y-6">
                         {isTradeRanking && rankingData && (
                           <div className="mb-8">
                             <TradeRankingMeter 
                               nota={rankingData.nota}
                               valorNovo={rankingData.valor_novo}
                               valorMercado={rankingData.valor_mercado}
                               compraIdeal={rankingData.compra_ideal}
                               precoReal={rankingData.preco_real}
                               liquidezScore={rankingData.liquidez_score}
                               estrategia={rankingData.estrategia}
                               roiPct={rankingData.roi_pct}
                               roiMensal={rankingData.roi_mensal}
                               negotiation={rankingData.negotiation}
                               marketAnalysis={rankingData.market_analysis}
                               sazonalidade={rankingData.sazonalidade}
                             />
                           </div>
                         )}
                         {isTradeRanking && !rankingData && (
                           <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border border-dashed border-gray-200">
                             <div className="text-gray-400 font-medium">Ranking details are still being calculated...</div>
                           </div>
                         )}
                       </div>
                     );
                   })()}
                 </div>
               )}

               {activeTab === "arcs" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {currentWorkspace?.promptSettings?.templateId?.startsWith("template_furniture") ? (
                        <FurnitureAnalyticsBoard tiles={allTiles} />
                      ) : (
                        <div className="space-y-6">
                            <TileGridAde
                              tiles={displayedTiles}
                              isGenerating={isGenerating}
                              onDeleteTile={async (tileId) => {
                                try {
                                  await content.deleteTile(tileId);
                                  workspaceActions.refreshWorkspaces();
                                  push({ title: "Tile deleted", description: "The tile has been removed.", variant: "default" });
                                } catch (error) {
                                  push({ title: "Error", description: "Failed to delete tile. Please try again.", variant: "destructive" });
                                }
                              }}
                              onReorderTiles={async (order) => {
                                if (!currentDashboard?.id) return;
                                try {
                                  await content.reorderTiles(currentDashboard.id, order);
                                  workspaceActions.refreshWorkspaces();
                                } catch (error) {
                                  push({ title: "Error", description: "Failed to reorder tiles. Please try again.", variant: "destructive" });
                                }
                              }}
                              onOpenTile={(tile) => setSelectedTile(tile)}
                              isReordering={false}
                              appearance={appearance}
                              onAddPrompt={openAddPrompt}
                              onBulkUploadPrompts={openBulkUpload}
                              animateEntrance={true}
                              workspaceName={currentWorkspace?.name}
                              dashboards={dashboardsForHeader}
                              onSelectDashboard={workspaceActions.setActiveDashboard}
                              onCreateBlankDashboard={openCreateBlankDashboard}
                            />
                        </div>
                      )}
                </div>
               )}

              {activeTab === "characters" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <ContactsPanelAde
                    contacts={allContacts}
                    onAddContact={openAddContact}
                    onOpenContact={setSelectedContact}
                    appearance={appearance}
                    title={
                        currentWorkspace?.promptSettings?.templateId === "template_love_writers" ? t("admin.dashboardLabels.cast") :
                        currentWorkspace?.promptSettings?.templateId === "template_furniture_logistics" ? t("admin.dashboardLabels.teamClients") :
                        currentWorkspace?.promptSettings?.templateId === "template_furniture_layout" ? t("admin.dashboardLabels.team") :
                        t("admin.dashboardLabels.contacts")
                    }
                    addLabel={
                        currentWorkspace?.promptSettings?.templateId === "template_love_writers" ? t("admin.dashboardLabels.newCharacter") :
                        currentWorkspace?.promptSettings?.templateId?.startsWith("template_furniture") ? t("admin.dashboardLabels.newMember") :
                        t("admin.dashboardLabels.newContact")
                    }
                  />
                </div>
              )}

              {activeTab === "notes" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <NotesPanelAde
                    notes={content.notes}
                    onAddNote={async (noteData) => {
                      if (currentDashboard) {
                        await content.createNote(currentDashboard.id, noteData);
                        handleNotesChanged();
                        push({ title: "Note created", description: "The note has been added successfully.", variant: "default" });
                      }
                    }}
                    onUpdateNote={async (noteId, updates) => {
                      await content.updateNote(noteId, updates);
                      handleNotesChanged();
                    }}
                    onDeleteNote={async (noteId) => {
                      if (currentWorkspace && currentDashboard) {
                        await content.deleteNote(noteId, currentWorkspace.id, currentDashboard.id);
                        handleNotesChanged();
                        push({ title: "Note deleted", description: "The note has been deleted successfully.", variant: "default" });
                      }
                    }}
                    appearance={appearance}
                    title={
                        currentWorkspace?.promptSettings?.templateId === "template_love_writers" ? t("admin.dashboardLabels.narrativeArcs") :
                        currentWorkspace?.promptSettings?.templateId === "template_furniture_logistics" ? t("admin.dashboardLabels.reportsProtocols") :
                        currentWorkspace?.promptSettings?.templateId === "template_furniture_layout" ? t("admin.dashboardLabels.floorplansAdjustments") :
                        t("admin.dashboardLabels.notes")
                    }
                  />
                </div>
              )}

              {activeTab === "files" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <FilesPlaceholderAde appearance={appearance} />
                </div>
              )}

              {activeTab === "chat_history" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-120px)]">
                  <ChatBoard workspace={currentWorkspace} dashboard={currentDashboard} />
                </div>
              )}

              {(activeTab as any) === "store" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {furniture.storeViewMode === "internal" ? (
                        <FurnitureStoreBoard 
                            tiles={allTiles}
                            workspaceId={currentWorkspace?.id}
                            onUpdateTile={async (tileId, updates) => {
                                await content.updateTile(tileId, updates);
                                workspaceActions.refreshWorkspaces();
                            }}
                            onOpenProductModal={(data) => {
                                furniture.setEditingProduct(data);
                                furniture.setProductModalOpen(true);
                            }}
                            onToggleViewMode={() => {
                                furniture.setStoreViewMode("public");
                            }}
                        />
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="flex bg-white items-center gap-4 px-6 py-4 rounded-3xl shadow-sm border border-gray-100 mb-8">
                                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Active Virtual Store</h4>
                                    <p className="text-xs text-gray-500 font-medium">Your public URL is live</p>
                                </div>
                                <button 
                                    onClick={() => furniture.setStoreViewMode("internal")}
                                    className="ml-auto px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 transition-all hover:bg-black active:scale-95 cursor-pointer"
                                >
                                    Back to Manager
                                </button>
                            </div>
                            <FurniturePublicStore 
                                tiles={allTiles}
                                onPurchaseRequest={furniture.handlePurchaseRequest}
                            />
                        </div>
                    )}
                </div>
              )}

              {(activeTab as any) === "clients" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ClientsBoard 
                    tiles={allTiles}
                    onClientSubmit={furniture.handleClientSubmit}
                  />
                </div>
              )}

              {(activeTab as any) === "staff" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <StaffBoard 
                    tiles={allTiles}
                    onStaffSubmit={furniture.handleStaffSubmit}
                  />
                </div>
              )}

              {(activeTab as any) === "logistics" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <LogisticsBoard 
                    tiles={allTiles} 
                    appearance={appearance}
                    onUpdateTile={async (tileId, updates) => {
                       await content.updateTile(tileId, updates);
                       workspaceActions.refreshWorkspaces();
                    }}
                    onAddNote={async (noteData) => {
                      if (currentDashboard) {
                        await content.createNote(currentDashboard.id, noteData);
                        handleNotesChanged();
                        push({ title: "Nota de Protocolo criada", variant: "success" });
                      }
                    }}
                    onOpenOrderModal={(data) => {
                      furniture.setEditingOrder(data);
                      furniture.setOrderModalOpen(true);
                    }}
                  />
                </div>
              )}

               {(activeTab as any) === "members" && currentWorkspace && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MembersBoard 
                    workspaceId={currentWorkspace.id} 
                    userRole={auth.user?.globalRole}
                  />
                </div>
              )}

               {(activeTab as any) === "global_users" && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <GlobalUsersBoard />
                 </div>
               )}

               {(activeTab as any) === "mentoring_tasks" && currentWorkspace && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MentoringKanbanBoard 
                    workspaceId={currentWorkspace.id} 
                    isOwner={true}
                    currentUserRole={currentWorkspace.userId === auth.user?.id ? "mentor" : "mentee"}
                  />
                </div>
              )}

              {(activeTab as any) === "mentoring_schedule" && currentWorkspace && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MentoringScheduleBoard 
                    workspaceId={currentWorkspace.id} 
                    isOwner={currentWorkspace.userId === auth.user?.id}
                  />
                </div>
              )}

              {(activeTab as any) === "mentoring_profile" && currentWorkspace && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MentoringProfileBoard 
                    isOwner={currentWorkspace.userId === auth.user?.id}
                    workspaceId={currentWorkspace.id}
                  />
                </div>
              )}

              {(activeTab as any) === "survey" && currentWorkspace && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                  <SmartSurveyBoard 
                    workspaceId={currentWorkspace.id}
                    dashboardId={currentDashboard?.id}
                    tiles={allTiles}
                  />
                </div>
              )}

              {(activeTab as any) === "blog" && currentWorkspace && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
                  <AiBlogBoard />
                </div>
              )}

              {(activeTab as any) === "layout" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <StoreLayoutGrid 
                    tiles={displayedTiles} 
                    onSaveLayout={furniture.handleSaveLayout}
                    onExport={furniture.handleExportData}
                    appearance={appearance} 
                  />
                </div>
              )}
          </div>

          {/* Render Book Editor Modal right at AdminContainer top layer */}
          {openBookId && currentWorkspace && (
            <BookWriterView
              workspaceId={currentWorkspace.id}
              bookId={openBookId}
              initialMode={openBookMode}
              onClose={() => setOpenBookId(null)}
            />
          )}

        </>
      )}

      {/* Modals */}
      {modals.isAddWorkspaceOpen && (
        <AddWorkspaceModal
          open={modals.isAddWorkspaceOpen}
          onClose={closeAddWorkspace}
          onSubmit={async (payload) => {
            console.log(
              "[DEBUG] AdminContainer.createWorkspace onSubmit called:",
              payload
            );
            if (auth.canPerformAction("createWorkspace")) {
              console.log(
                "[DEBUG] AdminContainer.createWorkspace allowance OK"
              );

              try {
                // Generate insights using the same API as home page
                const generateInBackground = async () => {
                  const targetUrl = "/api/generate";
                  const requestPayload = {
                    salesRepCompany: payload.company,
                    salesRepWebsite: payload.companyWebsite,
                    solution: payload.solution,
                    targetCompany: payload.researchTarget,
                    targetWebsite: payload.researchWebsite,
                    templateId: payload.templateId,
                    model: payload.model,
                    promptAgent: payload.promptAgent,
                    responseLength: payload.responseLength,
                    promptVariables: payload.promptVariables || [],
                    bulkPrompts: payload.bulkPrompts || [],
                  };

                  console.log(
                    "[DEBUG] AdminContainer.createWorkspace generating:",
                    requestPayload
                  );

                  const response = await fetch(targetUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestPayload),
                  });

                  const data = await response.json().catch(() => null);

                  if (!response.ok) {
                    throw new Error(
                      data?.error || "Failed to generate insights"
                    );
                  }

                  if (data?.workspace) {
                    console.log(
                      "[DEBUG] AdminContainer.createWorkspace initializing workspace"
                    );
                    await workspaceActions.initializeWorkspaceFromHome(
                      data.workspace
                    );
                  }

                  push({
                    title: "Workspace created successfully!",
                    description: `Generated insights for ${payload.researchTarget}`,
                    variant: "success",
                  });

                  console.log(
                    "[DEBUG] AdminContainer.createWorkspace completed"
                  );
                };

                await generateInBackground();
                closeAddWorkspace();
              } catch (error) {
                console.error(
                  "[DEBUG] AdminContainer.createWorkspace error:",
                  error
                );
                push({
                  title: "Failed to create workspace",
                  description:
                    error instanceof Error ? error.message : "Please try again",
                  variant: "destructive",
                });
              }

              auth.consumeUsage("createWorkspace");
            } else {
              console.log(
                "[DEBUG] AdminContainer.createWorkspace allowance DENIED"
              );
              // Open the limits modal instead of just a toast
              useUIStore.getState().openSaaSLimits();

              push({
                title: "Workspace limit reached",
                description: "Upgrade your plan to create more workspaces",
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {modals.isAddPromptOpen && (
        <AddPromptModal
          open={modals.isAddPromptOpen}
          onClose={closeAddPrompt}
          onAddPrompt={handleAddPrompt}
        />
      )}

      {modals.isAddContactOpen && (
        <AddContactModal
          open={modals.isAddContactOpen}
          onClose={closeAddContact}
          onSubmit={async (payload) => {
            console.log(
              "[DEBUG] AdminContainer.createContact onSubmit called:",
              payload
            );
            if (payment.ensureAllowance("createContact")) {
              console.log("[DEBUG] AdminContainer.createContact allowance OK");
              if (currentDashboard) {
                console.log(
                  "[DEBUG] AdminContainer.createContact calling content.createContact"
                );
                // Map payload to match API expectations
                const contactData = {
                  name: payload.name,
                  jobTitle: payload.jobTitle, // Correct field name for API
                  linkedinUrl: payload.linkedinUrl,
                };
                await content.createContact(currentDashboard.id, contactData);
                console.log("[DEBUG] AdminContainer.createContact completed");
                // Refresh contacts from workspace store
                handleContactsChanged();
                push({
                  title: "Contact created",
                  description: "The contact has been added successfully.",
                  variant: "default",
                });
              }
              payment.commitUsage("createContact");
            } else {
              console.log(
                "[DEBUG] AdminContainer.createContact allowance DENIED"
              );
            }
          }}
        />
      )}

      {modals.isCreateBlankDashboardOpen && (
        <CreateBlankDashboardModal
          open={modals.isCreateBlankDashboardOpen}
          onClose={closeCreateBlankDashboard}
          onSubmit={async (payload) => {
            if (!currentWorkspace) return null;
            await workspaceActions.createDashboard(currentWorkspace.id, {
                name: payload.dashboardName,
              });
              closeCreateBlankDashboard();
              push({
                title: "Dashboard created",
                variant: "success",
              });
          }}
        />
      )}

      {/* Tile Detail Modal */}
      {/* Tile Detail Modal */}
      {(() => {
        console.log(
          "[DEBUG] AdminContainer rendering modal check:",
          !!modals.selectedTile
        );
        return null;
      })()}
      {modals.selectedTile && (
        <TileDetailModal
          tile={modals.selectedTile}
          onClose={() => setSelectedTile(null)}
          onSubmit={async (payload) => {
            if (auth.canPerformAction("tileChat")) {
              const serializedAttachments = payload.attachments?.map(
                (file) => ({
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  lastModified: file.lastModified,
                })
              );
              await content.chatWithTile(modals.selectedTile!.id, {
                message: payload.message,
                attachments: serializedAttachments,
              });
              auth.consumeUsage("tileChat");
            }
          }}
          isSubmitting={content.chattingTileId === modals.selectedTile?.id}
          isGuest={auth.isGuest}
          canChat={auth.canPerformAction("tileChat")}
          allowAttachments={true}
        />
      )}

      {/* Contact Detail Modal */}
      {modals.selectedContact && (
        <ContactDetailModal
          contact={modals.selectedContact}
          onClose={() => setSelectedContact(null)}
          onSubmitChat={async (message) => {
            if (auth.canPerformAction("contactChat")) {
              await content.chatWithContact(
                modals.selectedContact!.id,
                message
              );
              auth.consumeUsage("contactChat");
            }
          }}
          isChatting={content.chattingContactId === modals.selectedContact?.id}
        />
      )}

      {/* Workspace Detail Modal */}
      {modals.isWorkspaceDetailOpen && (
        <WorkspaceDetailModal
          open={modals.isWorkspaceDetailOpen}
          onClose={closeWorkspaceDetail}
          workspaceId={modals.viewingWorkspaceId}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        open={payment.isUpgradeModalOpen}
        onClose={() => payment.setUpgradeModalOpen(false)}
        onCheckout={payment.startCheckout}
        onMarkMember={payment.confirmMembership}
        usage={payment.usage}
        limits={payment.limits}
        stripeCheckoutUrl={payment.stripeCheckoutUrl}
      />

      {/* Modals */}
      <SaaSLimitsModal
        isOpen={modals.isSaaSLimitsOpen}
        onClose={closeSaaSLimits}
        appearance={appearance}
      />

      <VoiceAssistantOverlay 
        workspace={currentWorkspace} 
        dashboard={currentDashboard} 
        onTabChange={setActiveTab}
      />

      {/* Book Reader Preview */}
      <BookReaderModal
        open={modals.isPreviewOpen}
        onClose={closePreview}
        tiles={allTiles}
        title={currentWorkspace?.name || "Book Preview"}
      />

      {furniture.orderModalOpen && (
        <AddOrderModal
          open={furniture.orderModalOpen}
          onClose={() => {
            furniture.setOrderModalOpen(false);
            furniture.setEditingOrder(null);
          }}
          onSubmit={furniture.handleOrderSubmit}
          initialData={furniture.editingOrder}
          clients={Array.isArray(allTiles.find(t => t.category === "clients")?.metadata) ? allTiles.find(t => t.category === "clients")?.metadata : (allTiles.find(t => t.category === "clients")?.metadata?.clients || [])}
          staff={Array.isArray(allTiles.find(t => t.category === "staff")?.metadata) ? allTiles.find(t => t.category === "staff")?.metadata : (allTiles.find(t => t.category === "staff")?.metadata?.staff || [])}
          products={Array.isArray(allTiles.find(t => t.category === "products")?.metadata) ? allTiles.find(t => t.category === "products")?.metadata : (allTiles.find(t => t.category === "products")?.metadata?.products || [])}
        />
      )}

      <AddProductModal 
        open={furniture.productModalOpen}
        onClose={() => {
            furniture.setProductModalOpen(false);
            furniture.setEditingProduct(null);
        }}
        onSubmit={furniture.handleProductSubmit}
        initialData={furniture.editingProduct}
        workspaceId={currentWorkspace?.id}
      />

    </AdminShellAde >
  );
}
