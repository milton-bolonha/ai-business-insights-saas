import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Upload, Download, Image as ImageIcon, Sparkles, 
  Settings2, Layers, MousePointer2, SquareDashed, CircleDashed,
  Eye, EyeOff, Trash2, Plus, Play, ZoomIn, ZoomOut, Maximize,
  ChevronDown, ChevronRight, Pipette, Merge, Trash, 
  SplitSquareHorizontal, Focus, Loader2, Hand, FileCode2, ArrowLeftRight,
  AlertTriangle, Check, Wand2, Cloud
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/services/cloudinary';

// --- CIELab COLOR MATH (Precisão humana de cores) ---
const rgbToLab = (r, g, b) => {
  let r_ = r / 255, g_ = g / 255, b_ = b / 255;
  r_ = r_ > 0.04045 ? Math.pow((r_ + 0.055) / 1.055, 2.4) : r_ / 12.92;
  g_ = g_ > 0.04045 ? Math.pow((g_ + 0.055) / 1.055, 2.4) : g_ / 12.92;
  b_ = b_ > 0.04045 ? Math.pow((b_ + 0.055) / 1.055, 2.4) : b_ / 12.92;
  let x = (r_ * 0.4124 + g_ * 0.3576 + b_ * 0.1805) * 100;
  let y = (r_ * 0.2126 + g_ * 0.7152 + b_ * 0.0722) * 100;
  let z = (r_ * 0.0193 + g_ * 0.1192 + b_ * 0.9505) * 100;
  x /= 95.047; y /= 100.000; z /= 108.883;
  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);
  return { l: (116 * y) - 16, a: 500 * (x - y), b: 200 * (y - z) };
};

const deltaE = (labA, labB) => Math.sqrt(Math.pow(labA.l - labB.l, 2) + Math.pow(labA.a - labB.a, 2) + Math.pow(labA.b - labB.b, 2));
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : {r:0, g:0, b:0};
};
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- PRESETS E CONFIGS ---
const PRESETS = {
  custom: { name: 'Customizado', desc: 'Ajuste livre', settings: null },
  fotolito: { name: 'Fotolito (P&B)', desc: 'Preto absoluto', settings: { blur: 1.5, contrast: 2.5, threshold: 128, ignoreWhite: true, colors: 2, detail: 80, smoothness: 0, despeckle: 5, optimize: 10 } },
  logo: { name: 'Logo Vetorial', desc: 'Cores puras, sem ruído', settings: { blur: 0, contrast: 1.0, threshold: 0, ignoreWhite: true, colors: 4, detail: 80, smoothness: 70, despeckle: 5, optimize: 80 } },
  icon: { name: 'Ícone Flat', desc: 'Traços limpos', settings: { blur: 1, contrast: 1.2, threshold: 0, ignoreWhite: true, colors: 8, detail: 50, smoothness: 30, despeckle: 4, optimize: 60 } },
  illustration: { name: 'Ilustração (Massas)', desc: 'Posterização de cores', settings: { blur: 2.5, contrast: 1.5, threshold: 0, ignoreWhite: false, colors: 24, detail: 90, smoothness: 20, despeckle: 2, optimize: 30 } }
};

const DEFAULT_SETTINGS = { blur: 0, contrast: 1.0, threshold: 0, ignoreWhite: false, colors: 16, detail: 50, smoothness: 25, despeckle: 2, optimize: 50 };

const mapSettingsToTracer = (s) => ({
    corsoptions: true, numberofcolors: s.colors,
    ltres: Math.max(0.1, 10 - (s.detail / 100) * 9.9), qtres: Math.max(0.1, 10 - (s.detail / 100) * 9.9),
    roundcoords: Math.floor(1 + (s.smoothness / 100) * 7), pathomit: Math.floor((s.despeckle / 10) * 32),
    blurradius: s.optimize > 80 ? 1 : 0, simplify: (s.optimize / 100) * 2, scale: 1
});

