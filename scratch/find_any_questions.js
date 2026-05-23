const fs = require('fs');
const path = require('path');

const files = ['io-form-surveys.txt', 'io-form-surveys - maker.txt'];

files.forEach(filename => {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`=== Matches in ${filename} ===`);
  lines.forEach((line, idx) => {
    const l = line.toLowerCase();
    if (l.includes('assedio') || l.includes('assédio') || l.includes('mudança') || l.includes('clareza') || l.includes('recompensa') || l.includes('suporte') || l.includes('autonomia') || l.includes('justiça') || l.includes('traumático') || l.includes('subcarga') || l.includes('sobrecarga') || l.includes('relacionamento') || l.includes('comunicação') || l.includes('remoto') || l.includes('isolado')) {
      console.log(`Line ${idx + 1}: ${line.trim().substring(0, 145)}`);
    }
  });
});
