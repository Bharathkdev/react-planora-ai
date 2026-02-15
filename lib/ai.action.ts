import puter from "@heyputer/puter.js";

import { PLANORA_RENDER_PROMPT } from "./constants";

/**
 * Converts any remote image URL → Base64 data URL
 * Required because Puter AI accepts raw image bytes, not public URLs
 */
export const fetchAsDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Generates a photorealistic 3D render from a 2D floor plan
 *
 * Flow:
 * 1. Ensure input image is Base64
 * 2. Extract MIME type + raw bytes
 * 3. Send to Gemini image model via Puter
 * 4. Convert result back to Base64 for persistence & download
 */
export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {

    // AI requires base64 — convert if user provided hosted URL
    const dataUrl = sourceImage.startsWith("data:")
        ? sourceImage
        : await fetchAsDataUrl(sourceImage);

    // Extract image payload & mime type
    const base64Data = dataUrl.split(",")[1];
    const mimeType = dataUrl.split(";")[0].split(":")[1];

    if (!base64Data || !mimeType) {
        throw new Error("Invalid image data");
    }

    // Send floor plan to AI renderer
    const response = await puter.ai.txt2img(PLANORA_RENDER_PROMPT, {
        provider: "gemini",
        model: "gemini-2.5-flash-image-preview",
        input_image: base64Data,
        input_image_mime_type: mimeType,
        ratio: { w: 1024, h: 1024 },
    });

    // AI returns an image element (hosted URL)
    const rawImageUrl = (response as HTMLImageElement).src ?? null;

    if (!rawImageUrl) return { renderedImage: null, renderedPath: undefined };

    // Convert output to base64 so it can be:
    // - downloaded
    // - cached
    // - stored in KV storage
    const renderedImage = rawImageUrl.startsWith("data:")
        ? rawImageUrl
        : await fetchAsDataUrl(rawImageUrl);

    return { renderedImage, renderedPath: undefined };
}
