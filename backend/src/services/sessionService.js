const sessions = new Map();

export const createSession = (sessionId, data) => {
    const session = {
        ...data,
        createdAt: Date.now(),
        timer: setTimeout(() => sessions.delete(sessionId), 30 * 60 * 1000)
    };
    sessions.set(sessionId, session);
};

export const getSession = (sessionId) => sessions.get(sessionId);

export const updateSession = (sessionId, data) => {
    const session = sessions.get(sessionId);
    if (session) {
        sessions.set(sessionId, { ...session, ...data });
    }
};

export const deleteSession = (sessionId) => {
    const session = sessions.get(sessionId);
    if (session) clearTimeout(session.timer);
    sessions.delete(sessionId);
};
