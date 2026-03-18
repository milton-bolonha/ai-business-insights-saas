# 🎨 Arquitetura Completa - Sistema de Capa Personalizada

## 📐 Visão Geral de Componentes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND - UI LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BookLibrarySection.tsx                                                │
│  ├─ formData.generateCover: boolean                                    │
│  ├─ formData.internalImagesCount: "0"|"1"|"2"|"3"                      │
│  ├─ formData.imageStyle: ImageStyle (7 opções)                         │
│  │                                                                      │
│  ├─ Input: Recebe dados do dashboard (currentDashboard)                │
│  │   ├─ contacts (personagens)                                         │
│  │   ├─ notes (contexto)                                               │
│  │   └─ tiles (setting)                                                │
│  │                                                                      │
│  ├─ Quando criar livro:                                                │
│  │   └─ Chama: calculateImageCosts()                                   │
│  │       Retorna: Cost breakdown para exibir                           │
│  │                                                                      │
│  └─ Quando gerar imagens (TODO - próximo):                             │
│      └─ Chamará: POST /api/workspace/books/generate-images             │
│          Com: context, options                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│               SERVICE LAYER - BUSINESS LOGIC                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  bookImageService.ts                                                   │
│  │                                                                      │
│  ├─ buildImagePromptContext(data) ← ⭐ NOVO                            │
│  │  ├─ Input: contacts, notes, tiles do dashboard                      │
│  │  ├─ Extrai: personagens, características, mood, setting             │
│  │  └─ Output: ImagePromptContext RICH (tudo preenchido)               │
│  │                                                                      │
│  ├─ generateCoverPrompt(context)                                       │
│  │  ├─ Input: ImagePromptContext personalizado                         │
│  │  ├─ Constrói: Prompt ESPECÍFICO com personagens                     │
│  │  │            (nome, idade, aparência, personalidade)               │
│  │  │            Contexto (relating, setting, mood)                    │
│  │  │            Requisitos (layout, print, quality)                   │
│  │  └─ Output: String pronta para DALL-E 3                             │
│  │                                                                      │
│  ├─ generateChapterImagePrompt(context, position)                      │
│  │  ├─ Input: Mesmo context, mas posição no capítulo                   │
│  │  ├─ Adapta: Prompt para beginning/middle/end                        │
│  │  └─ Output: Prompt específico do momento                            │
│  │                                                                      │
│  ├─ calculateImageCosts(options, chapters)                             │
│  │  ├─ Input: Opções do usuário (gerar capa? quantas imgs?)            │
│  │  ├─ Calcula: 100 créditos por imagem                                │
│  │  └─ Output: Breakdown de custos                                     │
│  │                                                                      │
│  ├─ generateImageSchedule(chapters, options, context)                  │
│  │  ├─ Input: Número de capítulos, opções, context                     │
│  │  ├─ Planeja: Ordem de geração (capa primeiro)                       │
│  │  │          Position de cada imagem (begin/mid/end)                │
│  │  └─ Output: Schedule com prompts prontos                            │
│  │                                                                      │
│  ├─ Constantes:                                                        │
│  │  ├─ IMAGE_STYLES (7 opções com descrições)                         │
│  │  └─ COST_PER_IMAGE = 100                                           │
│  │                                                                      │
│  └─ Interfaces:                                                        │
│     ├─ CharacterDetail (nome, idade, física, personalidade)            │
│     ├─ ImagePromptContext (tudo que DALL-E precisa)                    │
│     ├─ ImageGenerationOptions (user choices)                           │
│     └─ BookImage (metadata da imagem)                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              API LAYER - BACKEND ENDPOINT (TODO)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  POST /api/workspace/books/generate-images                             │
│  │                                                                      │
│  ├─ Recebe:                                                            │
│  │  ├─ bookId: string                                                  │
│  │  ├─ context: ImagePromptContext (do frontend)                       │
│  │  └─ options: ImageGenerationOptions                                 │
│  │                                                                      │
│  ├─ Valida:                                                            │
│  │  ├─ User auth                                                       │
│  │  ├─ User owns workspace                                             │
│  │  ├─ User owns book                                                  │
│  │  └─ User has enough credits                                         │
│  │                                                                      │
│  ├─ Deduz:                                                             │
│  │  └─ Credits do user                                                 │
│  │                                                                      │
│  ├─ Cria Job:                                                          │
│  │  └─ Coloca na fila: imageGenerationQueue.add()                      │
│  │                                                                      │
│  └─ Retorna:                                                           │
│     ├─ job_id: string                                                  │
│     ├─ images_count: number                                            │
│     └─ estimated_time: Date                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│             BACKGROUND JOB PROCESSOR (TODO)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  imageGenerationQueue.process()                                        │
│  │                                                                      │
│  ├─ Para cada imagem na schedule:                                      │
│  │  │                                                                   │
│  │  ├─ Chama: OpenAI DALL-E 3 API                                      │
│  │  │  ├─ Envio: Prompt personalizado                                  │
│  │  │  └─ Recebe: URL da imagem 1024×1024                              │
│  │  │                                                                   │
│  │  ├─ Salva imagem:                                                   │
│  │  │  ├─ No storage (S3/Cloudinary/Vercel Blob)                       │
│  │  │  └─ URL armazenada                                               │
│  │  │                                                                   │
│  │  └─ Grava no banco:                                                 │
│  │     ├─ Collection: book_images                                      │
│  │     ├─ Campos: url, prompt, style, type, position                   │
│  │     └─ Links: bookId                                                │
│  │                                                                      │
│  └─ Retorna: {success, imageCount}                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              PDF GENERATION - INTEGRATION                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BookCoverDocument.tsx (Capa)                                          │
│  ├─ Props: coverImageUrl (da BookImage collection)                     │
│  ├─ Layout: Frente (56%) + Verso (36%) + Lombada (8%)                  │
│  ├─ Insere: Imagem gerada na frente                                    │
│  └─ Output: PDF profissional 12.62×9.25"                               │
│                                                                         │
│  BookPDFDocument.tsx (Conteúdo interno)                                │
│  ├─ Props: chapterImages com URLs                                      │
│  ├─ Para cada capítulo: Insere imagens nos pontos certos               │
│  │  (beginning/middle/end do capítulo)                                 │
│  └─ Output: PDF interior pronto para impressão                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ LIVRO FINAL     │
                    ├─────────────────┤
                    │ ✅ Capa:        │
                    │    Emma + Mark  │
                    │    Personagens  │
                    │    Reais!       │
                    │                 │
                    │ ✅ Conteúdo:    │
                    │    Escrito por  │
                    │    AI           │
                    │                 │
                    │ ✅ Imagens:     │
                    │    Nos capít    │
                    │    Consistente  │
                    │                 │
                    │ ✅ Qualidade:   │
                    │    Pronto para  │
                    │    Impressão    │
                    └─────────────────┘
