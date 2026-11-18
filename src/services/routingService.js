const ROUTING_URL = 'https://router.project-osrm.org/route/v1/driving'

export async function fetchDrivingRoute(origin, destination) {
  const coordinates = [origin, destination]
  if (coordinates.some(({ latitude, longitude }) =>
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180)) {
    throw new Error('As coordenadas da rota não são válidas.')
  }

  const coordinatePath = coordinates
    .map(({ latitude, longitude }) => `${longitude},${latitude}`)
    .join(';')
  const url = `${ROUTING_URL}/${coordinatePath}?overview=full&geometries=geojson&steps=false`

  let response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(15000) })
  } catch {
    throw new Error('Não foi possível contactar o serviço de rotas. Verifique a ligação à internet e tente novamente.')
  }

  if (!response.ok) {
    throw new Error(`O serviço de rotas respondeu com o erro HTTP ${response.status}.`)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('O serviço de rotas devolveu uma resposta inválida.')
  }

  const result = data?.routes?.[0]
  if (data?.code !== 'Ok' || !result?.geometry?.coordinates?.length) {
    throw new Error('Não foi possível encontrar uma rota rodoviária para esta unidade.')
  }

  return {
    coordinates: result.geometry.coordinates,
    distanceMeters: result.distance,
    durationSeconds: result.duration,
  }
}
