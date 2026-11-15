import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllExperiences } from '../../redux/experiencesSlice'
import { isMissing } from '../../redux/helpers'
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
  const managedSessions = useSelector((state) => state.sessions.managed)
  const sessions = managedSessions.items

  useEffect(() => {
    if (isMissing(experiences)) dispatch(fetchAllExperiences())
    if (isMissing(managedSessions)) dispatch(fetchManagedSessions())
  }, [experiences, managedSessions, dispatch])

  if (experiences.error) return <ErrorState message={experiences.error} onRetry={() => dispatch(fetchAllExperiences())} />
  if (!experiences.loaded) return <Loading />

  return <HostCalendar experiences={experiences.items} sessions={[...sessions].sort(byStartsAt)} />
}

export default SessionsAdmin
