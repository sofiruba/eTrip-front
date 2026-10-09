import { useCallback, useEffect, useMemo, useState } from 'react'
import { StoreContext } from '../hooks/useStore'
import { apiFetch, pageContent } from '../services/api'

const emptyDb = {
  users: [],
  categories: [],
  experiences: [],
  sessions: [],
  orders: [],
  bookings: [],
  hostBookings: [],
  reviews: [],
  coupons: [],
  notifications: [],
}

const normalizeExperience = (item) => ({
  ...item,
  active: item.active !== false,
  images: (item.imagesBase64 ?? item.images ?? []).map((image) => (
    typeof image === 'string' && image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
  )),
  discountPercentage: Number(item.discountPercentage ?? 0),
  finalPrice: Number(item.finalPrice ?? item.price ?? 0),
  subtitle: item.subtitle ?? '',
  durationHours: item.durationHours ?? 2,
  minAge: item.minAge ?? 0,
  includes: item.includes ?? [],
})

const normalizeSession = (item) => ({
  ...item,
  experienceId: Number(item.experienceId),
  startsAt: item.startsAt,
  endsAt: item.endsAt,
  active: item.active !== false,
})

const normalizeBooking = (item) => ({
  ...item,
  buyerId: item.buyerId ?? item.userId,
  experienceSessionId: Number(item.experienceSessionId),
  experienceId: Number(item.experienceId),
  quantity: Number(item.quantity ?? 0),
  unitPrice: item.unitPrice == null ? null : Number(item.unitPrice),
})

const toExperienceRequest = (data) => {
  const experience = { ...data }
  const unsupportedFields = ['images', 'discountPercentage', 'subtitle', 'durationHours', 'minAge', 'includes', 'publisherId']
  unsupportedFields.forEach((key) => {
    delete experience[key]
  })
  return experience
}

const normalizeOrder = (item) => ({
  ...item,
  userId: item.userId,
  subtotal: Number(item.subtotal ?? 0),
  discountAmount: Number(item.discountAmount ?? 0),
  total: Number(item.total ?? 0),
  bookings: (item.bookings ?? []).map(normalizeBooking),
})

