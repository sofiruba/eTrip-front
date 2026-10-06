import { addHours, daysFromToday } from './dates'

// Forma de ExperienceSessionResponseDTO (sin experienceTitle, que sale de la experiencia)
const session = (id, experienceId, days, time, durationHours, capacity, availableSeats) => {
  const startsAt = daysFromToday(days, time)
  return { id, experienceId, startsAt, endsAt: addHours(startsAt, durationHours), capacity, availableSeats, active: true }
}

export const sessions = [
  session(1, 1, 12, '16:00', 3, 12, 7),
  session(2, 1, 19, '16:00', 3, 12, 12),
  session(3, 1, 26, '11:00', 3, 12, 12),
  session(4, 1, -20, '16:00', 3, 12, 2),
  session(5, 2, 5, '18:00', 2.5, 8, 3),
  session(6, 2, 12, '18:00', 2.5, 8, 8),
  session(7, 2, -25, '18:00', 2.5, 8, 0),
  session(8, 3, 20, '18:30', 3, 10, 9),
  session(9, 3, 27, '18:30', 3, 10, 10),
  session(10, 3, -30, '18:30', 3, 10, 1),
  session(11, 4, 9, '20:00', 2, 14, 11),
  session(12, 4, 16, '20:00', 2, 14, 14),
  session(13, 4, -15, '20:00', 2, 14, 3),
]
