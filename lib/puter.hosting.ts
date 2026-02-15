import puter from "@heyputer/puter.js";

import {
  createHostingSlug,
  fetchBlobFromUrl,
  getHostedUrl,
  getImageExtension,
  HOSTING_CONFIG_KEY,
  imageUrlToPngBlob,
  isHostedUrl
} from "./utils";


/**
 * Ensures the user has a hosting bucket
 *
 * We store only metadata in KV storage.
 * Actual images must live in permanent hosting.
 *
 * Flow:
 * - Check KV for existing hosting config
 * - If missing → create a new Puter hosting site
 * - Persist subdomain for reuse
 */
export const getOrCreateHostingConfig = async (): Promise<HostingConfig | null> => {

    const existingConfig = (await puter.kv.get(HOSTING_CONFIG_KEY)) as HostingConfig | null;

    if (existingConfig?.subdomain)
        return { subdomain: existingConfig.subdomain };

    const subdomain = createHostingSlug();

    try {
        const created = await puter.hosting.create(subdomain, ".");
        const config: HostingConfig = { subdomain: created.subdomain };

        // Persist so future uploads reuse same domain
        await puter.kv.set(HOSTING_CONFIG_KEY, config);

        return config;
    } catch (error) {
        console.error("Error creating hosting config:", error);
        return null;
    }
};

/**
 * Uploads an image to permanent hosting
 *
 * Why needed:
 * - AI output URLs are temporary
 * - Base64 cannot be stored in KV (size limit)
 * → Convert to file → upload → store hosted URL
 */
export const uploadImageToHosting = async ({
    hosting,
    url,
    projectId,
    label
}: StoreHostedImageParams): Promise<HostedAsset | null> => {

    if (!hosting || !url) return null;

    // Skip upload if already hosted
    if (isHostedUrl(url)) return { url };

    try {

        /**
         * Rendered images are often data URLs or temporary AI URLs.
         * We normalize them to PNG to ensure consistent format.
         */
        const resolved = label === "rendered"
            ? await imageUrlToPngBlob(url)
                .then((blob) => blob ? { blob, contentType: "image/png" } : null)
            : await fetchBlobFromUrl(url);

        if (!resolved) return null;

        const contentType = resolved.contentType || resolved.blob.type || "";
        const ext = getImageExtension(contentType, url);

        // Organize files per project
        const dir = `projects/${projectId}`;
        const filePath = `${dir}/${label}.${ext}`;

        const uploadFile = new File([resolved.blob], `${label}.${ext}`, { type: contentType });

        // Ensure folder exists then upload
        await puter.fs.mkdir(dir, { createMissingParents: true });
        await puter.fs.write(filePath, uploadFile);

        const hostedUrl = getHostedUrl({ subdomain: hosting.subdomain }, filePath);

        return hostedUrl ? { url: hostedUrl } : null;

    } catch (error) {
        console.warn("Failed to store hosted image:", error);
        return null;
    }
};
