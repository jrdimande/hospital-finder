<script setup>
import L from 'leaflet'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  hospitals: { type: Array, default: () => [] },
  userLocation: { type: Object, default: null },
  selectedId: { type: [String, Number], default: null },
  route: { type: Object, default: null },
  routeLoading: { type: Boolean, default: false },
  routeError: { type: String, default: '' },
  followLocation: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'clear-route', 'retry-route'])
const mapElement = ref(null)
let map
let hospitalLayer
let userLayer
let routeLayer
let userAccuracyCircle
let userMarker
let markerRenderer
let markerById = new Map()
let hasFittedInitialBounds = false

function icon(className, symbol) {
  return L.divIcon({
    className: 'map-icon-container',
    html: `<span class="map-marker ${className}">${symbol}</span>`,
    iconSize: [36, 44],
    iconAnchor: [18, 38],
    popupAnchor: [0, -34],
  })
}

function renderHospitals() {
  if (!map || !hospitalLayer) return
  hospitalLayer.clearLayers()
  markerById = new Map()

  props.hospitals.forEach((hospital) => {
    const marker = L.circleMarker([hospital.latitude, hospital.longitude], {
      renderer: markerRenderer,
      radius: 5,
      color: '#ffffff',
      weight: 1.5,
      fillColor: markerColor(hospital.category),
      fillOpacity: 0.94,
      bubblingMouseEvents: false,
    }).bindPopup(popupContent(hospital)).bindTooltip(hospital.name, { direction: 'top', offset: [0, -5] })
    marker.on('click', () => emit('select', hospital))
    marker.addTo(hospitalLayer)
    markerById.set(hospital.id, marker)
  })

  updateSelectedMarker()
  const points = props.hospitals.map(({ latitude, longitude }) => [latitude, longitude])
  if (points.length && !props.userLocation && !hasFittedInitialBounds) {
    map.fitBounds(points, { padding: [42, 42], maxZoom: 7 })
    hasFittedInitialBounds = true
  }
}

function markerColor(category) {
  if (category === 'MapSearch') return '#2585c2'
  if (category === 'Hospital') return '#df514d'
  if (category === 'Centro de Saúde') return '#279b76'
  return '#e29a34'
}

function popupContent(hospital) {
  const details = [
    ['Tipo', hospital.type],
    ['Fonte', hospital.source],
    ['Província', hospital.properties.Provincia],
    ['Distrito', hospital.properties.Distrito],
    ['Localidade', hospital.properties.PostoAdministrativo || hospital.properties.AreaLocalizacao],
    ['Contacto', hospital.properties.ContactoResponsavel],
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')

  return `<strong>${escapeHtml(hospital.name)}</strong>${details.map(([label, value]) => `<br><span>${escapeHtml(label)}: ${escapeHtml(value)}</span>`).join('')}`
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character])
}

function updateSelectedMarker() {
  markerById.forEach((marker, id) => {
    const selected = id === props.selectedId
    const hospital = props.hospitals.find((item) => item.id === id)
    marker.setStyle({
      radius: selected ? 9 : 5,
      color: selected ? '#17364b' : '#ffffff',
      weight: selected ? 3 : 1.5,
      fillColor: markerColor(hospital?.category),
      fillOpacity: 0.98,
    })
    if (id === props.selectedId) marker.openPopup()
  })
}

function updateUserMarker(location) {
  if (!map || !userLayer) return
  if (!location) {
    userLayer.clearLayers()
    userMarker = null
    userAccuracyCircle = null
    return
  }

  const position = [location.latitude, location.longitude]
  const isFirstPosition = !userMarker
  if (isFirstPosition) {
    userAccuracyCircle = L.circle(position, {
      radius: location.accuracy || 30,
      color: '#2688c7',
      weight: 1,
      fillColor: '#2787c5',
      fillOpacity: 0.12,
    }).addTo(userLayer)
    userMarker = L.marker(position, {
      icon: icon('user-marker', '<span></span>'),
      title: 'A sua localização em tempo real',
      zIndexOffset: 1000,
    }).bindPopup('<strong>A sua localização</strong><br><span>Posição atualizada pelo GPS do dispositivo.</span>')
      .addTo(userLayer)
  } else {
    userMarker.setLatLng(position)
    userAccuracyCircle.setLatLng(position).setRadius(location.accuracy || 30)
  }

  if (props.followLocation) {
    if (isFirstPosition) {
      map.setView(position, Math.max(map.getZoom(), 15), { animate: false })
    } else {
      map.panTo(position, { animate: false })
    }
  }
}