```

---

## 🔄 Fluxo de Dados Detalhado

### 1️⃣ Dashboard → Extração

```
Dashboard (currentDashboard)
│
├─ contacts: Array[Contact]
│  ├─ Contact { name: "Emma", notes: "age:28, auburn hair..." }
│  └─ Contact { name: "Mark", notes: "age:30, brown eyes..." }
│
├─ notes: Array[Note]
│  ├─ Note { title: "Tone", content: "passionate, tender" }
│  └─ Note { content: "Emma is vulnerable, Mark is protective" }
│
└─ tiles: Array[Tile]
   ├─ Tile { name: "Setting", description: "Coastal hometown" }
   └─ Tile { name: "Theme", description: "Second chances" }

           ↓

buildImagePromptContext({
  contacts,
  notes,
  tiles,
  bookTitle,
  bookDescription,
  authorName,
  imageStyle
})

           ↓

ImagePromptContext {
  characters: [
    {
      name: "Emma",
      age: 28,
      physicalDescription: "petite, auburn hair",
      personality: "passionate, vulnerable"
    },
    {
      name: "Mark",
      age: 30,
      physicalDescription: "tall, brown eyes",
      personality: "protective, thoughtful"
    }
  ],

  mainCouple: {
    character1: { /* Emma details */ },
    character2: { /* Mark details */ },
    relationship: "childhood best friends, rekindled romance"
  },

  setting: "Coastal hometown, summer",
  moodKeywords: ["passionate", "tender", "bittersweet"],

  bookTitle: "The Last Summer Together",
  bookDescription: "...",
  authorName: "Sarah Mitchell",
  imageStyle: "romantic",
  tone: "intimate and emotional",
  bookTheme: "contemporary romance"
}
```

### 2️⃣ Context → Prompt

```
ImagePromptContext
│
├─ characters ESPECÍFICOS (Emma, Mark com detalhes)
├─ mainCouple RELACIONAMENTO (childhood friends, rekindled)
├─ setting CONTEXTO (Coastal hometown, summer)
├─ moodKeywords EMOÇÃO (passionate, tender, bittersweet)
│
           ↓
generateCoverPrompt(context)
│
├─ "MAIN COUPLE - MUST BE FEATURED:"
├─ "Emma: petite, long auburn hair, passionate, vulnerable"
├─ "Mark: tall, brown eyes, protective, thoughtful"
├─ "Relationship: childhood best friends, rekindled romance"
├─ "Setting: Coastal hometown during summer"
├─ "Mood: passionate, tender, bittersweet, nostalgic"
│
           ↓

