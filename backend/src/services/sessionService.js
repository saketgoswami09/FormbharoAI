// In-memory session store
const sessions = new Map();

// Helper to add session with TTL
export const createSession = (data) => {
    const sessionId = Math.random().toString(36).substring(7);
    const session = {
        data,
        history: [], // Initialize history
        createdAt: Date.now(),
        timer: setTimeout(() => sessions.delete(sessionId), 30 * 60 * 1000) // 30 min TTL
    };
    sessions.set(sessionId, session);
    return sessionId;
};

export const getSession = (sessionId) => sessions.get(sessionId);

export const updateSession = (sessionId, data) => {
    const session = sessions.get(sessionId);
    if (session) {
        sessions.set(sessionId, { ...session, ...data });
    }
};
