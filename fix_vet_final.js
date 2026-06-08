const fs = require('fs');
let t = fs.readFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', 'utf8');

// 1. Swap dark theme classes for light theme classes comprehensively
t = t.replace(/bg-zinc-950/g, 'bg-white')
     .replace(/bg-zinc-900/g, 'bg-gray-50')
     .replace(/bg-zinc-800/g, 'bg-gray-100')
     .replace(/bg-zinc-700/g, 'bg-gray-200');

t = t.replace(/text-zinc-50/g, 'text-gray-900')
     .replace(/text-zinc-100/g, 'text-gray-900')
     .replace(/text-zinc-200/g, 'text-gray-800')
     .replace(/text-zinc-300/g, 'text-gray-700')
     .replace(/text-zinc-400/g, 'text-gray-500')
     .replace(/text-zinc-500/g, 'text-gray-400');

t = t.replace(/border-zinc-800/g, 'border-gray-200')
     .replace(/border-zinc-700/g, 'border-gray-300')
     .replace(/border-zinc-600/g, 'border-gray-400')
     .replace(/border-zinc-500/g, 'border-gray-300')
     .replace(/border-zinc-950/g, 'border-gray-100');

// 2. Fix the initial specific UX issues
t = t.replace(/checkerboard-bg/g, ''); 
t = t.replace(/\.checkerboard-bg \{[\s\S]*?\}/g, '');
const css = `
      <style dangerouslySetInnerHTML={{__html: \`
        .light-checkerboard { 
            background-image: linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%); 
            background-size: 20px 20px; 
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px; 
        }
      \`}} />
    </div>`;
t = t.replace(/<\/div>\s*$/i, css);
t = t.replace(/<main ref=\{containerRef\} className=\{\`flex-1 relative overflow-hidden bg-white/g, '<main ref={containerRef} className={`flex-1 relative overflow-hidden bg-white light-checkerboard');

// 3. Fix Image Canvas Taint (crossOrigin = 'anonymous')
t = t.replace(/const img = new Image\(\);/g, 'const img = new Image();\n        img.crossOrigin = \'anonymous\';');

// 4. Header logic
t = t.replace(/<header className=\"h-14 bg-gray-50/g, '{imageSrc && (<header className="h-14 bg-gray-50');
t = t.replace(/<\/header>/g, '</header>)}');
t = t.replace(/<span className=\"font-semibold tracking-wide text-gray-900 text-sm\">Vetorizador Pro V6<\/span>/g, '');

// 5. Container collapse
t = t.replace(/<div className=\"flex flex-col h-screen bg-white/g, '<div className="flex flex-col h-full min-h-[700px] bg-white');

// 6. Fix Compare UX slider jitter
t = t.replace(/<div className=\"w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-500 pointer-events-auto cursor-ew-resize\">/g, '<div onMouseDown={(e)=>{e.stopPropagation();}} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-500 pointer-events-auto cursor-ew-resize">');

// 7. Add togglePaletteSelection (insert after updateSingleColor)
t = t.replace(/updateSingleColor = \(id, newHex\) => \{[\s\S]*?setPalette\([\s\S]*?\);\n  \};/g, match => match + '\n\n  const togglePaletteSelection = (id) => {\n      setSelectedPaletteIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);\n  };\n');

// 8. Fix "Inteira" button contrast
t = t.replace(/bg-gray-100 text-white/g, 'bg-indigo-500 hover:bg-indigo-600 text-white');

// 9. Selected Layer font color (was text-white font-bold when selected, invisible on bg-white)
t = t.replace(/\? 'text-white font-bold' :/g, '? \'text-indigo-600 font-bold\' :');

// 10. Cloudinary Vectorize URL and Args
t = t.replace(/const url = await uploadToCloudinary\(file, "os-system\/vetorize"\);/g, `const now = new Date();
        const folder = \`workspace/\${now.getFullYear()}/\${String(now.getMonth() + 1).padStart(2, '0')}/apps/vetorize\`;
        const url = await uploadToCloudinary(file, folder);`);

t = t.replace(/let vectorizedUrl = '';\s*if \(extMatch\) {/g, `let vectorizedUrl = '';
        const d = (layerObject.settings.detail / 100).toFixed(1);
        const params = \`colors:\${layerObject.settings.colors}:detail:\${d}:despeckle:\${layerObject.settings.despeckle}\`;
        if (extMatch) {`);

t = t.replace(/vectorizedUrl = parts\[0\] \+ '\/upload\/e_vectorize\/' \+ parts\[1\]\.replace\(extMatch\[0\], '\.svg'\);/g, `vectorizedUrl = parts[0] + '/upload/e_vectorize:' + params + '/' + parts[1].replace(extMatch[0], '.svg');`);
t = t.replace(/vectorizedUrl = parts\[0\] \+ '\/upload\/e_vectorize\/' \+ parts\[1\] \+ '\.svg';/g, `vectorizedUrl = parts[0] + '/upload/e_vectorize:' + params + '/' + parts[1] + '.svg';`);

// 11. Add onError to SVG rendering
t = t.replace(/<img src=\{layer\.svgUrl\} className=\"w-full h-full object-contain drop-shadow-xl\" \/>/g, '<img src={layer.svgUrl} className="w-full h-full object-contain drop-shadow-xl" onError={() => setGlobalError("Falha ao carregar vetor do Cloudinary. O add-on \'Vectorize\' está ativo na sua conta?")} />');

fs.writeFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', t);
console.log("Fixes applied");
