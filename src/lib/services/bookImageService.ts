/**
 * Book Image Generation Service
 * Handles creation and cost calculation for book covers and internal images
 * Uses OpenAI DALL-E 3 API for image generation
 */

// Image style options for DALL-E
export type ImageStyle =
  | "realistic"
  | "painterly"
  | "illustrated"
  | "watercolor"
  | "romantic"
  | "cinematic"
  | "minimalist"
  | "anime"
  | "3d-movie"
  | "cartoon"
  | "fantasy"
  | "vintage"
  | "noir";

export const IMAGE_STYLES: Record<ImageStyle, string> = {
  realistic:
    "photorealistic, professional photography style, high quality lighting",
  painterly: "oil painting style, artistic brushwork, expressive",
  illustrated: "digital illustration, detailed artwork, vibrant colors",
  watercolor: "watercolor painting, soft edges, flowing technique",
  romantic:
    "romantic illustration, dreamy atmosphere, soft focus, emotionally evocative",
  cinematic:
    "cinematic lighting, film production quality, dramatic composition",
  minimalist: "minimalist design, clean lines, simple elegant composition",
  anime: "anime style, vibrant colors, expressive characters, manga-inspired",
  "3d-movie":
    "3D movie style, cinematic rendering, detailed textures, film-quality",
  cartoon: "cartoon style, playful and colorful, exaggerated features",
  fantasy: "fantasy art style, magical elements, ethereal lighting, mystical",
  vintage: "vintage style, retro aesthetic, classic illustration, nostalgic",
  noir: "film noir style, dramatic shadows, high contrast, mysterious atmosphere",
};

export interface ImageGenerationOptions {
  generateCover: boolean;
  internalImagesCount: "none" | "1" | "2" | "3";
  imageStyle: ImageStyle;
}

export interface ImageCostBreakdown {
  coverCost: number;
  imagesCostPerChapter: number;
  totalChapters: number;
  totalImagesCost: number;
  totalCost: number;
}

/**
 * Calculate the total credits needed for image generation
 * @param options - Image generation options selected by user
 * @param totalChapters - Number of chapters in the book
 * @returns Cost breakdown and total cost
 */
export function calculateImageCosts(
  options: ImageGenerationOptions,
  totalChapters: number,
): ImageCostBreakdown {
  const COST_PER_IMAGE = 100;

  let coverCost = 0;
  if (options.generateCover) {
    coverCost = COST_PER_IMAGE;
  }

  let imagesCostPerChapter = 0;
  if (options.internalImagesCount !== "none") {
    imagesCostPerChapter =
      COST_PER_IMAGE * parseInt(options.internalImagesCount);
  }

  const totalImagesCost = imagesCostPerChapter * totalChapters;
  const totalCost = coverCost + totalImagesCost;

  return {
    coverCost,
    imagesCostPerChapter,
    totalChapters,
    totalImagesCost,
    totalCost,
  };
}

/**
 * Format cost breakdown for display
 */
export function formatCostBreakdown(breakdown: ImageCostBreakdown): string {
  const parts: string[] = [];

  if (breakdown.coverCost > 0) {
    parts.push(`Cover: ${breakdown.coverCost} credits`);
  }

  if (breakdown.imagesCostPerChapter > 0) {
    parts.push(
      `Chapter images: ${breakdown.imagesCostPerChapter} credits × ${breakdown.totalChapters} chapters = ${breakdown.totalImagesCost} credits`,
    );
  }

  if (parts.length === 0) {
    return "No additional images selected";
  }

  return `${parts.join("\n")}Total: ${breakdown.totalCost} credits`;
}

/**
 * Character details for more personalized prompts
 */
export interface CharacterDetail {
  name: string;
  age?: number;
  physicalDescription?: string;
  personality?: string;
  role?: string; // "protagonist", "love-interest", "supporting"
}

/**
 * Get image generation prompts for DALL-E 3
 */
export interface ImagePromptContext {
  bookTitle: string;
  bookDescription: string;
  characters: CharacterDetail[];
  mainCouple?: {
    character1: CharacterDetail;
    character2: CharacterDetail;
    relationship?: string; // e.g., "estranged lovers", "forbidden romance"
  };
  chapterTitle: string;
  chapterDescription: string;
  bookTheme: string; // e.g., "romance", "adventure", etc.
  tone: string; // e.g., "intimate", "dramatic", "playful"
  authorName: string;
  imageStyle: ImageStyle;
  setting?: string; // e.g., "contemporary New York", "Victorian England"
  timeOfDay?: string; // e.g., "sunset", "midnight"
  moodKeywords?: string[]; // e.g., ["passionate", "tender", "conflicted"]
}

