import { createContext, useContext } from 'react'

export const StoreContext = createContext(null)

/** Acceso a la base en memoria: { db, experiences, create, update, remove, placeOrder, ... } */
export function useStore() {
  return useContext(StoreContext)
}
