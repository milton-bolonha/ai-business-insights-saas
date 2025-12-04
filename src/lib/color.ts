// Color utilities for the Ade theme

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g)
    .toString(16)
    .padStart(2, "0")}${Math.round(b)
    .toString(16)
    .padStart(2, "0")}`;
}

export function mixColors(color1: string, color2: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);

  const r = r1 * (1 - ratio) + r2 * ratio;
  const g = g1 * (1 - ratio) + g2 * ratio;
  const b = b1 * (1 - ratio) + b2 * ratio;

  return rgbToHex(r, g, b);
}

export function adjustLightness(color: string, factor: number): string {
  const [r, g, b] = hexToRgb(color);
  const adjustment = factor > 0 ? 255 * (1 - factor) : 255 * Math.abs(factor);

  if (factor > 0) {
    // Lighten
    return rgbToHex(
      Math.min(255, r + (255 - r) * factor),
      Math.min(255, g + (255 - g) * factor),
      Math.min(255, b + (255 - b) * factor)
    );
  } else {
    // Darken
    return rgbToHex(
      Math.max(0, r * (1 + factor)),
      Math.max(0, g * (1 + factor)),
      Math.max(0, b * (1 + factor))
    );
  }
}

export function getLuminance(color: string): number {
  const [r, g, b] = hexToRgb(color).map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastingTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export function toRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

