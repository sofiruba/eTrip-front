# Para llenar el back

Notas de lo que tiene que haber en la base de datos para que el front se vea bien.
**Todavía no se carga nada:** esto es la lista para cuando se decida vaciar y llenar la base.

## Categorías (obligatorias)

Las categorías vienen del back (`GET /experience-categories`); el front no tiene una lista propia. Las crea un admin (panel → Categorías) o el importador de datos de ejemplo, que no duplica las que ya existen (compara por nombre).
Se usan en el filtro de la home y en el editor de experiencias.

| Categoría | Descripción |
|---|---|
| _pendiente: pasar la lista_ | |

## Experiencias

- **Al menos 6 con foto**, idealmente de **ciudades distintas**: las usa el hero de la home (tarjetas flotantes alrededor del título). Elige primero las que tienen fecha próxima y mejor puntuación, y trata de no repetir ciudad. Con menos de 6, quedan huecos.
- `location` con formato **"Barrio, Ciudad"** (ej. "La Boca, Buenos Aires"): el front toma la ciudad de lo que está después de la última coma.
- Cada una con al menos una **sesión a futuro**, si no no aparece como disponible.
- Que haya algunas con **descuento** (`discountPercentage`): la home tiene una sección de ofertas.

## Ya existe

- [src/data/sampleData.json](src/data/sampleData.json): datos de ejemplo (4 categorías, 2 cupones, 4 usuarios, 4 experiencias con fotos de `public/ejemplos`). Se cargan desde el panel de admin (`DataImportAdmin`). **Ojo:** escribe en la base real. Cuando estén las categorías definitivas, actualizar este JSON.
