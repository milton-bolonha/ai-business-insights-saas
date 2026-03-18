# Image Generation - Personalization com Dados Reais do Livro

## 📌 Visão Geral

Agora o sistema de geração de imagens é **totalmente personalizado** com base nos:

- 👥 **Personagens** (contacts dashboard)
- 📝 **Notas e detalhes** (notes)
- 🏙️ **Configurações** (tiles, location)
- 📖 **Descrição do livro** (synopsis)

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────┐
│           Dashboard Data (Real Book Context)    │
├─────────────────────────────────────────────────┤
│  Contacts          Notes           Tiles        │
│  ├─ Character 1    ├─ Personality  ├─ Location │
│  ├─ Character 2    ├─ Mood         ├─ Themes   │
│  ├─ Age/Physical   ├─ Story Notes  ├─ Plot     │
│  └─ Details        └─ Emotions     └─ Settings │
└─────────────────────────────────────────────────┘
              ↓
    ┌────────────────────┐
    │  buildImagePrompt  │
    │  Context()         │
    └────────────────────┘
              ↓
    ┌────────────────────┐
    │  generateCover     │
    │  Prompt()          │
    └────────────────────┘
              ↓
    ┌────────────────────┐
    │  DALL-E 3 API      │
    │  (OpenAI)          │
    └────────────────────┘
              ↓
    ┌────────────────────┐
    │  Professional      │
    │  Book Cover Image  │
    └────────────────────┘
```

---

## 📊 Estrutura de Dados

### CharacterDetail (Novo)

```typescript
interface CharacterDetail {
  name: string;
  age?: number;
  physicalDescription?: string; // "tall, dark hair, piercing blue eyes"
  personality?: string; // "confident, protective, complex"
  role?: string; // "protagonist", "love-interest"
}
```

### ImagePromptContext (Expandido)

```typescript
interface ImagePromptContext {
  // Livro
  bookTitle: string;
  bookDescription: string;
  authorName: string;

  // Personagens (detalhados)
  characters: CharacterDetail[];
  mainCouple?: {
    character1: CharacterDetail;
    character2: CharacterDetail;
    relationship?: string; // "estranged lovers", "forbidden romance"
  };

  // Contexto da história
  chapterTitle: string;
  chapterDescription: string;
  bookTheme: string;
  tone: string;

  // Atmosfera visual
  setting?: string; // "contemporary New York"
  timeOfDay?: string; // "sunset", "midnight"
  moodKeywords?: string[]; // ["passionate", "tender"]

  // Seleção de estilo
  imageStyle: ImageStyle;
}
```

---

## 🛠️ Função Helper: buildImagePromptContext

### Propósito

Extrai dados do dashboard (contacts, notes, tiles) e converte em `ImagePromptContext` pronto para DALL-E 3.

### Uso

```typescript
import { buildImagePromptContext } from "@/lib/services/bookImageService";

const context = buildImagePromptContext({
  bookTitle: "The Last Summer Together",
  bookDescription: "A heartwarming story about...",
  authorName: "Jane Romance",
  imageStyle: "romantic",
  contacts: [
    {
      name: "Emma",
      notes:
        "age: 30, appearance: petite with long red hair, personality: passionate and vulnerable",
    },
    {
      name: "Mark",
      notes:
        "age: 32, appearance: tall with dark eyes, personality: reserved but deeply caring",
    },
  ],
  notes: [
    {
      title: "Tone",
      content:
        "Intimate, passionate, tender moments mixed with dramatic tension",
    },
  ],
  tiles: [
    {
      name: "Setting",
      description: "Contemporary coastal town, summer season",
    },
  ],
});

// Agora context tem tudo preenchido:
// - characters com detalhes
// - mainCouple com ambos os personagens
// - moodKeywords extraídos das notes
// - setting extraído dos tiles
```

---

## 📝 Como os Dados são Extraídos

### 1. **De Contacts** (Personagens)

```
Contact: Emma
Notes: "age: 30, appearance: long red hair, petite"
      "personality: passionate, adventurous"

