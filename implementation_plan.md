# Implementation Plan - Book Generation Refinement

This plan addresses the UI labels, generation lifecycle, page count control, typography issues, and image generation in the AI book generation process.

## Completed Tasks

### [✅ COMPLETED] [Book Generation UI & Logic]

#### [MODIFY] [BookLibrarySection.tsx](src/components/love-writers/BookLibrarySection.tsx)

- Change "chapters" to "arcs" throughout the file. ✅
- Update `isActivelyWriting` to correctly handle the completion state (hide buttons when `currentArc === totalArcs` and not busy). ✅
- Calculate `wordsPerArc` based on `formData.pagesCountGoal` (approx. 250 words per page). ✅
- Update the AI prompt to request the calculated word count instead of the hardcoded 600-900 range. ✅
- Update "Writing ch." to "Writing arc" for English consistency. ✅
- Implement intelligent arc scaling: more pages = more arcs. ✅

### [✅ COMPLETED] [PDF Typography]

#### [MODIFY] [BookPDFDocument.tsx](src/components/love-writers/BookPDFDocument.tsx)

- Use `Font.registerHyphenationCallback(() => [])` to disable automatic hyphenation in the PDF. ✅
- Ensure `textAlign: 'justify'` remains but without splitting words. ✅
- Update page size from A5 to 6x9 inches (432x648 points). ✅

### [✅ COMPLETED] [Narrative Structure Enhancement]

#### Enhanced AI Prompt with Expert Guidelines

- Integrated comprehensive narrative progression principles into generation prompt. ✅
- Added 10 core narrative structure directives (escalation, conflict, emotional arcs, etc.). ✅
- Focus on transformation driven by pressure and consequences. ✅

### [✅ COMPLETED] [Book Cover System]

#### [NEW] [BookCoverDocument.tsx](src/components/love-writers/BookCoverDocument.tsx)

- Professional cover template with front, back, and spine. ✅
- Dimensions: 12.62 × 9.25 inches (908.88 × 666.047 points). ✅
- Dynamic spine width based on page count:
  - 25 pages: ~1.43mm ✅
  - 75 pages: ~4.29mm ✅
  - 120 pages: ~6.86mm ✅
- Back cover with title, description, ISBN placeholder. ✅
- Front cover with image and book info. ✅

#### [ENHANCE] [BookLibrarySection.tsx](src/components/love-writers/BookLibrarySection.tsx)

- Add `generateCover` toggle to form state. ✅
- Add `internalImagesCount` ("none" | "1" | "2" | "3") to form state. ✅
- Create UI section for Image Generation Options:
  - Toggle for "Generate Book Cover" (100 credits). ✅
  - 4-button selector for internal images with cost display. ✅

### [✅ COMPLETED] [Image Generation Service]

#### [NEW] [bookImageService.ts](src/lib/services/bookImageService.ts)

- `calculateImageCosts()` - Compute total credits needed. ✅
- `generateCoverPrompt()` - DALL-E prompt for book cover. ✅
- `generateChapterImagePrompt()` - Prompts for chapter images. ✅
- `generateImageSchedule()` - Plan image generation order. ✅
- Image positioning logic (1/2/3 images per chapter). ✅

## Documentation

### Created

- [BOOK-IMAGES-SYSTEM.md](docs/BOOK-IMAGES-SYSTEM.md) - Complete system overview
- [BOOK-IMAGES-IMPLEMENTATION.md](docs/BOOK-IMAGES-IMPLEMENTATION.md) - Implementation guide

## Cost Structure

### Image Generation Pricing

| Item          | Cost        |
| ------------- | ----------- |
| Book Cover    | 100 credits |
| Chapter Image | 100 credits |

### Example: 5-Chapter Book (75 pages)

- Cover only: 100 credits
- Cover + 1 image/chapter: 600 credits
- Cover + 3 images/chapter: 1,600 credits

## Next Steps for Integration

1. **API Endpoint** - `/api/workspace/books/generate-images`
   - Validate credits before generation
   - Queue image generation tasks
   - Track generation status

2. **UI Cost Display**
   - Show total cost before book creation
   - Display credit validation warnings
   - Offer upgrade options if insufficient credits

3. **Image Generation Queue**
   - Integrate with DALL-E or alternative AI image provider
   - Handle async generation and callbacks
   - Store generated images with proper metadata

4. **Database Schema**
   - Extend Book model with image options
   - Add BookImage collection for tracking
   - Support image versioning and history

5. **Verification Testing**
   - Test cover generation with various page counts
   - Verify spine width calculations
   - Test image placement in chapters
   - Validate credit deduction

## Architecture Notes

### Form Flow

```
Create Book Form
├── Book Details (Title, Author, etc.)
├── Target Pages (25/75/120)
├── Image Generation Options (NEW)
│   ├── Generate Cover (100 cr)
│   └── Internal Images (None/1/2/3 per chapter)
├── Writer's Toolbox & Addons
└── Cost Summary & Publish
```

### Image Generation Flow

```
User selects options
    ↓
Calculate costs
    ↓
Check credits
    ↓
Generate cover (if selected)
    ↓
Schedule chapter images (if selected)
    ↓
Track generation status
    ↓
Insert images into PDF
```

## File Changes Summary

### Modified Files

- `src/components/love-writers/BookLibrarySection.tsx` - Added image options to form
- `src/components/love-writers/BookPDFDocument.tsx` - Updated to 6x9 inches
- `src/components/love-writers/BookCoverDocument.tsx` - Created cover template
- `implementation_plan.md` - This file

### New Files

- `src/lib/services/bookImageService.ts` - Image generation utilities
- `docs/BOOK-IMAGES-SYSTEM.md` - System documentation
- `docs/BOOK-IMAGES-IMPLEMENTATION.md` - Implementation guide
