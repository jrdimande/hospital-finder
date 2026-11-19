import { haversineDistanceKm } from '../utils/distance'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const SEARCH_RADIUS_METERS = 10000
const MAX_RESULTS = 20
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

export async function findNearbyPharmacies(location) {
  const cacheKey = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`
  if (resultCache.has(cacheKey)) return resultCache.get(cacheKey)

  const search = (async () => {
    await waitForRequestSlot()
    const query = `[out:json][timeout:20];(node["amenity"="pharmacy"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});way["amenity"="pharmacy"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude});relation["amenity"="pharmacy"](around:${SEARCH_RADIUS_METERS},${location.latitude},${location.longitude}););out center tags;`
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(25000),
    })

    if (!response.ok) throw new Error(`A pesquisa de farmácias respondeu com o erro HTTP ${response.status}.`)

    let data
    try {
      data = await response.json()
    } catch {
      throw new Error('O serviço de farmácias devolveu uma resposta inválida.')
    }

    return (data.elements || [])
      .map((element) => {
        const latitude = Number(element.lat ?? element.center?.lat)
        const longitude = Number(element.lon ?? element.center?.lon)
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

        const tags = element.tags || {}
        const address = [tags['addr:street'], tags['addr:housenumber'], tags['addr:suburb']]
          .filter(Boolean)
          .join(', ')
        const osmType = element.type === 'node' ? 'node' : element.type
        return {
          id: `pharmacy-${osmType}-${element.id}`,
          name: tags.name || tags['name:pt'] || 'Farmácia',
          type: 'Farmácia',
          category: 'Pharmacy',
          latitude,
          longitude,
          source: 'OpenStreetMap',
          sourceUrl: `https://www.openstreetmap.org/${osmType}/${element.id}`,
          properties: {
            Provincia: tags['addr:state'] || '',
            Distrito: tags['addr:city'] || tags['addr:district'] || '',
            AreaLocalizacao: tags['addr:suburb'] || tags['addr:neighbourhood'] || '',
            Endereco: address,
            ContactoResponsavel: tags['contact:phone'] || tags.phone || '',
          },
        }
      })
      .filter(Boolean)
      .filter((pharmacy) => haversineDistanceKm(location, pharmacy) <= SEARCH_RADIUS_METERS / 1000)
      .sort((a, b) => haversineDistanceKm(location, a) - haversineDistanceKm(location, b))
      .slice(0, MAX_RESULTS)
  })()

  resultCache.set(cacheKey, search)
  try {
    return await search
  } catch (error) {
    resultCache.delete(cacheKey)
    throw error
  }
}
