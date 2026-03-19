"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  BookOpen,
  Loader2,
  Play,
  Lock,
  Users,
  Check,
  X,
  Ban,
  Trash2,
  PauseCircle,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import {
  useBooks,
  useDeleteBook,
  useUpdateBook,
} from "@/lib/state/query/book.queries";
import { useCreateBook } from "@/lib/state/query/book.queries";
import { useUser } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";
import { useBookStream } from "@/lib/hooks/useBookStream";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import { toast } from "sonner";
import { 
  generateImageSchedule, 
  buildImagePromptContext,
  calculateImageCosts
} from "@/lib/services/bookImageService";

// Helper to call the image generation API
async function generateImage(payload: { prompt: string; workspaceId: string; imageStyle: string; size?: string }) {
  console.log("[generateImage] Requesting image with prompt:", payload.prompt);
  const res = await fetch("/api/generate/book-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to generate image");
  }

  const data = await res.json();
  return data.url as string;
}

interface BookLibrarySectionProps {
  workspaceId: string;
  dashboardId: string | undefined;
  dashboardName: string | undefined;
  workspaceName: string | undefined;
  onOpenBook: (bookId: string, mode: "library" | "create") => void;
}

export function BookLibrarySection({
  workspaceId,
  dashboardId,
  dashboardName,
  workspaceName,
  onOpenBook,
}: BookLibrarySectionProps) {
  const { data: books, isLoading } = useBooks(workspaceId);
  const { mutate: createBook, isPending: isCreating } = useCreateBook();
  const { mutate: deleteBook } = useDeleteBook();
  const { mutate: updateBook } = useUpdateBook();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const user = useUser();
  const router = useRouter();

  // Generation State Tracking
  // paused = paused mid-generation; stopped = permanently ended
  const [generatingBooks, setGeneratingBooks] = useState<
    Record<
      string,
      {
        currentArc: number;
        totalArcs: number;
        paused: boolean;
        stopped: boolean;
        status?: string; 
        synopsis?: string;
        pauseFn: () => void;
        stopFn: () => void;
        elapsedTime: number;
      }
    >
  >({});

  // Unified dashboard context for generation
  const currentDashboard = useWorkspaceStore((state) => state.currentDashboard);
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const tiles = currentDashboard?.tiles || [];
  const contacts = currentDashboard?.contacts || [];
  const notes = currentDashboard?.notes || [];

  const { startStream } = useBookStream({
    onSuccess: () => {},
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Timer Effect for active generation
  useEffect(() => {
    const timer = setInterval(() => {
      setGeneratingBooks((prev) => {
        const next = { ...prev };
        let hasUpdates = false;
        for (const id in next) {
          if (!next[id].paused && !next[id].stopped) {
            next[id] = { ...next[id], elapsedTime: (next[id].elapsedTime || 0) + 1 };
            hasUpdates = true;
          }
        }
        return hasUpdates ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isMember = user?.role === "member";

  const [formData, setFormData] = useState({
    title: workspaceName
      ? `The Story of ${workspaceName}`
      : "The Story of Love",
    authorship: "independent",
    publisher: "Autores Apaixonados",
    isbn: "",
    isPublic: false,
    adultContent: false,
    restrictPublicity: false,
    pagesCountGoal: 25,
    inspiration: "Original",
    removeCoAuthorship: false,
    language: "English",
    generateCover: false as boolean,
    internalImagesCount: "none" as "none" | "1" | "2" | "3",
    imageStyle: "romantic" as
      | "realistic"
      | "painterly"
      | "illustrated"
      | "watercolor"
      | "romantic"
      | "cinematic"
      | "minimalist"
      | "anime"
      | "3d-movie"
      | "cartoon"
      | "fantasy"
      | "vintage"
      | "noir",
  });

  const handleCreateBook = () => {
    if (isCreating) return;
    createBook(
      {
        workspaceId,
        dashboardId: dashboardId,
        ...formData,
      },
      {
        onSuccess: (res) => {
          setIsConfirmOpen(false);
          startBookGeneration(res.bookId, undefined, false, res.book);
        },
      },
    );
  };

  const startBookGeneration = async (
    targetBookId: string,
    targetArcs?: number,
    isResume = false,
    passedBook?: any // Optional passed book to avoid race condition
  ) => {
    let pauseRequested = false;
    let stopRequested = false;
    
    const selectedBook = passedBook && passedBook._id === targetBookId 
      ? passedBook 
      : books?.find((b) => b._id === targetBookId);
    
    const targetBookForContext = selectedBook || (formData.title ? formData : null);
    if (!targetBookForContext) {
      toast.error("Book data not found.");
      return;
    }

    const currentLanguage = formData.language || "English";
    const sortedTiles = [...tiles].sort((a, b) => a.orderIndex - b.orderIndex);

    if (sortedTiles.length === 0) {
      toast.error("No arcs found. Add arcs before generating a book.");
      return;
    }

    const baseArcs = sortedTiles.length;
    const calculatedTargetArcs = Math.ceil(formData.pagesCountGoal / 20);
    const totalArcs = Math.max(baseArcs, calculatedTargetArcs);

    if (totalArcs > baseArcs) {
      const lastTile = sortedTiles[sortedTiles.length - 1];
      for (let i = baseArcs; i < totalArcs; i++) {
        sortedTiles.push({
          ...lastTile,
          title: `${lastTile.title} (Extended ${i - baseArcs + 1})`,
          content: `Continue and extend the story from the previous arc, building on the established narrative for the longer book format.`,
          orderIndex: lastTile.orderIndex + (i - baseArcs + 1),
        });
      }
    }

    const totalWords = formData.pagesCountGoal * 250;
    const wordsPerArc = Math.round(totalWords / totalArcs);

    const pauseFn = () => {
      pauseRequested = true;
      setGeneratingBooks((prev) => ({
        ...prev,
        [targetBookId]: { ...prev[targetBookId], paused: true, status: "Paused" },
      }));
      toast.info("Book generation paused.");
    };

    const stopFn = () => {
      stopRequested = true;
      pauseRequested = true;
      setGeneratingBooks((prev) => ({
        ...prev,
        [targetBookId]: { ...prev[targetBookId], paused: false, stopped: true, status: "Stopped" },
      }));
      toast.info("Book generation stopped.");
    };

    const prevState = generatingBooks[targetBookId];

    // -- Utilities --
    const stripHTML = (html: string) =>
      html
        .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n\n$1\n\n")
        .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    const parseAndAppend = (raw: string, isFirstOfArc: boolean): string => {
      const normalized = raw
        .replace(/\r/g, "")
        .replace(/\\n\\n/g, "\n\n")
        .replace(/\\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      let pageTitle = "";
      const titleMatch = normalized.match(/\[TITLE\](.*?)\[END_TITLE\]/);
      if (titleMatch) pageTitle = titleMatch[1].trim();

      const cleanText = normalized.replace(/\[TITLE\][\s\S]*?\[END_TITLE\]/, "").trim();
      const paragraphs = cleanText.split(/\n\n+|\n(?=—)/);
      let html = isFirstOfArc && pageTitle ? `<h2>${pageTitle}</h2>` : "";
      html += paragraphs.map((para) => {
        const lines = para.split("\n").filter((l) => l.trim());
        return lines.map((line) => {
          const t = line.trim();
          if (!t) return "";
          if (t.startsWith("—")) return `<p class="dialogue" style="text-indent: 1em; font-style: italic;">${t}</p>`;
          return `<p>${t}</p>`;
        }).join("");
      }).join("");
      return html;
    };

    // Calculate total stages (Synopsis + Arcs + Optional Cover)
    const hasCoverStep = !!(targetBookForContext.generateCover && !targetBookForContext.coverImageUrl);
    const totalStages = totalArcs + (hasCoverStep ? 1 : 0) + 1; // +1 for synopsis

    setGeneratingBooks((prev) => ({
      ...prev,
      [targetBookId]: {
        currentArc: 0,
        totalArcs: totalStages,
        paused: false,
        stopped: false,
        status: hasCoverStep ? "Generating Cover..." : "Generating Synopsis...",
        pauseFn,
        stopFn,
        elapsedTime: 0,
      },
    }));

    toast.info(isResume ? "Resuming book writing..." : "Starting book writing...");

    const charactersToolbox = contacts.length > 0
      ? "CHARACTERS:\n" + contacts.map((c) => `- ${c.name}: ${c.notes || c.jobTitle || ""}`).join("\n")
      : "";
    const worldToolbox = notes.length > 0
      ? "WORLD NOTES:\n" + notes.map((n) => `- ${n.title}: ${n.content}`).join("\n")
      : "";

    console.warn("[startBookGeneration] DEBUG V2.5-STORY-FIX");
    console.warn("[startBookGeneration] Original Story from Workspace:", currentWorkspace?.promptSettings?.sellingSolutionsFor);

    const imageContext = buildImagePromptContext({
      bookTitle: targetBookForContext.title,
      bookDescription: targetBookForContext.inspiration || targetBookForContext.title,
      authorName: targetBookForContext.publisher || "Author",
      imageStyle: targetBookForContext.imageStyle as any,
      originalStory: currentWorkspace?.promptSettings?.sellingSolutionsFor,
      contacts: contacts as any[],
      notes: notes as any[],
      tiles: tiles as any[],
    });

    const imageSchedule = generateImageSchedule(totalArcs, {
      generateCover: !!targetBookForContext.generateCover,
      internalImagesCount: targetBookForContext.internalImagesCount as any,
      imageStyle: targetBookForContext.imageStyle as any,
    }, imageContext);

    console.log("[startBookGeneration] imageContext built:", JSON.stringify(imageContext, null, 2));
    if (imageSchedule.cover) {
      console.log("[startBookGeneration] Cover prompt generated:", imageSchedule.cover.prompt);
    }

    // 1. Generate Cover IN THE BACKGROUND if requested (NOT blocking)
    if (hasCoverStep && !isResume) {
      console.log("[startBookGeneration] Starting background cover generation...");
      
      const totalImages = (imageSchedule.chapters.reduce((acc, c) => acc + c.images.length, 0)) + 1;
      setGeneratingBooks((p) => ({ 
        ...p, 
        [targetBookId]: { ...p[targetBookId], status: `Generating Cover (1/${totalImages})...` } 
      }));

      generateImage({
        prompt: imageSchedule.cover!.prompt,
        workspaceId,
        imageStyle: imageSchedule.cover!.style,
        size: "1536x1024",
      })
      .then(async (coverUrl) => {
        await updateBook({ bookId: targetBookId, updates: { coverImageUrl: coverUrl } });
        toast.success("Cover generated in background! 🎨");
      })
      .catch((error) => {
        console.error("Background cover generation failed:", error);
        toast.error("Cover generation failed, but story continues...");
      });
    }

    // 2. Generate Story Synopsis
    let synopsis = isResume ? prevState?.synopsis || "" : "";
    if (!isResume) {
      setGeneratingBooks((p) => ({ ...p, [targetBookId]: { ...p[targetBookId], status: `Synopsis (1/${totalArcs})...` } }));
      const arcSummary = sortedTiles.map((t, i) => `Arc ${i + 1} — ${t.title}: ${t.content}`).join("\n");
      const synopsisPrompt = `You are an expert romance novelist. Create a concise outline in ${currentLanguage}.\n\n${charactersToolbox}\n${worldToolbox}\n\nARCS:\n${arcSummary}\n\nWrite a 200-300 word synopsis synthesizing the journey. Output ONLY synopsis text.`;

      await new Promise<void>((resolve) => {
        let buffer = "";
        startStream({ prompt: synopsisPrompt, previousContent: "", bookContext: `Book about ${workspaceName}`, workspaceId, language: currentLanguage }, 
          (chunk) => { buffer += chunk; })
          .then(() => {
            synopsis = buffer.trim();
            setGeneratingBooks((p) => ({ 
              ...p, 
              [targetBookId]: { 
                ...p[targetBookId], 
                synopsis, 
                currentArc: (p[targetBookId]?.currentArc || 0) + 1,
                status: "Generating Chapters..." 
              } 
            }));
            resolve();
          })
          .catch(() => resolve());
      });
    }

    // 3. Write Arc Chapters
    let accumulatedHTML = selectedBook?.pages?.[0]?.content || "";
    const resumeFromArc = isResume && prevState ? prevState.currentArc : 0;

    for (let arcIndex = 0; arcIndex < sortedTiles.length; arcIndex++) {
      if (stopRequested || pauseRequested) break;
      if (arcIndex < resumeFromArc) continue;

      const tile = sortedTiles[arcIndex];
      const arcNum = arcIndex + 1;

      setGeneratingBooks((p) => ({ 
        ...p, 
        [targetBookId]: { ...p[targetBookId], status: `Arc ${arcNum} / ${totalArcs}...` } 
      }));

      const plainContext = stripHTML(accumulatedHTML).slice(-6000);
      const chapterImages = imageSchedule.chapters.find(c => c.chapterIndex === arcIndex)?.images || [];
      
      const getImgTag = async (pos: "beginning" | "middle" | "end") => {
        const config = chapterImages.find(img => img.position === pos);
        if (!config) return "";
        try {
          const url = await generateImage({ prompt: config.prompt, workspaceId, imageStyle: config.style });
          return `<img src="${url}" alt="${pos} image" class="w-full h-auto my-4 rounded-lg shadow-md" />`;
        } catch { return ""; }
      };

      const beginningImg = await getImgTag("beginning");
      let chapterPrompt = `Romance novelist writing arc ${arcNum} of ${totalArcs}. Language: ${currentLanguage}.\nSynopsis: ${synopsis}\nArcs: ${tile.title} - ${tile.content}\nDialogue uses em-dash (—) and NO quotes. Format: [TITLE] Title [END_TITLE] then plain text paragraphs. No meta. Approx ${wordsPerArc} words.`;

      await new Promise<void>((resolve) => {
        let buffer = "";
        startStream({ prompt: chapterPrompt, previousContent: plainContext, bookContext: `Arc ${arcNum}: ${tile.title}`, workspaceId, language: currentLanguage }, 
          (chunk) => { buffer += chunk; })
          .then(async () => {
            let chapterHTML = parseAndAppend(buffer, true);
            if (beginningImg) chapterHTML = beginningImg + chapterHTML;
            
            const middleImg = await getImgTag("middle");
            if (middleImg) {
              const paras = chapterHTML.split("</p>");
              if (paras.length > 2) paras.splice(Math.floor(paras.length/2), 0, middleImg);
              else chapterHTML += middleImg;
              chapterHTML = paras.join("</p>");
            }
            
            const endImg = await getImgTag("end");
            if (endImg) chapterHTML += endImg;

            accumulatedHTML += chapterHTML;
            updateBook({ bookId: targetBookId, updates: { pages: [{ title: tile.title, content: accumulatedHTML, orderIndex: 0 }] } });
            
            setGeneratingBooks((p) => ({ 
              ...p, 
              [targetBookId]: { ...p[targetBookId], currentArc: (p[targetBookId]?.currentArc || 0) + 1 } 
            }));
            resolve();
          })
          .catch(() => resolve());
      });
    }

    if (!pauseRequested && !stopRequested) {
      toast.success("Book complete! 🎉");
      setGeneratingBooks((prev) => {
        const newState = { ...prev };
        delete newState[targetBookId];
        return newState;
      });
    }
  };


  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-pink-400" />
      </div>
    );
  }

  return (
    <div className="mb-10 mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <BookOpen className="w-5 h-5 text-pink-500" />
            Workspace Library
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your generated books and publish new ones.
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap gap-4 pb-4 pt-2">
          {/* Start New Book Trigger */}
          {isMember ? (
            <div
              onClick={() => setIsConfirmOpen(true)}
              className="flex-none w-64 p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-pink-400 hover:bg-pink-50 cursor-pointer transition-all bg-transparent flex flex-col items-center justify-center text-center group min-h-160px"
            >
              {isCreating ? (
                <Loader2 className="w-8 h-8 text-pink-400 animate-spin mb-3" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
              )}
              <h3 className="font-semibold text-gray-700">Publish New Book</h3>
              <p className="text-xs text-gray-400 mt-1 px-4">
                Create a blank canvas with AI Ghostwriter
              </p>
            </div>
          ) : (
            <div
              onClick={() => router.push("/sign-up")}
              className="flex-none w-64 p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-all bg-gray-50/50 flex flex-col items-center justify-center text-center group min-h-160px"
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-700">Members Only</h3>
              <p className="text-xs text-gray-500 mt-1 px-4">
                Create an account to publish AI Books safely.
              </p>
            </div>
          )}

          {/* Existing Books */}
          {books
            ?.slice()
            .reverse()
            .map((book) => {
              const gs = generatingBooks[book._id];
              const isActivelyWriting =
                gs && !gs.paused && !gs.stopped && gs.currentArc < gs.totalArcs;
              const isPaused = gs && gs.paused && !gs.stopped;
              const isStopped = gs && gs.stopped;
              const isDone =
                gs &&
                !gs.paused &&
                !gs.stopped &&
                gs.currentArc >= gs.totalArcs;
              const hasProgress = !!gs;

              return (
                <div
                  key={book._id}
                  onClick={() => onOpenBook(book._id, "library")}
                  className={`flex-none w-64 p-5 border rounded-xl transition-all relative group flex flex-col min-h-160px cursor-pointer
                            ${isActivelyWriting ? "border-pink-400 bg-pink-50 shadow-md shadow-pink-100" : "border-gray-200 hover:border-pink-300 hover:shadow-md bg-white"}`}
                >
                  {/* Deletion Overlay - Disabled if actively generating */}
                  {!isActivelyWriting && (
                    <div
                      className={`absolute right-2 top-2 flex items-center space-x-1 rounded-md border bg-white p-1 shadow-sm transition-all z-20 ${
                        isDeletingId === book._id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isDeletingId !== book._id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDeletingId(book._id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                          title="Delete Book"
                        >
                          <Trash2 className="h-4 w-4 cursor-pointer" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                          <span className="text-[10px] font-bold text-red-500 px-1">
                            Delete?
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBook(book._id);
                              setIsDeletingId(null);
                              if (gs?.stopFn) gs.stopFn();
                            }}
                            className="flex h-7 px-2 items-center justify-center rounded-md bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsDeletingId(null);
                            }}
                            className="flex h-7 px-2 items-center justify-center rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold hover:bg-gray-200 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {isActivelyWriting ? (
                    <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-500 flex items-center justify-center mb-3 shadow-inner">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-3 group-hover:bg-pink-50 group-hover:text-pink-500 group-hover:border-pink-100 transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}

                  <h3
                    className="font-semibold text-gray-800 truncate mb-1"
                    title={book.title}
                  >
                    {book.title}
                  </h3>

                  {hasProgress ? (
                      <div className="flex flex-col gap-2">
                        {/* Arc Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-pink-600">
                            <span className={isActivelyWriting ? "animate-pulse" : ""}>
                              {isStopped
                                ? "Stopped"
                                : isPaused
                                  ? "Paused"
                                  : isDone
                                    ? "Complete ✓"
                                    : gs.status || `Arc ${gs.currentArc + 1} / ${gs.totalArcs}`}
                            </span>
                            <span>{Math.round((gs.currentArc / gs.totalArcs) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-pink-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full transition-all duration-1000 ease-out ${isDone ? "bg-green-500" : isStopped ? "bg-gray-400" : "bg-pink-500"} ${isActivelyWriting ? "animate-pulse" : ""}`}
                              style={{
                                width: `${Math.min((gs.currentArc / gs.totalArcs) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Image Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-blue-500">
                            <span>Image Art</span>
                            <span>{book.coverImageUrl ? "1/1" : "0/1"}</span>
                          </div>
                          <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden shadow-inner font-bold">
                            <div
                              className={`h-full transition-all duration-1000 ease-out ${book.coverImageUrl ? "bg-blue-500" : "bg-blue-200 animate-pulse"}`}
                              style={{
                                width: book.coverImageUrl ? "100%" : "20%",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                  ) : (
                    <div className="mb-4" />
                  )}

                  <div className="mt-auto flex gap-2 w-full pt-3 border-t border-gray-100/50">
                    {isActivelyWriting ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (gs?.pauseFn) gs.pauseFn();
                          }}
                          className="flex-1 py-1.5 px-2 bg-white text-gray-700 hover:bg-gray-50 rounded-md text-xs font-bold transition-all border border-gray-200 shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <PauseCircle className="w-3.5 h-3.5" /> Pause
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (gs?.stopFn) gs.stopFn();
                          }}
                          className="flex-1 py-1.5 px-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-bold transition-all border border-red-200 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <StopCircle className="w-3.5 h-3.5" /> Stop
                        </button>
                      </>
                    ) : isPaused ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBook(book._id, "library");
                          }}
                          className="flex-1 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-md text-xs font-medium transition-colors border border-gray-200 cursor-pointer"
                        >
                          Read
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startBookGeneration(book._id, undefined, true);
                          }}
                          className="flex-1 py-1.5 px-2 bg-pink-600 text-white hover:bg-pink-700 rounded-md text-xs font-bold transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <PlayCircle className="w-3.5 h-3.5" /> Resume
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBook(book._id, "library");
                        }}
                        className="w-full py-1.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-md text-xs font-medium transition-colors border border-gray-200 cursor-pointer"
                      >
                        Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {books?.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 md:px-0 opacity-60 pointer-events-none">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 mb-3">
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                No books generated yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom React Modal for Credit Warning */}
      {isConfirmOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-white/20">
              <div className="px-8 py-6 border-b bg-linear-to-r from-pink-50 to-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    Publish New Book
                  </h3>
                  <p className="text-xs text-pink-500 font-bold uppercase tracking-wider mt-1">
                    Ghostwriter Settings
                  </p>
                </div>
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all text-gray-400 hover:text-pink-600 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 scrollbar-hide flex-1">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                      Book Title
                    </label>
                    <input
                      type="text"
                      className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-pink-500 focus:ring-0 outline-none transition-all bg-gray-50/50 hover:bg-white focus:bg-white text-lg font-medium"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Ex: The Story of Jessica & Lillian"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Inspiration */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                        Inspiration / Style
                      </label>
                      <select
                        className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-pink-500 focus:ring-0 outline-none bg-gray-50/50 hover:bg-white focus:bg-white transition-all appearance-none cursor-pointer"
                        value={formData.inspiration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            inspiration: e.target.value,
                          })
                        }
                      >
                        <option value="Original">✨ Original (Default)</option>
                        <option value="Notebook">📓 The Notebook</option>
                        <option value="Titanic">⛴️ Titanic</option>
                        <option value="Pride and Prejudice">
                          👑 Pride and Prejudice
                        </option>
                        <option value="La La Land">💃 La La Land</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                        Language
                      </label>
                      <select
                        className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-pink-500 focus:ring-0 outline-none bg-gray-50/50 hover:bg-white focus:bg-white transition-all appearance-none cursor-pointer"
                        value={formData.language}
                        onChange={(e) =>
                          setFormData({ ...formData, language: e.target.value })
                        }
                      >
                        <option value="English">🇺🇸 English</option>
                        <option value="Portuguese">🇧🇷 Portuguese</option>
                        <option value="Spanish">🇪🇸 Spanish</option>
                        <option value="French">🇫🇷 French</option>
                        <option value="Italian">🇮🇹 Italian</option>
                      </select>
                    </div>

                    {/* ISBN */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                        ISBN{" "}
                        <span className="text-[10px] font-normal text-gray-400 font-mono">
                          (OPTIONAL)
                        </span>
                      </label>
                      <input
                        type="text"
                        className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-pink-500 focus:ring-0 outline-none transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                        value={formData.isbn}
                        onChange={(e) =>
                          setFormData({ ...formData, isbn: e.target.value })
                        }
                        placeholder="Ex: 978-3-16-148410-0"
                      />
                    </div>
                  </div>

                  {/* Page Count Presets */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 px-1">
                      Target Pages
                    </label>
                    <div className="flex gap-3">
                      {[25, 75, 120].map((pages) => (
                        <button
                          key={pages}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, pagesCountGoal: pages })
                          }
                          className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-lg cursor-pointer ${
                            formData.pagesCountGoal === pages
                              ? "border-pink-500 bg-pink-500 text-white shadow-lg shadow-pink-200"
                              : "border-gray-100 bg-gray-50/50 text-gray-400 hover:border-pink-200 hover:bg-white"
                          }`}
                        >
                          {pages}{" "}
                          <span className="text-xs font-normal opacity-80 ml-1">
                            Pgs
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Image Generation Options */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold px-1 mb-4 italic text-pink-600/60">
                    Image Generation (100 credits per image/cover)
                  </label>

                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                      formData.generateCover
                        ? "border-pink-200 bg-pink-50/30"
                        : "border-gray-100 bg-white hover:border-pink-100"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl transition-colors ${
                        formData.generateCover
                          ? "bg-pink-500 text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-sm font-bold text-gray-800">
                        Generate Book Cover
                      </span>
                      <span className="text-[10px] text-gray-500 leading-tight">
                        AI-generated professional cover (100 credits)
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.generateCover}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          generateCover: e.target.checked,
                        })
                      }
                    />
                    <div
                      className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${
                        formData.generateCover
                          ? "border-pink-500 bg-pink-500"
                          : "border-gray-200"
                      }`}
                    >
                      {formData.generateCover && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 px-1">
                      Internal Chapter Images
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {(["none", "1", "2", "3"] as const).map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              internalImagesCount: count,
                            })
                          }
                          className={`py-3 rounded-2xl border-2 transition-all font-bold cursor-pointer ${
                            formData.internalImagesCount === count
                              ? "border-pink-500 bg-pink-500 text-white shadow-lg shadow-pink-200"
                              : "border-gray-100 bg-gray-50/50 text-gray-400 hover:border-pink-200 hover:bg-white"
                          }`}
                        >
                          <span className="text-sm">
                            {count === "none" ? "None" : `${count}`}
                          </span>
                          {count !== "none" && (
                            <span className="text-[10px] font-normal opacity-80 block mt-1">
                              {100 * parseInt(count)} cr.
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 px-1">
                      Image Style (Applied to all images)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(
                        [
                          "realistic",
                          "painterly",
                          "illustrated",
                          "watercolor",
                          "romantic",
                          "cinematic",
                          "minimalist",
                          "anime",
                          "3d-movie",
                          "cartoon",
                          "fantasy",
                          "vintage",
                          "noir",
                        ] as const
                      ).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              imageStyle: style,
                            })
                          }
                          className={`py-2.5 rounded-lg border-2 transition-all font-semibold text-xs cursor-pointer ${
                            formData.imageStyle === style
                              ? "border-pink-500 bg-pink-500 text-white shadow-md shadow-pink-200"
                              : "border-gray-100 bg-gray-50/50 text-gray-600 hover:border-pink-200 hover:bg-white"
                          }`}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Premium Toggles & Addons */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold px-1 mb-4 italic text-pink-600/60">
                    Writer's Toolbox & Addons
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label
                      className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.removeCoAuthorship ? "border-pink-200 bg-pink-50/30" : "border-gray-100 bg-white hover:border-pink-100"}`}
                    >
                      <div
                        className={`p-3 rounded-xl transition-colors ${formData.removeCoAuthorship ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-400"}`}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-sm font-bold text-gray-800">
                          Independent Authorship
                        </span>
                        <span className="text-[10px] text-gray-500 leading-tight">
                          Remove "Autores Apaixonados" co-authorship
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.removeCoAuthorship}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            removeCoAuthorship: e.target.checked,
                          })
                        }
                      />
                      <div
                        className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${formData.removeCoAuthorship ? "border-pink-500 bg-pink-500" : "border-gray-200"}`}
                      >
                        {formData.removeCoAuthorship && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.isPublic ? "border-blue-200 bg-blue-50/30" : "border-gray-100 bg-white hover:border-blue-100"}`}
                    >
                      <div
                        className={`p-3 rounded-xl transition-colors ${formData.isPublic ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"}`}
                      >
                        <Play className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-sm font-bold text-gray-800">
                          Publish to Store
                        </span>
                        <span className="text-[10px] text-gray-500 leading-tight">
                          Book visible to the public
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.isPublic}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isPublic: e.target.checked,
                          })
                        }
                      />
                      <div
                        className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${formData.isPublic ? "border-blue-500 bg-blue-500" : "border-gray-200"}`}
                      >
                        {formData.isPublic && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.adultContent ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-white hover:border-red-100"}`}
                    >
                      <div
                        className={`p-3 rounded-xl transition-colors ${formData.adultContent ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400"}`}
                      >
                        <div className="relative">
                          <Ban className="w-5 h-5" />
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
                            18
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className="block text-sm font-bold text-gray-800">
                          Adult Content
                        </span>
                        <span className="text-[10px] text-gray-500 leading-tight">
                          18+ Rating
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.adultContent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            adultContent: e.target.checked,
                          })
                        }
                      />
                      <div
                        className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${formData.adultContent ? "border-red-500 bg-red-500" : "border-gray-200"}`}
                      >
                        {formData.adultContent && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.restrictPublicity ? "border-orange-200 bg-orange-50/30" : "border-gray-100 bg-white hover:border-orange-100"}`}
                    >
                      <div
                        className={`p-3 rounded-xl transition-colors ${formData.restrictPublicity ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"}`}
                      >
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-sm font-bold text-gray-800">
                          Restrict Publicity
                        </span>
                        <span className="text-[10px] text-gray-500 leading-tight">
                          Private use / No marketing
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.restrictPublicity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            restrictPublicity: e.target.checked,
                          })
                        }
                      />
                      <div
                        className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${formData.restrictPublicity ? "border-orange-500 bg-orange-500" : "border-gray-200"}`}
                      >
                        {formData.restrictPublicity && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <p className="text-sm font-medium text-pink-600 bg-pink-50 p-6 rounded-3xl border-2 border-pink-100/50 flex items-start gap-4 shadow-inner">
                  <span className="text-2xl">✍️</span>
                  <span>
                    Publishing will start automatic arc-by-arc writing.
                    Consumption is <strong>20 Credits</strong> per generation.
                  </span>
                </p>
              </div>

              <div className="p-8 border-t bg-gray-50/80 flex justify-end gap-4 shrink-0">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-8 py-4 rounded-2xl text-sm font-bold text-gray-500 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBook}
                  disabled={isCreating}
                  className="px-10 py-4 rounded-2xl text-sm font-black bg-pink-600 hover:bg-pink-700 text-white shadow-xl shadow-pink-200 hover:shadow-pink-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3 cursor-pointer group"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Book...
                    </>
                  ) : (
                    <>Publish & Start Writing</>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
