import puter from "@heyputer/puter.js";
import { getOrCreateHostingConfig, uploadImageToHosting } from "./puter.hosting";
import { isHostedUrl } from "./utils";
import { PUTER_WORKER_URL } from "./constants";

export const signIn = async () => await puter.auth.signIn();

export const signOut = () => puter.auth.signOut();

export const getCurrentUser = async () => {
    try {
        return await puter.auth.getUser();
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
};

export const createProject = async ({ item, visibility = "private" }: CreateProjectParams): Promise<DesignItem | null | undefined> => {
    if (!PUTER_WORKER_URL) {
        console.warn("PUTER_WORKER_URL is not defined. Cannot fetch projects.");
        return null;
    }

    const projectId = item.id;

    const hosting = await getOrCreateHostingConfig();

    const hostedSource = projectId ? await uploadImageToHosting({ hosting, url: item.sourceImage, projectId, label: "source" }) : null;

    const hostedRendered = projectId && item.renderedImage ? await uploadImageToHosting({ hosting, url: item.renderedImage, projectId, label: "rendered" }) : null;

    const resolvedSource = hostedSource?.url || (isHostedUrl(item.sourceImage) ? item.sourceImage : null);

    if (!resolvedSource) {
        console.warn("Failed to host source image, skipping save.");
        return null;
    }

    const resolvedRendered = hostedRendered?.url || (item.renderedImage && isHostedUrl(item.renderedImage) ? item.renderedImage : undefined);

    const {
        sourcePath: _sourcePath,
        renderedPath: _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item;

    const payload = {
        ...rest,
        sourceImage: resolvedSource,
        renderedImage: resolvedRendered,
    };

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/save`, {
            method: "POST",
            body: JSON.stringify({ project: payload, visibility }),
        });

        if (!response.ok) {
            console.error("Failed to save project, status:", await response.text());
            return null;
        }

        const data = (await response.json()) as { project?: DesignItem | null };

        return data?.project ?? null;
    } catch (error) {
        console.error("Error saving project:", error);
        return null;
    }
};

export const getProjects = async (): Promise<DesignItem[]> => {
    if (!PUTER_WORKER_URL) {
        console.warn("PUTER_WORKER_URL is not defined. Cannot fetch projects.");
        return [];
    }

    try {
        const response = await puter.workers.exec(`${PUTER_WORKER_URL}/api/projects/list`, { method: "GET" });

        if (!response.ok) {
            console.error("Failed to fetch projects, status:", await response.text());
            return [];
        }

        const data = (await response.json()) as { projects?: DesignItem[] | null };

        return Array.isArray(data.projects) ? data.projects : [];
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
    };
};

export const getProjectById = async ({ id }: { id: string }) => {
    if (!PUTER_WORKER_URL) {
        console.warn("Missing VITE_PUTER_WORKER_URL; skipping project fetch.");
        return null;
    }

    try {
        const response = await puter.workers.exec(
            `${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
            { method: "GET" },
        );

        if (!response.ok) {
            console.error("Failed to fetch project:", await response.text());
            return null;
        }

        const data = (await response.json()) as {
            project?: DesignItem | null;
        };

        return data?.project ?? null;
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return null;
    }
};