function StoreProvider({ children }) {
  const [db, setDb] = useState(emptyDb)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [categories, experiences, sessions] = await Promise.all([
        apiFetch('/experience-categories'),
        apiFetch('/experiences?includeInactive=true'),
        apiFetch('/experience-sessions?onlyAvailable=false'),
      ])
      const next = {
        ...emptyDb,
        categories: pageContent(categories),
        experiences: pageContent(experiences).map(normalizeExperience),
        sessions: pageContent(sessions).map(normalizeSession),
      }
      const protectedRequests = [
        ['users', '/users'],
        ['orders', '/orders'],
        ['bookings', '/bookings'],
        ['hostBookings', '/bookings/sales'],
        ['reviews', '/reviews'],
        ['coupons', '/discount-coupons'],
        ['notifications', '/notifications'],
      ]
      const protectedResults = await Promise.all(
        protectedRequests.map(async ([key, endpoint]) => {
          try {
            const response = await apiFetch(endpoint)
            return [key, pageContent(response)]
          } catch {
            return [key, []]
          }
        }),
      )
      protectedResults.forEach(([key, value]) => {
        next[key] = value
      })
      next.experiences = next.experiences.map(normalizeExperience)
      next.sessions = next.sessions.map(normalizeSession)
      const publicReviews = await Promise.all(
        next.experiences.map(async (experience) => {
          try {
            return pageContent(await apiFetch(`/reviews/experience/${experience.id}`))
          } catch {
            return []
          }
        }),
      )
      next.reviews = publicReviews.flat()
      next.experiences = next.experiences.map((experience) => {
        const upcoming = next.sessions
          .filter((session) => session.experienceId === experience.id && session.active && new Date(session.startsAt) >= new Date())
          .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
        return {
          ...experience,
          nextSession: upcoming.find((session) => session.availableSeats > 0) ?? null,
          upcomingCount: upcoming.length,
          availableSeats: upcoming.reduce((sum, session) => sum + (session.availableSeats ?? 0), 0),
        }
      })
      next.bookings = next.bookings.map(normalizeBooking)
      next.hostBookings = next.hostBookings.map(normalizeBooking)
      next.orders = next.orders.map(normalizeOrder)
      setDb(next)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const updateDb = useCallback((collection, updater) => {
    setDb((current) => ({ ...current, [collection]: updater(current[collection]) }))
  }, [])

  const create = useCallback(
    async (collection, data) => {
      const endpoints = {
        categories: ['/experience-categories', 'json'],
        coupons: ['/discount-coupons', 'json'],
        sessions: ['/experience-sessions', 'json'],
      }
      if (collection === 'experiences') {
        const form = new FormData()
        const { images = [], discountPercentage } = data
        const experience = toExperienceRequest(data)
        form.append('experience', JSON.stringify(experience))
        images.filter((image) => image instanceof File).forEach((image) => form.append('images', image))
        const result = normalizeExperience(await apiFetch('/experiences', { method: 'POST', body: form }))
        updateDb(collection, (items) => [...items, result])
        if (discountPercentage) {
          const discounted = normalizeExperience(await apiFetch(`/experiences/${result.id}/discount`, {
            method: 'PATCH',
            body: JSON.stringify({ discountPercentage }),
          }))
          updateDb(collection, (items) => items.map((item) => (item.id === result.id ? discounted : item)))
          return discounted
        }
        return result
      }
      const [endpoint] = endpoints[collection] ?? []
      const requestData = collection === 'sessions'
        ? { experienceId: data.experienceId, startsAt: data.startsAt, endsAt: data.endsAt, capacity: data.capacity }
        : data
      const result = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(requestData) })
      const normalized = collection === 'sessions' ? normalizeSession(result) : result
      updateDb(collection, (items) => [...items, normalized])
      return normalized
    },
    [updateDb],
  )

  const update = useCallback(
    async (collection, id, data) => {
      const endpointMap = {
        categories: `/experience-categories/${id}`,
        coupons: `/discount-coupons/${id}`,
        sessions: `/experience-sessions/${id}`,
      }
      let result
      if (collection === 'experiences') {
        if (Object.keys(data).length === 1 && data.active !== undefined) {
          result = normalizeExperience(await apiFetch(`/experiences/${id}/status?active=${Boolean(data.active)}`, { method: 'PATCH' }))
          updateDb(collection, (items) => items.map((item) => (item.id === id ? result : item)))
          return result
        }
        if (Object.keys(data).length === 1 && data.discountPercentage !== undefined) {
          result = normalizeExperience(await apiFetch(`/experiences/${id}/discount`, {
            method: 'PATCH',
            body: JSON.stringify({ discountPercentage: data.discountPercentage }),
          }))
          updateDb(collection, (items) => items.map((item) => (item.id === id ? result : item)))
          return result
        }
        const form = new FormData()
        const { images = [] } = data
        const experience = toExperienceRequest(data)
        form.append('experience', JSON.stringify(experience))
        images.filter((image) => image instanceof File).forEach((image) => form.append('images', image))
        result = await apiFetch(`/experiences/${id}`, { method: 'PUT', body: form })
        result = normalizeExperience(result)
      } else {
        const requestData = collection === 'sessions'
          ? { experienceId: data.experienceId, startsAt: data.startsAt, endsAt: data.endsAt, capacity: data.capacity }
          : data
        if (collection === 'users') {
          const endpoint = data.role
            ? `/users/${id}/role?role=${encodeURIComponent(data.role)}`
            : `/users/${id}/status?active=${Boolean(data.active)}`
          result = await apiFetch(endpoint, { method: 'PATCH' })
        } else {
          result = await apiFetch(endpointMap[collection], { method: 'PUT', body: JSON.stringify(requestData) })
        }
        if (collection === 'sessions') result = normalizeSession(result)
      }
      updateDb(collection, (items) => items.map((item) => (item.id === id ? result : item)))
      return result
    },
    [updateDb],
  )

  const remove = useCallback(
    async (collection, id) => {
      const endpoints = {
        categories: `/experience-categories/${id}`,
        coupons: `/discount-coupons/${id}`,
        sessions: `/experience-sessions/${id}`,
        experiences: `/experiences/${id}`,
        reviews: `/reviews/${id}`,
      }
      await apiFetch(endpoints[collection], { method: 'DELETE' })
      updateDb(collection, (items) => items.filter((item) => item.id !== id))
    },
    [updateDb],
  )

  const placeOrder = useCallback(async ({ coupon }) => {
    const order = normalizeOrder(
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({ couponCode: coupon?.code || null }),
      }),
    )
    updateDb('orders', (items) => [...items, order])
    updateDb('bookings', (items) => [...items, ...(order.bookings ?? [])])
    return { order, bookings: order.bookings ?? [] }
  }, [updateDb])

  const refundBooking = useCallback(async (bookingId) => {
    const booking = normalizeBooking(await apiFetch(`/bookings/${bookingId}/refund`, { method: 'POST' }))
    updateDb('bookings', (items) => items.map((item) => (item.id === booking.id ? booking : item)))
    updateDb('hostBookings', (items) => items.map((item) => (item.id === booking.id ? booking : item)))
    return booking
  }, [updateDb])

  const markNotificationRead = useCallback(async (notificationId) => {
    const notification = await apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' })
    updateDb('notifications', (items) => items.map((item) => (item.id === notification.id ? notification : item)))
    return notification
  }, [updateDb])

  const value = useMemo(
    () => ({
      db,
      experiences: db.experiences,
      loading,
      error,
      reload,
      create,
      update,
      remove,
      placeOrder,
      refundBooking,
      markNotificationRead,
      removeExperience: (id) => remove('experiences', id),
    }),
    [db, loading, error, reload, create, update, remove, placeOrder, refundBooking, markNotificationRead],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export default StoreProvider
