import { request, requestList } from './api'

export const getCategories = () => requestList('/experience-categories')
export const createCategory = (category) => request('/experience-categories', 'POST', category)
export const updateCategory = (id, category) => request(`/experience-categories/${id}`, 'PUT', category)
export const deleteCategory = (id) => request(`/experience-categories/${id}`, 'DELETE')
