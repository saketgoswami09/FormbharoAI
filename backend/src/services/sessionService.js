const sessions = new Map();

export const createSession = (sessionId, data) => {
    console.log(`[SessionService] createSession called for id: ${sessionId}`);
    const session = {
        ...data,
        createdAt: Date.now(),
        timer: setTimeout(() => {
            console.log(`[SessionService] TTL expired for id: ${sessionId}`);
            sessions.delete(sessionId);
        }, 30 * 60 * 1000)
    };
    sessions.set(sessionId, session);
    console.log(`[SessionService] current map size: ${sessions.size}`);
};

export const getSession = (sessionId) => {
    console.log(`[SessionService] getSession called for id: ${sessionId}`);
    console.log(`[SessionService] session exists? ${sessions.has(sessionId)}`);
    return sessions.get(sessionId);
};

export const updateSession = (sessionId, data) => {
    console.log(`[SessionService] updateSession called for id: ${sessionId}`);
    const session = sessions.get(sessionId);
    if (session) {
        sessions.set(sessionId, { ...session, ...data });
    }
};

export const deleteSession = (sessionId) => {
    console.log(`[SessionService] deleteSession called for id: ${sessionId}`);
    const session = sessions.get(sessionId);
    if (session) clearTimeout(session.timer);
    sessions.delete(sessionId);
};
