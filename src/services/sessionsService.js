import { request, requestList } from './api'

// Fechas públicas: el back solo manda las activas y futuras (también las agotadas)
export const getSessions = () => requestList('/experience-sessions')

export const getSessionsByExperience = (experienceId) => requestList(`/experience-sessions/experience/${experienceId}`)

// Para gestionar: también las pasadas y las canceladas. Anfitrión → las de sus experiencias; admin → todas
export const getManagedSessions = () => requestList('/experience-sessions/manage')

// session = { experienceId, startsAt, endsAt, capacity }
export const createSession = (session) => request('/experience-sessions', 'POST', session)
export const updateSession = (id, session) => request(`/experience-sessions/${id}`, 'PUT', session)
export const deleteSession = (id) => request(`/experience-sessions/${id}`, 'DELETE')

// Borra del todo una fecha cancelada o terminada (la saca del calendario)
export const removeSession = (id) => request(`/experience-sessions/${id}/permanent`, 'DELETE')
