const fs = require('fs');
const path = require('path');

const files = ['io-form-surveys.txt', 'io-form-surveys - maker.txt'];

files.forEach(filename => {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  console.log(`=== Inspecting ${filename} ===`);
  
  // Find all matches for templates or questions arrays
  const regex = /const\s+INITIAL_TEMPLATE\s*=\s*{[\s\S]*?};/g;
  const match = content.match(regex);
  if (match) {
    console.log(`Found INITIAL_TEMPLATE in ${filename}:`);
    console.log(match[0].substring(0, 800));
  } else {
    console.log(`INITIAL_TEMPLATE not found in ${filename}`);
  }
});
