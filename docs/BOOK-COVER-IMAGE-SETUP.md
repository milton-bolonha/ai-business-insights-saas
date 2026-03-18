# Book Cover & Image Generation System - Setup Summary

## 🎯 Overview

Um sistema completo para geração de capas e imagens internas de livros romance com IA, incluindo:

- Capa profissional com frente, verso e lombada
- Imagens internas por capítulo (1, 2 ou 3)
- Sistema inteligente de custos em créditos
- Especificações de impressão precisas

---

## 📦 O Que Foi Implementado

### 1. ✅ Interface de Criação de Livro (BookLibrarySection.tsx)

**Adicionadas 2 novas opções no formulário:**

```
┌─────────────────────────────────────────┐
│ Image Generation (100 cr por imagem)    │
├─────────────────────────────────────────┤
│ ☐ Generate Book Cover                   │
│   AI-generated professional cover       │
│   (100 credits)                         │
│                                         │
│ Internal Chapter Images                 │
│ ┌─────┬─────┬─────┬─────┐             │
│ │None │ 1   │ 2   │ 3   │             │
│ │(0cr)│(100)│(200)│(300)│             │
│ └─────┴─────┴─────┴─────┘             │
└─────────────────────────────────────────┘
```

**Campos de estado adicionados:**

```typescript
generateCover: false; // Default: OFF
internalImagesCount: "none"; // Options: "none" | "1" | "2" | "3"
```

### 2. ✅ Template de Capa Profissional (BookCoverDocument.tsx)

**Dimensões finais:**

- Tamanho total: 12.62 × 9.25 polegadas (908.88 × 666.047 pontos)
- Layout: Verso (36%) + Lombada (8%) + Capa (56%)

**Cada seção:**

- **Capa (Frente)**: Imagem + Título + Autor
- **Lombada**: Título abreviado (largura variável)
- **Verso**: Título + Descrição + Autor + ISBN

**Cálculo automático da lombada:**

- 25 páginas: ~1.43mm
- 75 páginas: ~4.29mm
- 120 páginas: ~6.86mm

### 3. ✅ Serviço de Geração de Imagens (bookImageService.ts)

**Funções principais:**

```typescript
// Calcula custos totais
calculateImageCosts(options, totalChapters)
→ { coverCost, imagesCostPerChapter, totalCost }

// Formata exibição de custos
formatCostBreakdown(breakdown) → string

// Gera prompts para IA
generateCoverPrompt(context) → string
generateChapterImagePrompt(context, position) → string

// Planeja ordem de geração
generateImageSchedule(chapters, options, context) → schedule
```

### 4. ✅ Documentação Técnica

- **BOOK-IMAGES-SYSTEM.md** - Sistema completo com especificações
- **BOOK-IMAGES-IMPLEMENTATION.md** - Guia de integração

---

## 💰 Estrutura de Custos

### Preços por Item

| Item               | Custo        |
| ------------------ | ------------ |
| Capa do livro      | 100 créditos |
| Imagem de capítulo | 100 créditos |

### Exemplos de Custo

**Livro de 5 capítulos (75 páginas):**

```
Apenas capa:
  Capa: 100 cr
  Total: 100 cr

Capa + 1 imagem por capítulo:
  Capa: 100 cr
  Imagens: 100 cr × 5 = 500 cr
  Total: 600 cr

Capa + 3 imagens por capítulo:
  Capa: 100 cr
  Imagens: 300 cr × 5 = 1.500 cr
  Total: 1.600 cr
```

---

## 🎨 Estratégia de Posicionamento de Imagens

### 1 Imagem por Capítulo

Meio do capítulo (cena climática)

### 2 Imagens por Capítulo

- Início (abertura, apresentação)
- Fim (resolução, cliffhanger)

### 3 Imagens por Capítulo

- Início (apresentação)
- Meio (ponto de virada)
- Fim (conclusão/impacto)

---

## 📋 Fluxo de Implementação

### Próximas Etapas

1. **API de Geração**

   ```
   POST /api/workspace/books/generate-images
   Body: { bookId, options }
   ```

