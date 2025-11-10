export async function getDominantColorFromImage(url: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const w = 64; // downscale for performance
    const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
    canvas.width = w;
    canvas.height = h;
    try {
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 128) continue; // skip transparent
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
      if (n === 0) return null;
      r = Math.round(r / n);
      g = Math.round(g / n);
      b = Math.round(b / n);

      // clamp overly neon colors by reducing saturation slightly
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max - min;
      if (sat > 100) {
        const factor = 0.85;
        const avg = (r + g + b) / 3;
        r = Math.round(avg + (r - avg) * factor);
        g = Math.round(avg + (g - avg) * factor);
        b = Math.round(avg + (b - avg) * factor);
      }

      return `rgb(${r}, ${g}, ${b})`;
    } catch {
      // Cross-origin images may taint the canvas; gracefully fallback
      return null;
    }
  } catch (e) {
    return null;
  }
}
