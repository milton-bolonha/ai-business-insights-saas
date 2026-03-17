"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, BookOpen, Loader2, Play, Lock, Users, Shield, Wand2, Check, ShieldAlert, X, Ban, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import { useBooks, useDeleteBook, useUpdateBook } from "@/lib/state/query/book.queries";
import { useCreateBook } from "@/lib/state/query/book.queries";
import { useUser } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";
import { useBookStream } from "@/lib/hooks/useBookStream";
import { useWorkspaceStore } from "@/lib/stores/workspaceStore";
import { toast } from "sonner";

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
    onOpenBook
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
    const [generatingBooks, setGeneratingBooks] = useState<Record<string, { current: number, total: number, paused: boolean, stopFn?: () => void }>>({});
    
    // Unified dashboard context for generation
    const currentDashboard = useWorkspaceStore(state => state.currentDashboard);
    const tiles = currentDashboard?.tiles || [];
    const contacts = currentDashboard?.contacts || [];
    const notes = currentDashboard?.notes || [];

    const { startStream } = useBookStream({
        onSuccess: () => {},
        onError: (err) => {
            toast.error(err.message);
        }
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    const isMember = user?.role === "member";

    const [formData, setFormData] = useState({
        title: workspaceName ? `The Story of ${workspaceName}` : "The Story of Love",
        authorship: "independent",
        publisher: "Autores Apaixonados",
        isbn: "",
        isPublic: false,
        adultContent: false,
        restrictPublicity: false,
        pagesCountGoal: 25,
        inspiration: "Original",
        removeCoAuthorship: false
    });

    const handleCreateBook = () => {
        if (isCreating) return;
        createBook({
            workspaceId,
            dashboardId: dashboardId,
            ...formData
        }, {
            onSuccess: (res) => {
                setIsConfirmOpen(false);
                // Start generation immediately in background
                startBookGeneration(res.bookId, formData.pagesCountGoal);
            }
        });
    };

    const startBookGeneration = async (targetBookId: string, pagesGoal: number = 25, isResume = false) => {
        const selectedBook = books?.find(b => b._id === targetBookId);
        
        let stopRequested = false;

        const stopFn = () => {
            stopRequested = true;
            setGeneratingBooks(prev => ({
                ...prev,
                [targetBookId]: { ...prev[targetBookId], paused: true }
            }));
            toast.info("Book generation paused.");
        };

        // Initialize or Resume State
        setGeneratingBooks(prev => ({
            ...prev,
            [targetBookId]: { 
                current: prev[targetBookId] ? prev[targetBookId].current : 0, 
                total: pagesGoal, 
                paused: false, 
                stopFn 
            }
        }));

        toast.info(isResume ? "Resuming Book Generation..." : "Starting Book Generation...");

        // Act distribution
        const act12Pages = Math.ceil(pagesGoal * 0.25);
        const act345Pages = Math.ceil(pagesGoal * 0.60);
        const actFinalPages = Math.max(1, pagesGoal - act12Pages - act345Pages);

        const arcDistribution: Record<number, number> = {
            0: Math.ceil(act12Pages / 2),
            1: Math.floor(act12Pages / 2),
            2: Math.ceil(act345Pages / 3),
            3: Math.ceil(act345Pages / 3),
            4: Math.floor(act345Pages / 3),
            5: actFinalPages
        };

        const sortedTiles = [...tiles].sort((a, b) => a.orderIndex - b.orderIndex);
        
        // Retreive existing content if resuming
        let accumulatedHTML = selectedBook?.pages?.[0]?.content || "";

        for (const tile of sortedTiles) {
            if (stopRequested) break;

            const pagesForThisArc = arcDistribution[tile.orderIndex] || 1;

            for (let p = 0; p < pagesForThisArc; p++) {
                if (stopRequested) break;

                const pageNum = p + 1;
                const totalPageNum = Array.from(Object.values(arcDistribution)).slice(0, tile.orderIndex).reduce((a, b) => a + b, 0) + pageNum;

                // Skip if resuming and we already generated these pages
                // Very simple heuristic: Assuming 1 page = ~300 words, if we have words, we skip.
                const wordCount = accumulatedHTML.split(/\s+/).filter(Boolean).length;
                const estimatedPagesAlreadyDone = Math.floor(wordCount / 300);
                
                if (totalPageNum <= estimatedPagesAlreadyDone) {
                    setGeneratingBooks(prev => ({
                        ...prev, [targetBookId]: { ...prev[targetBookId], current: totalPageNum }
                    }));
                    continue; // skip this page limit
                }

                setGeneratingBooks(prev => ({
                    ...prev, [targetBookId]: { ...prev[targetBookId], current: totalPageNum }
                }));
                console.log(`[FullGen] Writing Page ${totalPageNum}/${pagesGoal} (Arc ${tile.orderIndex + 1})`);

                const charactersToolbox = contacts.length > 0 ? "### CHARACTER TOOLBOX:\n" + contacts.map(c => `- ${c.name}: ${c.notes || c.jobTitle}`).join("\n") : "";
                const worldToolbox = notes.length > 0 ? "### WORLD TOOLBOX:\n" + notes.map(n => `- ${n.title}: ${n.content}`).join("\n") : "";
                const fullToolbox = `${charactersToolbox}\n\n${worldToolbox}`;

                const unifiedPrompt = `You are a Romance Novelist who writes simple and heartfelt love stories based on real couples.
### CRITICAL: THE ENTIRE OUTPUT MUST BE IN ${process.env.NEXT_PUBLIC_AI_RESPONSE_LANGUAGE || 'English'}.

Your role is to transform information, memories, and details into a narrative that reads like a short romance story. Stay faithful to real events.
${fullToolbox}

WRITING STYLE:
- Use simple, natural language. Prose should be warm, sincere, and easy to read.
- Describe moments with small, meaningful details.
- Let feelings appear naturally through actions/gestures.

GRAMMAR & FORMATTING RULES:
1. PARAGRAPHS: Use double newlines (\\n\\n) for a new paragraph or new speaker.
2. DIALOGUE (EM DASH STYLE):
   - START OF SPEECH: Always start dialogue with an em dash (—) and a capital letter. Example: — Where are you?
   - NEW SPEAKER: Always start a new paragraph (\\n\\n).
   - SPEECH VERBS: — Speech — said John. (No period before "said").
   - NO QUOTES: Never mix quotes and em dashes.
3. THOUGHTS: Treat as normal narration (no em-dash).
4. SPACING: No space before comma/period; always space after.

### CURRENT ARC OBJECTIVE:
[${tile.title}] - ${tile.content}

### FORMATTING:
1. NO HTML TAGS except for TITLES.
2. PARAGRAPHS: Double-newlines between paragraphs (\\n\\n).
3. TITLES: Start with a poetic title using markers like [TITLE] Threads of Fate [END_TITLE] ONLY IF IT IS THE FIRST PAGE OF AN ARC.

### INSTRUCTION:
Write EXACTLY ONE PAGE of the book (approx 300 words). This is page ${totalPageNum} of ${pagesGoal} total.`;

                // Run generation synchronously for this page
                let pageHTML = "";
                await new Promise<void>((resolve, reject) => {
                    let pageBuffer = "";
                    startStream({
                        prompt: unifiedPrompt,
                        previousContent: accumulatedHTML.slice(-2000), // feed last 2000 chars
                        bookContext: fullToolbox,
                        workspaceId,
                    }, (chunk) => {
                        if (stopRequested) return;
                        pageBuffer += chunk;
                        
                        if (pageBuffer.includes("[TITLE]")) {
                            if (pageBuffer.includes("[END_TITLE]")) {
                                const titleMatch = pageBuffer.match(/\[TITLE\](.*?)\[END_TITLE\]/);
                                if (titleMatch) {
                                    pageHTML += `<h2>${titleMatch[1].trim()}</h2><p></p>`;
                                    pageBuffer = pageBuffer.replace(/\[TITLE\][\s\S]*?\[END_TITLE\]/, "");
                                }
                            } else if (pageBuffer.length > 500) {
                                pageHTML += `<p>${pageBuffer.replace(/\n/g, "<br>")}</p>`;
                                pageBuffer = "";
                            }
                            return;
                        }
                        
                        // For non-title text, we simple accumulate it but format simple paragraphs
                        // We will just wait for entire page generation to finish then wrap with <p>
                    }).then(() => {
                        if (pageBuffer.trim()) {
                            // Simple text to HTML paragraph conversion if not already HTML
                            const formatted = pageBuffer.split('\n\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
                            pageHTML += formatted;
                        }
                        
                        // Append to the total book content
                        accumulatedHTML += pageHTML;
                        
                        // Incrementally save
                        updateBook({
                            bookId: targetBookId,
                            updates: { pages: [{ title: "Chapter", content: accumulatedHTML, orderIndex: 0 }] }
                        });
                        resolve();
                    }).catch(reject);
                });

                if (stopRequested) break;
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        if (!stopRequested) {
            setGeneratingBooks(prev => ({
                ...prev, [targetBookId]: { ...prev[targetBookId], current: pagesGoal, paused: true }
            }));
            toast.success("Book Creation Complete!");
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-pink-400" /></div>;
    }

    return (
        <div className="mb-10 mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                        <BookOpen className="w-5 h-5 text-pink-500" />
                        Workspace Library
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Manage your generated books and publish new ones.</p>
                </div>
            </div>

            <div className="p-6">
                <div className="flex flex-wrap gap-4 pb-4 pt-2">
                    {/* Start New Book Trigger */}
                    {isMember ? (
                        <div
                            onClick={() => setIsConfirmOpen(true)}
                            className="flex-none w-64 p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-pink-400 hover:bg-pink-50 cursor-pointer transition-all bg-transparent flex flex-col items-center justify-center text-center group min-h-[160px]"
                        >
                            {isCreating ? (
                                <Loader2 className="w-8 h-8 text-pink-400 animate-spin mb-3" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6" />
                                </div>
                            )}
                            <h3 className="font-semibold text-gray-700">Publish New Book</h3>
                            <p className="text-xs text-gray-400 mt-1 px-4">Create a blank canvas with AI Ghostwriter</p>
                        </div>
                    ) : (
                        <div
                            onClick={() => router.push("/sign-up")}
                            className="flex-none w-64 p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-all bg-gray-50/50 flex flex-col items-center justify-center text-center group min-h-[160px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Lock className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-gray-700">Members Only</h3>
                            <p className="text-xs text-gray-500 mt-1 px-4">Create an account to publish AI Books safely.</p>
                        </div>
                    )}

                    {/* Existing Books */}
                    {books?.slice().reverse().map((book) => {
                        const generatingState = generatingBooks[book._id];
                        const isCurrentlyGenerating = generatingState && !generatingState.paused && generatingState.current < generatingState.total;
                        const isPaused = generatingState && generatingState.paused && generatingState.current < generatingState.total;
                        
                        return (
                        <div
                            key={book._id}
                            className={`flex-none w-64 p-5 border rounded-xl transition-all relative group flex flex-col min-h-[160px] 
                            ${isCurrentlyGenerating ? "border-pink-400 bg-pink-50 shadow-md shadow-pink-100" : "border-gray-200 hover:border-pink-300 hover:shadow-md bg-white"}`}
                        >
                            {/* Deletion Overlay - Disabled if generating */}
                            {!isCurrentlyGenerating && (
                            <div
                                className={`absolute right-2 top-2 flex items-center space-x-1 rounded-md border bg-white p-1 shadow-sm transition-all z-20 ${isDeletingId === book._id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                            >
                                {isDeletingId !== book._id ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDeletingId(book._id);
                                        }}
                                        className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-red-50 text-gray-400 hover:text-red-500"
                                        title="Delete Book"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                                        <span className="text-[10px] font-bold text-red-500 px-1">Delete?</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteBook(book._id);
                                                setIsDeletingId(null);
                                                // stop generation if deleting
                                                if (generatingBooks[book._id]?.stopFn) {
                                                    generatingBooks[book._id].stopFn!();
                                                }
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

                            {isCurrentlyGenerating ? (
                                <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-500 flex items-center justify-center mb-3 shadow-inner">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-3 group-hover:bg-pink-50 group-hover:text-pink-500 group-hover:border-pink-100 transition-colors">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                            )}

                            <h3 className="font-semibold text-gray-800 truncate mb-1" title={book.title}>
                                {book.title}
                            </h3>

                            {generatingState ? (
                                <div className="w-full mt-2 space-y-1 mb-4">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-pink-600">
                                        <span>{isPaused ? "Paused" : "Writing..."}</span>
                                        <span>{generatingState.current} / {generatingState.total}</span>
                                    </div>
                                    <div className="h-2 w-full bg-pink-100 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full bg-pink-500 transition-all duration-1000 ease-out ${!isPaused && "animate-pulse"}`}
                                            style={{ width: `${(generatingState.current / generatingState.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4" />
                            )}

                            <div className="mt-auto flex gap-2 w-full pt-3 border-t border-gray-100/50">
                                {isCurrentlyGenerating ? (
                                    <button
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (generatingState.stopFn) generatingState.stopFn();
                                        }}
                                        className="flex-1 py-1.5 px-3 bg-white text-gray-700 hover:bg-gray-50 rounded-md text-xs font-bold transition-all border border-gray-200 shadow-sm flex items-center justify-center gap-1"
                                    >
                                        <PauseCircle className="w-3.5 h-3.5" /> Pause
                                    </button>
                                ) : isPaused ? (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenBook(book._id, "library"); }}
                                            className="flex-1 py-1.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-md text-xs font-medium transition-colors border border-gray-200"
                                        >
                                            Read
                                        </button>
                                        <button
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                startBookGeneration(book._id, generatingState.total, true); 
                                            }}
                                            className="flex-1 py-1.5 px-3 bg-pink-600 text-white hover:bg-pink-700 rounded-md text-xs font-bold transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-1"
                                        >
                                            <PlayCircle className="w-3.5 h-3.5" /> Resume
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onOpenBook(book._id, "library"); }}
                                        className="w-full py-1.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-md text-xs font-medium transition-colors border border-gray-200"
                                    >
                                        Read
                                    </button>
                                )}
                            </div>
                        </div>
                    )})}

                    {books?.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 md:px-0 opacity-60 pointer-events-none">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 mb-3">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">No books generated yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom React Modal for Credit Warning */}
            {isConfirmOpen && mounted && typeof document !== "undefined" && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-white/20">
                        <div className="px-8 py-6 border-b bg-gradient-to-r from-pink-50 to-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Publish New Book</h3>
                                <p className="text-xs text-pink-500 font-bold uppercase tracking-wider mt-1">Ghostwriter Settings</p>
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
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Book Title</label>
                                    <input 
                                        type="text"
                                        className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-pink-500 focus:ring-0 outline-none transition-all bg-gray-50/50 hover:bg-white focus:bg-white text-lg font-medium"
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        placeholder="Ex: The Story of Jessica & Lillian"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Inspiration */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Inspiration / Style</label>
                                        <select 
                                            className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-pink-500 focus:ring-0 outline-none bg-gray-50/50 hover:bg-white focus:bg-white transition-all appearance-none cursor-pointer"
                                            value={formData.inspiration}
                                            onChange={(e) => setFormData({...formData, inspiration: e.target.value})}
                                        >
                                            <option value="Original">✨ Original (Default)</option>
                                            <option value="Notebook">📓 The Notebook</option>
                                            <option value="Titanic">⛴️ Titanic</option>
                                            <option value="Pride and Prejudice">👑 Pride and Prejudice</option>
                                            <option value="La La Land">💃 La La Land</option>
                                        </select>
                                    </div>

                                    {/* ISBN */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2 px-1">
                                            ISBN <span className="text-[10px] font-normal text-gray-400 font-mono">(OPTIONAL)</span>
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-pink-500 focus:ring-0 outline-none transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                                            value={formData.isbn}
                                            onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                                            placeholder="Ex: 978-3-16-148410-0"
                                        />
                                    </div>
                                </div>

                                {/* Page Count Presets */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3 px-1">Target Pages</label>
                                    <div className="flex gap-3">
                                        {[25, 75, 120].map((pages) => (
                                            <button
                                                key={pages}
                                                type="button"
                                                onClick={() => setFormData({...formData, pagesCountGoal: pages})}
                                                className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold text-lg cursor-pointer ${
                                                    formData.pagesCountGoal === pages 
                                                    ? "border-pink-500 bg-pink-500 text-white shadow-lg shadow-pink-200" 
                                                    : "border-gray-100 bg-gray-50/50 text-gray-400 hover:border-pink-200 hover:bg-white"
                                                }`}
                                            >
                                                {pages} <span className="text-xs font-normal opacity-80 ml-1">Pgs</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Premium Toggles & Addons */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700 px-1 mb-4 italic text-pink-600/60">Writer's Toolbox & Addons</label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.removeCoAuthorship ? 'border-pink-200 bg-pink-50/30' : 'border-gray-100 bg-white hover:border-pink-100'}`}>
                                        <div className={`p-3 rounded-xl transition-colors ${formData.removeCoAuthorship ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="block text-sm font-bold text-gray-800">Independent Authorship</span>
                                            <span className="text-[10px] text-gray-500 leading-tight">Remove "Autores Apaixonados" co-authorship</span>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={formData.removeCoAuthorship} onChange={(e) => setFormData({...formData, removeCoAuthorship: e.target.checked})} />
                                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${formData.removeCoAuthorship ? 'border-pink-500 bg-pink-500' : 'border-gray-200'}`}>
                                            {formData.removeCoAuthorship && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.isPublic ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-white hover:border-blue-100'}`}>
                                        <div className={`p-3 rounded-xl transition-colors ${formData.isPublic ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <Play className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="block text-sm font-bold text-gray-800">Publish to Store</span>
                                            <span className="text-[10px] text-gray-500 leading-tight">Book visible to the public</span>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={formData.isPublic} onChange={(e) => setFormData({...formData, isPublic: e.target.checked})} />
                                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${formData.isPublic ? 'border-blue-500 bg-blue-500' : 'border-gray-200'}`}>
                                            {formData.isPublic && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.adultContent ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-white hover:border-red-100'}`}>
                                        <div className={`p-3 rounded-xl transition-colors ${formData.adultContent ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <div className="relative">
                                                <Ban className="w-5 h-5" />
                                                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">18</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <span className="block text-sm font-bold text-gray-800">Adult Content</span>
                                            <span className="text-[10px] text-gray-500 leading-tight">18+ Rating</span>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={formData.adultContent} onChange={(e) => setFormData({...formData, adultContent: e.target.checked})} />
                                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${formData.adultContent ? 'border-red-500 bg-red-500' : 'border-gray-200'}`}>
                                            {formData.adultContent && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.restrictPublicity ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100 bg-white hover:border-orange-100'}`}>
                                        <div className={`p-3 rounded-xl transition-colors ${formData.restrictPublicity ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="block text-sm font-bold text-gray-800">Restrict Publicity</span>
                                            <span className="text-[10px] text-gray-500 leading-tight">Private use / No marketing</span>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={formData.restrictPublicity} onChange={(e) => setFormData({...formData, restrictPublicity: e.target.checked})} />
                                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${formData.restrictPublicity ? 'border-orange-500 bg-orange-500' : 'border-gray-200'}`}>
                                            {formData.restrictPublicity && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <p className="text-sm font-medium text-pink-600 bg-pink-50 p-6 rounded-3xl border-2 border-pink-100/50 flex items-start gap-4 shadow-inner">
                                <span className="text-2xl">✍️</span>
                                <span>Publishing will start automatic arc-by-arc writing. Consumption is <strong>20 Credits</strong> per generation.</span>
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
                                    <>
                                        Publish & Start Writing
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
