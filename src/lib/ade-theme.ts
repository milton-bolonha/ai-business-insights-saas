import {
  adjustLightness,
  getContrastingTextColor,
  mixColors,
  toRgba,
} from "@/lib/color";

export interface AdeAppearanceTokens {
  baseColor: string;
  surfaceColor: string;
  sidebarColor: string;
  sidebarBorderColor: string;
  cardBorderColor: string;
  primaryColor?: string;
  headingColor: string;
  textColor: string;
  mutedTextColor: string;
  actionColor: string;
  overlayColor: string;
}

const DEFAULT_BASE = "#f7f7f7";

export function computeAdeAppearanceTokens(baseColor: string): AdeAppearanceTokens {
  const safeBase = baseColor || DEFAULT_BASE;
  const surfaceColor = adjustLightness(safeBase, 0.08);
  // Sidebar should be semi-transparent gray over baseColor for tinting effect
  // Using rgba with opacity instead of solid color
  const sidebarColor = mixColors(safeBase, "#808080", 0.3); // Gray tint with transparency effect
  // Calculate heading color based on surfaceColor (where headings are displayed)
  const headingColor = getContrastingTextColor(surfaceColor);
  // Calculate text color based on surfaceColor (where text is displayed)
  const textColor = getContrastingTextColor(surfaceColor);
  const mutedTextColor = mixColors(textColor, surfaceColor, 0.55);

  return {
    baseColor: safeBase,
    surfaceColor,
    sidebarColor,
    sidebarBorderColor: mixColors(sidebarColor, "#000000", 0.1),
    cardBorderColor: mixColors(surfaceColor, "#000000", 0.08),
    headingColor,
    textColor,
    mutedTextColor,
    actionColor: mixColors(textColor, "#000000", 0.1),
    overlayColor: toRgba("#000000", 0.08),
  };
}

