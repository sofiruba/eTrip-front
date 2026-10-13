import { useEffect, useState } from 'react'
import { getAllExperiences } from '../../services/experiencesService'
import { getSessions } from '../../services/sessionsService'
import HostCalendar from '../host/HostCalendar'
import Loading from '../ui/Loading'

/** Gestión global de fechas: el mismo calendario del anfitrión, con todas las experiencias. */
function SessionsAdmin() {
  const [experiences, setExperiences] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllExperiences()
      .then((data) => setExperiences(data))
      .catch((error) => console.error('Error al traer las experiencias:', error))
      .then(() => setLoading(false))

    getSessions()
      .then((data) => setSessions(data))
      .catch((error) => console.error('Error al traer las fechas:', error))
  }, [])

  if (loading) return <Loading />

  return <HostCalendar experiences={experiences} sessions={sessions} setSessions={setSessions} />
}

export default SessionsAdmin
