const fs = require("fs");
const path = require("path");

const enPath = path.join(__dirname, "../messages/en.json");
const ptPath = path.join(__dirname, "../messages/pt.json");

function updateJson(filePath, newKeys) {
  let data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  Object.assign(data.admin.aiBlog, newKeys);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

updateJson(enPath, {
  "automatedOperations": "Automated Operations",
  "automatedOperationsDesc": "Use the AI Engine to generate entire semantic clusters of content automatically.",
  "searchPosts": "Search posts..."
});

updateJson(ptPath, {
  "automatedOperations": "Operações Automatizadas",
  "automatedOperationsDesc": "Use o motor de IA para gerar clusters semânticos inteiros de conteúdo automaticamente.",
  "searchPosts": "Pesquisar posts..."
});
