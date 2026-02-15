// Prefix used to namespace all project records in KV storage
const PROJECT_PREFIX = 'planora_project_';

/**
 * Standard JSON error response helper
 * Adds CORS header so frontend can read error body
 */
const jsonError = (status, message, extra = {}) => {
    return new Response(JSON.stringify({ error: message, ...extra }), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    })
}

/**
 * Extract authenticated user ID from Puter session
 * Returns null if user session invalid/expired
 */
const getUserId = async (userPuter) => {
    try {
        const user = await userPuter.auth.getUser();
        return user?.uuid || null;
    } catch {
        return null;
    }
}

/* ---------------- SAVE PROJECT ---------------- */

/**
 * Stores project metadata in KV
 * Note: Images are NOT stored here — only hosted URLs
 */
router.post('/api/projects/save', async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, 'Authentication failed');

        const body = await request.json();
        const project = body?.project;

        if (!project?.id || !project?.sourceImage)
            return jsonError(400, 'Project ID and source image are required');

        // Add server timestamp
        const payload = {
            ...project,
            updatedAt: new Date().toISOString(),
        }

        // Validate session
        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, 'Authentication failed');

        // KV key per project
        const key = `${PROJECT_PREFIX}${project.id}`;
        await userPuter.kv.set(key, payload);

        return { saved: true, id: project.id, project: payload }

    } catch (e) {
        // Serialize unknown errors safely for debugging
        let errorDetails;
        try {
            errorDetails = JSON.stringify(e, Object.getOwnPropertyNames(e));
        } catch {
            errorDetails = String(e);
        }

        console.error("FULL ERROR:", e);

        return jsonError(500, 'Failed to save project', {
            message: e?.message || 'Unknown error',
            fullError: errorDetails,
        });
    }
})

/**
 * Returns all projects belonging to user
 * KV prefix listing used instead of DB query
 */
router.get('/api/projects/list', async ({ user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, 'Authentication failed');

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, 'Authentication failed');

        const projects = (await userPuter.kv.list(PROJECT_PREFIX, true))
            .map(({ value }) => ({ ...value, isPublic: true }))

        return { projects };

    } catch (e) {
        return jsonError(500, 'Failed to list projects', { message: e.message || 'Unknown error' });
    }
})

/**
 * Fetch a specific project by ID
 */
router.get('/api/projects/get', async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, 'Authentication failed');

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, 'Authentication failed');

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return jsonError(400, 'Project ID is required');

        const key = `${PROJECT_PREFIX}${id}`;
        const project = await userPuter.kv.get(key);

        if (!project) return jsonError(404, 'Project not found');

        return { project };

    } catch (e) {
        return jsonError(500, 'Failed to get project', { message: e.message || 'Unknown error' });
    }
})
