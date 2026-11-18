const EARTH_RADIUS_KM = 6371

export function haversineDistanceKm(from, to) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const latitudeDelta = radians(to.latitude - from.latitude)
  const longitudeDelta = radians(to.longitude - from.longitude)
  const fromLatitude = radians(from.latitude)
  const toLatitude = radians(to.latitude)

  const rawA =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2
  const a = Math.min(1, Math.max(0, rawA))

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) return ''
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m`
    : `${distanceKm.toFixed(1)} km`
}
