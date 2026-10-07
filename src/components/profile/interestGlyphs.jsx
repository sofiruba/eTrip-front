/**
 * Íconos de línea propios (mismo formato que lucide: 24×24, trazo redondeado) para los intereses
 * que lucide no trae o no se parecen al estilo que buscamos.
 */
function LineIcon({ size = 24, strokeWidth = 2, children, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export function Snorkel(props) {
  return (
    <LineIcon {...props}>
      <path d="M3 9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v2.5a3.5 3.5 0 0 1-3.5 3.5h-.6a1 1 0 0 1-.8-.4l-.7-.9a1 1 0 0 0-1.6 0l-.7.9a1 1 0 0 1-.8.4h-.6A3.5 3.5 0 0 1 3 11.5z" />
      <path d="M19 3v12a5 5 0 0 1-5 5h-2" />
      <path d="M12 18.5v3" />
    </LineIcon>
  )
}

export function Cloche(props) {
  return (
    <LineIcon {...props}>
      <path d="M4 17a8 8 0 0 1 16 0" />
      <path d="M2 17h20" />
      <path d="M12 9V6" />
      <path d="M10 6h4" />
      <path d="M4 20h16" />
    </LineIcon>
  )
}

export function Column(props) {
  return (
    <LineIcon {...props}>
      <path d="M4 4h16" />
      <circle cx="7" cy="7" r="2" />
      <circle cx="17" cy="7" r="2" />
      <path d="M9 7h6" />
      <path d="M8 9v10" />
      <path d="M16 9v10" />
      <path d="M12 10v8" />
      <path d="M6 19h12" />
      <path d="M5 21h14" />
    </LineIcon>
  )
}

export function TreeMountain(props) {
  return (
    <LineIcon {...props}>
      <path d="M7 2.5 3 9.5h8z" />
      <path d="M7 9.5V15" />
      <path d="m11 13 3.5-5 5.5 7.5" />
      <path d="M3 18c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
      <path d="M6 21.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
    </LineIcon>
  )
}

export function Boot(props) {
  return (
    <LineIcon {...props}>
      <path d="M6 3h5v6l5 2.5a4 4 0 0 1 4 3.6V17H4v-5l2-3z" />
      <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
      <path d="M8 6h3" />
      <path d="M8.5 9H11" />
    </LineIcon>
  )
}

export function Walker(props) {
  return (
    <LineIcon {...props}>
      <circle cx="13" cy="4" r="2" />
      <path d="m13 7.5-2 6.5" />
      <path d="m11 14 3 3v5" />
      <path d="m11 14-3 8" />
      <path d="m12.5 9-3 2-1 3" />
      <path d="m12.6 9 2.4 3 3 1" />
    </LineIcon>
  )
}

export function Basketball(props) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="M5.6 5.6a9 9 0 0 1 0 12.8" />
      <path d="M18.4 5.6a9 9 0 0 0 0 12.8" />
    </LineIcon>
  )
}

export function Baseball(props) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.8c2 1.6 3 3.8 3 6.2s-1 4.6-3 6.2" />
      <path d="M18.5 5.8c-2 1.6-3 3.8-3 6.2s1 4.6 3 6.2" />
      <path d="m6.6 8.6 1.6-.6M7.4 12h1.8M6.6 15.4l1.6.6" />
      <path d="m17.4 8.6-1.6-.6M16.6 12h-1.8M17.4 15.4l-1.6.6" />
    </LineIcon>
  )
}

export function Bowling(props) {
  return (
    <LineIcon {...props}>
      <path d="M9 3a1.5 1.5 0 0 0-1.5 1.5c0 1 .5 1.5.5 2.5S6 9.5 6 13s1 6 1.5 8h3c.5-2 1.5-4.5 1.5-8s-2-5-2-6 .5-1.5.5-2.5A1.5 1.5 0 0 0 9 3z" />
      <path d="M7.7 7.5h2.6" />
      <circle cx="17" cy="17" r="4" />
      <circle cx="16" cy="15.6" r=".5" />
      <circle cx="18.2" cy="15.8" r=".5" />
    </LineIcon>
  )
}