↓

CharacterDetail {
  name: "Emma",
  age: 30,
  physicalDescription: "long red hair, petite",
  personality: "passionate, adventurous"
}
```

### 2. **De Notes** (Mood, Atmosfera)

```
Note: "Tone & Emotions"
Content: "passionate, tender, dramatic, conflicted moments"

↓

moodKeywords: ["passionate", "tender", "dramatic", "conflicted"]
```

### 3. **De Tiles** (Setting, Local)

```
Tile: Setting
Description: "Contemporary New York, winter time"

↓

setting: "Contemporary New York, winter time"
```

---

## 🎨 Exemplo Completo: Geração de Capa

### Input (dados do dashboard)

```typescript
// BookLibrarySection.tsx
const currentDashboard = useWorkspaceStore((state) => state.currentDashboard);

const context = buildImagePromptContext({
  bookTitle: "The Last Summer Together",
  bookDescription:
    "Emma returns to her hometown and encounters Mark, her childhood best friend. Unresolved feelings resurface as they navigate their complicated past and discover what love really means.",
  authorName: "Sarah Mitchell",
  imageStyle: "romantic",
  contacts: currentDashboard?.contacts, // ← Personagens reais
  notes: currentDashboard?.notes, // ← Notas reais
  tiles: currentDashboard?.tiles, // ← Configurações reais
});
```

### Prompt Gerado para DALL-E 3

```
Create a professional, emotionally compelling book cover for a ROMANCE NOVEL.

CRITICAL LAYOUT:
- Full cover dimensions: 12.62" × 9.25" with three sections:
  * RIGHT (56%): FRONT COVER - Main visual area (PRIMARY FOCUS)
  * LEFT (36%): BACK COVER - Background/continuation
  * CENTER (8%): SPINE - Text overlay area

BOOK INFORMATION:
Title: "The Last Summer Together"
Author: "Sarah Mitchell"
Genre: CONTEMPORARY ROMANCE
Synopsis: Emma returns to her hometown...
Theme: nostalgia, second chances, hidden feelings
Tone: bittersweet, intimate, romantic
SETTING & CONTEXT: Coastal hometown during summer

ALL CHARACTERS IN THIS STORY:
  - Emma: age 28, petite with long auburn hair, personality: passionate, artistic, vulnerable
  - Mark: age 30, tall with warm brown eyes, personality: protective, thoughtful, complex
  - Sarah: age 26, Emma's sister (supporting)
  - James: age 32, Mark's business partner (supporting)

MAIN COUPLE - MUST BE PROMINENTLY FEATURED:
  Emma:
    - Physical appearance: petite, long auburn hair, delicate features
    - Personality: passionate, artistic, emotionally complex
    - Age: 28

  Mark:
    - Physical appearance: tall, warm brown eyes, strong presence
    - Personality: protective, thoughtful, carries emotional baggage
    - Age: 30

  Relationship: childhood best friends, rekindled romance, unresolved feelings

CRITICAL: The cover MUST show an intimate, emotionally charged moment between Emma and Mark. Their connection, chemistry, and personalities should be immediately visible.

EMOTIONAL TONE & ATMOSPHERE: passionate, tender, bittersweet, nostalgic

VISUAL AESTHETIC:
romantic illustration, dreamy atmosphere, soft focus, emotionally evocative

WHAT THIS COVER IMAGE MUST SHOW:
✓ An emotionally charged, intimate moment between Emma and Mark
✓ Both characters' physical features and personalities clearly visible
✓ Professional, polished visual composition
✓ Romantic color palette and atmospheric lighting
✓ Print-ready quality (300 DPI equivalent)
✓ Strong visual focal point with magnetic appeal
✓ Sensual tension and emotional depth
...

