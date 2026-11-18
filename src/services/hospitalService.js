const SERVICE_URL = import.meta.env.DEV
  ? '/api/mozgis/MEF/MEFAAPUnidadesSanitarias/MapServer'
  : 'https://www.mozgis.gov.mz/server/rest/services/MEF/MEFAAPUnidadesSanitarias/MapServer'

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

  const facilities = data.features.flatMap((feature, index) => {
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
    return [{
      id: `${id}:${feature.id ?? properties.OBJECTID ?? `${longitude},${latitude},${index}`}`,
      category,
      latitude,
      longitude,
      name: properties.Nome || properties.name || 'Unidade sanitária sem nome',
      type: properties.Tipo || properties.type || '',
      properties,
    }]
  })

  return { category, facilities }
}

export async function fetchHospitals() {
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
