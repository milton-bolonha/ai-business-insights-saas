# Book Cover & Image Generation - DALL-E 3 Integration

## 🚀 Overview

Sistema completo de geração de capas e imagens usando OpenAI DALL-E 3 API, com suporte a múltiplos estilos e especificações de impressão profissional.

---

## 📡 OpenAI API Integration

### Current Setup

- ✅ OpenAI API já configurada no projeto
- ✅ `OPENAI_API_KEY` no `.env.local`
- ✅ DALL-E 3 disponível para geração de imagens
- Ubicação: `src/lib/ai/`

### Usage

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate image with DALL-E 3
const response = await openai.images.generate({
  model: "dall-e-3",
  prompt: "Your detailed prompt here",
  n: 1,
  size: "1024x1024", // or other sizes
  quality: "hd", // Standard or HD
});

const imageUrl = response.data[0].url;
```

---

## 🎨 Image Styles Available

13 estilos diferentes para capas e imagens internas:

| Style           | Description                               | Use Case                  |
| --------------- | ----------------------------------------- | ------------------------- |
| **Realistic**   | Photorealistic, professional photography  | Contemporary romance      |
| **Painterly**   | Oil painting, artistic brushwork          | Classic, literary romance |
| **Illustrated** | Digital illustration, vibrant colors      | Young adult romance       |
| **Watercolor**  | Soft edges, flowing watercolor technique  | Romantic, dreamy feel     |
| **Romantic**    | Dreamy, soft focus, emotionally evocative | All romance genres        |
| **Cinematic**   | Film production quality, dramatic         | Action-romance, intense   |
| **Minimalist**  | Clean lines, simple elegant               | Contemporary, modern      |
| **Anime**       | Anime style, vibrant colors, expressive   | Manga-inspired romance    |
| **3D Movie**    | 3D movie style, cinematic rendering       | Sci-fi, fantasy romance   |
| **Cartoon**     | Cartoon style, playful, exaggerated       | Light-hearted romance     |
| **Fantasy**     | Fantasy art, magical elements             | Epic fantasy romance      |
| **Vintage**     | Vintage style, retro aesthetic            | Historical romance        |
| **Noir**        | Film noir, dramatic shadows, mystery      | Dark, suspenseful romance |

---

## 📖 Book Cover Specifications

### CRITICAL: Cover Layout

**Full Cover Dimensions: 12.62" × 9.25" (908.88 × 666.047 pt)**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  BACK COVER    │    SPINE    │   FRONT COVER    │
│   (LEFT 36%)   │   (8%)      │   (RIGHT 56%)    │
│                │   varies    │                  │
│   152.4 × 228.6│   w/pages   │   152.4 × 228.6  │
│                │             │                  │
│  • Title       │   • Title   │   • Main Image   │
│  • Blurb/DESC  │   • Author  │   • Title        │
│  • Author      │   • Indie   │   • Author       │
│  • ISBN bar    │   marker    │   • Tagline opt  │
└──────────────────────────────────────────────────┘
```

### Spine Width (Dynamic)

Varies by page count:

- **25 pages**: ~1.43mm (4.06 pt)
- **75 pages**: ~4.29mm (12.17 pt)
- **120 pages**: ~6.86mm (19.46 pt)

### Requirements for Cover Image (DALL-E prompt)

#### MUST HAVE ✓

- Emotionally evocative imagery for romance
- Professional, high-quality composition
- Characters embodying the story essence
- Romantic color palette
- Print quality (300 DPI equivalent)
- Clear focal point
- Space at bottom-right for title/author overlay

#### MUST NOT HAVE ✗

- Text overlay (added separately)
- Copyright-infringing artwork
- Pricing or promotional text
- Blurred or unclear elements
- Content contradicting the book
- Stock photo appearance
- Watermarks or branding

---

## 📝 Chapter Image Specifications

### Placement Strategy

**1 image per chapter:**

- Middle of chapter (climactic moment)

**2 images per chapter:**

- Beginning (opening/introduction)
- End (conclusion/cliffhanger)

**3 images per chapter:**

- Beginning (setup)
- Middle (turning point)
- End (resolution/impact)

### Requirements for Chapter Images

- Emotionally resonant and character-focused
- Suitable for book interior pages
- Professional illustration quality
- Consistent with romantic novel aesthetics
- No text or watermarks
- Print quality (300 DPI equivalent)

---

## 🔧 Implementation - Image Generation Endpoint

### Proposed API Route

```
POST /api/workspace/books/generate-images
```

### Request Body

```typescript
{
  bookId: string;
  imageOptions: {
    generateCover: boolean;
    internalImagesCount: "none" | "1" | "2" | "3";
    imageStyle: "realistic" | "painterly" | "illustrated" |
                "watercolor" | "romantic" | "cinematic" | "minimalist" |
                "anime" | "3d-movie" | "cartoon" | "fantasy" | "vintage" | "noir";
  };
  bookData: {
    title: string;
    author: string;
    description: string;
    characters: string[];
    tone: string;
    chapters: Array<{
      index: number;
      title: string;
      description: string;
    }>;
  };
}
```

### Response

```typescript
{
  success: boolean;
  imageSchedule: ImageGenerationSchedule;
  estimatedTime: number; // seconds
  message: string;
}
```

