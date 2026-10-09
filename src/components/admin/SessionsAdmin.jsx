import HostCalendar from '../host/HostCalendar'
import { useStore } from '../../hooks/useStore'

/** Gestión global de fechas para administradores. */
function SessionsAdmin() {
  const { db } = useStore()

  return <HostCalendar experiences={db.experiences} sessions={db.sessions} />
}

export default SessionsAdmin
