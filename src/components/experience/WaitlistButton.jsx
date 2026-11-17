import { BellRing, BellOff } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { openAuth } from '../../redux/authSlice'
import { showToast } from '../../redux/toastsSlice'
import { joinWaitlist, leaveWaitlist } from '../../redux/waitlistSlice'
import { formatShortDate } from '../../utils/format'
import Button from '../ui/Button'

/**
 * "Avisame si se libera un lugar" en una fecha agotada (POST / DELETE /experience-sessions/{id}/waitlist).
 * Si ya estoy anotado, el botón sirve para bajarme. Sin sesión abre el login.
 */
function WaitlistButton({ session, size = 'sm' }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const waiting = useSelector((state) => state.waitlist.sessionIds.includes(session.id))

  const toggle = () => {
    if (!user) return dispatch(openAuth({ mode: 'login' }))
    const action = waiting ? leaveWaitlist(session.id) : joinWaitlist(session.id)
    return dispatch(action)
      .then((result) => {
        if (result.error) {
          return dispatch(showToast({ message: result.error.message, tone: 'error' }))
        }
        if (waiting) return dispatch(showToast({ message: 'Te bajaste de la lista de espera', tone: 'info' }))
        return dispatch(
          showToast({ message: `Listo: te avisamos si se libera un lugar el ${formatShortDate(session.startsAt)}.` }),
        )
      })
  }

  return (
    <Button size={size} variant={waiting ? 'ghost' : 'secondary'} icon={waiting ? BellOff : BellRing} onClick={toggle}>
      {waiting ? 'En lista de espera' : 'Avisame si se libera un lugar'}
    </Button>
  )
}

export default WaitlistButton
