import { onBeforeUnmount, ref } from 'vue'

const GEOLOCATION_ERRORS = {
  1: 'A permissão de localização foi negada. Pode autorizá-la nas definições do navegador e tentar novamente.',
  2: 'Não foi possível determinar a sua localização. Verifique o sinal do dispositivo e tente novamente.',
  3: 'O pedido de localização excedeu o tempo limite. Tente novamente.',
}

export function useGeolocation() {
  const location = ref(null)
  const locating = ref(false)
  const tracking = ref(false)
  const error = ref('')
  let watchId = null

  function stopTracking() {
    if (watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    tracking.value = false
    locating.value = false
  }

  function locate() {
    error.value = ''
    if (tracking.value) {
      stopTracking()
      return
    }
    if (!('geolocation' in navigator)) {
      error.value = 'Este navegador não suporta geolocalização.'
      return
    }

    locating.value = true
    tracking.value = true
    watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        error.value = ''
        location.value = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          updatedAt: Date.now(),
        }
        locating.value = false
      },
      (cause) => {
        error.value = GEOLOCATION_ERRORS[cause.code] || 'Não foi possível obter a sua localização.'
        if (cause.code === 1 || !location.value) stopTracking()
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 3000 },
    )
  }

  onBeforeUnmount(stopTracking)

  return { location, locating, tracking, error, locate, stopTracking }
}
