const SERVICE_URL = '/api/mozgis/MEF/MEFAAPUnidadesSanitarias/MapServer'
const STATIC_DATA_URL = `${import.meta.env.BASE_URL}data/unidades.geojson`

const FACILITY_LAYERS = [
  { id: 5, category: 'Hospital' },
  { id: 6, category: 'Centro de Saúde' },
  { id: 7, category: 'Posto de Saúde' },
]

async function fetchLayer({ id, category }) {
  const url = `${SERVICE_URL}/${id}/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson`
  let response

  try {
    response = await fetch(url, {
      headers: { Accept: 'application/geo+json, application/json' },
    })
  } catch {
    throw new Error(`Não foi possível carregar a camada “${category}”. A ligação pode estar indisponível ou bloqueada por CORS.`)
  }

  if (!response.ok) {
    throw new Error(`A API do MozGIS respondeu com o erro HTTP ${response.status} na camada “${category}”.`)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`A API do MozGIS devolveu JSON inválido na camada “${category}”.`)
  }

  if (!Array.isArray(data?.features)) {
    throw new Error(`A resposta da camada “${category}” não contém uma lista de unidades sanitárias válida.`)
  }

  return { category, facilities: normalizeFeatures(data.features, id, category) }
}

export async function fetchHospitals() {
  if (import.meta.env.PROD) {
    let response
    try {
      response = await fetch(STATIC_DATA_URL, { cache: 'no-store' })
    } catch {
      throw new Error('Não foi possível carregar os dados MozGIS publicados. Tente novamente mais tarde.')
    }

    if (!response.ok) {
      throw new Error(`Os dados MozGIS publicados responderam com o erro HTTP ${response.status}.`)
    }

    let data
    try {
      data = await response.json()
    } catch {
      throw new Error('Os dados MozGIS publicados não contêm GeoJSON válido.')
    }

    if (!Array.isArray(data?.features)) {
      throw new Error('Os dados MozGIS publicados não contêm unidades sanitárias válidas.')
    }

    const facilities = FACILITY_LAYERS.flatMap(({ id, category }) =>
      normalizeFeatures(data.features.filter((feature) => feature.category === category), id, category))
    if (!facilities.length) {
      throw new Error('Os dados MozGIS publicados não contêm unidades sanitárias com coordenadas válidas.')
    }
    return { facilities, errors: [], updatedAt: data.generatedAt || null }
  }

  const results = await Promise.allSettled(FACILITY_LAYERS.map(fetchLayer))
  const facilities = []
  const errors = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      facilities.push(...result.value.facilities)
    } else {
      errors.push(result.reason instanceof Error
        ? result.reason.message
        : `Falha ao carregar a camada “${FACILITY_LAYERS[index].category}”.`)
    }
  })

  if (facilities.length === 0) {
    throw new Error(
      `${errors.join(' ')} Não foi possível carregar unidades sanitárias do MozGIS. Confirme se o serviço permite CORS para este domínio; poderá ser necessário um proxy autorizado.`,
    )
  }

  return { facilities, errors }
}

function normalizeFeatures(features, layerId, category) {
  return features.flatMap((feature, index) => {
    const coordinates = feature?.geometry?.coordinates
    const properties = feature?.properties

    if (
      feature?.geometry?.type !== 'Point' ||
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      !Number.isFinite(coordinates[0]) ||
      !Number.isFinite(coordinates[1]) ||
      !properties ||
      typeof properties !== 'object'
    ) {
      return []
    }

    const [longitude, latitude] = coordinates
    const sourceId = String(feature.id ?? properties.OBJECTID ?? `${longitude},${latitude},${index}`)
    return [{
      id: sourceId.startsWith(`${layerId}:`) ? sourceId : `${layerId}:${sourceId}`,
      category,
      latitude,
      longitude,
      name: properties.Nome || properties.name || 'Unidade sanitária sem nome',
      type: properties.Tipo || properties.type || '',
      properties,
    }]
  })
}
