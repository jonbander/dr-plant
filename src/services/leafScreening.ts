export interface LeafPixelMetrics {
  leafCoverage: number;
  greenPercent: number;
  yellowPercent: number;
  brownPercent: number;
  darkPercent: number;
  brightnessMean: number;
  brightnessStdDev: number;
  sharpnessVariance: number;
}

export interface ImageQualityAssessment {
  isUsable: boolean;
  warnings: string[];
}

function rgbToHsv(red: number, green: number, blue: number): [number, number, number] {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return [hue, max === 0 ? 0 : delta / max, max];
}

/** Measures coarse color proportions only; it is not a disease classifier. */
export function analyzeLeafPixels(data: ArrayLike<number>, width: number, height: number): LeafPixelMetrics {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error('أبعاد الصورة غير صالحة.');
  }
  if (data.length !== width * height * 4) {
    throw new Error('بيانات البكسلات لا تطابق أبعاد الصورة.');
  }

  const total = width * height;
  const gray = new Float32Array(total);
  let leafPixels = 0;
  let greenPixels = 0;
  let yellowPixels = 0;
  let brownPixels = 0;
  let darkPixels = 0;
  let brightnessSum = 0;
  let brightnessSquareSum = 0;

  for (let pixel = 0; pixel < total; pixel++) {
    const offset = pixel * 4;
    if (data[offset + 3] < 32) continue;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    gray[pixel] = luma;
    brightnessSum += luma;
    brightnessSquareSum += luma * luma;

    const [hue, saturation, value] = rgbToHsv(red, green, blue);
    const likelyVegetationPixel = hue >= 8 && hue <= 170 && saturation >= 0.14 && value >= 0.12;
    if (!likelyVegetationPixel) continue;

    leafPixels++;
    if (hue >= 68 && hue <= 165 && saturation >= 0.18 && value >= 0.18) greenPixels++;
    else if (hue >= 32 && hue < 68 && saturation >= 0.18 && value >= 0.22) yellowPixels++;
    else if (hue >= 8 && hue < 32 && saturation >= 0.16 && value < 0.78) brownPixels++;
    if (value < 0.2) darkPixels++;
  }

  const brightnessMean = brightnessSum / Math.max(1, total);
  const brightnessVariance = Math.max(0, brightnessSquareSum / Math.max(1, total) - brightnessMean * brightnessMean);
  let laplacianSum = 0;
  let laplacianSquareSum = 0;
  let laplacianCount = 0;

  if (width >= 3 && height >= 3) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        const laplacian = gray[index - 1] + gray[index + 1] + gray[index - width] + gray[index + width] - 4 * gray[index];
        laplacianSum += laplacian;
        laplacianSquareSum += laplacian * laplacian;
        laplacianCount++;
      }
    }
  }

  const laplacianMean = laplacianCount ? laplacianSum / laplacianCount : 0;
  const sharpnessVariance = laplacianCount
    ? Math.max(0, laplacianSquareSum / laplacianCount - laplacianMean * laplacianMean)
    : 0;
  const denominator = Math.max(1, leafPixels);

  return {
    leafCoverage: (leafPixels / Math.max(1, total)) * 100,
    greenPercent: (greenPixels / denominator) * 100,
    yellowPercent: (yellowPixels / denominator) * 100,
    brownPercent: (brownPixels / denominator) * 100,
    darkPercent: (darkPixels / denominator) * 100,
    brightnessMean,
    brightnessStdDev: Math.sqrt(brightnessVariance),
    sharpnessVariance
  };
}

export function evaluateImageQuality(
  width: number,
  height: number,
  metrics: LeafPixelMetrics,
  sourceWidth: number = width,
  sourceHeight: number = height
): ImageQualityAssessment {
  const warnings: string[] = [];
  let isUsable = true;

  // The resolution gate must reflect the original source image, not the
  // downscaled analysis probe. Callers that downscale before measuring pass the
  // original dimensions; legacy callers default to the probe dimensions.
  if (sourceWidth < 240 || sourceHeight < 240) {
    isUsable = false;
    warnings.push('دقة الصورة منخفضة؛ التقط صورة أوضح وأقرب للورقة.');
  }
  if (metrics.leafCoverage < 4) {
    isUsable = false;
    warnings.push('لم تظهر مساحة كافية من الأنسجة الخضراء في الصورة. اجعل الورقة تملأ معظم الإطار.');
  }
  if (metrics.brightnessMean < 35) {
    isUsable = false;
    warnings.push('الصورة مظلمة جداً؛ أعد التصوير في ضوء طبيعي غير مباشر.');
  } else if (metrics.brightnessMean > 232) {
    isUsable = false;
    warnings.push('الصورة شديدة السطوع؛ تجنب الفلاش وأشعة الشمس المباشرة.');
  }
  if (metrics.brightnessStdDev < 10) {
    isUsable = false;
    warnings.push('التباين ضعيف جداً؛ تحقق من التركيز ووجود الورقة داخل الإطار.');
  }
  if (metrics.sharpnessVariance < 2) {
    warnings.push('قد تكون الصورة مهزوزة أو خارج التركيز؛ أعد التصوير إن أمكن.');
  }
  if (warnings.length === 0) {
    warnings.push('جودة الصورة مقبولة لقياس اللون فقط، وليست دليلاً على دقة تشخيص مرض.');
  }
  return { isUsable, warnings };
}
