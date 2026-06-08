const fs = require('fs');
let t = fs.readFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', 'utf8');

// 1. Fix "Gerar Vetor Definitivo" contrast (it was accidentally changed to text-indigo-600)
t = t.replace(/text-indigo-600 font-bold text-sm rounded-lg shadow-lg/g, 'text-white font-bold text-sm rounded-lg shadow-lg');

// 2. Add togglePaletteSelection if missing
if (!t.includes('const togglePaletteSelection =')) {
    t = t.replace(/const updateSingleColor = [^\}]+};\s*/, match => match + '\n  const togglePaletteSelection = (id) => {\n      setSelectedPaletteIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);\n  };\n\n');
}

// 3. Update Cloudinary upload folder and Vectorize parameters
t = t.replace(/const url = await uploadToCloudinary\(file, "os-system\/vetorize"\);/g, `const now = new Date();
        const folder = \`workspace/\${now.getFullYear()}/\${String(now.getMonth() + 1).padStart(2, '0')}/apps/vetorize\`;
        const url = await uploadToCloudinary(file, folder);`);

t = t.replace(/let vectorizedUrl = '';\s*if \(extMatch\) {/g, `let vectorizedUrl = '';
        const d = (layerObject.settings.detail / 100).toFixed(1);
        const params = \`colors:\${layerObject.settings.colors}:detail:\${d}:despeckle:\${layerObject.settings.despeckle}\`;
        if (extMatch) {`);

t = t.replace(/\/upload\/e_vectorize\/'/g, '/upload/e_vectorize:\' + params + \'/');

// 4. "o arrastar pra comparar tá horrível !"
// Previously I added stopPropagation, let's also remove `pointer-events-auto` from the wrapper and make sure the slider is smooth.
// Actually, I'll just change the wrapper to only capture slider events.
t = t.replace(/<div onMouseDown=\{\(e\)=>e\.stopPropagation\(\)\} onMouseMove=\{\(e\)=>e\.stopPropagation\(\)\} className=\"w-8 h-8 bg-gray-50/g, '<div onMouseDown={(e)=>{e.stopPropagation();}} className="w-8 h-8 bg-white');

fs.writeFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', t);
console.log("Fixes applied");