/**
 * Generate professional book cover prompt for DALL-E 3
 *
 * COVER LAYOUT:
 * - RIGHT SIDE (56%): FRONT COVER - Main visual with title/author at bottom
 * - LEFT SIDE (36%): BACK COVER - Blurb area with description
 * - MIDDLE (8%): SPINE - Varies by page count
 *
 * REQUIREMENTS:
 * - Must feature the main couple prominently
 * - Characters' physical details and personalities must be visible
 * - Captures the emotional essence and tone of the romance
 * - Professional print quality (300 DPI equivalent)
 * - Must work at full bleed (12.62 x 9.25 inches)
 */
export function generateCoverPrompt(context: ImagePromptContext): string {
  const styleDescription = IMAGE_STYLES[context.imageStyle];

  // Format characters with full details
  const characterDescriptions = context.characters
    .map((char) => {
      const details = [
        char.name,
        char.age && `age ${char.age}`,
        char.physicalDescription,
        char.personality && `personality: ${char.personality}`,
      ]
        .filter(Boolean)
        .join(", ");
      return `  - ${details}`;
    })
    .join("\n");

  // Main couple focus for romantic imagery
  const coupleContext = context.mainCouple
    ? `
MAIN COUPLE - MUST BE PROMINENTLY FEATURED:
  ${context.mainCouple.character1.name}:
    - Physical appearance: ${context.mainCouple.character1.physicalDescription || "attractive, compelling"}
    - Personality: ${context.mainCouple.character1.personality || "complex, intriguing"}
    - Age: ${context.mainCouple.character1.age || "adult"}
  
  ${context.mainCouple.character2.name}:
    - Physical appearance: ${context.mainCouple.character2.physicalDescription || "attractive, compelling"}
    - Personality: ${context.mainCouple.character2.personality || "complex, intriguing"}
    - Age: ${context.mainCouple.character2.age || "adult"}
  
  Relationship: ${context.mainCouple.relationship || "romantic connection and tension"}
  
CRITICAL: The cover MUST show an intimate, emotionally charged moment between these two characters. Their connection, chemistry, and personalities should be immediately visible.`
    : "";

  const moodSection = context.moodKeywords
    ? `\nEMOTIONAL TONE & ATMOSPHERE: ${context.moodKeywords.join(", ")}`
    : "";

  const settingSection = context.setting
    ? `\nSETTING & CONTEXT: ${context.setting}${context.timeOfDay ? ` at ${context.timeOfDay}` : ""}`
    : "";

  return `Create a professional, emotionally compelling book cover for a ROMANCE NOVEL.

CRITICAL LAYOUT:
- Full cover dimensions: 12.62" × 9.25" with three sections:
  * RIGHT (56%): FRONT COVER - Main visual area (PRIMARY FOCUS)
  * LEFT (36%): BACK COVER - Background/continuation
  * CENTER (8%): SPINE - Text overlay area
- Design primarily for the RIGHT/FRONT section
- Characters must be PROMINENTLY visible and emotionally engaging
- Artwork extends to all edges (full bleed)
- Leave room at bottom-right for title/author overlay

BOOK INFORMATION:
Title: "${context.bookTitle}"
Author: "${context.authorName}"
Genre: CONTEMPORARY ROMANCE
Synopsis: ${context.bookDescription}
Theme: ${context.bookTheme}
Tone: ${context.tone}${settingSection}${moodSection}

ALL CHARACTERS IN THIS STORY:
${characterDescriptions}${coupleContext}

VISUAL AESTHETIC:
${styleDescription}

WHAT THIS COVER IMAGE MUST SHOW:
✓ An emotionally charged, intimate moment between the main couple
✓ Both characters' physical features and personalities clearly visible
✓ Professional, polished visual composition
✓ Romantic color palette and atmospheric lighting
✓ Print-ready quality (300 DPI equivalent)
✓ Strong visual focal point with magnetic appeal
✓ Sensual tension and emotional depth appropriate to the story
✓ Marketable, compelling appearance
✓ Consistency with the book's theme and emotional tone
✓ Visual representation of the couple's unique connection

WHAT THIS IMAGE MUST NOT CONTAIN:
✗ ANY text, words, titles, or watermarks
✗ Copyright-infringing character likenesses or copyrighted images
✗ Pricing information, promotional text, or sale offers
✗ Generic stock photo appearance
✗ Unclear, blurred, pixelated, or cut-off character faces or bodies
✗ Content contradicting the book's tone, theme, or synopsis
✗ Anything violating content policies

Generate a stunning, emotionally resonant book cover that captures the heart and passion of this romance story and will immediately captivate potential readers.`;
}

