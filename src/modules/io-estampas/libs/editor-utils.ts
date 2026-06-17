import React from 'react';

export const FONTS_BY_CATEGORY = {
  "Universitário & Academia": ['Georgia', 'Cambria', 'Times New Roman'],
  "Direito & Advocacia": ['Century Schoolbook', 'Garamond', 'Calibri'],
  "Medicina & Saúde": ['Arial', 'Helvetica', 'Garamond'],
  "Design, Arte & Moda": ['Playfair Display', 'Montserrat', 'Syne', 'Cinzel'],
  "Tech & Engenharia": ['JetBrains Mono', 'Fira Code', 'Space Grotesk', 'Inter'],
  "Finanças & Negócios": ['Prata', 'Source Sans 3', 'PT Serif'],
  "Esportes & Fitness": ['Oswald', 'Bebas Neue', 'Rubik'],
  "Arquitetura & Construção": ['Architects Daughter', 'Josefin Sans', 'Urbanist'],
  "Pedagogia & Infantil": ['Fredoka', 'Quicksand', 'Comfortaa'],
  "Geek, Pop & Streetwear": ['Press Start 2P', 'Permanent Marker', 'Creepster']
};

export const ALL_FONTS = Array.from(new Set(Object.values(FONTS_BY_CATEGORY).flat()));

