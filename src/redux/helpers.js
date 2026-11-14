/**
 * Funciones chicas que comparten los slices.
 * Las de listas trabajan "mutando" porque se usan dentro de los reducers: Redux Toolkit (Immer)
 * convierte esos cambios en un estado nuevo, así que el estado global nunca se modifica directamente.
 */

/**
 * Opción `condition` de createAsyncThunk para los GET: el pedido se hace UNA sola vez.
 * Si los datos ya están en el store (o se están trayendo), no se vuelve a pedir: cualquier componente
 * puede despachar la acción al montarse sin repetir la llamada al back.
 * `dispatch(fetchX({ force: true }))` lo fuerza (por ejemplo, para sincronizar después de un error del back).
 */
export const onlyOnce = (selectSlice) => ({
  condition: (arg, { getState }) => {
    const { loaded, loading } = selectSlice(getState())
    return Boolean(arg?.force) || (!loaded && !loading)
  },
})

/** Reemplaza el elemento con el mismo id (findIndex, como el PUT de clase). Si no está, no hace nada. */
export function replaceById(list, updated) {
  const index = list.findIndex((item) => item.id === updated.id)
  if (index !== -1) list[index] = updated
}

/** Si ya está, lo reemplaza; si no, lo agrega al final (como el POST de clase). */
export function upsertById(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id)
  if (index !== -1) list[index] = item
  else list.push(item)
}

/** Saca de la lista el elemento con ese id. */
export function removeById(list, id) {
  const index = list.findIndex((item) => item.id === id)
  if (index !== -1) list.splice(index, 1)
}
