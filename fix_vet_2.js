const fs = require('fs');
let t = fs.readFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', 'utf8');

// 1. Re-add light checkerboard
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

// Apply it to main
t = t.replace(/<main ref=\{containerRef\} className=\{\`flex-1 relative overflow-hidden bg-white/g, '<main ref={containerRef} className={`flex-1 relative overflow-hidden bg-white light-checkerboard');

// 2. Fix Header logic (only show if imageSrc) and remove title
t = t.replace(/<header className=\"h-14 bg-gray-50/g, '{imageSrc && (<header className="h-14 bg-gray-50');
t = t.replace(/<\/header>/g, '</header>)}');
// remove title from header
t = t.replace(/<span className=\"font-semibold tracking-wide text-gray-900 text-sm\">Vetorizador Pro V6<\/span>/g, '');
// there's a {imageSrc && ( around the zoom controls, we can leave it or remove it since header is already conditionally rendered, but it's fine to leave it.

// 3. Fix contrast for layers
// button "Inteira"
t = t.replace(/bg-gray-100 text-white/g, 'bg-indigo-500 hover:bg-indigo-600 text-white');
// Selected layer text-white font-bold
t = t.replace(/text-white font-bold/g, 'text-indigo-600 font-bold');

// 4. Fix Compare UX slider jitter
t = t.replace(/<div className=\"w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-500 pointer-events-auto cursor-ew-resize\">/g, '<div onMouseDown={(e)=>e.stopPropagation()} onMouseMove={(e)=>e.stopPropagation()} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center shadow-lg border-2 border-indigo-500 pointer-events-auto cursor-ew-resize">');

// 5. Add onError to Cloudinary image to fallback or alert
t = t.replace(/<img src=\{layer\.svgUrl\} className=\"w-full h-full object-contain drop-shadow-xl\" \/>/g, '<img src={layer.svgUrl} className="w-full h-full object-contain drop-shadow-xl" onError={() => setGlobalError("Falha ao carregar vetor do Cloudinary. O add-on \'Vectorize\' está ativo na sua conta?")} />');

fs.writeFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', t);
console.log("Fixes applied");
