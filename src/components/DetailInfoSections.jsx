function DetailInfoSections({ item }) {
  return <>
    <section className="detail-info"><h2>Dónde nos encontramos</h2><p>{item.location}</p><div className="fake-map"><span>⌖</span><strong>Punto de encuentro</strong></div></section>
    <section className="detail-info host-section"><h2>Información sobre el anfitrión</h2><div className="host-profile"><span className="big-avatar">NF</span><div><h3>{item.host}</h3><p>Una persona local que disfruta compartir sus planes favoritos.</p></div></div></section>
    <section className="good-to-know"><h2>Qué tenés que saber</h2><div><article><span>♧</span><strong>Requisitos</strong><p>Una experiencia pensada para mayores de 18 años.</p></article><article><span>⌁</span><strong>Nivel de actividad</strong><p>El nivel de actividad es tranquilo y accesible.</p></article><article><span>✓</span><strong>¿Qué incluye?</strong><p>Todo lo necesario para disfrutar el plan.</p></article></div></section>
  </>
}

export default DetailInfoSections
