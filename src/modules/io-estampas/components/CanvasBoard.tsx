import React, { useRef } from 'react';

// GabaritoOverlay
export function GabaritoOverlay({ w, h, visible }: { w: number; h: number; visible: boolean }) {
  if (!visible) return null;
  const cx = w / 2, cy = h / 2;
  const step = w / 14;
  const letters = ["A","B","C","D","E","F","G","H","I","J","L","M","N","O","P","Q","R","S"];
  const refLines = [0.25, 0.5, 0.75];
  return (
    <svg style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:2, opacity:0.65 }} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <pattern id="grd" width={step} height={step} patternUnits="userSpaceOnUse">
          <path d={`M ${step} 0 L 0 0 0 ${step}`} fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width={w} height={h} fill="url(#grd)"/>
      <line x1={cx} y1={0} x2={cx} y2={h} stroke="#475569" strokeWidth="1.2"/>
      {refLines.map(f => (
        <g key={f}>
          <line x1={0} y1={h*f} x2={w} y2={h*f} stroke="#475569" strokeWidth="1.2"/>
          {[1,2,3,4,5,6,7].map(n => {
            const lx = cx - n*step, rx = cx + n*step;
            return (
              <g key={n}>
                <text x={lx} y={h*f-3} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#64748b">{n}</text>
                <text x={rx} y={h*f-3} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#64748b">{n}</text>
                <line x1={lx} y1={h*f-5} x2={lx} y2={h*f} stroke="#94a3b8" strokeWidth="0.8"/>
                <line x1={rx} y1={h*f-5} x2={rx} y2={h*f} stroke="#94a3b8" strokeWidth="0.8"/>
              </g>
            );
          })}
        </g>
      ))}
      {letters.map((l, i) => {
        const y = (i+1)/(letters.length+1)*h;
        return (
          <g key={l}>
            <text x={cx+4} y={y+3} fontSize="8" fontFamily="monospace" fill="#64748b" fontWeight="700">{l}</text>
            <line x1={cx-5} y1={y} x2={cx} y2={y} stroke="#94a3b8" strokeWidth="0.8"/>
          </g>
        );
      })}
      {[...Array(15)].map((_, i) => {
        const deg = Math.abs(i-7);
        const x = i*w/14 + w/28;
        return <text key={i} x={x} y={h-4} textAnchor="middle" fontSize="6" fontFamily="monospace" fill="#94a3b8">{deg}°</text>;
      })}
      <circle cx={cx} cy={cy} r={7} stroke="#ef4444" strokeWidth="1.5" fill="none"/>
      <line x1={cx-12} y1={cy} x2={cx+12} y2={cy} stroke="#ef4444" strokeWidth="1.5"/>
      <line x1={cx} y1={cy-12} x2={cx} y2={cy+12} stroke="#ef4444" strokeWidth="1.5"/>
    </svg>
  );
}

