# ✅ Integration Checklist - Image Generation com Personalization

## 📋 Status das Implementações

### ✅ COMPLETO - Frontend & Service Layer

#### bookImageService.ts

- [x] `CharacterDetail` interface com nome, idade, física, personalidade
- [x] `ImagePromptContext` expandido com mainCouple, setting, moodKeywords
- [x] `generateCoverPrompt()` - Prompt rico com personagens específicos
- [x] `generateChapterImagePrompt()` - Prompts para imagens de capítulo
- [x] `buildImagePromptContext()` - Helper para extrair dados do dashboard
- [x] `ImageGenerationOptions` e `calculateImageCosts()`
- [x] `generateImageSchedule()` - Agendamento de imagens
- [x] 13 estilos de imagem (realistic, painterly, illustrated, etc.)
- [x] Tratamento de erro e validação básica

#### BookCoverDocument.tsx

- [x] Props para receber `coupleNames`
- [x] JSDoc atualizado com contexto de personalizaçãoado
- [x] Layout profissional (frente/verso/lombada)
- [x] Dimensões corretas (12.62 × 9.25 inches)
- [x] Cálculo dinâmico de lombada
- [x] Integração de imagem

#### BookLibrarySection.tsx

- [x] UI para seleção de geração de capa
- [x] UI para seleção de quantidade de imagens (0/1/2/3)
- [x] UI para seleção de estilo (7 botões)
- [x] Cálculo de custos em tempo real
- [x] Exibição de custos para usuário
- [x] Seleção de estilo padrão (Romantic)

---

### ⏳ PRÓXIMOS PASSOS - Backend Implementation

#### [ ] API Endpoint: `/api/workspace/books/generate-images`

**Responsabilidades:**

```typescript
POST /api/workspace/books/generate-images

Request body: {
  bookId: string;
  context: ImagePromptContext;  // ← Dados completos do livro
  options: ImageGenerationOptions;
  totalChapters: number;
}

Response: {
  success: boolean;
  job_id: string;
  estimated_completion: Date;
  images_count: number;
  total_cost: number;
}
```

**Lógica:**

1. ✅ Validar autenticação do usuário
2. ✅ Verificar se livro existe e pertence ao workspace
3. ✅ Validar créditos suficientes (calculateImageCosts)
4. ✅ Deduzir créditos (transação)
5. ✅ Criar job na fila de processamento
6. ✅ Retornar job ID e status

---

#### [ ] Job Queue System

**Biblioteca recomendada:** BullMQ / Bull / Node-Queue

**O que fazer:**

```typescript
// Quando POST /api/workspace/books/generate-images é chamada:
imageGenerationQueue.add(
  {
    jobId: uuid(),
    bookId,
    context,
    options,
    userId,
    workspaceId,
  },
  {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  },
);

// Processor (roda em background):
imageGenerationQueue.process(async (job) => {
  // 1. Gerar prompts usando generateImageSchedule()
  const schedule = generateImageSchedule(totalChapters, options, context);

  // 2. Para cada imagem na schedule:
  for (const image of schedule.allImages) {
    const url = await generateImageWithDALLE3(image.prompt, options.imageStyle);

    // 3. Salvar resultado no banco
    await BookImage.create({
      bookId,
      imageUrl: url,
      prompt: image.prompt,
      style: options.imageStyle,
      type: image.type,
      position: image.position,
    });

    job.progress(progress);
  }

  return { success: true, imageCount: schedule.length };
});
```

---

#### [ ] Database Schema Updates

**New Collection: `book_images`**

```typescript
{
  _id: ObjectId;
  bookId: string;         // ← Link ao livro
  type: "cover" | "chapter-image";
  chapterIndex?: number;
  position?: "beginning" | "middle" | "end";
  imageUrl: string;       // ← URL da imagem salva
  prompt: string;         // ← Prompt usado
  style: ImageStyle;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}
```

**Update Book Model:**

```typescript
interface Book {
  // ... existing fields
  imageOptions?: {
    generateCover: boolean;
    internalImagesCount: "0" | "1" | "2" | "3";
    imageStyle: ImageStyle;
  };
  coverImageUrl?: string; // ← URL da capa gerada
  images?: string[]; // ← IDs das imagens de capítulo
}
```

---

#### [ ] DALL-E 3 Integration

**Helper Function:**

```typescript
async function generateImageWithDALLE3(
  prompt: string,
  style: ImageStyle,
): Promise<string> {
  // 1. Enriquecer prompt com estilo
  const enrichedPrompt = `${prompt}\n\nStyle: ${IMAGE_STYLES[style]}`;

  // 2. Chamar OpenAI
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: enrichedPrompt,
    size: "1024x1024",
    quality: "hd",
    n: 1,
  });

  // 3. Retornar URL da imagem
  return response.data[0].url;
}
```