function renderRoute(route) {
  if (!map || !routeLayer) return
  routeLayer.clearLayers()
  if (!route) return
  const routeLine = L.polyline(
    route.coordinates.map(([longitude, latitude]) => [latitude, longitude]),
    { color: '#176f9f', weight: 6, opacity: 0.85, lineCap: 'round', lineJoin: 'round' },
  ).addTo(routeLayer)
  map.fitBounds(routeLine.getBounds(), { padding: [48, 48], maxZoom: 15 })
}

onMounted(() => {
  map = L.map(mapElement.value, {
    scrollWheelZoom: false,
    touchZoom: true,
    preferCanvas: true,
  }).setView([-18.6, 35.5], 5)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 2,
  }).addTo(map)
  hospitalLayer = L.layerGroup().addTo(map)
  userLayer = L.layerGroup().addTo(map)
  routeLayer = L.layerGroup().addTo(map)
  markerRenderer = L.canvas({ padding: 0.5 })
  renderHospitals()
  const resizeObserver = new ResizeObserver(() => map?.invalidateSize({ pan: false }))
  resizeObserver.observe(mapElement.value)
  map.once('unload', () => resizeObserver.disconnect())
})

watch(() => props.hospitals, renderHospitals)

watch(() => props.userLocation, updateUserMarker)

watch(() => props.followLocation, (following) => {
  if (following && props.userLocation && map) {
    map.setView(
      [props.userLocation.latitude, props.userLocation.longitude],
      Math.max(map.getZoom(), 15),
      { animate: false },
    )
  }
})

watch(() => props.selectedId, (selectedId) => {
  updateSelectedMarker()
  const marker = markerById.get(selectedId)
  if (marker && map) {
    if (String(selectedId).startsWith('map-')) {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 14))
    } else {
      map.panTo(marker.getLatLng())
    }
    marker.openPopup()
  }
})

watch(() => props.route, renderRoute)

onBeforeUnmount(() => {
  map?.remove()
})

function centerOnUser() {
  if (!props.userLocation || !map) return
  map.setView(
    [props.userLocation.latitude, props.userLocation.longitude],
    Math.max(map.getZoom(), 15),
    { animate: true },
  )
}
</script>

<template>
  <div class="map-canvas">
    <div v-if="routeLoading" class="map-feedback" role="status">
      <span class="loading-spinner" aria-hidden="true"></span>
      A calcular a rota rodoviária…
    </div>
    <div v-else-if="routeError" class="map-feedback map-feedback-error" role="alert">
      <span>{{ routeError }}</span>
      <button type="button" @click="emit('retry-route')">Tentar novamente</button>
    </div>
    <div v-if="route" class="route-summary">
      <span class="route-summary-icon" aria-hidden="true">↗</span>
      <span class="route-summary-text">
        <strong>Rota para {{ route.destinationName }}</strong>
        <small>~{{ (route.distanceMeters / 1000).toFixed(1) }} km · ~{{ Math.max(1, Math.round(route.durationSeconds / 60)) }} min de carro</small>
      </span>
      <button class="route-clear" type="button" @click="emit('clear-route')">Limpar</button>
    </div>
    <button v-if="userLocation" class="map-recenter" type="button" aria-label="Centrar mapa na minha localização" @click="centerOnUser">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
      <span>A minha localização</span>
    </button>
    <div ref="mapElement" class="leaflet-map" role="application" aria-label="Mapa interativo de unidades sanitárias e rota rodoviária"></div>
  </div>
</template>
