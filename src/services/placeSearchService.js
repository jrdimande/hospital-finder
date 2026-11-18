const GEOCODING_URL = 'https://nominatim.openstreetmap.org/search'
const resultCache = new Map()
let lastRequestAt = 0
let requestQueue = Promise.resolve()

function waitForRequestSlot() {
  const scheduledRequest = requestQueue.then(async () => {
    const delay = Math.max(0, 1000 - (Date.now() - lastRequestAt))
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
    lastRequestAt = Date.now()
  })
  requestQueue = scheduledRequest.catch(() => {})
  return scheduledRequest
}

export async function searchMapPlaces(query, province = '') {
  const searchTerm = [query.trim(), province, 'Mozambique'].filter(Boolean).join(', ')
  const cacheKey = searchTerm.toLocaleLowerCase('pt')
  if (resultCache.has(cacheKey)) return resultCache.get(cacheKey)

  const search = (async () => {
    await waitForRequestSlot()
    lastRequestAt = Date.now()

    const url = new URL(GEOCODING_URL)
    url.searchParams.set('q', searchTerm)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('countrycodes', 'mz')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '5')

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      referrerPolicy: 'strict-origin-when-cross-origin',
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) throw new Error(`A pesquisa no mapa respondeu com o erro HTTP ${response.status}.`)

    const results = await response.json()
    return results
      .map((place) => {
        const latitude = Number(place.lat)
        const longitude = Number(place.lon)
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

        const address = place.address || {}
        return {
          id: `map-${place.osm_type}-${place.osm_id}`,
          name: place.name || place.display_name?.split(',')[0] || 'Local encontrado no mapa',
          type: place.type === 'hospital' ? 'Hospital encontrado no mapa' : 'Local encontrado no mapa',
          category: 'MapSearch',
          latitude,
          longitude,
          source: 'OpenStreetMap',
          sourceUrl: `https://www.openstreetmap.org/${place.osm_type}/${place.osm_id}`,
          properties: {
            Provincia: address.state || address.province || '',
            Distrito: address.county || address.city_district || address.municipality || '',
            AreaLocalizacao: address.suburb || address.neighbourhood || address.city || address.town || '',
            Endereco: place.display_name,
          },
        }
      })
      .filter(Boolean)
  })()

  resultCache.set(cacheKey, search)
  try {
    return await search
  } catch (error) {
    resultCache.delete(cacheKey)
    throw error
  }
}
