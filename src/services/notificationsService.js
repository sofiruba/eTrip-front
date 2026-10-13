import { request, requestList } from './api'

export const getNotifications = () => requestList('/notifications')
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, 'PATCH')