export function BoxingGlove(props) {
  return (
    <LineIcon {...props}>
      <path d="M8 17V9a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v3a5 5 0 0 1-3 4.6V17" />
      <path d="M8 9H6.5a2.5 2.5 0 0 0 0 5H11" />
      <rect x="7.5" y="17" width="10" height="4" rx="1" />
    </LineIcon>
  )
}

export function SoccerBall(props) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 8 3.8 2.8-1.5 4.4H9.7l-1.5-4.4z" />
      <path d="M12 8V3.5M15.8 10.8l4.3-1.4M14.3 15.2l2.7 3.6M9.7 15.2 7 18.8M8.2 10.8 3.9 9.4" />
    </LineIcon>
  )
}

export function DeskGlobe(props) {
  return (
    <LineIcon {...props}>
      <circle cx="11" cy="10" r="6" />
      <path d="M5 10h12" />
      <path d="M11 4a3 6 0 0 1 0 12 3 6 0 0 1 0-12" />
      <path d="M16.66 4.34A8 8 0 0 1 5.34 15.66" />
      <path d="M11 18v3" />
      <path d="M7.5 21h7" />
    </LineIcon>
  )
}

export function Lotus(props) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="m6.5 13.5 3-4.5h5l3 4.5" />
      <path d="m9.5 9 .5 5h4l.5-5" />
      <path d="M4 18c2-1 5-2 8-2s6 1 8 2" />
      <path d="M4 18c0 1 1 1.5 2 1.5h12c1 0 2-.5 2-1.5" />
    </LineIcon>
  )
}

export function Surfboard(props) {
  return (
    <LineIcon {...props}>
      <path d="M5 19C3 13 13 3 19 5c2 6-8 16-14 14z" />
      <path d="M7.5 16.5 16.5 7.5" />
      <path d="m6.5 14.5-1.5 2" />
    </LineIcon>
  )
}

export function DiscoBall(props) {
  return (
    <LineIcon {...props}>
      <path d="M12 2v5" />
      <circle cx="12" cy="13" r="6" />
      <path d="M6 13h12M6.8 10h10.4M6.8 16h10.4" />
      <path d="M12 7c-2 1.5-2.5 4-2.5 6s.5 4.5 2.5 6" />
      <path d="M12 7c2 1.5 2.5 4 2.5 6s-.5 4.5-2.5 6" />
      <path d="M20 3v3M18.5 4.5h3" />
    </LineIcon>
  )
}

export function TennisBall(props) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.5 5.8c2 1.6 3 3.8 3 6.2s-1 4.6-3 6.2" />
      <path d="M18.5 5.8c-2 1.6-3 3.8-3 6.2s1 4.6 3 6.2" />
    </LineIcon>
  )
}

export function PingPong(props) {
  return (
    <LineIcon {...props}>
      <circle cx="9.5" cy="9.5" r="6.5" />
      <path d="m14.1 14.1 1.4 1.4" />
      <path d="m15 17 3.5 3.5a1.5 1.5 0 0 0 2.1-2.1L17 15" />
      <circle cx="6" cy="19.5" r="1.5" />
    </LineIcon>
  )
}

export function TargetArrow(props) {
  return (
    <LineIcon {...props}>
      <circle cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="4.5" />
      <circle cx="11" cy="13" r="1" />
      <path d="m11 13 8.5-8.5" />
      <path d="M19.5 4.5H22M19.5 4.5V2M17.5 6.5H20M17.5 6.5V4" />
    </LineIcon>
  )
}

export function Drinks(props) {
  return (
    <LineIcon {...props}>
      <path d="M3 7h8l-1.2 14H4.2z" />
      <path d="M3.5 12h7" />
      <path d="m8 7 2-4" />
      <path d="M13.5 4h6c0 4-1.3 6-3 6s-3-2-3-6z" />
      <path d="M16.5 10v11" />
      <path d="M14 21h5" />
    </LineIcon>
  )
}
