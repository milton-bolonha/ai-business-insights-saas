const fs = require('fs');
let t = fs.readFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', 'utf8');
const lines = t.split('\n');
const newLines = lines.filter(line => !line.includes('background-image: linear-gradient') && !line.includes('<style dangerouslySetInnerHTML=') && !line.includes('`}} />'));
fs.writeFileSync('src/modules/os-system/components/VetorizeStudioPro.tsx', newLines.join('\n'));
console.log('Removed bad css');
