<script setup>
import L from 'leaflet'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { phoneHref } from '../utils/phone'

const props = defineProps({
  hospitals: { type: Array, default: () => [] },
  userLocation: { type: Object, default: null },
  routeMode: { type: String, default: 'car' },
  selectedId: { type: [String, Number], default: null },
  selectionVersion: { type: Number, default: 0 },
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
let markerById = new Map()
let hospitalById = new Map()
let hasFittedInitialBounds = false
let renderHospitalsFrame = null
let lastFollowedPosition = null
let styledSelectedId = null

function icon(className, symbol) {
  return L.divIcon({
    className: 'map-icon-container',
    html: `<span class="map-marker ${className}">${symbol}</span>`,
    iconSize: [36, 44],
    iconAnchor: [18, 38],
    popupAnchor: [0, -34],
  })
}

function facilityStyle(category, selected = false) {
  const color = category === 'Hospital'
    ? '#df514d'
    : category === 'Centro de Saúde'
      ? '#279b76'
      : category === 'MapSearch'
        ? '#2585c2'
        : '#e29a34'
  return {
    radius: selected ? 9 : 6,
    color: selected ? '#17364b' : '#ffffff',
    weight: selected ? 3 : 2,
    fillColor: color,
    fillOpacity: 1,
  }
}

function renderHospitals() {
  if (!map || !hospitalLayer) return
  const nextHospitals = new Map(props.hospitals.map((hospital) => [hospital.id, hospital]))
  let selectedMarkerAdded = false
  markerById.forEach((marker, id) => {
    if (nextHospitals.has(id)) return
    hospitalLayer.removeLayer(marker)
    markerById.delete(id)
    hospitalById.delete(id)
  })
  props.hospitals.forEach((hospital) => {
    let marker = markerById.get(hospital.id)
    if (!marker) {
      marker = L.circleMarker([hospital.latitude, hospital.longitude], {
        ...facilityStyle(hospital.category),
        title: hospital.name,
        riseOnHover: true,
      }).bindPopup(() => {
        const currentHospital = hospitalById.get(hospital.id)
        return currentHospital ? popupContent(currentHospital) : ''
      }, { closeOnClick: false, closeOnEscapeKey: false })
      marker.on('click', () => {
        const selectedHospital = hospitalById.get(hospital.id)
        if (selectedHospital) emit('select', selectedHospital)
      })
      marker.addTo(hospitalLayer)
      markerById.set(hospital.id, marker)
      if (hospital.id === props.selectedId) selectedMarkerAdded = true
    } else {
      const previousHospital = hospitalById.get(hospital.id)
      if (previousHospital !== hospital) {
        marker.setLatLng([hospital.latitude, hospital.longitude])
        marker.setStyle(facilityStyle(hospital.category, hospital.id === props.selectedId))
        marker.bindPopup(() => {
          const currentHospital = hospitalById.get(hospital.id)
          return currentHospital ? popupContent(currentHospital) : ''
        }, { closeOnClick: false, closeOnEscapeKey: false })
      }
    }
    hospitalById.set(hospital.id, hospital)
  })

  updateSelectedMarker()
  const points = props.hospitals.map(({ latitude, longitude }) => [latitude, longitude])
  if (points.length && !props.userLocation && !hasFittedInitialBounds) {
    map.fitBounds(points, { padding: [42, 42], maxZoom: 7 })
    hasFittedInitialBounds = true
  }
  if (selectedMarkerAdded) openSelectedPopup()
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

  return `<strong>${escapeHtml(hospital.name)}</strong>${details.map(([label, value]) => {
    const contactLink = label === 'Contacto' && phoneHref(value)
      ? `<a href="${escapeHtml(phoneHref(value))}">${escapeHtml(value)}</a>`
      : escapeHtml(value)
    return `<br><span>${escapeHtml(label)}: ${contactLink}</span>`
  }).join('')}<br><a class="hospital-google-maps" href="${escapeHtml(googleMapsUrl(hospital))}" target="_blank" rel="noopener noreferrer">Navegar no Google Maps ↗</a>`
}

function googleMapsUrl(hospital) {
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('destination', `${hospital.latitude},${hospital.longitude}`)
  if (props.userLocation) {
    url.searchParams.set('origin', `${props.userLocation.latitude},${props.userLocation.longitude}`)
  }
  url.searchParams.set('travelmode', props.routeMode === 'pedestrian' ? 'walking' : 'driving')
  url.searchParams.set('dir_action', 'navigate')
  return url.toString()
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character])
}

