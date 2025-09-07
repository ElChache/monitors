// Color utility for accessibility validation

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export function parseColorToRGB(color: string): ColorRGB {
  // Handle various color formats
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);

  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10)
    };
  }

  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16)
    };
  }

  throw new Error(`Unsupported color format: ${color}`);
}

export function getLuminance(color: ColorRGB): number {
  const [r, g, b] = [color.r, color.g, color.b].map(c => {
    c /= 255;
    return c <= 0.03928 
      ? c / 12.92 
      : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function calculateContrastRatio(color1: ColorRGB, color2: ColorRGB): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

export function assessColorContrast(
  foregroundColor: string, 
  backgroundColor: string
): { 
  ratio: number, 
  passesAA: boolean, 
  passesAAA: boolean 
} {
  const fgRGB = parseColorToRGB(foregroundColor);
  const bgRGB = parseColorToRGB(backgroundColor);
  
  const contrastRatio = calculateContrastRatio(fgRGB, bgRGB);
  
  return {
    ratio: contrastRatio,
    passesAA: contrastRatio >= 4.5,  // WCAG Level AA
    passesAAA: contrastRatio >= 7.0  // WCAG Level AAA
  };
}

export function suggestAccessibleColor(
  originalColor: string, 
  backgroundColor: string
): { 
  suggestedColor: string, 
  improvementRatio: number 
} {
  // Basic color adjustment strategies
  const adjustColors = [
    { factor: 1.2, description: 'Slightly darker' },
    { factor: 1.5, description: 'Moderately darker' },
    { factor: 2.0, description: 'Significantly darker' }
  ];

  const originalRGB = parseColorToRGB(originalColor);
  const bgRGB = parseColorToRGB(backgroundColor);

  let bestSuggestion = { 
    suggestedColor: originalColor, 
    improvementRatio: calculateContrastRatio(originalRGB, bgRGB) 
  };

  adjustColors.forEach(adjustment => {
    const adjustedColor = {
      r: Math.min(255, Math.floor(originalRGB.r * adjustment.factor)),
      g: Math.min(255, Math.floor(originalRGB.g * adjustment.factor)),
      b: Math.min(255, Math.floor(originalRGB.b * adjustment.factor))
    };

    const contrastRatio = calculateContrastRatio(adjustedColor, bgRGB);

    if (contrastRatio > bestSuggestion.improvementRatio) {
      bestSuggestion = {
        suggestedColor: `rgb(${adjustedColor.r}, ${adjustedColor.g}, ${adjustedColor.b})`,
        improvementRatio: contrastRatio
      };
    }
  });

  return bestSuggestion;
}

export function generateAccessibilityReport(
  colorPalette: Record<string, string>, 
  backgroundColor: string
): { 
  colors: Array<{
    name: string, 
    originalColor: string, 
    contrastRatio: number, 
    passesAA: boolean, 
    passesAAA: boolean, 
    suggestedColor?: string
  }> 
} {
  return {
    colors: Object.entries(colorPalette).map(([name, color]) => {
      const contrastAnalysis = assessColorContrast(color, backgroundColor);
      const suggestion = contrastAnalysis.passesAA 
        ? undefined 
        : suggestAccessibleColor(color, backgroundColor);

      return {
        name,
        originalColor: color,
        contrastRatio: contrastAnalysis.ratio,
        passesAA: contrastAnalysis.passesAA,
        passesAAA: contrastAnalysis.passesAAA,
        suggestedColor: suggestion?.suggestedColor
      };
    })
  };
}