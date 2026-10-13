import { request, requestList } from './api'

export const getMe = () => request('/users/me')

// El back solo guarda nombre y apellido (UserUpdateDTO)
export const updateMe = ({ firstName, lastName }) => request('/users/me', 'PUT', { firstName, lastName })

// Perfil público de cualquier usuario (por ejemplo, un anfitrión)
export const getUser = (id) => request(`/users/${id}`)

// Solo administradores
export const getUsers = () => requestList('/users')
export const updateUserRole = (id, role) => request(`/users/${id}/role?role=${role}`, 'PATCH')
export const updateUserStatus = (id, active) => request(`/users/${id}/status?active=${active}`, 'PATCH')