function updateSelectedMarker() {
  if (styledSelectedId === props.selectedId) {
    const marker = markerById.get(props.selectedId)
    const hospital = hospitalById.get(props.selectedId)
    if (marker && hospital) marker.setStyle(facilityStyle(hospital.category, true))
    return
  }
  if (styledSelectedId !== null) {
    const previousMarker = markerById.get(styledSelectedId)
    const previousHospital = hospitalById.get(styledSelectedId)
    if (previousMarker && previousHospital) {
      previousMarker.setStyle(facilityStyle(previousHospital.category))
    }
  }
  const selectedMarker = markerById.get(props.selectedId)
  const selectedHospital = hospitalById.get(props.selectedId)
  if (selectedMarker && selectedHospital) {
    selectedMarker.setStyle(facilityStyle(selectedHospital.category, true))
    styledSelectedId = props.selectedId
  } else {
    styledSelectedId = null
  }
}

function openSelectedPopup() {
  const marker = markerById.get(props.selectedId)
  if (marker && map) marker.openPopup()
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

  if (!props.followLocation) return
  const movedMeters = lastFollowedPosition
    ? map.distance(lastFollowedPosition, position)
    : Infinity
  if (isFirstPosition || movedMeters >= 35) {
    lastFollowedPosition = L.latLng(position)
    map.setView(position, Math.max(map.getZoom(), 15), { animate: false })
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
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
    renderer: L.canvas({ padding: 0.5 }),
  }).setView([-18.6, 35.5], 5)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 1,
  }).addTo(map)
  hospitalLayer = L.layerGroup().addTo(map)
  userLayer = L.layerGroup().addTo(map)
  routeLayer = L.layerGroup().addTo(map)
  renderHospitals()
  updateUserMarker(props.userLocation)
  renderRoute(props.route)
  openSelectedPopup()
  const resizeObserver = new ResizeObserver(() => map?.invalidateSize({ pan: false }))
  resizeObserver.observe(mapElement.value)
  map.once('unload', () => resizeObserver.disconnect())
})

watch(() => props.hospitals, () => {
  if (renderHospitalsFrame !== null) cancelAnimationFrame(renderHospitalsFrame)
  renderHospitalsFrame = requestAnimationFrame(() => {
    renderHospitalsFrame = null
    renderHospitals()
  })
})

watch(() => props.userLocation, updateUserMarker)

watch(() => props.followLocation, (following) => {
  if (following && props.userLocation && map) {
    lastFollowedPosition = L.latLng(props.userLocation.latitude, props.userLocation.longitude)
    map.setView(
      [props.userLocation.latitude, props.userLocation.longitude],
      Math.max(map.getZoom(), 15),
      { animate: false },
    )
  }
})

function focusSelectedMarker(selectedId = props.selectedId) {
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
}

watch(() => props.selectedId, focusSelectedMarker)
watch(() => props.selectionVersion, () => focusSelectedMarker())

watch(() => props.route, renderRoute)

onBeforeUnmount(() => {
  if (renderHospitalsFrame !== null) cancelAnimationFrame(renderHospitalsFrame)
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
      A calcular a rota…
    </div>
    <div v-else-if="routeError" class="map-feedback map-feedback-error" role="alert">
      <span>{{ routeError }}</span>
      <button type="button" @click="emit('retry-route')">Tentar novamente</button>
    </div>
    <div v-if="route" class="route-summary">
      <span class="route-summary-icon" aria-hidden="true">↗</span>
      <span class="route-summary-text">
        <strong>Rota para {{ route.destinationName }}</strong>
        <small>~{{ (route.distanceMeters / 1000).toFixed(1) }} km · ~{{ Math.max(1, Math.round(route.durationSeconds / 60)) }} min {{ route.mode === 'pedestrian' ? 'a pé' : route.mode === 'motorcycle' ? 'de mota*' : 'de carro' }}</small>
      </span>
      <button class="route-clear" type="button" @click="emit('clear-route')">Limpar</button>
    </div>
    <p v-if="route?.mode === 'motorcycle'" class="route-mode-note">* Mota usa o perfil rodoviário de carro; o percurso pode não refletir restrições específicas para motas.</p>
    <button v-if="userLocation" class="map-recenter" type="button" aria-label="Centrar mapa na minha localização" @click="centerOnUser">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
      <span>A minha localização</span>
    </button>
    <div ref="mapElement" class="leaflet-map" role="application" aria-label="Mapa interativo de unidades sanitárias e rota no modo selecionado"></div>
  </div>
</template>