### Implementation Pseudocode

```typescript
export async function generateImages(req: NextRequest) {
  const { bookId, imageOptions, bookData } = await req.json();

  // Validate credits
  const costs = calculateImageCosts(imageOptions, bookData.chapters.length);
  const user = await getAuthenticatedUser();

  if (user.credits < costs.totalCost) {
    return Response.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // Generate images async
  const schedule = generateImageSchedule(
    bookData.chapters.length,
    imageOptions,
    {
      bookTitle: bookData.title,
      bookDescription: bookData.description,
      characters: bookData.characters,
      tone: bookData.tone,
      authorName: bookData.author,
      chapterTitle: "",
      chapterDescription: "",
      bookTheme: "",
      imageStyle: imageOptions.imageStyle,
    },
  );

  // Queue generation tasks
  for (const image of getAllImagesFromSchedule(schedule)) {
    await queueImageGeneration({
      bookId,
      prompt: image.prompt,
      style: imageOptions.imageStyle,
      type: image.type,
      chapterIndex: image.chapterIndex,
      position: image.position,
    });
  }

  // Deduct credits
  await deductCredits(user.id, costs.totalCost);

  return Response.json({
    success: true,
    imageSchedule: schedule,
    estimatedTime: schedule.chapters.length * 60, // ~1 min per image
  });
}

// Background task
async function generateImageTask(
  bookId: string,
  prompt: string,
  imageStyle: ImageStyle,
) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    });

    const imageUrl = response.data[0].url;

    // Store in database
    await saveBookImage({
      bookId,
      imageUrl,
      prompt,
      style: imageStyle,
      status: "completed",
    });

    // Optionally: Insert into PDF
    await updateBookPDFWithImage(bookId);
  } catch (error) {
    await saveBookImage({
      bookId,
      status: "failed",
      error: error.message,
    });
  }
}
```

---

## 💾 Database Schema

### BookImage Collection

```typescript
interface BookImage {
  _id: ObjectId;
  bookId: ObjectId;
  type: "cover" | "chapter-image";
  chapterIndex?: number;
  position?: "beginning" | "middle" | "end";
  imageUrl: string;
  prompt: string;
  style: ImageStyle;
  status: "pending" | "generating" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  creditsCost: number;
}
```

### Book Model Extension

```typescript
type Book {
  // ... existing fields
  imageOptions?: {
    generateCover: boolean;
    internalImagesCount: "none" | "1" | "2" | "3";
    imageStyle: ImageStyle;
  };
  images?: ObjectId[]; // References to BookImage collection
  coverImageId?: ObjectId;
  generationStatus: "not-started" | "in-progress" | "completed" | "failed";
}
```

---

## 🎯 Cover Prompt Template

```
Create a professional book cover for a romance novel.

CRITICAL LAYOUT REQUIREMENTS:
- This is for a FULL BOOK COVER (12.62" x 9.25") with three sections:
  * RIGHT: FRONT COVER (56% width) - Main image area
  * LEFT: BACK COVER (36% width) - Will have text overlay
  * CENTER: SPINE (8% width) - Will have title overlay
- Design the visual elements for the RIGHT/FRONT section primarily
- Leave subtle visual continuity from front to back
- Ensure artwork extends properly to all edges for bleed

BOOK DETAILS:
Title: "{title}"
Author: "{author}"
Description: {description}
Theme: {theme}
Tone: {tone}

KEY CHARACTERS:
{characters}

STYLE: {style_description}

MUST HAVE:
✓ Emotionally evocative imagery suitable for romance
✓ Professional, high-quality composition
✓ Characters that embody the story's essence
✓ Color palette that evokes romantic emotion
✓ Works as print cover (300 DPI quality)
✓ Clear focal point that draws the eye
✓ Leaves space at bottom-right for title/author overlay

MUST NOT HAVE:
✗ Text overlay (title/author will be added separately)
✗ Copyright-infringing artwork
✗ Pricing or promotional text
✗ Blurred or unclear elements
✗ Anything that contradicts the book's content

Generate a stunning, marketable book cover suitable for both print and digital distribution.
```

---

## 🔄 Integration Checklist

- [ ] API endpoint `/api/workspace/books/generate-images` created
- [ ] Image generation queued asynchronously
- [ ] Database schema updated
- [ ] Credit validation implemented
- [ ] DALL-E 3 API calls working
- [ ] Image URLs stored in database
- [ ] PDF insertion logic implemented
- [ ] UI displays image generation status
- [ ] Error handling for failed generations
- [ ] Image CDN/storage configured

---

## 💡 Best Practices

1. **Caching**: Cache generated images to avoid regeneration
2. **Retry Logic**: Retry failed generations with exponential backoff
3. **Rate Limiting**: Respect DALL-E rate limits (25-100 requests/min)
4. **Credit Validation**: Always validate before starting generation
5. **User Feedback**: Show generation progress and status
6. **Error Messages**: Provide clear feedback on failures
7. **Optimization**: Queue images to avoid overwhelming API

---

## 🚀 Next Steps

1. Create `/api/workspace/books/generate-images` endpoint
2. Implement image generation queue system
3. Add image storage (S3 or similar)
4. Create UI for image progress tracking
5. Test with sample books
6. Monitor API usage and costs
