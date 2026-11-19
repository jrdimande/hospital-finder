const ROUTING_PROFILES = {
  pedestrian: {
    url: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
    label: 'peão',
  },
  car: {
    url: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
    label: 'carro',
  },
  motorcycle: {
    url: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
    label: 'mota',
  },
}
let nextRequestAt = 0

async function waitForRequestSlot() {
  const now = Date.now()
  const delay = Math.max(0, nextRequestAt - now)
  nextRequestAt = Math.max(now, nextRequestAt) + 1000
  if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
}

export async function fetchRoute(origin, destination, mode = 'car') {
  const profile = ROUTING_PROFILES[mode]
  if (!profile) throw new Error('Escolha um modo de deslocação válido.')

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
  const url = `${profile.url}/${coordinatePath}?overview=full&geometries=geojson&steps=false`

  let response
  try {
    await waitForRequestSlot()
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
    throw new Error(`Não foi possível encontrar uma rota para esta unidade no modo ${profile.label}.`)
  }

  return {
    coordinates: result.geometry.coordinates,
    distanceMeters: result.distance,
    durationSeconds: result.duration,
    mode,
  }
}