---

#### [ ] Image Storage

**Opções:**

- S3 (AWS)
- Azure Blob Storage
- Cloudinary
- Vercel Blob

**Recomendado:** Vercel Blob (simples, integrado)

```typescript
async function saveImage(url: string, fileName: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  const savedUrl = await put(fileName, blob, {
    access: "public",
  });

  return savedUrl.url;
}
```

---

#### [ ] PDF Integration

**Atualizar BookPDFDocument.tsx:**

```typescript
interface BookPDFDocumentProps {
  // ... existing
  chapterImages?: Array<{
    chapterIndex: number;
    imageUrl: string;
    position: "beginning" | "middle" | "end";
  }>;
}

export function BookPDFDocument({
  // ...
  chapterImages,
}: BookPDFDocumentProps) {
  // Para cada capítulo, adicionar imagens
  // nos pontos corretos
}
```

---

#### [ ] Progress Tracking UI

**Real-time Updates (WebSocket ou Polling):**

```typescript
// BookLibrarySection.tsx
const [imageProgress, setImageProgress] = useState<{
  [bookId]: {
    progress: number;
    total: number;
    status: "pending" | "generating" | "completed" | "failed";
  }
}>({});

// Poll ou WebSocket
useEffect(() => {
  const interval = setInterval(async () => {
    const status = await checkImageGenerationStatus(bookId);
    setImageProgress(prev => ({
      ...prev,
      [bookId]: status
    }));
  }, 2000);

  return () => clearInterval(interval);
}, [bookId]);

// Display:
{imageProgress[bookId]?.status === "generating" && (
  <ProgressBar
    current={imageProgress[bookId].progress}
    total={imageProgress[bookId].total}
  />
)}
```

---

### 📊 Implementation Priority

**Priority 1 (Essential):**

1. [ ] API Endpoint - `/api/workspace/books/generate-images`
2. [ ] DALL-E 3 API call function
3. [ ] Basic job queue
4. [ ] Database schema for BookImage

**Priority 2 (Important):** 5. [ ] Credit validation and deduction 6. [ ] Error handling and retry logic 7. [ ] Image storage (S3/Cloudinary) 8. [ ] PDF integration

**Priority 3 (Nice to Have):** 9. [ ] Progress tracking UI 10. [ ] WebSocket real-time updates 11. [ ] Image preview before purchase 12. [ ] Batch operations

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] `buildImagePromptContext()` extracts data correctly
- [ ] `calculateImageCosts()` returns correct values
- [ ] `generateCoverPrompt()` includes all character details
- [ ] Character data parsed from notes

### Integration Tests

- [ ] API endpoint accepts valid requests
- [ ] API rejects invalid requests
- [ ] Credits deducted on successful request
- [ ] Credits NOT deducted on failed request

### End-to-End Tests

- [ ] User creates book with image options
- [ ] API called with correct context
- [ ] DALL-E 3 returns image
- [ ] Image stored in database
- [ ] Image appears in PDF
- [ ] Cover and chapter images are consistent

---

## 🔐 Security Considerations

- [ ] Validar user ownership de book
- [ ] Validar user ownership de workspace
- [ ] Rate limit requests (prevent abuse)
- [ ] Validate API keys (OpenAI)
- [ ] Sanitize prompts (no injection)
- [ ] Verify image URLs (no malicious content)

---

## 📚 Documentation Needed

- [ ] API endpoint documentation
- [ ] Database schema documentation
- [ ] Queue system setup guide
- [ ] Troubleshooting guide
- [ ] Cost breakdown guide

---

## 🎯 Expected Outcome

After completion:

```
User Flow:
1. User creates book with personalized data in dashboard
2. User selects "Generate Cover" + style
3. Clicks "Create Book"
4. ✅ System extracts character/story data
5. ✅ Builds rich ImagePromptContext
6. ✅ Generates detailed DALL-E prompt
7. ✅ Creates job in queue
8. ✅ DALL-E 3 generates personalized cover
9. ✅ Image stored and linked to book
10. ✅ PDF updated with cover
11. ✅ Credits deducted
12. User has professional, personalized book!
```

---

## 🚀 Launch Readiness

**Frontend:** ✅ 100% - Pronto para enviar dados
**Service:** ✅ 100% - Pronto para gerar prompts
**API:** ⏳ 0% - Precisa ser criado
**Queue:** ⏳ 0% - Precisa ser criado
**Database:** ⏳ 0% - Precisa ser criado
**Storage:** ⏳ 0% - Precisa ser configurado

**Total Frontend Readiness: 100%** ✅
**Total Backend Readiness: 0%** ⏳

Next: Criar API endpoint em `/api/workspace/books/generate-images`