2. **Validação de Créditos**
   - Verificar saldo antes de gerar
   - Mostrar modal de upgrade se insuficiente

3. **Fila de Geração**
   - Queue async para DALL-E ou provider de IA
   - Rastreamento de status
   - Callbacks para completar

4. **Armazenamento de Imagens**
   - Nova coleção `BookImage` no MongoDB
   - URLs das imagens geradas
   - Metadados de geração

5. **Integração no PDF**
   - Inserir imagens nos pontos corretos
   - Otimizar dimensões para print
   - Suportar múltiplas imagens por capítulo

---

## 📐 Especificações Técnicas

### Capa Completa (Total)

- Largura: 318.01mm - 312.58mm (varia com lombada)
- Altura: 234.95mm
- Sangria: 3.17mm (todas as bordas)
- Margem: 3.17mm (zona segura)

### Frente/Verso (cada um)

- Largura: 152.4mm
- Altura: 228.6mm
- Tamanho do livro: 6 × 9 polegadas

### Lombada (varia conforme número de páginas)

**25 páginas:**

- Largura: 1.43mm
- Altura: 228.6mm

**75 páginas:**

- Largura: 4.29mm
- Altura: 228.6mm

**120 páginas:**

- Largura: 6.86mm
- Altura: 228.6mm

### Código de Barras

- Área de segurança: 6.35mm
- Posição: Verso inferior

---

## 📁 Arquivos Modificados/Criados

```
MODIFICADOS:
├── src/components/love-writers/BookLibrarySection.tsx
│   └── Adicionadas opções de imagem no formulário
├── src/components/love-writers/BookPDFDocument.tsx
│   └── Atualizado para 6×9 polegadas
└── implementation_plan.md
    └── Atualizado com novas tarefas

CRIADOS:
├── src/components/love-writers/BookCoverDocument.tsx
│   └── Template profissional de capa
├── src/lib/services/bookImageService.ts
│   └── Lógica de custos e geração
├── docs/BOOK-IMAGES-SYSTEM.md
│   └── Documentação do sistema
├── docs/BOOK-IMAGES-IMPLEMENTATION.md
│   └── Guia de integração
└── docs/BOOK-COVER-IMAGE-SETUP.md (este arquivo)
```

---

## 🔄 Estado Atual do Projeto

✅ **Pronto para:**

- [ ] Integração com API de geração de imagens (DALL-E, etc.)
- [ ] Implementação de fila de geração async
- [ ] Integração com sistema de créditos
- [ ] Testes de geração de PDF
- [ ] Interface de preview de imagens

---

## 🎯 Fluxo do Usuário

1. **Abre formulário de criar livro**
   - Preenche dados básicos
   - Seleciona número de páginas (25/75/120)

2. **Novo: Seleciona opções de imagens**
   - ☐ Gerar capa (opcional)
   - Seleciona quantas imagens por capítulo (1/2/3 ou nenhuma)

3. **Vê custo total**
   - Capa: 100 cr
   - Imagens: X cr × N capítulos = Total
   - **Custo total exibido**

4. **Valida créditos**
   - Se tem créditos: Continua
   - Se falta: Oferece upgrade

5. **Publica livro**
   - Livro criado
   - Geração de texto inicia
   - Fila de imagens inicia em background

6. **Imagens aparecem**
   - Conforme forem geradas
   - Inseridas no PDF
   - Usuário pode ver progresso

---

## 🚀 Como Testar

```bash
# 1. Fazer build
npm run build

# 2. Verificar erros
npm run lint

# 3. Testar criação de livro com imagens
# - Abrir formulário
# - Selecionar "Generate Cover"
# - Selecionar "2" imagens por capítulo
# - Ver custo calculado corretamente
```

---

## 📞 Suporte

Para dúvidas sobre:

- **Sistema de custos**: Ver `bookImageService.ts`
- **Layout de capa**: Ver `BookCoverDocument.tsx`
- **Especificações**: Ver `BOOK-IMAGES-SYSTEM.md`
- **Integração**: Ver `BOOK-IMAGES-IMPLEMENTATION.md`
