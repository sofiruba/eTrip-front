import { useMemo, useState } from 'react'
import { initialDatabase } from '../data'
import { findById, toExperienceDTO } from '../data/selectors'
import { buildOrder } from '../utils/orders'
import { toLocalIso } from '../data/dates'
import { StoreContext } from '../hooks/useStore'

let lastId = 10000
const reserveIds = (count = 1) => {
  const first = lastId + 1
  lastId += count
  return first
}

/**
 * Simula el backend en memoria. Cada acción equivale a un endpoint;
 * al conectar la API, estas funciones pasan a hacer los fetch.
 */
function StoreProvider({ children }) {
  const [db, setDb] = useState(initialDatabase)

  const value = useMemo(() => {
    const updateCollection = (collection, updater) =>
      setDb((current) => ({ ...current, [collection]: updater(current[collection]) }))

    const create = (collection, data) => {
      const item = { ...data, id: reserveIds() }
      updateCollection(collection, (items) => [...items, item])
      return item
    }

    const update = (collection, id, patch) =>
      updateCollection(collection, (items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))

    const remove = (collection, id) => updateCollection(collection, (items) => items.filter((item) => item.id !== id))

    const changeSeats = (sessions, sessionId, delta) =>
      sessions.map((session) =>
        session.id === sessionId ? { ...session, availableSeats: session.availableSeats + delta } : session,
      )

    const placeOrder = ({ buyer, items, coupon }) => {
      const orderId = reserveIds()
      const { order, bookings } = buildOrder({
        orderId,
        firstBookingId: reserveIds(items.length),
        buyer,
        items,
        coupon,
        createdAt: toLocalIso(new Date()),
        sessions: db.sessions,
        experiences: db.experiences,
      })
      setDb((current) => ({
        ...current,
        orders: [...current.orders, order],
        bookings: [...current.bookings, ...bookings],
        sessions: items.reduce((sessions, item) => changeSeats(sessions, item.sessionId, -item.quantity), current.sessions),
      }))
      return { order, bookings }
    }

    const refundBooking = (bookingId) => {
      const booking = findById(db.bookings, bookingId)
      setDb((current) => ({
        ...current,
        bookings: current.bookings.map((entry) =>
          entry.id === bookingId ? { ...entry, refunded: true, refundedAt: toLocalIso(new Date()) } : entry,
        ),
        sessions: changeSeats(current.sessions, booking.experienceSessionId, booking.quantity),
      }))
    }

    const removeExperience = (experienceId) =>
      setDb((current) => ({
        ...current,
        experiences: current.experiences.filter((experience) => experience.id !== experienceId),
        sessions: current.sessions.filter((session) => session.experienceId !== experienceId),
      }))

    return {
      db,
      experiences: db.experiences.map((experience) => toExperienceDTO(db, experience)),
      create,
      update,
      remove,
      placeOrder,
      refundBooking,
      removeExperience,
    }
  }, [db])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export default StoreProvider
