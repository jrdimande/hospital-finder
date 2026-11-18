import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SERVICE_URL =
  'https://www.mozgis.gov.mz/server/rest/services/MEF/MEFAAPUnidadesSanitarias/MapServer'
const LAYERS = [
  { id: 5, category: 'Hospital' },
  { id: 6, category: 'Centro de Saúde' },
  { id: 7, category: 'Posto de Saúde' },
]

async function fetchLayer({ id, category }) {
  const url = `${SERVICE_URL}/${id}/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson`
  const response = await fetch(url, {
    headers: { Accept: 'application/geo+json, application/json' },
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    throw new Error(`MozGIS devolveu HTTP ${response.status} para a camada ${category}.`)
  }

  const data = await response.json()
  if (!Array.isArray(data?.features)) {
    throw new Error(`A camada ${category} não devolveu uma lista GeoJSON de unidades.`)
  }

  const features = data.features
    .filter((feature) =>
      feature?.geometry?.type === 'Point' &&
      Array.isArray(feature.geometry.coordinates) &&
      Number.isFinite(feature.geometry.coordinates[0]) &&
      Number.isFinite(feature.geometry.coordinates[1]) &&
      feature.properties &&
      typeof feature.properties === 'object')
    .map((feature, index) => ({
      ...feature,
      id: `${id}:${feature.id ?? feature.properties.OBJECTID ?? index}`,
      category,
    }))

  if (!features.length) {
    throw new Error(`A camada ${category} não contém unidades com coordenadas válidas.`)
  }

  return { category, features }
}

const layers = await Promise.all(LAYERS.map(fetchLayer))
const featureCollection = {
  type: 'FeatureCollection',
  generatedAt: new Date().toISOString(),
  features: layers.flatMap(({ features }) => features),
}
const outputPath = resolve(ROOT, 'public/data/unidades.geojson')

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, JSON.stringify(featureCollection))

for (const { category, features } of layers) {
  console.log(`${category}: ${features.length} unidades`)
}
console.log(`Gravadas ${featureCollection.features.length} unidades em public/data/unidades.geojson`)
