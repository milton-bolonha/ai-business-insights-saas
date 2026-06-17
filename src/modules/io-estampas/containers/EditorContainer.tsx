import React, { useState, useEffect, useCallback } from 'react';
import { SidebarLeft } from '../components/SidebarLeft';
import { SidebarRight } from '../components/SidebarRight';
import { GabaritoOverlay, CanvasEl } from '../components/CanvasBoard';
import { BottomFloatingMenu } from '../components/BottomFloatingMenu';
import { AiMockupGenerator } from '../components/AiMockupGenerator';
import { FileManagerModal } from '../components/FileManagerModal';
import { generateId, ALL_FONTS, openPrintWindow, renderHtmlElement, PRINT_TYPES } from '../libs/editor-utils';
import { useWorkspaceStore } from '@/lib/stores/workspaceStore';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface Props {
  storeName: string;
  onExit: () => void;
  isInsideAdmin?: boolean;
}

export function EditorContainer({ storeName, onExit, isInsideAdmin = false }: Props) {
  const [printType, setPrintType] = useState("silk");
  const [showPrintMenu, setShowPrintMenu] = useState(false);

  const [title, setTitle] = useState("Sem título");
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [activeEstampaId, setActiveEstampaId] = useState<string | null>(null);

  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
  const currentDashboard = useWorkspaceStore(state => state.currentDashboard);
  const updateTileInDashboard = useWorkspaceStore(state => state.updateTileInDashboard);
  
  const [elements, setElements] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [dropSide, setDropSide] = useState<'top' | 'bottom' | null>(null);
  
  const [history, setHistory] = useState<any[][]>([[]]);
  const [histIdx, setHistIdx] = useState(0);

  const [canvasW, setCanvasW] = useState(420);
  const [canvasH, setCanvasH] = useState(594);
  const [canvasFormat, setCanvasFormat] = useState("A3");
  const [pageBgColor, setPageBgColor] = useState('#ffffff');
  const [exportPageBg, setExportPageBg] = useState(true);

  const [showGabarito, setShowGabarito] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  const [activeRightPanel, setActiveRightPanel] = useState('properties');

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMockupResult, setAiMockupResult] = useState<string | null>(null);

  useEffect(() => {
    const fontsUrl = `https://fonts.googleapis.com/css2?${ALL_FONTS.map(f => `family=${f.replace(/ /g, '+')}`).join('&')}&display=swap`;
    const link = document.createElement('link'); link.href = fontsUrl; link.id = "google-fonts"; link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { if (document.head.contains(link)) document.head.removeChild(link); };
  }, []);

  const fitZoom = useCallback(() => {
    const area = document.getElementById("canvas-area");
    if (!area) return;
    const zw = (area.clientWidth - 100) / canvasW;
    const zh = (area.clientHeight - 100) / canvasH;
    setZoom(Math.min(zw, zh, 2));
    setPan({ x: 0, y: 0 }); // reset pan on fit
  }, [canvasW, canvasH]);
  
  useEffect(() => { setTimeout(fitZoom, 100); }, [fitZoom]);

  const pushHistory = useCallback((els?: any[]) => {
    setHistory(h => { const newH = [...h.slice(0, histIdx+1), els ?? elements]; setHistIdx(newH.length-1); return newH; });
  }, [elements, histIdx]);

  const undo = () => { if (histIdx > 0) { setElements(history[histIdx-1]); setHistIdx(h => h-1); setSelectedId(null); setEditingId(null); } };
  const redo = () => { if (histIdx < history.length-1) { setElements(history[histIdx+1]); setHistIdx(h => h+1); setSelectedId(null); setEditingId(null); } };

  // --- Auto-Save Effect ---
  useEffect(() => {
    if (!currentWorkspace || !currentDashboard || !activeEstampaId) return;
    
    const saveTimeout = setTimeout(() => {
      console.log("[Auto-Save] Gravando estampa:", title, elements.length, "elementos.", "printType:", printType);
      updateTileInDashboard(currentWorkspace.id, currentDashboard.id, activeEstampaId, { 
        title, 
        metadata: { elements, canvasW, canvasH, pageBgColor, printType } 
      });
    }, 1000);
    return () => clearTimeout(saveTimeout);
  }, [elements, title, canvasW, canvasH, pageBgColor, printType, currentDashboard, currentWorkspace, updateTileInDashboard, activeEstampaId]);

  // If no active estampa, open file manager instead of auto-creating
  useEffect(() => {
     if (currentWorkspace && currentDashboard && !activeEstampaId) {
        // Open file manager automatically only if we haven't forced closed it and no estampa is active
        // To prevent infinite loop of opening, we could track if it was manually closed, but for now we just open it once
        // Actually, just relying on the user clicking "Files" is better, but since they want a modal on start:
        if (!isFileManagerOpen && elements.length === 0 && title === "Sem título") {
           setIsFileManagerOpen(true);
        }
     }
  }, [currentDashboard, activeEstampaId, elements.length, title]);

  const handleCreateNew = () => {
    if (!currentWorkspace || !currentDashboard) return;
    const id = `io_estampas_${generateId()}`;
    setActiveEstampaId(id);
    setTitle("Nova Estampa");
    setElements([]);
    setHistory([[]]);
    setHistIdx(0);
    useWorkspaceStore.getState().addTileToDashboard(currentWorkspace.id, currentDashboard.id, {
        id,
        title: "Nova Estampa",
        content: "",
        prompt: "",
        model: "io_estampas",
        orderIndex: currentDashboard.tiles?.length || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attempts: 0,
        history: [],
        metadata: { elements: [], canvasW, canvasH, pageBgColor, printType }
    });
    setIsFileManagerOpen(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingId) return;
      if ((e.ctrlKey||e.metaKey) && e.key==="z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey||e.metaKey) && (e.key==="y"||(e.key==="z"&&e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.key==="Delete"||e.key==="Backspace") && selectedId && document.activeElement===document.body) removeEl(selectedId);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const addEl = (el: any) => { const newEls = [...elements, el]; setElements(newEls); setSelectedId(el.id); setActiveRightPanel('properties'); pushHistory(newEls); };
  const updateEl = (id: string, changes: any, saveHist=true) => {
    setElements(prev => {
      const next = prev.map(e => e.id===id ? {...e,...changes} : e);
      if (saveHist) { setHistory(h => { const nh = [...h.slice(0, histIdx+1), next]; setHistIdx(nh.length-1); return nh; }); }
      return next;
    });
  };
  const removeEl = (id: string) => { const next = elements.filter(e=>e.id!==id); setElements(next); if (selectedId===id) setSelectedId(null); setEditingId(null); pushHistory(next); };

  const handleDropLayer = () => {
    if (!draggedLayerId || !dragOverLayerId || draggedLayerId === dragOverLayerId) {
      setDraggedLayerId(null); setDragOverLayerId(null); return;
    }
    const arr = [...elements];
    const fromIndex = arr.findIndex(e => e.id === draggedLayerId);
    const toIndex = arr.findIndex(e => e.id === dragOverLayerId);
    if (fromIndex < 0 || toIndex < 0) return;
    
    const [movedEl] = arr.splice(fromIndex, 1);
    let finalIndex = toIndex;
    if (dropSide === 'top') finalIndex = fromIndex < toIndex ? toIndex : toIndex + 1;
    else finalIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;

    arr.splice(finalIndex, 0, movedEl);
    setElements(arr);
    pushHistory(arr);
    setDraggedLayerId(null); setDragOverLayerId(null);
  };

  const addText = () => addEl({ id:generateId(), type:"text", content:"NOVO TEXTO", x:canvasW/2-100, y:canvasH/2-25, w:200, h:50, color:"#1e293b", fontSize:40, fontFamily:"Inter", fontWeight:"800", fontStyle:"normal", textDecoration:"none", letterSpacing:0, lineHeight:1.2, underlineOffset:0, textTransform:"none", textAlign:"center", curve: 0, strokeColor:"transparent", strokeWidth:0, strokeDasharray:"none", layerName: "Texto" });
  const addShape = (shape: string) => addEl({ id:generateId(), type:"shape", content:shape, x:canvasW/2-50, y:canvasH/2-50, w:100, h:100, color:"#1e293b", strokeColor:"transparent", strokeWidth:0, strokeDasharray:"none", layerName: "Forma" });
  
  const handleImage = (e: any) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width/img.height; const mw = Math.min(200, canvasW*0.4);
        addEl({ id:generateId(), type:"image", content:ev.target?.result, x:canvasW/2-mw/2, y:canvasH/2-(mw/ratio)/2, w:mw, h:mw/ratio, layerName: "Imagem" });
      };
      if (ev.target?.result) img.src = ev.target.result as string;
    };
    reader.readAsDataURL(file); e.target.value="";
  };

  const changeFormat = (f: string) => {
    setCanvasFormat(f);
    if (f === 'A4') { setCanvasW(297); setCanvasH(420); }
    else if (f === 'A3') { setCanvasW(420); setCanvasH(594); }
  };

  const alignGrid = (col: number, row: number) => {
    const el = elements.find(e=>e.id===selectedId);
    if (!el) return;
    const posXs = [canvasW * 0.25, canvasW * 0.5, canvasW * 0.75];
    const nx = posXs[col] - el.w/2;
    const rowH = canvasH / 4;
    const ny = (row * rowH) + (rowH - el.h) / 2;
    updateEl(selectedId as string, { x: nx, y: ny });
  };
  
  const alignCenterAbs = () => {
    const el = elements.find(e=>e.id===selectedId);
    if (!el) return;
    updateEl(selectedId as string, { x: (canvasW - el.w)/2, y: (canvasH - el.h)/2 });
  }

  const handleExportPDF = (mode: string) => {
    setIsExportMenuOpen(false);
    let finalCanvasBgColor = 'transparent';
    if (mode === 'fotolito' || mode === 'silk-colors') {
       finalCanvasBgColor = '#ffffff';
    } else if (exportPageBg) {
       finalCanvasBgColor = pageBgColor;
    }

    if (mode === 'silk-colors') {
      const colors = [...new Set(elements.map(e => e.color).filter(c => c))];
      if (colors.length === 0) return alert("Nenhuma cor para separar.");
      let htmlPages = colors.map(color => {
        const filteredHtml = elements.map(el => {
          if (el.color !== color && el.type !== 'image') return '';
          return renderHtmlElement(el, '#000000');
        }).join('');
        return `<div class="page-container">${filteredHtml}<div class="color-label">SEPARAÇÃO: ${color}</div></div>`;
      }).join('<div style="page-break-after: always;"></div>');
      openPrintWindow(htmlPages, 'Separação Silk', finalCanvasBgColor, canvasW, canvasH);
    } else {
      const isFotolito = mode === 'fotolito';
      const elementsHtml = elements.map(el => renderHtmlElement(el, isFotolito ? '#000000' : el.color)).join('');
      openPrintWindow(`<div class="page-container">${elementsHtml}</div>`, isFotolito ? 'Fotolito' : 'Arte PDF', finalCanvasBgColor, canvasW, canvasH);
    }
  };

  const runAiMockupFn = async () => {
    setIsExportMenuOpen(false);
    setAiLoading(true);
    try {
      const promptToUse = title !== "Sem título" ? title : (elements.find(e => e.type === 'text')?.content || "uma estampa criativa");
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Photorealistic mockup of a blank white t-shirt featuring a design related to: ${promptToUse}. High quality, studio lighting, professional product photography.` })
      });
      const data = await res.json();
      if (data.url) {
        setAiMockupResult(data.url);
      } else {
        alert("Erro ao gerar mockup: " + JSON.stringify(data));
      }
    } catch (e) {
      console.error(e);
      alert("Falha na rede ao tentar gerar o mockup.");
    } finally {
      setAiLoading(false);
    }
  }

  const runAiImageFn = async () => {
    if(!aiImagePrompt) return; 
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiImagePrompt })
      });
      const data = await res.json();
      if (data.url) {
        const mw = Math.min(200, canvasW * 0.4);
        addEl({ id:generateId(), type:"image", content:data.url, x:canvasW/2-mw/2, y:canvasH/2-mw/2, w:mw, h:mw, layerName: "Ilustração IA" });
        setAiImagePrompt("");
      } else {
        alert("Erro ao gerar imagem: " + (data.error || "Desconhecido"));
      }
    } catch (e) {
      alert("Erro na comunicação com a API de IA.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="flex flex-1 w-full h-full min-h-0 bg-transparent text-slate-800 font-sans overflow-hidden relative">
      
      {/* Absolute top bar inside the editor just for navigation (hidden if inside admin) */}
      {!isInsideAdmin && (
        <div className="absolute top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur border-b border-slate-200 z-30 flex items-center px-4 justify-between">
           <div className="flex items-center gap-4">
             <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><ArrowLeft size={18}/></button>
             <h1 className="font-bold text-slate-800 text-sm tracking-tight">{storeName} <span className="font-normal text-slate-400">— Editor de Estampas</span></h1>
           </div>
        </div>
      )}

      <div className={`flex flex-1 overflow-hidden w-full h-full ${!isInsideAdmin ? 'pt-14' : ''}`}>
        <SidebarLeft 
          elements={elements}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          setEditingId={setEditingId}
          removeEl={removeEl}
          updateEl={updateEl}
          setActiveEstampaId={setActiveEstampaId}
          handleDropLayer={handleDropLayer}
          draggedLayerId={draggedLayerId}
          setDraggedLayerId={setDraggedLayerId}
          dragOverLayerId={dragOverLayerId}
          setDragOverLayerId={setDragOverLayerId}
          dropSide={dropSide}
          setDropSide={setDropSide}
          title={title}
          setTitle={setTitle}
          openFileManager={() => setIsFileManagerOpen(true)}
        />

        <main className="flex-1 flex flex-col relative overflow-hidden bg-transparent"
          onPointerDown={(e) => {
            if (e.button === 1) {
              setIsPanning(true);
              e.preventDefault();
            }
          }}
          onPointerMove={(e) => {
            if (isPanning) {
              setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
            }
          }}
          onPointerUp={(e) => {
            if (e.button === 1) setIsPanning(false);
          }}
          onPointerLeave={() => setIsPanning(false)}
          onWheel={(e) => {
            if (e.altKey) {
              e.preventDefault();
              if (e.deltaY > 0) setZoom(z => Math.max(0.2, z - 0.1));
              else setZoom(z => Math.min(3, z + 0.1));
            } else {
              setPan(p => ({ x: p.x, y: p.y - e.deltaY }));
            }
          }}
        >
          <div id="canvas-area" className="flex-1 overflow-hidden relative flex items-center justify-center p-8" 
               onPointerDown={(e) => { if(e.target === e.currentTarget) { setSelectedId(null); setEditingId(null); } }}
               style={{ cursor: isPanning ? 'grabbing' : (zoom > 1 ? 'grab' : 'default') }}>
            <div style={{ transform:`translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin:"center center", flexShrink:0, position:"relative", transition: isPanning ? 'none' : 'transform 0.1s ease-out' }}>
              <div 
                style={{ width:canvasW, height:canvasH, background: pageBgColor, boxShadow:"0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)", position:"relative", overflow:"hidden", borderRadius: '4px' }}
                onPointerDown={(e) => { if(e.target === e.currentTarget) { setSelectedId(null); setEditingId(null); } }}
              >
                <GabaritoOverlay w={canvasW} h={canvasH} visible={showGabarito} />
                
                <div className="absolute top-4 left-4 z-0 pointer-events-none flex flex-col items-start gap-1">
                   <span className={`px-2 py-1 text-[10px] uppercase font-black text-white rounded shadow-sm ${PRINT_TYPES.find(t=>t.id===printType)?.bg}`}>{PRINT_TYPES.find(t=>t.id===printType)?.name}</span>
                </div>

                <div 
                  style={{position:"absolute",inset:0,zIndex:5}}
                  onPointerDown={(e) => { if(e.target === e.currentTarget) { setSelectedId(null); setEditingId(null); } }}
                >
                  {elements.map(el => <CanvasEl key={el.id} el={el} selected={el.id===selectedId} zoom={zoom} onSelect={setSelectedId} onUpdate={updateEl} onPushHistory={()=>pushHistory()} isFotolito={false} editingId={editingId} setEditingId={setEditingId} />)}
                </div>
              </div>
            </div>
          </div>

          <BottomFloatingMenu 
            undo={undo} redo={redo} showGabarito={showGabarito} setShowGabarito={setShowGabarito}
            zoom={zoom} setZoom={setZoom} fitZoom={fitZoom}
            printType={printType} setPrintType={setPrintType}
            showPrintMenu={showPrintMenu} setShowPrintMenu={setShowPrintMenu}
            isExportMenuOpen={isExportMenuOpen} setIsExportMenuOpen={setIsExportMenuOpen}
            handleExportPDF={handleExportPDF} openAiMockup={runAiMockupFn}
          />

          <AiMockupGenerator aiMockupResult={aiMockupResult} setAiMockupResult={setAiMockupResult} />
        </main>

        <SidebarRight 
          elements={elements} selectedId={selectedId} setSelectedId={setSelectedId} setEditingId={setEditingId}
          activeRightPanel={activeRightPanel} setActiveRightPanel={setActiveRightPanel}
          addText={addText} addShape={addShape} handleImage={handleImage} removeEl={removeEl} updateEl={updateEl} pushHistory={()=>pushHistory()}
          canvasFormat={canvasFormat} changeFormat={changeFormat} canvasW={canvasW} setCanvasW={setCanvasW} canvasH={canvasH} setCanvasH={setCanvasH}
          pageBgColor={pageBgColor} setPageBgColor={setPageBgColor} exportPageBg={exportPageBg} setExportPageBg={setExportPageBg}
          alignGrid={alignGrid} alignCenterAbs={alignCenterAbs}
          aiImagePrompt={aiImagePrompt} setAiImagePrompt={setAiImagePrompt} aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
          runAiImage={runAiImageFn} runAiMockup={runAiMockupFn} aiLoading={aiLoading}
        />
      </div>

      <FileManagerModal 
        isOpen={isFileManagerOpen} 
        onClose={() => setIsFileManagerOpen(false)}
        title={title}
        setTitle={setTitle}
        onLoadArtwork={(file) => {
           setIsFileManagerOpen(false);
           if (file && file.data) {
             setActiveEstampaId(file.id);
             setTitle(file.name || "Sem título");
             setElements(file.data.elements || []);
             if (file.data.canvasW) setCanvasW(file.data.canvasW);
             if (file.data.canvasH) setCanvasH(file.data.canvasH);
             if (file.data.pageBgColor) setPageBgColor(file.data.pageBgColor);
             if (file.data.printType) setPrintType(file.data.printType);
             setHistory([file.data.elements || []]);
             setHistIdx(0);
           }
        }}
        onCreateNew={handleCreateNew}
      />
    </div>
  );
}
