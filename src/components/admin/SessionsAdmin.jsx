import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchManagedExperiences } from '../../redux/experiencesSlice'
import { fetchManagedSessions } from '../../redux/sessionsSlice'
import { byStartsAt } from '../../utils/experiences'
import HostCalendar from '../host/HostCalendar'
import ErrorState from '../ui/ErrorState'
import Loading from '../ui/Loading'

/** Gestión global de fechas: el mismo calendario del anfitrión, con todas las experiencias. */
function SessionsAdmin() {
  const dispatch = useDispatch()
  // Como admin, "managed" son todas las experiencias y todas las fechas del sitio (también las pasadas y las canceladas)
  const experiences = useSelector((state) => state.experiences.managed)
  const sessions = useSelector((state) => state.sessions.managed.items)

  useEffect(() => {
    dispatch(fetchManagedExperiences())
    dispatch(fetchManagedSessions())
  }, [dispatch])

  if (experiences.error) return <ErrorState message={experiences.error} onRetry={() => dispatch(fetchManagedExperiences())} />
  if (!experiences.loaded) return <Loading />

  return <HostCalendar experiences={experiences.items} sessions={[...sessions].sort(byStartsAt)} />
}

export default SessionsAdmin
