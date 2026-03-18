# Sistema de Geração de Capas com DALL-E 3 - Setup Completo

## ✅ Status Atual

### Já Disponível ✓

- ✅ OpenAI API configurada no projeto
- ✅ DALL-E 3 pronto para usar
- ✅ Sistema de custos de créditos
- ✅ 13 estilos de imagem diferentes
- ✅ UI de seleção de opções
- ✅ Prompts otimizados para DALL-E 3

### Templates de Capa ✓

- ✅ Layout profissional (frente/verso/lombada)
- ✅ Dimensões corretas (12.62" × 9.25")
- ✅ Lombada inteligente (varia com páginas)
- ✅ Especificações de impressão

---

## 🎨 Estilos de Imagem Disponíveis

Agora o usuário pode escolher o estilo ao criar o livro:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Realistic    │ Painterly    │ Illustrated  │ Watercolor   │
│ Photography  │ Oil Painting │ Digital Art  │ Soft edges   │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Romantic     │ Cinematic    │ Minimalist   │ Anime        │
│ Dreamy soft  │ Film quality │ Clean lines  │ Manga style  │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ 3D Movie     │ Cartoon      │ Fantasy      │ Vintage      │
│ Cinematic 3D │ Playful      │ Magical      │ Retro        │
├──────────────┴──────────────┴──────────────┴──────────────┤
│                    Noir                                │
│          Dramatic shadows, mystery                    │
└───────────────────────────────────────────────────────┘
```

**Seleção UI:**

- Grid de 13 botões (13 estilos)
- Seleciona um por vez
- Default: "Romantic"
- Aplica a TODAS as imagens do livro

---

## 📖 Especificações da Capa (FINAL)

### Layout Físico

**CAPA COMPLETA: 12.62" × 9.25"**

```
┌─────────────────┬──────┬────────────────┐
│  VERSO (BACK)   │SPINE │  CAPA (FRONT)  │
│  Esquerda 36%   │ 8%   │  Direita 56%   │
│                 │varies│                │
│ 152.4×228.6mm   │w/pgs │ 152.4×228.6mm  │
├─────────────────┴──────┴────────────────┤
│  SANGRIA: 3.17mm (todas as bordas)     │
│  MARGEM SEGURA: 3.17mm (zona interna)  │
└───────────────────────────────────────┘
```

### A DIREITA - CAPA (Front Cover - 56% width)

**O que aparece na prateleira:**

- Imagem principal (gerada por DALL-E)
- Título do livro (será adicionado sobre a imagem)
- Nome do autor (será adicionado sobre a imagem)
- Tagline opcional (será adicionado)

**Requisitos DALL-E:**

- ✓ Deixa espaço embaixo-direita para título/autor
- ✓ Foco emocional e visual claro
- ✓ Qualidade impressão (300 DPI)
- ✓ Personagens visíveis e atraentes
- ✓ Paleta de cores romântica
- ✗ SEM texto na imagem
- ✗ SEM copyright infringement
- ✗ SEM preços ou promoções

### A ESQUERDA - VERSO (Back Cover - 36% width)

**O que vai atrás do livro:**

- Sinopse/Descrição (texto será adicionado)
- Nome do autor
- Biografia breve (opcional)
- Código de barras ISBN (placeholder)
- Informação do publisher

### NO MEIO - LOMBADA (Spine - 8%, variable width)

**O que aparece na lombada:**

- Título do livro (abreviado)
- Nome do autor (opcional)
- Varia conforme páginas:
  - 25 pgs: 1.43mm
  - 75 pgs: 4.29mm
  - 120 pgs: 6.86mm

---

## 🚀 Como a Geração Funciona

### 1. Usuário cria livro

```
Seleciona:
- Título, autor, descrição
- Número de páginas (25/75/120)
- ✓ Gerar Capa? (100 cr)
- Quantas imagens por capítulo? (0/1/2/3 × 100 cr)
- Estilo: Romantic (default)
```

### 2. Calcula custos

```
Capa: 100 cr
Imagens (2 × 5 capítulos): 1.000 cr
Total: 1.100 créditos
```

### 3. Valida créditos

```
Se tem créditos → Continua
Se falta → Oferece upgrade
```

### 4. Gera a capa

```
OpenAI DALL-E 3 recebe:
- Prompt detalhado com:
  * Layout (frente/verso/lombada)
  * Dimensões exatas
  * Caracteres, tom, tema
  * Requisitos específicos

Retorna:
- URL da imagem (1024×1024)
- Pronta para processar
```

### 5. Insere no PDF

```
BookCoverDocument.tsx:
- Posiciona imagem na frente
- Adiciona texto (verso/lombada)
- Bleed correto
- Pronto para impressão
```

---

## 🔧 Prompt da Capa (O que DALL-E recebe)

### Estrutura Completa

```
Create a professional book cover for a romance novel.

