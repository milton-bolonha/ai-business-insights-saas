const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'io-form-surveys.txt');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

const start = 955;
const end = 1070;

for (let i = start; i <= end; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
