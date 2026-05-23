const fs = require('fs');
const path = require('path');

const files = ['io-form-surveys.txt', 'io-form-surveys - maker.txt'];
const terms = ['assedio', 'assédio', 'mudanças', 'recompensas', 'suporte', 'autonomia', 'justiça', 'violentos', 'subcarga', 'sobrecarga', 'relacionamentos', 'comunicação', 'remoto'];

files.forEach(filename => {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`=== Matches in ${filename} ===`);
  terms.forEach(term => {
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        console.log(`[${term}] Line ${idx + 1}: ${line.trim().substring(0, 140)}`);
      }
    });
  });
});