WHAT THIS IMAGE MUST NOT CONTAIN:
✗ ANY text, words, titles, or watermarks
✗ Copyright-infringing character likenesses
...
```

### Output (Imagem gerada)

DALL-E 3 recebe prompt com **contexto completo** e gera uma imagem que:

- ✅ Mostra Emma e Mark em momento íntimo
- ✅ Retrata características físicas mencionadas
- ✅ Comunica o tom bittersweet
- ✅ Funciona como capa de romance profissional
- ✅ É pronta para impressão

---

## 🎯 Melhores Práticas para Dados Personalizados

### 1. Estruturar Contacts Corretamente

```
Contact Name: Emma
Notes:
  age: 28
  appearance: petite, long auburn hair, delicate features, warm smile
  personality: passionate, artistic, emotionally expressive, vulnerable
  role: protagonist
```

### 2. Adicionar Detalhes em Notes

```
Note: "Character Emotions"
Content: "Emma is passionate and vulnerable, Mark is protective and thoughtful. Together they have tender moments mixed with dramatic tension."

Note: "Book Tone"
Content: "Bittersweet, nostalgic, passionate, intimate, romantic"

Note: "Relationship"
Content: "Childhood best friends reuniting after years apart, unresolved feelings resurface"
```

### 3. Configurar Tiles com Setting

```
Tile: Setting
Description: "Coastal hometown during summer, nostalgic locations from childhood"

Tile: Theme
Description: "Second chances, hidden feelings, coming home"
```

---

## 🔌 Implementação no BookLibrarySection

### Quando gerar a capa:

```typescript
// BookLibrarySection.tsx
const handleCreateBook = () => {
  createBook(
    {
      workspaceId,
      dashboardId,
      ...formData,
    },
    {
      onSuccess: (res) => {
        startBookGeneration(res.bookId);
      },
    },
  );
};

// Ao processar imagens:
const startImageGeneration = async () => {
  const context = buildImagePromptContext({
    bookTitle: selectedBook.title,
    bookDescription: selectedBook.coverImageUrl || "",
    authorName: user.name,
    imageStyle: formData.imageStyle,
    contacts: currentDashboard?.contacts, // ← Personagens!
    notes: currentDashboard?.notes, // ← Contexto!
    tiles: currentDashboard?.tiles, // ← Settings!
  });

  // Chamar API para gerar imagens
  await generateImages(selectedBook._id, context, formData);
};
```

---

## 📖 Para Capítulos (Chapter Images)

### Mesmo padrão:

```typescript
const chapterContext = {
  ...baseContext,
  chapterTitle: chapter.title,
  chapterDescription: chapter.summary,
  // Mesmo personagens, mesmo casal, mesmo contexto
};

const prompt = generateChapterImagePrompt(chapterContext, "middle");
// DALL-E gera imagem consistente com a capa!
```

---

## ✨ Resultados

### Antes:

```
"Main hero image"
↓
Prompt genérico para DALL-E
↓
Imagem genérica, sem personagem específico
```

### Depois:

```
Emma (28, auburn hair, passionate)
Mark (30, brown eyes, protective)
Relationship: childhood friends, rekindled romance
Setting: coastal hometown, summer
Tone: bittersweet, intimate
↓
Prompt rico e específico
↓
Imagem personalizada dos personagens reais!
```

---

## 🚀 Próximos Passos

1. **API Endpoint** criar `/api/workspace/books/generate-images`
2. **Integração** chamar `buildImagePromptContext()` com dados do dashboard
3. **DALL-E 3** processar prompts enriquecidos
4. **Armazenamento** guardar imagens com metadados
5. **PDF** inserir imagens no BookCoverDocument

---

## 📚 Arquivos Modificados

- ✅ `bookImageService.ts` - Funções expandidas + helper
- ✅ `BookCoverDocument.tsx` - Recebe props de personagens
- ✅ `ImagePromptContext` - Interface expandida com detalhes
- ⏳ API endpoint (próximo passo)
