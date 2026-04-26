/**
 * Resize + compress an image File/Blob to max 800px wide/tall, JPEG quality 0.7.
 * Returns a base64 string WITHOUT the data: prefix (ready for Ollama vision API).
 *
 * This is critical to avoid the 180s vision timeout on large images.
 */
export async function resizeImageToBase64(
  file: File | Blob,
  maxPx = 800,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down so the longest side is maxPx
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height * maxPx) / width);
          width = maxPx;
        } else {
          width = Math.round((width * maxPx) / height);
          height = maxPx;
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
