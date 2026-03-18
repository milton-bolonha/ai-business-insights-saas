# Book Images & Cover Generation System

## Overview

This system enables users to generate professional book covers and internal chapter images for AI-generated romance novels.

## Features

### 1. Book Cover Generation

- **Dimensions**: 12.62 × 9.25 inches (908.88 × 666.047 points)
- **Format**: Full cover with front, back, and spine
- **Cost**: 100 credits per cover
- **Default**: OFF (optional toggle)

#### Cover Layout

```
┌─────────────────┬──────┬────────────────┐
│  Back Cover     │ Spine│  Front Cover   │
│  (36% width)    │(8%)  │  (56% width)   │
│  6×9 inches     │varies│  6×9 inches    │
└─────────────────┴──────┴────────────────┘
```

#### Spine Width Calculation

Spine width varies by page count:

- **25 pages**: ~1.43mm (4.06 points)
- **75 pages**: ~4.29mm (12.17 points)
- **120 pages**: ~6.86mm (19.46 points)

#### Cover Components

**Back Cover** (36% width, 152.4 × 228.6 mm)

- Title
- Blurb/Description
- Author name
- ISBN barcode placeholder

**Spine** (Variable width, 228.6 mm height)

- Book title (abbreviated)
- Dynamic width based on page count

**Front Cover** (56% width, 152.4 × 228.6 mm)

- Hero image
- Book title
- Author name

### 2. Internal Chapter Images

- **Options**: None, 1 per chapter, 2 per chapter, or 3 per chapter
- **Default**: None (no images)
- **Cost**: 100 credits per image
- **Positions**: Beginning, middle, and end of chapter (if 3 selected)

#### Image Placement Strategy

- **1 image**: Middle of chapter
- **2 images**: Beginning and end of chapter
- **3 images**: Beginning, middle, and end of chapter

#### Image Specifications

- **Size**: Responsive to chapter content
- **Format**: RGB or CMYK suitable
- **Quality**: Optimized for print (300 DPI equivalent)
- **Style**: Should match book theme and tone

### 3. Form Options

In the "Create Book" dialog, users can select:

```
Image Generation (100 credits per image/cover)
├── ☐ Generate Book Cover (100 credits)
└── Internal Chapter Images
    ├── None (0 credits)
    ├── 1 per chapter (100 credits × number of chapters)
    ├── 2 per chapter (200 credits × number of chapters)
    └── 3 per chapter (300 credits × number of chapters)
```

### 4. Cost Calculation Example

**Book with 5 chapters, 75 pages:**

- Cover: 100 credits
- Internal images (2 per chapter): 200 × 5 = 1,000 credits
- **Total additional cost**: 1,100 credits

## Implementation Details

### Files Involved

1. **BookLibrarySection.tsx**
   - Form state includes `generateCover` and `internalImagesCount`
   - UI toggles for cover and image options
   - Credit cost display

2. **BookCoverDocument.tsx** (NEW)
   - PDF generation for book covers
   - Dynamic spine width calculation
   - Front/back/spine layout

3. **BookPDFDocument.tsx**
   - Internal images inserted at calculated positions
   - Image optimization and placement logic

### Generation Flow

1. **User selects image options** in create book form
2. **Cost is calculated and displayed** (100 credits per image)
3. **On book creation**:
   - If `generateCover` is true: AI generates cover image via DALL-E or similar
   - If `internalImagesCount !== "none"`: Schedule image generation for each chapter
4. **Images are inserted** into PDF during rendering
5. **Credits are deducted** from user workspace

### API Endpoints (Future)

- `POST /api/images/generate-cover` - Generate book cover
- `POST /api/images/generate-chapter-image` - Generate chapter image
- `GET /api/images/status/:bookId` - Check image generation status

## Credit System

| Item          | Cost        |
| ------------- | ----------- |
| Book cover    | 100 credits |
| Chapter image | 100 credits |

**Example costs:**

- 5-chapter book with cover only: 100 credits
- 5-chapter book with cover + 1 image/chapter: 600 credits
- 5-chapter book with cover + 3 images/chapter: 1,600 credits

## UI/UX Details

### Form Section

Located after "Target Pages" and before "Writer's Toolbox & Addons"

**Cover Toggle**

- Icon: BookOpen
- Label: "Generate Book Cover"
- Description: "AI-generated professional cover (100 credits)"
- Color when active: Pink (#ec4899)

**Image Count Buttons**

- 4 options: "None", "1", "2", "3"
- Shows cost per chapter in smaller text
- Grid layout: 4 columns

## Specifications Reference

### Cover Dimensions (120-page example)

| Element         | Width (mm) | Height (mm) | Notes          |
| --------------- | ---------- | ----------- | -------------- |
| Full cover      | 318.01     | 234.95      | Complete bleed |
| Front/Back each | 152.4      | 228.6       | Book page size |
| Spine           | 6.86       | 228.6       | For 120 pages  |
| Bleed           | 3.17       | 3.17        | On all edges   |
| Margin          | 3.17       | 3.17        | Safe zone      |

### Cover Dimensions (75-page example)

| Element    | Width (mm) | Height (mm) |
| ---------- | ---------- | ----------- |
| Full cover | 315.44     | 234.95      |
| Spine      | 4.29       | 228.6       |

### Cover Dimensions (25-page example)

| Element    | Width (mm) | Height (mm) |
| ---------- | ---------- | ----------- |
| Full cover | 312.58     | 234.95      |
| Spine      | 1.43       | 228.6       |

## Future Enhancements

- [ ] Custom cover templates/styles
- [ ] Image variation options (artistic, photorealistic, etc.)
- [ ] Batch image generation
- [ ] Image gallery/preview before purchase
- [ ] Integration with AI image generation APIs
- [ ] Book cover preview before generation
