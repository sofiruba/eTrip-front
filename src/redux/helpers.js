/**
 * Funciones chicas que comparten los slices para actualizar listas dentro de los reducers.
 * "Mutan" la lista porque Redux Toolkit (Immer) convierte esos cambios en un estado nuevo:
 * el estado global nunca se modifica directamente.
 */

/** PUT: busca con findIndex el elemento con el mismo id y lo reemplaza. Si da -1, no estaba. */
export function replaceById(list, updated) {
  const index = list.findIndex((item) => item.id === updated.id)
  if (index !== -1) list[index] = updated
}

/** Si ya está, lo reemplaza; si no, lo agrega al final. */
export function upsertById(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id)
  if (index !== -1) list[index] = item
  else list.push(item)
}

/** DELETE: saca de la lista el elemento con ese id. */
export function removeById(list, id) {
  const index = list.findIndex((item) => item.id === id)
  if (index !== -1) list.splice(index, 1)
}

/**
 * Para los useEffect que piden varias listas: true si la lista todavía no se trajo, no se está trayendo y no falló.
 * Así cada GET se hace una sola vez (si falló, se vuelve a pedir con el botón "Reintentar").
 */
export const isMissing = (list) => !list.loaded && !list.loading && !list.error

/**
 * Usuario del back → usuario del front. La foto de perfil viene en base64 (`avatarBase64`): la pasamos a un
 * data URL (`avatarUrl`) que entiende <img src>. Lo usan el slice de sesión (yo) y el de usuarios (perfiles públicos).
 */
export function toUser({ avatarBase64, ...user }) {
  return {
    ...user,
    avatarUrl: avatarBase64 ? `data:image/jpeg;base64,${avatarBase64}` : null,
    interests: user.interests ?? [],
  }
}