export function VetorizeStudioPro() {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ w: 0, h: 0 });
  const [globalError, setGlobalError] = useState(null);
  
  const [activeTool, setActiveTool] = useState('select'); 
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [splitPos, setSplitPos] = useState(50);
  
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({x:0, y:0});

  const [propsOpen, setPropsOpen] = useState(true);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [highlightGenerate, setHighlightGenerate] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [currentDraw, setCurrentDraw] = useState(null);

  const [useCustomPalette, setUseCustomPalette] = useState(false);
  const [palette, setPalette] = useState([]);
  const [selectedPaletteIds, setSelectedPaletteIds] = useState([]);

  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);

  const containerRef = useRef(null);
  const innerCanvasRef = useRef(null);

  useEffect(() => {
    if (!window.ImageTracer) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.js';
      script.async = true;
      script.onerror = () => setGlobalError('Falha ao carregar a biblioteca de vetorização. Verifique a internet.');
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const down = (e) => { if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT') { e.preventDefault(); setIsSpaceDown(true); } };
    const up = (e) => { if (e.code === 'Space') { e.preventDefault(); setIsSpaceDown(false); setIsPanning(false); } };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const centerCanvas = useCallback((w, h) => {
      if (!containerRef.current || !w) return;
      const rect = containerRef.current.getBoundingClientRect();
      const z = Math.min(1, (rect.width - 100) / w, (rect.height - 100) / h) * 0.9;
      setZoom(z); setPan({ x: 0, y: 0 }); 
  }, []);

  const revokeLayerUrls = useCallback((layer) => {
     if (layer.svgUrl) URL.revokeObjectURL(layer.svgUrl);
     if (layer.rasterUrl) URL.revokeObjectURL(layer.rasterUrl);
  }, []);

  const toggleLayerVisibility = useCallback((id) => setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l)), []);

  const deleteLayer = useCallback((id) => {
    setLayers(prev => {
       const layerToDelete = prev.find(l => l.id === id);
       if (layerToDelete) revokeLayerUrls(layerToDelete);
       const newLayers = prev.filter(l => l.id !== id);
       if (selectedLayerId === id) setSelectedLayerId(newLayers[0]?.id || null);
       return newLayers;
    });
  }, [selectedLayerId, revokeLayerUrls]);

  const loadFile = (file) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
        img.crossOrigin = 'anonymous';
    img.onload = () => {
      let w = img.width; let h = img.height;
      const MAX_DIM = 2500;
      if (w > MAX_DIM || h > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
        w *= ratio; h *= ratio;
      }
      setImageSrc(url); setImageDimensions({ w, h });
      centerCanvas(w, h);
      
      layers.forEach(revokeLayerUrls);
      setLayers([{ id: 'base', type: 'base', name: 'Imagem Original', visible: true, mask: null, svgUrl: null, rasterUrl: null, settings: { ...DEFAULT_SETTINGS }, isProcessing: false }]);
      setSelectedLayerId('base');
      setPalette([]); setUseCustomPalette(false); setActiveTool('select'); setSplitPos(50);
    };
    img.src = url;
  };

  const activeLayer = useMemo(() => layers.find(l => l.id === selectedLayerId), [layers, selectedLayerId]);

  // Função utilitária para "desconfirmar" o vetor atual sempre que o usuário mover um slider
  const invalidateActiveVector = () => {
      if (activeLayer && activeLayer.svgUrl) {
          setLayers(prev => prev.map(l => l.id === activeLayer.id ? { ...l, svgUrl: null } : l));
      }
  };

  // --- EXPORTAÇÃO INTELIGENTE MULTIFORMATO ---
  const handleExport = (format) => {
      if (!activeLayer || activeLayer.type === 'base') {
          setGlobalError("Selecione um Recorte ou Camada de Ajuste para exportar.");
          return;
      }
      
      const sourceUrl = activeLayer.svgUrl || activeLayer.rasterUrl;
      if (!sourceUrl) return;

      const filename = activeLayer.name.replace(/\s+/g, '-').toLowerCase();
      
      if (format === 'svg') {
          if (!activeLayer.svgUrl) {
              setHighlightGenerate(true); setTimeout(() => setHighlightGenerate(false), 1500);
              return;
          }
          const link = document.createElement('a'); link.href = activeLayer.svgUrl; link.download = `${filename}.svg`; link.click();
      } else {
          // PNG, JPG, WEBP
          const img = new Image();
        img.crossOrigin = 'anonymous';
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = activeLayer.mask ? activeLayer.mask.w : imageDimensions.w;
              canvas.height = activeLayer.mask ? activeLayer.mask.h : imageDimensions.h;
              const ctx = canvas.getContext('2d');
              
              if (format === 'jpg') {
                  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              const link = document.createElement('a');
              link.download = `${filename}.${format}`;
              link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : format}`);
              link.click();
          };
          img.src = sourceUrl;
      }
      setExportMenuOpen(false);
  };

  // --- PALETTE ENGINE ---
  const extractPalette = () => {
    if (!imageSrc || !activeLayer) return;
    invalidateActiveVector();
    const img = new Image();
        img.crossOrigin = 'anonymous';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let dX = 0, dY = 0, dW = img.width, dH = img.height;
        if (activeLayer.mask) { dX = activeLayer.mask.x; dY = activeLayer.mask.y; dW = activeLayer.mask.w; dH = activeLayer.mask.h; }

        canvas.width = dW; canvas.height = dH;
        ctx.drawImage(img, dX, dY, dW, dH, 0, 0, dW, dH);
        const data = ctx.getImageData(0,0,dW,dH).data;

        const colorMap = {};
        const step = 4 * 4; 
        for(let i = 0; i < data.length; i += step) {
            if(data[i+3] < 128) continue; 
            const r = data[i], g = data[i+1], b = data[i+2];
            if (activeLayer.settings.ignoreWhite && r > 240 && g > 240 && b > 240) continue;

            const qR = Math.round(r/15)*15, qG = Math.round(g/15)*15, qB = Math.round(b/15)*15;
            const key = `${qR},${qG},${qB}`;
            if (!colorMap[key]) colorMap[key] = { count: 0, r: qR, g: qG, b: qB, lab: rgbToLab(qR, qG, qB) };
            colorMap[key].count++;
        }

        const sorted = Object.values(colorMap).sort((a,b) => b.count - a.count);
        const finalColors = [];
        for (const c of sorted) {
            if (finalColors.length >= 32) break; 
            let tooClose = false;
            for (const fc of finalColors) { if (deltaE(c.lab, fc.lab) < 15) { tooClose = true; break; } }
            if (!tooClose) finalColors.push({ r: c.r, g: c.g, b: c.b, hex: rgbToHex(c.r,c.g,c.b), id: generateId(), lab: c.lab });
        }
        setPalette(finalColors); setSelectedPaletteIds([]);
    };
    img.src = imageSrc;
  };

  const handleMergeColors = () => {
      if (selectedPaletteIds.length < 2) return;
      invalidateActiveVector();
      const targetId = selectedPaletteIds[0];
      setPalette(palette.filter(p => p.id === targetId || !selectedPaletteIds.includes(p.id)));
      setSelectedPaletteIds([]);
  };

  const handleRemoveColor = () => {
      invalidateActiveVector();
      setPalette(palette.filter(p => !selectedPaletteIds.includes(p.id)));
      setSelectedPaletteIds([]);
  };

  const updateSingleColor = (id, newHex) => {
      invalidateActiveVector();
      const rgb = hexToRgb(newHex); const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
      setPalette(prev => prev.map(p => p.id === id ? { ...p, r: rgb.r, g: rgb.g, b: rgb.b, hex: newHex, lab } : p));
  };

  const togglePaletteSelection = (id) => {
      setSelectedPaletteIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };



  // --- LIVE PREVIEW (RASTER APENAS - RÁPIDO) ---
  const activeSettingsStr = activeLayer ? JSON.stringify(activeLayer.settings) : null;
  const activeLayerMask = activeLayer?.mask;
  const activeLayerId = activeLayer?.id;

  useEffect(() => {
    if (!activeLayerId || activeLayerId === 'base' || !activeSettingsStr) return;
    
    const timer = setTimeout(() => {
        const settings = JSON.parse(activeSettingsStr);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            let dX = 0, dY = 0, dW = imageDimensions.w, dH = imageDimensions.h;
            if (activeLayerMask) {
                dX = activeLayerMask.x; dY = activeLayerMask.y; dW = activeLayerMask.w; dH = activeLayerMask.h;
            }
            
            const PREVIEW_MAX = 800; let ratio = 1;
            if (dW > PREVIEW_MAX || dH > PREVIEW_MAX) { ratio = Math.min(PREVIEW_MAX/dW, PREVIEW_MAX/dH); }
            const destW = dW * ratio; const destH = dH * ratio;
            
            canvas.width = destW; canvas.height = destH;
            
            if (settings.blur > 0) ctx.filter = `blur(${settings.blur * ratio}px)`;
            ctx.drawImage(img, dX, dY, dW, dH, 0, 0, destW, destH);
            ctx.filter = 'none';

            const data = ctx.getImageData(0,0,destW,destH).data;
            const usePal = useCustomPalette && palette.length > 0;

            for (let i = 0; i < data.length; i += 4) {
                if(data[i+3] === 0) continue; 
                let r = data[i], g = data[i+1], b = data[i+2];

                if (settings.ignoreWhite && r > 240 && g > 240 && b > 240) {
                    data[i+3] = 0; continue; 
                }

                r = Math.min(255, r * settings.contrast); g = Math.min(255, g * settings.contrast); b = Math.min(255, b * settings.contrast);

                if (settings.threshold > 0 && !usePal) {
                    const val = (r * 0.3 + g * 0.59 + b * 0.11) < settings.threshold ? 0 : 255;
                    r = g = b = val;
                }

                if (usePal) {
                    const pLab = rgbToLab(r, g, b);
                    let minD = Infinity; let bR=r, bG=g, bB=b;
                    for (const p of palette) { const d = deltaE(pLab, p.lab); if (d < minD) { minD = d; bR = p.r; bG = p.g; bB = p.b; } }
                    r = bR; g = bG; b = bB;
                }
                data[i] = r; data[i+1] = g; data[i+2] = b;
            }
            ctx.putImageData(new ImageData(data, destW, destH), 0, 0);
            
            setLayers(prev => prev.map(l => {
                if (l.id === activeLayerId) {
                    if (l.rasterUrl) URL.revokeObjectURL(l.rasterUrl);
                    return { ...l, rasterUrl: canvas.toDataURL('image/png') };
                }
                return l;
            }));
        };
        img.src = imageSrc;
    }, 200); 
    return () => clearTimeout(timer);
  }, [activeLayerId, activeSettingsStr, activeLayerMask, useCustomPalette, palette, imageSrc, imageDimensions]);


  // --- VETORIZAÇÃO FINAL (AÇÃO EXPLÍCITA CLOUDINARY) ---
  const handleCloudinaryVectorize = async (layerObject) => {
    if (!layerObject) layerObject = activeLayer;
    if (!layerObject || layerObject.type === 'base') return;

    const layerId = layerObject.id;
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, isProcessing: true } : l));

    try {
        const sourceUrl = layerObject.rasterUrl || imageSrc;
        if (!sourceUrl) throw new Error("Sem imagem para vetorizar.");

        const res = await fetch(sourceUrl);
        const blob = await res.blob();
        const file = new File([blob], "vectorize_input.png", { type: blob.type });

        // Envia para o Cloudinary
        const now = new Date();
        const folder = `workspace/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/apps/vetorize`;
        const url = await uploadToCloudinary(file, folder);
        
        // Aplica o add-on de vetorização do Cloudinary
        const parts = url.split('/upload/');
        const extMatch = parts[1].match(/\.(png|jpg|jpeg|webp)$/i);
        let vectorizedUrl = '';
        const d = (layerObject.settings.detail / 100).toFixed(1);
        const params = `colors:${layerObject.settings.colors}:detail:${d}:despeckle:${layerObject.settings.despeckle}`;
        if (extMatch) {
            vectorizedUrl = parts[0] + '/upload/e_vectorize:' + params + '/' + parts[1].replace(extMatch[0], '.svg');
        } else {
            vectorizedUrl = parts[0] + '/upload/e_vectorize:' + params + '/' + parts[1] + '.svg';
        }

        setLayers(prev => prev.map(l => {
           if (l.id === layerId) {
               return { ...l, svgUrl: vectorizedUrl, isProcessing: false };
           }
           return l;
        }));
    } catch (err) {
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, isProcessing: false } : l));
        setGlobalError("Erro ao vetorizar no Cloudinary. Verifique se o Add-on está ativado.");
    }
  };

  // --- FLUXO DE VETORIZAÇÃO CORRIGIDO ---
  // 1. Cria a Camada de Ajuste (Mero Draft, não vetoriza ainda!)
  const createFullImageDraft = () => {
      const inheritedSettings = activeLayer ? JSON.parse(JSON.stringify(activeLayer.settings)) : { ...DEFAULT_SETTINGS };
      const newLayerId = generateId();
      const newLayer = {
        id: newLayerId, type: 'vector', name: `Ajuste Imagem ${layers.filter(l => l.type === 'vector').length + 1}`,
        visible: true, mask: null, svgUrl: null, rasterUrl: null, settings: inheritedSettings, isProcessing: false
      };
      setLayers(prev => [newLayer, ...prev]);
      setSelectedLayerId(newLayerId); 
      setPropsOpen(true);
  };

  // 2. Apenas mediante clique do usuário: Roda o Trace no Canvas Original
  const processLayerVector = (layerObject) => {
    if (!layerObject || layerObject.type === 'base') return;
    if (!window.ImageTracer) { setGlobalError("Engine vetorial não carregada. Verifique internet."); return; }
    
    const layerId = layerObject.id;
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, isProcessing: true } : l));

    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          let drawX = 0, drawY = 0, drawW = imageDimensions.w, drawH = imageDimensions.h;
          if (layerObject.mask) {
             drawX = layerObject.mask.x; drawY = layerObject.mask.y; drawW = layerObject.mask.w; drawH = layerObject.mask.h;
          }
          canvas.width = drawW; canvas.height = drawH;

          if (layerObject.settings.blur > 0) ctx.filter = `blur(${layerObject.settings.blur}px)`;
          if (layerObject.mask && layerObject.mask.type === 'oval') { 
              ctx.beginPath(); ctx.ellipse(drawW/2, drawH/2, drawW/2, drawH/2, 0, 0, 2 * Math.PI); ctx.clip(); 
          }
          ctx.drawImage(img, drawX, drawY, drawW, drawH, 0, 0, drawW, drawH);
          ctx.filter = 'none';

          const data = ctx.getImageData(0,0,drawW,drawH).data;
          const usePal = useCustomPalette && palette.length > 0;

          for (let i = 0; i < data.length; i += 4) {
              if(data[i+3] === 0) continue; 
              let r=data[i], g=data[i+1], b=data[i+2];

              if (layerObject.settings.ignoreWhite && r > 240 && g > 240 && b > 240) {
                  data[i+3] = 0; continue;
              }

              r = Math.min(255, r * layerObject.settings.contrast); g = Math.min(255, g * layerObject.settings.contrast); b = Math.min(255, b * layerObject.settings.contrast);
              if (layerObject.settings.threshold > 0 && !usePal) {
                  const val = (r * 0.3 + g * 0.59 + b * 0.11) < layerObject.settings.threshold ? 0 : 255;
                  r = g = b = val;
              }
              if (usePal) {
                  const pLab = rgbToLab(r, g, b);
                  let minD = Infinity; let bR=r, bG=g, bB=b;
                  for (const p of palette) { const d = deltaE(pLab, p.lab); if (d < minD) { minD = d; bR = p.r; bG = p.g; bB = p.b; } }
                  r = bR; g = bG; b = bB;
              }
              data[i] = r; data[i+1] = g; data[i+2] = b;
          }
          ctx.putImageData(new ImageData(data, drawW, drawH), 0, 0);

          const finalRasterUrl = canvas.toDataURL('image/png');
          const tracerOptions = mapSettingsToTracer(layerObject.settings);
          if (usePal) { tracerOptions.pal = palette.map(c => ({r: c.r, g: c.g, b: c.b, a: 255})); tracerOptions.colorquantcycles = 0; }

          window.ImageTracer.imageToSVG(finalRasterUrl, (svgstr) => {
              const blob = new Blob([svgstr], {type: 'image/svg+xml'});
              const url = URL.createObjectURL(blob);
              
              setLayers(prev => prev.map(l => {
                 if (l.id === layerId) {
                     if (l.svgUrl) URL.revokeObjectURL(l.svgUrl);
                     return { ...l, svgUrl: url, rasterUrl: finalRasterUrl, isProcessing: false }; // Mantém o rasterUrl pro caso de baixar PNG
                 }
                 return l;
              }));
          }, tracerOptions);
        };
        img.src = imageSrc;
      } catch (err) {
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, isProcessing: false } : l));
        setGlobalError("Ocorreu um erro ao vetorizar.");
      }
    }, 50);
  };

  // --- DYNAMICS: PAN, ZOOM AND DRAWING ---
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault(); setZoom(prev => Math.max(0.1, Math.min(8, prev - e.deltaY * 0.002)));
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const handleMouseDown = (e) => {
    if (!imageSrc || e.target.tagName === 'INPUT') return;
    
    if (activeTool === 'pan' || isSpaceDown || e.button === 1) {
      setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); return;
    } 
    
    if (activeTool === 'rect' || activeTool === 'oval') {
      const rect = innerCanvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom; 
      const y = (e.clientY - rect.top) / zoom;
      setDrawStart({ x, y }); setCurrentDraw({ x, y, w: 0, h: 0, type: activeTool }); setIsDrawing(true);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (isDrawing && (activeTool === 'rect' || activeTool === 'oval')) {
      const rect = innerCanvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom; const y = (e.clientY - rect.top) / zoom;
      const w = x - drawStart.x; const h = y - drawStart.y;
      setCurrentDraw({ x: w < 0 ? x : drawStart.x, y: h < 0 ? y : drawStart.y, w: Math.abs(w), h: Math.abs(h), type: activeTool });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (isDrawing) {
        setIsDrawing(false);
        if (currentDraw && currentDraw.w > 10 && currentDraw.h > 10) {
          const inheritedSettings = activeLayer ? JSON.parse(JSON.stringify(activeLayer.settings)) : { ...DEFAULT_SETTINGS };
          const newLayer = { id: generateId(), type: 'vector', name: `Recorte ${layers.filter(l => l.type === 'vector').length + 1}`, visible: true, mask: { ...currentDraw }, svgUrl: null, rasterUrl: null, settings: inheritedSettings, isProcessing: false };
          setLayers(prev => [newLayer, ...prev]);
          setSelectedLayerId(newLayer.id);
          setCurrentDraw(null); setActiveTool('select'); setPropsOpen(true);
        } else { setCurrentDraw(null); }
    }
  };

  const currentPresetKey = useMemo(() => {
     if (!activeLayer || !activeLayer.settings) return 'custom';
     const s = activeLayer.settings;
     for (const [key, preset] of Object.entries(PRESETS)) {
         if (key === 'custom') continue;
         if (JSON.stringify(preset.settings) === JSON.stringify(s)) return key;
     }
     return 'custom';
  }, [activeSettingsStr]); 


  return (
    <div className="absolute inset-0 flex flex-col bg-white text-gray-800 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {globalError && (
         <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white px-4 py-2 rounded shadow-xl flex items-center gap-2 text-xs font-bold border border-red-500">
            <AlertTriangle size={16} /> {globalError}
            <button onClick={() => setGlobalError(null)} className="ml-2 hover:opacity-70">×</button>
         </div>
      )}

      {/* HEADER */}
      {imageSrc && (<header className="h-14 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 relative z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg"><Sparkles size={16} className="text-white" /></div>
          
        </div>

        {imageSrc && (
          <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-gray-200">
             <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><ZoomOut size={14}/></button>
             <span className="text-xs font-medium w-12 text-center text-gray-9000">{Math.round(zoom * 100)}%</span>
             <button onClick={() => setZoom(z => Math.min(8, z + 0.1))} className="p-1.5 hover:bg-gray-100 rounded text-gray-500"><ZoomIn size={14}/></button>
             <div className="w-px h-4 bg-gray-100 mx-1"></div>
             <button onClick={() => centerCanvas(imageDimensions.w, imageDimensions.h)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Centralizar Visualização"><Focus size={14}/></button>
          </div>
        )}

        <div className="flex items-center gap-3">
           {imageSrc && (
             <label className="flex items-center gap-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded cursor-pointer text-gray-700 transition-colors">
                <Plus size={14} /> Nova Imagem
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && loadFile(e.target.files[0])} />
             </label>
           )}
           
           <div className="relative">
               <button onClick={() => setExportMenuOpen(!exportMenuOpen)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors">
                   <Download size={14} /> Exportar <ChevronDown size={14} />
               </button>
               {exportMenuOpen && (
                   <div className="absolute right-0 top-full mt-1 w-32 bg-gray-100 border border-gray-300 rounded-md shadow-xl z-50 overflow-hidden">
                       {['svg', 'png', 'jpg', 'webp'].map(fmt => (
                           <button key={fmt} onClick={() => handleExport(fmt)} className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-200 uppercase font-medium">{fmt}</button>
                       ))}
                   </div>
               )}
           </div>
        </div>
      </header>)}

      <div className="flex flex-1 overflow-hidden relative z-0">
        
        {/* SIDEBAR FERRAMENTAS ESQUERDA */}
        {imageSrc && (
          <aside className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 gap-2 relative z-40 flex-shrink-0 shadow-xl">
            {/* CTA VETORIZAR */}
            <button 
               onClick={activeLayer?.type === 'base' ? createFullImageDraft : () => { if (!activeLayer?.svgUrl) processLayerVector(activeLayer); }}
               disabled={activeLayer?.type === 'vector' && !!activeLayer?.svgUrl}
               className={`w-10 h-10 mb-2 rounded-xl flex items-center justify-center transition-all ${activeLayer?.type === 'vector' && !!activeLayer?.svgUrl ? 'bg-gray-100 text-zinc-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] active:scale-95'}`}
               title={activeLayer?.type === 'base' ? "Preparar Imagem Inteira" : (activeLayer?.svgUrl ? "Vetor Atualizado" : "Gerar Vetor SVG Agora (Local)")}
            >
               {activeLayer?.isProcessing ? <Loader2 size={18} className="animate-spin" /> : (activeLayer?.type === 'vector' && activeLayer?.svgUrl ? <Check size={20} /> : <Wand2 size={20} />)}
            </button>
            <button 
               onClick={() => activeLayer?.type !== 'base' && handleCloudinaryVectorize(activeLayer)}
               className={`w-10 h-10 mb-2 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all active:scale-95 ${activeLayer?.type === 'base' ? 'bg-gray-100 text-gray-9000 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-400 text-white'}`}
               title="Vetorizar com Cloudinary (Alta Precisão)"
               disabled={activeLayer?.type === 'base'}
            >
               {activeLayer?.isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={20} />}
            </button>
            <div className="w-8 h-px bg-gray-100 mb-2"></div>

            <button onClick={() => setActiveTool('select')} className={`p-3 rounded-xl transition-all ${activeTool === 'select' ? 'bg-indigo-600/20 text-indigo-400 shadow-inner' : 'text-gray-9000 hover:bg-gray-100'}`} title="Seleção Normal"><MousePointer2 size={18} /></button>
            <button onClick={() => setActiveTool('pan')} className={`p-3 rounded-xl transition-all ${activeTool === 'pan' ? 'bg-indigo-600/20 text-indigo-400 shadow-inner' : 'text-gray-9000 hover:bg-gray-100'}`} title="Mover Tela (Ou segure Espaço)"><Hand size={18} /></button>
            <button onClick={() => setActiveTool('rect')} className={`p-3 rounded-xl transition-all ${activeTool === 'rect' ? 'bg-indigo-600/20 text-indigo-400 shadow-inner' : 'text-gray-9000 hover:bg-gray-100'}`} title="Recorte Retangular"><SquareDashed size={18} /></button>
            <button onClick={() => setActiveTool('oval')} className={`p-3 rounded-xl transition-all ${activeTool === 'oval' ? 'bg-indigo-600/20 text-indigo-400 shadow-inner' : 'text-gray-9000 hover:bg-gray-100'}`} title="Recorte Elíptico"><CircleDashed size={18} /></button>
            
            <div className="mt-auto w-8 h-px bg-gray-100 my-2"></div>
            <button onClick={() => setActiveTool('compare')} className={`p-3 rounded-xl transition-all ${activeTool === 'compare' ? 'bg-blue-600/20 text-blue-400 shadow-inner' : 'text-gray-9000 hover:bg-gray-100'}`} title="Comparar Original vs Vetor"><SplitSquareHorizontal size={18} /></button>
          </aside>
        )}

        {/* MAIN CANVAS */}
        <main ref={containerRef} className={`flex-1 relative overflow-hidden bg-[#e5e5e5]  z-10 ${isSpaceDown || activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : (activeTool==='select'?'cursor-default':'cursor-crosshair')}`}
          onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          
          {!imageSrc && (
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto">
                <label className="flex flex-col items-center justify-center w-80 h-80 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-gray-100/50 cursor-pointer transition-all group shadow-2xl">
                   <div className="w-20 h-20 rounded-full bg-gray-100 group-hover:bg-indigo-500/20 flex items-center justify-center mb-6 shadow-inner transition-colors"><ImageIcon size={32} className="text-gray-9000 group-hover:text-indigo-400" /></div>
                   <h2 className="text-xl font-medium text-gray-700">Área de Trabalho</h2>
                   <p className="text-sm mt-2 text-gray-9000 px-8 text-center">Arraste a imagem original aqui.</p>
                   <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && loadFile(e.target.files[0])} />
                </label>
             </div>
          )}

          {/* INNER TRANSFORM CONTAINER (Absolute Center) */}
          {imageSrc && (
            <div ref={innerCanvasRef} className="absolute shadow-2xl origin-center bg-white/5" 
              style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: imageDimensions.w, height: imageDimensions.h }}>
                
                {/* 1. BASE LAYER (Fica no fundo, visível inteira) */}
                {layers.find(l => l.type === 'base' && l.visible) && (
                   <img src={imageSrc} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                )}

                {/* 2. VECTOR/PREVIEW LAYERS (Por cima) */}
                {layers.filter(l => l.type === 'vector' && l.visible).reverse().map(layer => {
                   const m = layer.mask; const isMasked = !!m;
                   
                   // CORREÇÃO DO COMPARADOR: Corta APENAS o vetor para mostrar a imagem Original por baixo
                   let clip = 'none';
                   if (activeTool === 'compare' && selectedLayerId === layer.id) {
                      clip = `inset(0 0 0 ${splitPos}%)`;
                   }

                   return (
                     <div key={layer.id} className="absolute pointer-events-none" style={{ left: isMasked?m.x:0, top: isMasked?m.y:0, width: isMasked?m.w:'100%', height: isMasked?m.h:'100%', clipPath: clip }}>
                        {layer.svgUrl ? (
                           <img src={layer.svgUrl} className="w-full h-full object-contain drop-shadow-xl" onError={() => setGlobalError("Falha ao carregar vetor do Cloudinary. O add-on 'Vectorize' está ativo na sua conta?")} />
                        ) : layer.rasterUrl ? (
                           <img src={layer.rasterUrl} className="w-full h-full object-contain opacity-95" />
                        ) : (
                           <div className={`w-full h-full border-2 border-dashed ${selectedLayerId === layer.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300/50 bg-zinc-500/10'}`} style={{ borderRadius: isMasked && m.type==='oval'?'50%':'0' }} />
                        )}
                     </div>
                   );
                })}

                {/* 3. SLIDER MÁGICO DE COMPARAÇÃO */}
                {activeTool === 'compare' && activeLayer?.type === 'vector' && (
                  <div className="absolute top-0 bottom-0 w-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(0,0,0,0.8)] z-30 flex items-center justify-center pointer-events-none" style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}>
                     <div onMouseDown={(e)=>{e.stopPropagation();}} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-500 pointer-events-auto cursor-ew-resize">
                        <ArrowLeftRight size={14} className="text-white pointer-events-none" />
                        <input type="range" min="0" max="100" value={splitPos} onChange={(e) => setSplitPos(parseFloat(e.target.value))} className="absolute inset-y-0 -left-12 w-32 opacity-0 cursor-ew-resize" />
                     </div>
                  </div>
                )}

                {/* 4. MARQUEE DE DESENHO (RECORTE) */}
                {isDrawing && currentDraw && !isSpaceDown && activeTool !== 'pan' && (
                   <div className="absolute border border-indigo-400 bg-indigo-500/20 pointer-events-none z-50 shadow-[0_0_0_1px_rgba(0,0,0,0.3)]" style={{ left: currentDraw.x, top: currentDraw.y, width: currentDraw.w, height: currentDraw.h, borderRadius: currentDraw.type === 'oval' ? '50%' : '0' }} />
                )}
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR (Propriedades) */}
        {imageSrc && (
          <aside className="w-[340px] bg-gray-50 border-l border-gray-200 flex flex-col relative z-40 flex-shrink-0 shadow-[-4px_0_15px_rgba(0,0,0,0.05)]">
            
            {/* PROPERTIES SCROLL AREA */}
            <div className={`flex flex-col border-b border-gray-200 transition-all overflow-hidden ${propsOpen ? 'flex-1' : 'flex-none'}`}>
               <button onClick={() => setPropsOpen(!propsOpen)} className="p-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center flex-shrink-0 transition-colors border-b border-gray-200">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
                     <Settings2 size={14} /> Controles: {activeLayer ? activeLayer.name : 'Nenhum'}
                  </h3>
                  {propsOpen ? <ChevronDown size={16} className="text-gray-9000"/> : <ChevronRight size={16} className="text-gray-9000"/>}
               </button>

               {propsOpen && activeLayer && activeLayer.type === 'vector' && (
                 <div className="flex-1 p-5 space-y-6 overflow-y-auto">
                     <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500">Preset Inteligente</label>
                        <select 
                           value={currentPresetKey} 
                           onChange={(e) => {
                               const preset = PRESETS[e.target.value];
                               if(preset.settings) {
                                  setLayers(prev => prev.map(l => l.id === activeLayer.id ? { ...l, svgUrl: null, settings: { ...preset.settings } } : l));
                               }
                           }} 
                           className="w-full bg-white border border-gray-200 rounded text-xs text-gray-800 p-2 outline-none"
                        >
                           {Object.entries(PRESETS).map(([key, preset]) => <option key={key} value={key}>{preset.name} - {preset.desc}</option>)}
                        </select>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h4 className="text-[10px] font-bold text-gray-9000 uppercase flex justify-between">1. Base Analógica</h4>
                        {[{key:'blur', label:'Suavização e Fusão (px)', min:0, max:5, step:0.5}, {key:'contrast', label:'Contraste Linear', min:0.5, max:3.0, step:0.1}, {key:'threshold', label:'Corte Monocromático', min:0, max:255, step:1}].map(sl => (
                           <div key={sl.key} className="space-y-2">
                              <div className="flex justify-between items-center"><label className="text-xs font-medium text-gray-500">{sl.label}</label><span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-gray-700 border border-gray-200">{activeLayer.settings[sl.key]}</span></div>
                              <input type="range" min={sl.min} max={sl.max} step={sl.step} value={activeLayer.settings[sl.key]} onChange={(e) => setLayers(prev => prev.map(l => l.id === activeLayer.id ? { ...l, svgUrl: null, settings: { ...l.settings, [sl.key]: parseFloat(e.target.value) } } : l))} className="w-full accent-indigo-500 h-1 bg-gray-100 rounded appearance-none cursor-pointer" />
                           </div>
                        ))}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                          <label className="text-xs font-medium text-gray-500">Ignorar Fundo Branco</label>
                          <button onClick={() => setLayers(prev => prev.map(l => l.id === activeLayer.id ? { ...l, svgUrl: null, settings: { ...l.settings, ignoreWhite: !l.settings.ignoreWhite } } : l))} className={`w-9 h-5 rounded-full transition-colors relative shadow-inner ${activeLayer.settings.ignoreWhite ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${activeLayer.settings.ignoreWhite ? 'left-4.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                     </div>

                     <div className="space-y-3 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-indigo-400 flex items-center gap-2"><Pipette size={14} /> 2. Paleta Manual (Lab)</label>
                          <button onClick={() => { setUseCustomPalette(!useCustomPalette); invalidateActiveVector(); }} className={`w-9 h-5 rounded-full transition-colors relative shadow-inner ${useCustomPalette ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                             <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${useCustomPalette ? 'left-4.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                        {useCustomPalette && (
                           <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-inner">
                              {palette.length === 0 ? <button onClick={extractPalette} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-xs text-indigo-300 font-medium rounded transition-colors shadow">Extrair Cores Brutas</button> : (
                                 <>
                                    <div className="flex justify-between items-center mb-3">
                                       <span className="text-[10px] uppercase font-bold text-gray-9000">{palette.length} Detetadas</span>
                                       <button onClick={() => { setPalette([]); invalidateActiveVector(); }} className="text-[10px] text-indigo-400 hover:underline">Resetar</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                       {palette.map(c => (
                                          <div key={c.id} onClick={() => togglePaletteSelection(c.id)} className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all ${selectedPaletteIds.includes(c.id) ? 'border-indigo-500 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-gray-300 hover:border-gray-300'}`} style={{ backgroundColor: c.hex }} title="Selecionar" />
                                       ))}
                                    </div>
                                    {selectedPaletteIds.length > 0 && (
                                       <div className="flex flex-col gap-2">
                                          {selectedPaletteIds.length === 1 ? (
                                             <div className="flex items-center justify-between bg-gray-50 p-2 rounded"><span className="text-xs text-gray-500">Alterar cor:</span><input type="color" value={palette.find(c=>c.id===selectedPaletteIds[0])?.hex} onChange={(e) => updateSingleColor(selectedPaletteIds[0], e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" /></div>
                                          ) : <button onClick={handleMergeColors} className="flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-xs text-indigo-700 font-bold transition-colors"><Merge size={14} /> Mesclar Tudo</button>}
                                          <button onClick={handleRemoveColor} className="flex items-center justify-center gap-2 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded text-xs transition-colors"><Trash size={14} /> Excluir</button>
                                       </div>
                                    )}
                                 </>
                              )}
                           </div>
                        )}
                     </div>

                     <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h4 className="text-[10px] font-bold text-gray-9000 uppercase">3. Geometria (Vetor)</h4>
                        {[{key:'colors', label:'Cores Limite', min:2, max:128, step:1}, {key:'detail', label:'Fidelidade (%)', min:1, max:100, step:1}, {key:'smoothness', label:'Cantos Retos (0) / Curvas (100)', min:0, max:100, step:1}, {key:'despeckle', label:'Ignorar Sujeira', min:0, max:10, step:1}, {key:'optimize', label:'Otimizar Curvas (%)', min:0, max:100, step:1}].map(sl => (
                           <div key={sl.key} className="space-y-2">
                              <div className="flex justify-between items-center"><label className="text-xs font-medium text-gray-500">{sl.label}</label><span className="text-[10px] bg-white px-1.5 py-0.5 rounded text-gray-700 border border-gray-200">{activeLayer.settings[sl.key]}</span></div>
                              <input type="range" min={sl.min} max={sl.max} step={sl.step} value={activeLayer.settings[sl.key]} onChange={(e) => setLayers(prev => prev.map(l => l.id === activeLayer.id ? { ...l, svgUrl: null, settings: { ...l.settings, [sl.key]: parseFloat(e.target.value) } } : l))} className="w-full accent-indigo-500 h-1 bg-gray-100 rounded appearance-none cursor-pointer" />
                           </div>
                        ))}
                     </div>
                 </div>
               )}

               {propsOpen && activeLayer && activeLayer.type === 'base' && (
                  <div className="flex-1 p-8 text-center flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                     <ImageIcon size={48} className="text-zinc-700" />
                     <div>
                        <p className="text-sm font-bold text-gray-700 mb-1">Imagem Original (Apenas Leitura)</p>
                        <p className="text-xs text-gray-9000 leading-relaxed">Faça um recorte na imagem à esquerda, ou clique abaixo para preparar a imagem inteira.</p>
                     </div>
                     <button onClick={createFullImageDraft} className="mt-4 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded shadow flex items-center gap-2 transition-colors w-full justify-center">
                        <Settings2 size={14} /> Criar Camada de Ajuste Inteira
                     </button>
                  </div>
               )}
               
               {/* CTA BOTÃO FINAL FIXO */}
               {propsOpen && activeLayer && activeLayer.type === 'vector' && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                     {activeLayer.svgUrl ? (
                        <div className="w-full py-3 bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-sm rounded-lg flex justify-center items-center gap-2">
                           <Check size={16} /> Vetor Gerado e Atualizado
                        </div>
                     ) : (
                        <button onClick={() => processLayerVector(activeLayer)} disabled={activeLayer.isProcessing} className={`w-full py-3 text-white font-bold text-sm rounded-lg shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-all ${highlightGenerate ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-105' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                           {activeLayer.isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} 
                           Gerar Vetor Definitivo (SVG)
                        </button>
                     )}
                  </div>
               )}
            </div>

            {/* LAYERS PANEL */}
            <div className={`flex flex-col bg-white transition-all border-t-4 border-gray-100 ${propsOpen ? 'flex-none h-64' : 'flex-1'}`}>
               <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2"><Layers size={14} /> Recortes e Vetores</h3>
                  <button onClick={createFullImageDraft} className="text-[10px] bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded hover:bg-gray-200 transition-colors flex items-center gap-1 font-medium"><Plus size={12}/> Inteira</button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
                  {layers.filter(l => l.type === 'vector').reverse().map(layer => (
                     <div key={layer.id} onClick={() => { setSelectedLayerId(layer.id); setPropsOpen(true); }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group ${selectedLayerId === layer.id ? 'bg-indigo-600/10 border-indigo-500 shadow-sm relative z-10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                     >
                        <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className="text-gray-9000 hover:text-gray-700">
                           {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        
                        <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${layer.isProcessing ? 'text-indigo-400 bg-indigo-900/20' : (layer.svgUrl ? 'bg-green-500/10 text-green-400' : 'bg-gray-100 text-gray-9000')}`}>
                           {layer.isProcessing ? <Loader2 size={14} className="animate-spin" /> : (layer.mask ? <SquareDashed size={14}/> : <FileCode2 size={14} />)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                           <p className={`text-xs truncate ${selectedLayerId === layer.id ? 'text-indigo-300 font-bold' : 'text-gray-700 font-medium'}`}>{layer.name}</p>
                           {layer.isProcessing ? <p className="text-[9px] text-indigo-400">Processando...</p> : (layer.svgUrl ? <p className="text-[9px] text-green-500 font-medium">Vetor Final</p> : <p className="text-[9px] text-gray-9000">Preview (Em Ajuste)</p>)}
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} className="text-zinc-600 hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>
                     </div>
                  ))}

                  <div className="mt-8 border-t border-gray-200 pt-4">
                     <span className="text-[9px] font-bold uppercase text-zinc-600 block mb-2 px-2">Base Original Fixa</span>
                     {layers.filter(l => l.type === 'base').map(layer => (
                        <div key={layer.id} onClick={() => { setSelectedLayerId(layer.id); setPropsOpen(true); }}
                           className={`flex items-center gap-3 p-3 rounded-lg border border-dashed transition-all cursor-pointer ${selectedLayerId === layer.id ? 'border-gray-300 bg-gray-100' : 'border-gray-200 bg-transparent opacity-60 hover:opacity-100'}`}
                        >
                           <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className="text-gray-9000 hover:text-gray-700"><Eye size={16} /></button>
                           <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-9000"><ImageIcon size={14}/></div>
                           <p className={`text-xs flex-1 truncate ${selectedLayerId === layer.id ? 'text-indigo-600 font-bold' : 'text-gray-500 font-medium'}`}>{layer.name}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

          </aside>
        )}
      </div>

    </div>
  );
}