// CanvasEl
export function CanvasEl({ 
  el, selected, zoom, onSelect, onUpdate, onPushHistory, isFotolito, editingId, setEditingId 
}: { 
  el: any; selected: boolean; zoom: number; onSelect: (id: string) => void; onUpdate: (id: string, changes: any, saveHist?: boolean) => void; 
  onPushHistory: () => void; isFotolito: boolean; editingId: string | null; setEditingId: (id: string | null) => void 
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number, startY: number, ox: number, oy: number } | null>(null);
  const resize = useRef<{ startX: number, startY: number, ow: number, oh: number } | null>(null);
  const isEditing = editingId === el.id;

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.resize || isFotolito || isEditing) return;
    e.preventDefault(); e.stopPropagation();
    onSelect(el.id);
    drag.current = { startX: e.clientX/zoom, startY: e.clientY/zoom, ox: el.x, oy: el.y };
    const move = (ev: MouseEvent) => {
      if (!drag.current) return;
      onUpdate(el.id, { x: drag.current.ox + (ev.clientX/zoom - drag.current.startX), y: drag.current.oy + (ev.clientY/zoom - drag.current.startY) }, false);
    };
    const up = () => { drag.current = null; onPushHistory(); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };

  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFotolito) return;
    e.preventDefault(); e.stopPropagation();
    resize.current = { startX: e.clientX/zoom, startY: e.clientY/zoom, ow: el.w, oh: el.h };
    const move = (ev: MouseEvent) => {
      if (!resize.current) return;
      const dw = ev.clientX/zoom - resize.current.startX;
      const dh = ev.clientY/zoom - resize.current.startY;
      const newW = Math.max(20, resize.current.ow+dw);
      const newH = Math.max(20, resize.current.oh+dh);
      onUpdate(el.id, { w: newW, h: newH }, false);
    };
    const up = () => { resize.current = null; onPushHistory(); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
  };

  const displayColor = isFotolito && el.type !== 'image' ? '#000000' : el.color;
  const strokeColor = isFotolito ? '#000000' : (el.strokeColor || 'transparent');

  return (
    <div ref={ref} style={{
        position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h,
        opacity: el.opacity ?? 1, cursor: (isFotolito || isEditing) ? "default" : "move", userSelect: "none",
        outline: selected && !isFotolito ? "2px solid #6366f1" : "none", outlineOffset: selected ? 2 : 0, zIndex: selected ? 50 : 10,
      }} onMouseDown={startDrag}>
      
      {el.type === "text" && (
        <div 
          onDoubleClick={() => { if(!isFotolito) setEditingId(el.id); }} 
          style={{ width:"100%", height:"100%" }}
        >
          {isEditing ? (
            <textarea
              autoFocus
              value={el.content}
              onChange={(e) => onUpdate(el.id, { content: e.target.value }, false)}
              onBlur={() => { setEditingId(null); onPushHistory(); }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: "100%", height: "100%", background: "rgba(255,255,255,0.8)", border: "none",
                outline: "none", resize: "none", color: displayColor, fontSize: el.fontSize,
                fontFamily: el.fontFamily, fontWeight: el.fontWeight || "800", fontStyle: el.fontStyle || 'normal',
                textDecoration: el.textDecoration || 'none', textTransform: el.textTransform || 'none',
                letterSpacing: `${el.letterSpacing || 0}px`, lineHeight: el.lineHeight || 1.2,
                textUnderlineOffset: `${el.underlineOffset || 0}px`,
                textAlign: el.textAlign || "center", overflow: "hidden", padding: 0, margin: 0,
                WebkitTextStroke: el.strokeWidth ? `${el.strokeWidth}px ${strokeColor}` : undefined
              }}
            />
          ) : (el.curve && el.curve !== 0) ? (
            <svg width="100%" height="100%" viewBox={`0 0 ${el.w} ${el.h}`} style={{overflow: 'visible'}}>
               {(() => {
                 const pathId = `curve_${el.id}`;
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
                 if (el.textAlign === "left") { textAnchor = "start"; startOffset = "0%"; }
                 if (el.textAlign === "right") { textAnchor = "end"; startOffset = "100%"; }

                 return (
                   <>
                     <path id={pathId} d={d} fill="transparent" stroke="none" />
                     <text 
                       style={{
                         fill: displayColor,
                         stroke: strokeColor,
                         strokeWidth: el.strokeWidth || 0,
                         strokeDasharray: el.strokeDasharray || 'none',
                         fontSize: `${el.fontSize}px`,
                         fontFamily: `"${el.fontFamily}", sans-serif`,
                         fontWeight: el.fontWeight || '800',
                         fontStyle: el.fontStyle || 'normal',
                         textDecoration: el.textDecoration || 'none',
                         textTransform: el.textTransform || 'none',
                         letterSpacing: `${el.letterSpacing || 0}px`
                       }}
                       textAnchor={textAnchor as any}
                     >
                       <textPath href={`#${pathId}`} startOffset={startOffset}>{el.content}</textPath>
                     </text>
                   </>
                 )
               })()}
            </svg>
          ) : (
            <div style={{ 
              width: "100%", height: "100%", color: displayColor, fontSize: el.fontSize,
              fontFamily: `"${el.fontFamily}", sans-serif`, fontWeight: el.fontWeight || "800", fontStyle: el.fontStyle || 'normal',
              textDecoration: el.textDecoration || 'none', textTransform: el.textTransform || 'none',
              letterSpacing: `${el.letterSpacing || 0}px`, lineHeight: el.lineHeight || 1.2,
              textUnderlineOffset: `${el.underlineOffset || 0}px`,
              textAlign: el.textAlign || "center", wordBreak: "break-word", whiteSpace: "pre-wrap",
              WebkitTextStroke: el.strokeWidth ? `${el.strokeWidth}px ${strokeColor}` : undefined
            }}>
              {el.content}
            </div>
          )}
        </div>
      )}
      
      {el.type === "shape" && (
        <div style={{ width:"100%", height:"100%" }} dangerouslySetInnerHTML={{ __html: require('../libs/editor-utils').SHAPES[el.content]?.(displayColor, el.w, el.h, strokeColor, el.strokeWidth, el.strokeDasharray) || "" }}/>
      )}
      
      {el.type === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={el.content} alt="" draggable={false} style={{ width:"100%", height:"100%", objectFit:"contain", display:"block", pointerEvents:"none" }}/>
      )}
      
      {selected && !isFotolito && !isEditing && (
        <div data-resize="br" onMouseDown={startResize} style={{ position:"absolute", bottom:-6, right:-6, width:14, height:14, background:"#6366f1", border:"2px solid #fff", borderRadius:"50%", cursor:"se-resize", zIndex:60, boxShadow:"0 2px 4px rgba(0,0,0,0.2)" }}/>
      )}
    </div>
  );
}
