const fs = require('fs');
let t = fs.readFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', 'utf8');

// 1. togglePaletteSelection insertion (Fixing the regex and carriage returns)
if (!t.includes('const togglePaletteSelection =')) {
    t = t.replace(/const updateSingleColor = \([\s\S]*?\};/g, match => match + '\n\n  const togglePaletteSelection = (id) => {\n      setSelectedPaletteIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);\n  };\n');
}

// 2. Fix height
t = t.replace(/<div className=\"flex flex-col h-full min-h-\[700px\] bg-white/g, '<div className="flex flex-col h-full bg-white');

// 3. Fix Figma Background
// Figma background color is usually #e5e5e5. Let's apply bg-[#e5e5e5] and remove bg-white light-checkerboard
t = t.replace(/className=\{\`flex-1 relative overflow-hidden bg-white light-checkerboard/g, 'className={`flex-1 relative overflow-hidden bg-[#e5e5e5]');
t = t.replace(/className=\{\`flex-1 relative overflow-hidden bg-white/g, 'className={`flex-1 relative overflow-hidden bg-[#e5e5e5]'); // Fallback

// 4. Fix right sidebar shadow
t = t.replace(/shadow-\[-5px_0_20px_rgba\(0,0,0,0\.5\)\]/g, 'shadow-[-4px_0_15px_rgba(0,0,0,0.05)]');

// 5. Fix merge button colors for light mode
t = t.replace(/bg-indigo-600\/20 hover:bg-indigo-600\/40 border border-indigo-500\/30 rounded text-xs text-indigo-300/g, 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded text-xs text-indigo-700');

// 6. Fix remove color button colors for light mode
t = t.replace(/bg-red-900\/10 hover:bg-red-900\/30 border border-red-900\/50 text-red-400/g, 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600');

// 7. Fix the active palette circle highlight (it was using white border on white bg, now on white bg it should be indigo)
t = t.replace(/'border-white scale-110 shadow-\[0_0_10px_rgba\(255,255,255,0\.3\)\]'/g, "'border-indigo-500 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]'");

fs.writeFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', t);
console.log("Fixes part 4 applied");