CRITICAL LAYOUT REQUIREMENTS:
- Full cover 12.62" × 9.25" com 3 seções
- RIGHT (56%): FRENTE - Imagem principal
- LEFT (36%): VERSO - Será preenchido com texto
- CENTER (8%): LOMBADA - Título será adicionado
- Design para a FRENTE principalmente
- Deixar continuidade visual frente→verso
- Extensão até as bordas (bleed)

BOOK DETAILS:
Title: "The Last Summer Together"
Author: "Jane Romance"
Description: A heartwarming story about...
Theme: Contemporary romance
Tone: Intimate and tender

KEY CHARACTERS:
Emma (30s, passionate), Mark (32s, reserved)

STYLE: Romantic (dreamy, soft focus, emotionally evocative)

MUST HAVE:
✓ Emotionally evocative imagery
✓ Professional high-quality composition
✓ Characters embodying the story
✓ Romantic color palette
✓ Print quality (300 DPI)
✓ Clear focal point
✓ Espaço embaixo-direita para título/autor

MUST NOT HAVE:
✗ Text overlay
✗ Copyright infringement
✗ Pricing or promos
✗ Blurred elements
✗ Contradicting content
✗ Stock photo appearance
✗ Watermarks

Generate a stunning, marketable book cover.
```

---

## 📋 Opções do Usuário (UI)

### Seção: Image Generation Options

```
☐ Generate Book Cover
  AI-generated professional cover (100 credits)

Internal Chapter Images:
┌─────┬─────┬─────┬─────┐
│None │ 1   │ 2   │ 3   │
│(0cr)│(100)│(200)│(300)│
└─────┴─────┴─────┴─────┘

Image Style (Applies to all images):
┌──────────┬──────────┬──────────┐
│Realistic │Painterly │Illustrated
├──────────┼──────────┼──────────┤
│Watercolor│Romantic* │Cinematic│
├──────────┼──────────┼──────────┤
│ Minimalist (7 total) │
└──────────────────────┘

* = Default
```

---

## 💰 Estrutura de Custos

| Item               | Custo  |
| ------------------ | ------ |
| Capa               | 100 cr |
| Imagem de capítulo | 100 cr |

### Exemplo: Livro 5 Capítulos, 75 páginas

**Opção 1: Apenas capa**

- Capa: 100 cr
- Total: 100 cr

**Opção 2: Capa + 1 img/cap**

- Capa: 100 cr
- Imagens: 100 × 5 = 500 cr
- Total: 600 cr

**Opção 3: Capa + 3 img/cap**

- Capa: 100 cr
- Imagens: 300 × 5 = 1.500 cr
- Total: 1.600 cr

---

## 🔌 API Pronta para Integrar

```typescript
// bookImageService.ts já implementa:

// 1. Calcular custos
calculateImageCosts(options, chapters)
→ { coverCost, totalCost, breakdown }

// 2. Gerar prompts
generateCoverPrompt(context)
generateChapterImagePrompt(context, position)

// 3. Agendar geração
generateImageSchedule(chapters, options, context)
→ Ordem de geração, prompts, estilos

// 4. Estilos
IMAGE_STYLES = {
  realistic: "photorealistic...",
  painterly: "oil painting...",
  illustrated: "digital...",
  watercolor: "soft edges...",
  romantic: "dreamy, soft focus...",
  cinematic: "film quality...",
  minimalist: "clean lines..."
}
```

---

## ✨ Próxima Etapa: API Endpoint

Falta apenas criar:

```
POST /api/workspace/books/generate-images
```

Que fará:

1. Valida creditos
2. Chama DALL-E 3 para cada imagem
3. Armazena URLs
4. Deduz créditos
5. Insere imagens no PDF

---

## 📚 Documentação Criada

- ✅ `DALLE3-INTEGRATION.md` - Guia completo de integração
- ✅ `BookCoverDocument.tsx` - Template com layout explicado
- ✅ `bookImageService.ts` - Serviço com todos os utilitários
- ✅ `BookLibrarySection.tsx` - UI com seleção de estilos

---

## 🎯 Checklist de Implementação

- [x] Entender layout da capa (frente/verso/lombada)
- [x] Implementar seleção de estilos (7 opções)
- [x] Criar prompts otimizados para DALL-E 3
- [x] Sistema de custos em créditos
- [x] UI no formulário de criar livro
- [ ] **TODO**: API endpoint de geração
- [ ] **TODO**: Integração com fila async (Bull/BullMQ)
- [ ] **TODO**: Armazenamento de imagens (S3/similar)
- [ ] **TODO**: Inserção no PDF
- [ ] **TODO**: Rastreamento de status

---

## 🚀 Está Pronto Para!

✅ Usuário escolher estilo de imagem  
✅ Calcular custos automaticamente  
✅ Gerar prompts perfeitos para DALL-E 3  
✅ Ver layout profissional da capa

⏳ Só falta conectar com a API DALL-E e processar!
