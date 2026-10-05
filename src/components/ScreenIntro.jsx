function ScreenIntro({ eyebrow, title, accent, description }) {
  return <div className="page-title"><span className="intro-tag">{eyebrow}</span><h1>{title} <em>{accent}</em></h1><p>{description}</p></div>
}

export default ScreenIntro