export const FONT_WEIGHTS = [
  { value: '100', label: 'Thin' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' }
];

export const PRINT_TYPES = [
  { id: 'silk', name: 'Silk', icon: 'PaintBucket', color: 'text-blue-600', bg: 'bg-blue-600' },
  { id: 'dtf', name: 'DTF', icon: 'Layers', color: 'text-fuchsia-600', bg: 'bg-fuchsia-600' },
  { id: 'sublimacao', name: 'Sublimação', icon: 'Droplets', color: 'text-cyan-600', bg: 'bg-cyan-600' },
  { id: 'plotter', name: 'Plotter', icon: 'Scissors', color: 'text-orange-600', bg: 'bg-orange-600' },
  { id: 'custom', name: 'Customizado', icon: 'Sparkles', color: 'text-slate-800', bg: 'bg-slate-800' }
];

export const SHAPES: Record<string, (color: string, w: number, h: number, sColor?: string, sWidth?: number, sDash?: string) => string> = {
  heart: (color, w, h, sColor, sWidth, sDash) => `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="${color}" stroke="${sColor||'none'}" stroke-width="${sWidth||0}" stroke-dasharray="${sDash||'none'}" preserveAspectRatio="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  star: (color, w, h, sColor, sWidth, sDash) => `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="${color}" stroke="${sColor||'none'}" stroke-width="${sWidth||0}" stroke-dasharray="${sDash||'none'}" preserveAspectRatio="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  circle: (color, w, h, sColor, sWidth, sDash) => `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="${color}" stroke="${sColor||'none'}" stroke-width="${sWidth||0}" stroke-dasharray="${sDash||'none'}" preserveAspectRatio="none"><circle cx="12" cy="12" r="10"/></svg>`,
  rect: (color, w, h, sColor, sWidth, sDash) => `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="${color}" stroke="${sColor||'none'}" stroke-width="${sWidth||0}" stroke-dasharray="${sDash||'none'}" preserveAspectRatio="none"><rect x="2" y="2" width="20" height="20" rx="3"/></svg>`,
  triangle: (color, w, h, sColor, sWidth, sDash) => `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="${color}" stroke="${sColor||'none'}" stroke-width="${sWidth||0}" stroke-dasharray="${sDash||'none'}" preserveAspectRatio="none"><polygon points="12,2 22,22 2,22"/></svg>`,
  diamond: (color, w, h, sColor, sWidth, sDash) => `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="${color}" stroke="${sColor||'none'}" stroke-width="${sWidth||0}" stroke-dasharray="${sDash||'none'}" preserveAspectRatio="none"><polygon points="12,2 22,12 12,22 2,12"/></svg>`,
};

export const generateId = () => "el_" + Date.now() + Math.random().toString(36).substring(2, 7);

export const renderHtmlElement = (el: any, forceColor: string) => {
  const sColor = forceColor === '#000000' ? '#000000' : (el.strokeColor || 'transparent');
  const sWidth = el.strokeWidth || 0;

  if (el.type === "text") {
    const align = el.textAlign || 'center';
    if (el.curve && el.curve !== 0) {
      const pathId = `curve_exp_${el.id}`;
      const curveVal = el.curve;
      const safeCurve = Math.max(-99.9, Math.min(99.9, curveVal));
      const pad = el.w; 
      const totalW = el.w + pad * 2;
      const dy = (safeCurve / 100) * (el.h / 2);
      const absDy = Math.max(0.1, Math.abs(dy)); 
      const r = Math.max(((totalW/2)*(totalW/2) + absDy*absDy) / (2 * absDy), totalW/2);
      const startY = el.h/2;
      const sweep = safeCurve > 0 ? 1 : 0;
      const d = `M -${pad},${startY} A ${r} ${r} 0 0 ${sweep} ${el.w + pad},${startY}`;
      
      let textAnchor = "middle"; let startOffset = "50%";
      if (align === "left") { textAnchor = "start"; startOffset = "0%"; }
      if (align === "right") { textAnchor = "end"; startOffset = "100%"; }

      return `<div style="position:absolute; top:${el.y}px; left:${el.x}px; width:${el.w}px; height:${el.h}px;">
        <svg width="100%" height="100%" viewBox="0 0 ${el.w} ${el.h}" style="overflow: visible;">
          <path id="${pathId}" d="${d}" fill="transparent" stroke="none" />
          <text style="fill:${forceColor}; stroke:${sColor}; stroke-width:${sWidth}px; stroke-dasharray:${el.strokeDasharray||'none'}; font-size:${el.fontSize}px; font-family:'${el.fontFamily}', sans-serif; font-weight:${el.fontWeight||800}; font-style:${el.fontStyle||'normal'}; text-decoration:${el.textDecoration||'none'}; text-transform:${el.textTransform||'none'}; letter-spacing:${el.letterSpacing||0}px;" text-anchor="${textAnchor}">
            <textPath href="#${pathId}" startOffset="${startOffset}">${el.content}</textPath>
          </text>
        </svg>
      </div>`;
    }
    return `<div style="position:absolute; top:${el.y}px; left:${el.x}px; width:${el.w}px; height:${el.h}px; color:${forceColor}; font-size:${el.fontSize}px; font-family:'${el.fontFamily}', sans-serif; font-weight:${el.fontWeight||800}; font-style:${el.fontStyle||'normal'}; text-decoration:${el.textDecoration||'none'}; text-transform:${el.textTransform||'none'}; letter-spacing:${el.letterSpacing||0}px; text-underline-offset:${el.underlineOffset||0}px; text-align:${align}; line-height:${el.lineHeight||1.2}; word-break:break-word; white-space:pre-wrap; -webkit-text-stroke:${sWidth}px ${sColor};">${el.content}</div>`;
  }
  if (el.type === "shape") return `<div style="position:absolute; top:${el.y}px; left:${el.x}px; width:${el.w}px; height:${el.h}px;">${SHAPES[el.content]?.(forceColor, el.w, el.h, sColor, sWidth, el.strokeDasharray) || ""}</div>`;
  if (el.type === "image") return `<div style="position:absolute; top:${el.y}px; left:${el.x}px; width:${el.w}px; height:${el.h}px;"><img src="${el.content}" style="width:100%; height:100%; object-fit:contain;"></div>`;
  return "";
};

export const openPrintWindow = (content: string, title: string, bgCSSColor: string, canvasW: number, canvasH: number) => {
  const printWindow = window.open('', '', 'width=900,height=700');
  if (!printWindow) return;
  const fontsUrl = `https://fonts.googleapis.com/css2?${ALL_FONTS.map(f => `family=${f.replace(/ /g, '+')}`).join('&')}&display=swap`;
  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>${title}</title><link href="${fontsUrl}" rel="stylesheet">
    <style>@page { size: ${canvasW}px ${canvasH}px; margin: 0; } body { margin: 0; background: ${bgCSSColor}; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: sans-serif; } .page-container { position: relative; width: ${canvasW}px; height: ${canvasH}px; overflow: hidden; background: ${bgCSSColor}; margin: 0 auto; } .color-label { position: absolute; bottom: 10px; left: 10px; font-family: monospace; font-size: 12px; font-weight: bold; color: black; z-index: 100; }</style>
    </head><body>${content}<script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); };</script></body></html>
  `);
  printWindow.document.close();
};
