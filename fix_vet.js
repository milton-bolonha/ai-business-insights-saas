const fs = require('fs');
let t = fs.readFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', 'utf8');

// 1. Fix colors
t = t.replace(/text-zinc-100/g, 'text-gray-900')
     .replace(/border-zinc-500/g, 'border-gray-300')
     .replace(/bg-zinc-500/g, 'bg-gray-300')
     .replace(/text-zinc-700/g, 'text-gray-300')
     .replace(/border-zinc-950/g, 'border-gray-100');

// 2. Fix checkerboard
t = t.replace(/#121212/g, '#e5e7eb');

// 3. Fix canvas taint (crossOrigin)
t = t.replace(/const img = new Image\(\);/g, 'const img = new Image();\n        img.crossOrigin = \'anonymous\';');

// 4. Fix split comparison slider white arrow on white bg
t = t.replace(/<ArrowLeftRight size=\{14\} className=\"text-white pointer-events-none\" \/>/g, '<ArrowLeftRight size={14} className=\"text-violet-500 pointer-events-none\" />');

// 5. Fix container collapsing height
t = t.replace(/<div className=\"flex flex-col h-full rounded-xl/g, '<div className=\"flex flex-col h-full min-h-[700px] rounded-xl');

// 6. Add missing togglePaletteSelection
t = t.replace(/updateSingleColor = \(id, newHex\) => \{[\s\S]*?setPalette\([\s\S]*?\);\n  \};/g, match => match + '\n\n  const togglePaletteSelection = (id) => {\n      setSelectedPaletteIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);\n  };\n');

// 7. Add explicit upload button
const uploadBtnStr = `{!imageSrc && (
             <label className="flex items-center gap-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-md shadow-violet-500/20">
                <Upload size={14} /> Começar Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && loadFile(e.target.files[0])} />
             </label>
           )}
           {!imageSrc && (
             <div className="absolute inset-0`;
t = t.replace(/\{\!imageSrc && \(\n             <div className=\"absolute inset-0/, uploadBtnStr);

fs.writeFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', t);
console.log("Done.");