/**
 * Generate chapter image prompt for DALL-E 3
 *
 * Chapter images appear at:
 * - 1 image: Middle of chapter
 * - 2 images: Beginning and end
 * - 3 images: Beginning, middle, and end
 */
export function generateChapterImagePrompt(
  context: ImagePromptContext,
  position: "beginning" | "middle" | "end",
): string {
  const styleDescription = IMAGE_STYLES[context.imageStyle];

  // Format characters with full details
  const characterDescriptions = context.characters
    .map((char) => {
      const details = [
        char.name,
        char.age && `age ${char.age}`,
        char.physicalDescription,
        char.personality && `personality: ${char.personality}`,
      ]
        .filter(Boolean)
        .join(", ");
      return `  - ${details}`;
    })
    .join("\n");

  const positionContext = {
    beginning: "an important first moment, introduction, or setup",
    middle: "a pivotal emotional turning point or climactic moment",
    end: "a meaningful resolution, consequence, or cliffhanger moment",
  };

  const coupleContext = context.mainCouple
    ? `\n\nMAIN COUPLE IN THIS CHAPTER:
  ${context.mainCouple.character1.name} (${context.mainCouple.character1.personality})
  ${context.mainCouple.character2.name} (${context.mainCouple.character2.personality})
  Their connection: ${context.mainCouple.relationship || "romantic tension"}`
    : "";

  const settingSection = context.setting
    ? `\nSETTING: ${context.setting}${context.timeOfDay ? ` at ${context.timeOfDay}` : ""}`
    : "";

  const moodSection = context.moodKeywords
    ? `\nMOOD: ${context.moodKeywords.join(", ")}`
    : "";

  return `Create a beautiful, emotionally evocative scene illustration for a romance novel chapter.

BOOK CONTEXT:
Title: "${context.bookTitle}" by ${context.authorName}
Genre: Contemporary Romance
Synopsis: ${context.bookDescription}${settingSection}${moodSection}

CHAPTER DETAILS:
Title: "${context.chapterTitle}"
Content: ${context.chapterDescription}
Story Position: ${positionContext[position]}

ALL CHARACTERS IN THIS STORY:
${characterDescriptions}${coupleContext}

VISUAL STYLE:
${styleDescription}

THIS IMAGE MUST CAPTURE:
✓ Emotionally resonant moment from the chapter
✓ Character(s) from the story with recognizable traits
✓ The emotional essence of this specific story moment
✓ Intimate, authentic romantic connection or tension
✓ Professional, polished illustration quality
✓ Suitable for book interior (standard page format)
✓ Print-ready quality (300 DPI equivalent)
✓ Consistency with the book's tone and aesthetic
✓ Visual storytelling that advances narrative understanding

THIS IMAGE MUST NOT CONTAIN:
✗ Any text, dialogue, or watermarks
✗ Copyright-infringing artwork or references
✗ Generic or stock photo appearance
✗ Anything contradicting the chapter's content
✗ Characters whose appearance contradicts the story
✗ Visual elements that don't match the book's setting/theme

Create an impactful interior illustration that brings this romantic moment to life visually and enhances the reader's emotional experience.`;
}

/**
 * Placeholder for image metadata
 */
export interface BookImage {
  id: string;
  bookId: string;
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
}

/**
 * Calculate image generation schedule
 */
export interface ImageGenerationSchedule {
  cover?: {
    order: number;
    prompt: string;
    style: ImageStyle;
  };
  chapters: Array<{
    chapterIndex: number;
    images: Array<{
      position: "beginning" | "middle" | "end";
      prompt: string;
      style: ImageStyle;
      order: number;
    }>;
  }>;
}

