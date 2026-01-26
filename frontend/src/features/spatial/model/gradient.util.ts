const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const componentToHex = (c: number) => {
  const hex = Math.round(c).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

const calculateGradientColor = (
  value: number,
  minVal: number,
  maxVal: number,
  minColor: string,
  maxColor: string,
): string => {
  if (value <= minVal) return minColor;
  if (value >= maxVal) return maxColor;

  const startRGB = hexToRgb(minColor);
  const endRGB = hexToRgb(maxColor);

  if (!startRGB || !endRGB) return minColor; // Fallback

  const percentage = (value - minVal) / (maxVal - minVal);

  const r = startRGB.r + (endRGB.r - startRGB.r) * percentage;
  const g = startRGB.g + (endRGB.g - startRGB.g) * percentage;
  const b = startRGB.b + (endRGB.b - startRGB.b) * percentage;

  return rgbToHex(r, g, b);
};

export { hexToRgb, componentToHex, rgbToHex, calculateGradientColor };
