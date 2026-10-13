import { request, requestList } from './api'

// Todas las fechas (también las agotadas y las pasadas)
export const getSessions = () => requestList('/experience-sessions?onlyAvailable=false')

export const getSessionsByExperience = (experienceId) =>
  requestList(`/experience-sessions/experience/${experienceId}?onlyAvailable=false`)

// session = { experienceId, startsAt, endsAt, capacity }
export const createSession = (session) => request('/experience-sessions', 'POST', session)
export const updateSession = (id, session) => request(`/experience-sessions/${id}`, 'PUT', session)
export const deleteSession = (id) => request(`/experience-sessions/${id}`, 'DELETE')
