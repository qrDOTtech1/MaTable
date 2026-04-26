/**
 * Resize + compress an image File/Blob for Ollama vision API.
 * - Max 1536px on longest side (within model limits, avoids timeout)
 * - Min 100px on shortest side (qwen3-vl rejects tiny images)
 * - JPEG quality 0.85 (good quality for text/menu reading)
 * Returns a base64 string WITHOUT the data: prefix (ready for Ollama vision API).
 */
export async function resizeImageToBase64(
  file: File | Blob,
  maxPx = 1536,
  minPx = 100,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale DOWN so the longest side is maxPx
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height * maxPx) / width);
          width = maxPx;
        } else {
          width = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }

      // Scale UP if too small (qwen3-vl rejects images below ~28px)
      if (width < minPx && height < minPx) {
        if (width >= height) {
          height = Math.round((height * minPx) / width);
          width = minPx;
        } else {
          width = Math.round((width * minPx) / height);
          height = minPx;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas context unavailable")); return; }

      ctx.drawImage(img, 0, 0, width, height);

      // toDataURL includes the "data:image/jpeg;base64," prefix — strip it
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1]);
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load error")); };
    img.src = url;
  });
}