PROMPT PARA DALL-E 3:
"Create a professional book cover...
MAIN COUPLE - MUST BE PROMINENTLY FEATURED:
  Emma:
    - Physical appearance: petite, long auburn hair, delicate features
    - Personality: passionate, artistic, emotionally expressive, vulnerable
  Mark:
    - Physical appearance: tall, warm brown eyes, strong presence
    - Personality: protective, deeply caring, thoughtful, complex
Relationship: childhood best friends, rekindled romance, unresolved feelings
..."
```

### 3️⃣ Prompt → DALL-E 3

```
DALL-E 3 recebe:
  "Create a cover with Emma (petite, auburn hair, passionate)
   and Mark (tall, brown eyes, protective)..."

         ↓ (OpenAI DALL-E 3 API)

Output: Image URL (1024×1024)
  └─ Mostra Emma e Mark em momento íntimo
  └─ Características físicas específicas
  └─ Atmosfera bittersweet e romantic
  └─ Qualidade profissional
```

### 4️⃣ Imagem → Armazenamento

```
Image URL
  ├─ Salvar no storage (S3/Cloudinary)
  └─ Guardar metadados no banco

BookImage Document:
{
  _id: ObjectId,
  bookId: "123",
  type: "cover",
  imageUrl: "https://...",
  prompt: "Create a professional book cover...",
  style: "romantic",
  status: "completed",
  createdAt: Date
}
```

### 5️⃣ Imagem → PDF

```
BookCoverDocument.tsx
├─ Recebe: coverImageUrl (do BookImage)
├─ Insere: Na frente (56% da capa)
├─ Posiciona: De forma profissional
└─ Output: PDF 12.62×9.25" pronto

         ↓

Livro com capa dos personagens REAIS! ✅
```

---

## 📊 Estrutura de Dados

### CharacterDetail

```typescript
{
  name: string;           // "Emma"
  age?: number;           // 28
  physicalDescription?: string; // "petite, auburn hair"
  personality?: string;    // "passionate, vulnerable"
  role?: string;          // "love-interest"
}
```

### ImagePromptContext

```typescript
{
  // Livro
  bookTitle: string;
  bookDescription: string;
  authorName: string;

  // Personagens
  characters: CharacterDetail[];
  mainCouple?: {
    character1: CharacterDetail;
    character2: CharacterDetail;
    relationship?: string;
  };

  // Contexto
  chapterTitle: string;
  chapterDescription: string;
  bookTheme: string;
  tone: string;
  setting?: string;
  timeOfDay?: string;
  moodKeywords?: string[];

  // Seleção
  imageStyle: ImageStyle;
}
```

### ImageGenerationOptions

```typescript
{
  generateCover: boolean;
  internalImagesCount: "none" | "1" | "2" | "3";
  imageStyle: ImageStyle;
}
```

---

## 🎨 Image Styles (7 Opções)

```
1. realistic: photorealistic, professional photography
2. painterly: oil painting, artistic brushwork
3. illustrated: digital illustration, vibrant colors
4. watercolor: soft edges, flowing technique
5. romantic: dreamy atmosphere, soft focus (DEFAULT)
6. cinematic: film quality, dramatic lighting
7. minimalist: clean lines, simple elegant
```

---

## 💰 Custos

```
100 créditos por imagem

Exemplo: 5 capítulos, opções variadas
├─ Capa: 100 cr
├─ Imagens de capítulo (2 por capítulo): 1000 cr
└─ Total: 1100 cr
```

---

## ✅ Status Implementação

### Frontend ✅ 100%

- [x] UI para seleção de opções
- [x] Cálculo de custos
- [x] Seleção de estilo
- [x] Props para dados de personagens

### Service Layer ✅ 100%

- [x] CharacterDetail interface
- [x] ImagePromptContext expandido
- [x] generateCoverPrompt() personalizado
- [x] buildImagePromptContext() helper
- [x] Todas as funções e constantes

### Backend ⏳ 0%

- [ ] API endpoint
- [ ] Job queue
- [ ] DALL-E 3 integration
- [ ] Database schema
- [ ] Image storage

---

## 🚀 Próximos Passos

1. **Criar API endpoint** `/api/workspace/books/generate-images`
2. **Setup job queue** com BullMQ ou similar
3. **Integrar DALL-E 3** na processor
4. **Implementar storage** (S3/Cloudinary/Vercel Blob)
5. **Adicionar progresso** em tempo real
6. **Testar** end-to-end

---

## 🎯 Resultado

Uma arquitetura completa e personalizada que:

✅ Extrai dados reais do livro do usuário
✅ Cria prompts muito específicos
✅ Gera capas profissionais e personalizadas
✅ Integra no PDF
✅ Pronto para impressão

**Usuário tem livro profissional EM MINUTOS!**
