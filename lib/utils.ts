// KV key storing user's hosting configuration
export const HOSTING_CONFIG_KEY = "planora_hosting_config";

// All hosted assets live under Puter public hosting domain
export const HOSTING_DOMAIN_SUFFIX = ".puter.site";

/**
 * Detect if a URL is already permanently hosted
 * Prevents re-uploading same file multiple times
 */
export const isHostedUrl = (value: unknown): value is string =>
    typeof value === "string" && value.includes(HOSTING_DOMAIN_SUFFIX);

/**
 * Generate unique hosting subdomain per user
 * Avoids collisions across users/projects
 */
export const createHostingSlug = () =>
    `planora-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

/**
 * Ensure subdomain always includes public suffix
 */
const normalizeHost = (subdomain: string) =>
    subdomain.endsWith(HOSTING_DOMAIN_SUFFIX)
        ? subdomain
        : `${subdomain}${HOSTING_DOMAIN_SUFFIX}`;

/**
 * Build final CDN URL for stored file
 */
export const getHostedUrl = (
    hosting: { subdomain: string },
    filePath: string,
): string | null => {
    if (!hosting?.subdomain) return null;
    const host = normalizeHost(hosting.subdomain);
    return `https://${host}/${filePath}`;
};

/**
 * Determine file extension reliably
 * Handles:
 * - MIME types
 * - Data URLs
 * - Query URLs
 * - Missing extensions
 */
export const getImageExtension = (contentType: string, url: string): string => {
    const type = (contentType || "").toLowerCase();

    const typeMatch = type.match(/image\/(png|jpe?g|webp|gif|svg\+xml|svg)/);
    if (typeMatch?.[1]) {
        const ext = typeMatch[1].toLowerCase();
        return ext === "jpeg" || ext === "jpg"
            ? "jpg"
            : ext === "svg+xml"
                ? "svg"
                : ext;
    }

    const dataMatch = url.match(/^data:image\/([a-z0-9+.-]+);/i);
    if (dataMatch?.[1]) {
        const ext = dataMatch[1].toLowerCase();
        return ext === "jpeg" ? "jpg" : ext;
    }

    const extMatch = url.match(/\.([a-z0-9]+)(?:$|[?#])/i);
    if (extMatch?.[1]) return extMatch[1].toLowerCase();

    // Default fallback to PNG for safety
    return "png";
};

/**
 * Convert base64 data URL → Blob
 * Needed for uploading AI outputs & user uploads to hosting FS
 */
export const dataUrlToBlob = (
    dataUrl: string,
): { blob: Blob; contentType: string } | null => {
    try {
        const match = dataUrl.match(/^data:([^;]+)?(;base64)?,([\s\S]*)$/i);
        if (!match) return null;

        const contentType = match[1] || "";
        const isBase64 = !!match[2];
        const data = match[3] || "";

        const raw = isBase64
            ? atob(data.replace(/\s/g, ""))
            : decodeURIComponent(data);

        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) {
            bytes[i] = raw.charCodeAt(i);
        }

        return { blob: new Blob([bytes], { type: contentType }), contentType };
    } catch {
        return null;
    }
};

/**
 * Fetch remote image → Blob
 * Handles both:
 * - normal URLs
 * - base64 data URLs
 */
export const fetchBlobFromUrl = async (
    url: string,
): Promise<{ blob: Blob; contentType: string } | null> => {
    if (url.startsWith("data:")) {
        return dataUrlToBlob(url);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch image");

        return {
            blob: await response.blob(),
            contentType: response.headers.get("content-type") || "",
        };
    } catch {
        return null;
    }
};

/**
 * Normalize any image → PNG blob using canvas
 *
 * Why:
 * - AI outputs sometimes temporary or unsupported formats
 * - Canvas removes cross-origin restrictions
 * - Ensures consistent downloadable format
 */
export const imageUrlToPngBlob = async (url: string): Promise<Blob | null> => {
    if (typeof window === "undefined") return null;

    try {
        const img = new Image();
        img.crossOrigin = "anonymous";

        const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = url;
        });

        const width = loaded.naturalWidth || loaded.width;
        const height = loaded.naturalHeight || loaded.height;
        if (!width || !height) return null;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.drawImage(loaded, 0, 0, width, height);

        return await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((result) => resolve(result), "image/png");
        });
    } catch {
        return null;
    }
};