export function generateImageSchedule(
  totalChapters: number,
  options: ImageGenerationOptions,
  context: ImagePromptContext,
): ImageGenerationSchedule {
  const schedule: ImageGenerationSchedule = {
    chapters: [],
  };

  let order = 1;

  // Add cover image
  if (options.generateCover) {
    schedule.cover = {
      order,
      prompt: generateCoverPrompt(context),
      style: options.imageStyle,
    };
    order++;
  }

  // Add chapter images
  if (options.internalImagesCount !== "none") {
    const imagesPerChapter = parseInt(options.internalImagesCount);
    const positions: Array<"beginning" | "middle" | "end"> =
      imagesPerChapter === 1
        ? ["middle"]
        : imagesPerChapter === 2
          ? ["beginning", "end"]
          : ["beginning", "middle", "end"];

    for (let i = 0; i < totalChapters; i++) {
      const chapterImages = positions.map((position) => ({
        position,
        prompt: generateChapterImagePrompt(
          { ...context, chapterTitle: `Chapter ${i + 1}` },
          position,
        ),
        style: options.imageStyle,
        order: order++,
      }));

      schedule.chapters.push({
        chapterIndex: i,
        images: chapterImages,
      });
    }
  }

  return schedule;
}

/**
 * Helper function to extract and format book data for image generation
 * Converts dashboard data (contacts, notes, tiles) into ImagePromptContext
 */
export function buildImagePromptContext(options: {
  bookTitle: string;
  bookDescription: string;
  authorName: string;
  imageStyle: ImageStyle;
  contacts?: Array<{ name: string; notes?: string }>;
  notes?: Array<{ title?: string; content?: string }>;
  tiles?: Array<{ name?: string; description?: string }>;
}): ImagePromptContext {
  // Extract character information from contacts
  const characters: CharacterDetail[] = (options.contacts || [])
    .slice(0, 5) // Limit to first 5 for clarity
    .map((contact) => {
      // Try to parse character details from contact notes
      const notes = contact.notes || "";
      const ageMatch = notes.match(/age[:=]?\s*(\d+)/i);
      const personalityMatch = notes.match(/personality[:=]?\s*([^,\n]+)/i);
      const descriptionMatch = notes.match(/appearance[:=]?\s*([^,\n]+)/i);

      return {
        name: contact.name,
        age: ageMatch ? parseInt(ageMatch[1]) : undefined,
        personality: personalityMatch ? personalityMatch[1].trim() : undefined,
        physicalDescription: descriptionMatch
          ? descriptionMatch[1].trim()
          : undefined,
      };
    });

  // Try to identify main couple (first two unique characters)
  let mainCouple: ImagePromptContext["mainCouple"] = undefined;
  if (characters.length >= 2) {
    mainCouple = {
      character1: characters[0],
      character2: characters[1],
      relationship: "romantic connection",
    };
  }

  // Extract mood/keywords from notes
  const moodKeywords: string[] = [];
  (options.notes || []).forEach((note) => {
    const content = (note.content || note.title || "").toLowerCase();
    if (content.includes("passionate")) moodKeywords.push("passionate");
    if (content.includes("tender")) moodKeywords.push("tender");
    if (content.includes("dramatic")) moodKeywords.push("dramatic");
    if (content.includes("intimate")) moodKeywords.push("intimate");
    if (content.includes("tender")) moodKeywords.push("tender");
    if (content.includes("conflicted")) moodKeywords.push("conflicted");
  });

  // Extract setting from tiles or notes
  let setting: string | undefined;
  (options.tiles || []).forEach((tile) => {
    if (
      tile.name?.toLowerCase().includes("location") ||
      tile.name?.toLowerCase().includes("setting")
    ) {
      setting = tile.description || tile.name;
    }
  });

  return {
    bookTitle: options.bookTitle,
    bookDescription: options.bookDescription,
    authorName: options.authorName,
    imageStyle: options.imageStyle,
    characters,
    mainCouple,
    chapterTitle: "Story Chapter",
    chapterDescription: options.bookDescription,
    bookTheme: "contemporary romance",
    tone: "intimate and emotional",
    setting,
    moodKeywords: moodKeywords.slice(0, 5), // Limit to 5 keywords
  };
}
