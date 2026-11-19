<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import HeroSection from '../components/HeroSection.vue'
import HospitalList from '../components/HospitalList.vue'
import HospitalMap from '../components/HospitalMap.vue'
import LoadingState from '../components/LoadingState.vue'
import Navbar from '../components/Navbar.vue'
import SearchBar from '../components/SearchBar.vue'
import { useGeolocation } from '../composables/useGeolocation'
import { useHospitals } from '../composables/useHospitals'
import { searchMapPlaces } from '../services/placeSearchService'
import { fetchDrivingRoute } from '../services/routingService'
import { haversineDistanceKm } from '../utils/distance'

const { hospitals, loading, error, updatedAt, reload } = useHospitals()
const { location, locating, tracking, error: locationError, locate } = useGeolocation()
const searchQuery = ref('')
const nearbyActive = ref(false)
const selectedId = ref(null)
const showAllResults = ref(false)
const pendingRouteHospital = ref(null)
const pendingRouteScroll = ref(false)
const autoRoutePending = ref(false)
const automaticRouteQueue = ref([])
const mapPlaces = ref([])
const placeSearchLoading = ref(false)
const placeSearchError = ref('')
const placeSearchMessage = ref('')
let placeSearchRequestId = 0
const route = ref(null)
const routeError = ref('')
const routeLoadingId = ref(null)
let routeRequestId = 0
let rerouteTimer = null

const searchedHospitals = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('pt')
  return hospitals.value.filter((hospital) => {
    const searchable = [
      hospital.name,
      hospital.type,
      hospital.properties.Provincia,
      hospital.properties.Distrito,
      hospital.properties.PostoAdministrativo,
    ].filter(Boolean).join(' ').toLocaleLowerCase('pt')
    return !query || searchable.includes(query)
  })
})

const rankedHospitals = computed(() => [
  ...searchedHospitals.value,
  ...mapPlaces.value,
].map((hospital) => ({
    hospital,
    distanceKm: location.value ? haversineDistanceKm(location.value, hospital) : null,
  }))
  .sort((a, b) => {
    if (a.distanceKm === null || b.distanceKm === null) return 0
    return a.distanceKm - b.distanceKm
  }))

const matchingHospitals = computed(() => {
  if (!nearbyActive.value) return rankedHospitals.value
  return rankedHospitals.value.filter((item) => item.distanceKm !== null)
})
const visibleHospitals = computed(() => matchingHospitals.value.slice(0, showAllResults.value ? matchingHospitals.value.length : nearbyActive.value ? 5 : 6))
const hasActiveFilters = computed(() => Boolean(searchQuery.value.trim() || nearbyActive.value))

watch([searchQuery, nearbyActive], () => { showAllResults.value = false })
watch(searchQuery, () => {
  placeSearchRequestId += 1
  mapPlaces.value = []
  placeSearchError.value = ''
  placeSearchMessage.value = ''
  placeSearchLoading.value = false
  if (String(selectedId.value).startsWith('map-')) selectedId.value = null
  clearRoute()
})

async function searchPlaces() {
  clearRoute()
  selectedId.value = null
  nearbyActive.value = false
  mapPlaces.value = []
  placeSearchError.value = ''
  placeSearchMessage.value = ''
  if (!searchQuery.value.trim() || searchedHospitals.value.length) return

  const requestId = ++placeSearchRequestId
  placeSearchLoading.value = true
  try {
    const places = await searchMapPlaces(searchQuery.value)
    if (requestId !== placeSearchRequestId) return
    mapPlaces.value = places
    if (!mapPlaces.value.length) {
      placeSearchMessage.value = `Não encontrámos “${searchQuery.value.trim()}” nos dados MozGIS nem no mapa. Tente outro nome ou inclua a cidade.`
    } else {
      selectedId.value = mapPlaces.value[0].id
      requestAnimationFrame(() => {
        document.querySelector('#mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  } catch (cause) {
    if (requestId !== placeSearchRequestId) return
    placeSearchError.value = cause instanceof Error
      ? cause.message
      : 'Não foi possível pesquisar este local no mapa.'
  } finally {
    if (requestId === placeSearchRequestId) placeSearchLoading.value = false
  }
}

function findNearby() {
  const stoppingTracking = tracking.value
  nearbyActive.value = true
  showAllResults.value = false
  autoRoutePending.value = !stoppingTracking
  if (!stoppingTracking) {
    requestAnimationFrame(() => {
      document.querySelector('#mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
  locate()
}

function selectHospital(hospital, { scroll = true } = {}) {
  selectedId.value = hospital.id
  if (route.value?.hospitalId !== hospital.id) {
    routeRequestId += 1
    route.value = null
    routeError.value = ''
    routeLoadingId.value = null
  }
  if (scroll) document.querySelector('#mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function showRoute(hospital, { scroll = true, automatic = false } = {}) {
  autoRoutePending.value = false
  if (!automatic) automaticRouteQueue.value = []
  selectHospital(hospital, { scroll })
  if (!location.value) {
    pendingRouteHospital.value = hospital
    pendingRouteScroll.value = scroll
    nearbyActive.value = false
    locate()
    return
  }
  pendingRouteHospital.value = null
  const requestId = ++routeRequestId
  route.value = null
  routeError.value = ''
  routeLoadingId.value = hospital.id

  try {
    const origin = { latitude: location.value.latitude, longitude: location.value.longitude }
    route.value = {
      ...await fetchDrivingRoute(origin, hospital),
      hospitalId: hospital.id,
      destinationName: hospital.name,
      origin,
    }
    if (automatic) automaticRouteQueue.value = []
  } catch (error) {
    if (requestId === routeRequestId) {
      const message = error instanceof Error ? error.message : 'Ocorreu um erro ao calcular a rota.'
      const nextHospital = automatic && message.includes('Não foi possível encontrar uma rota rodoviária')
        ? automaticRouteQueue.value.shift()
        : null
      if (nextHospital) {
        showRoute(nextHospital, { scroll: false, automatic: true })
      } else {
        automaticRouteQueue.value = []
        routeError.value = automatic && message.includes('Não foi possível encontrar uma rota rodoviária')
          ? 'Não foi encontrada uma rota para as unidades disponíveis próximas de si. Escolha outra unidade na lista para tentar novamente.'
          : message
      }
    }
  } finally {
    if (requestId === routeRequestId) {
      routeLoadingId.value = null
      if (scroll) document.querySelector('#mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

function clearRoute() {
  routeRequestId += 1
  pendingRouteHospital.value = null
  pendingRouteScroll.value = false
  autoRoutePending.value = false
  automaticRouteQueue.value = []
  route.value = null
  routeError.value = ''
  routeLoadingId.value = null
}

function retryRoute() {
  const hospital = [...hospitals.value, ...mapPlaces.value].find((item) => item.id === selectedId.value)
  if (hospital) showRoute(hospital)
}

watch(location, (currentLocation) => {
  if (pendingRouteHospital.value && currentLocation) {
    const destination = pendingRouteHospital.value
    const shouldScrollToRoute = pendingRouteScroll.value
    pendingRouteHospital.value = null
    pendingRouteScroll.value = false
    showRoute(destination, { scroll: shouldScrollToRoute })
    return
  }
  if (autoRoutePending.value && currentLocation) {
    autoRoutePending.value = false
    const nearestHospitals = matchingHospitals.value.map((item) => item.hospital)
    const nearestHospital = nearestHospitals.shift()
    automaticRouteQueue.value = nearestHospitals
    if (nearestHospital) showRoute(nearestHospital, { scroll: false, automatic: true })
    return
  }
  if (!tracking.value || !route.value || !currentLocation) return
  if (haversineDistanceKm(currentLocation, route.value.origin) < 0.1) return

  clearTimeout(rerouteTimer)
  rerouteTimer = setTimeout(() => {
    const destination = [...hospitals.value, ...mapPlaces.value].find((hospital) => hospital.id === route.value?.hospitalId)
    if (destination) showRoute(destination, { scroll: false })
  }, 1200)
})

onBeforeUnmount(() => clearTimeout(rerouteTimer))
</script>

<template>
  <Navbar />
  <main>
    <HeroSection :loading="loading" :locating="locating" :tracking="tracking" @locate="findNearby" />

    <section id="encontrar" class="finder-section">
      <div class="page-shell">
        <div class="search-heading">
          <div class="section-kicker"><span></span> PESQUISA</div>
          <h2>Encontre cuidados de saúde</h2>
          <p>Pesquise pelo nome de um hospital, centro de saúde ou localidade.</p>
        </div>
        <SearchBar
          v-model="searchQuery"
          @search="searchPlaces"
        />
        <p class="search-hint">Se a unidade não estiver nos dados MozGIS, pesquisamos o local no OpenStreetMap.</p>

        <div v-if="placeSearchLoading" class="place-search-status" role="status">
          <span class="loading-spinner" aria-hidden="true"></span>
          A procurar o local no mapa…
        </div>
        <div v-else-if="placeSearchError" class="notice notice-error" role="alert">
          <span aria-hidden="true">!</span><p>{{ placeSearchError }}</p>
        </div>
        <div v-else-if="placeSearchMessage" class="place-search-status" role="status">
          {{ placeSearchMessage }}
        </div>

        <div v-if="locationError" class="notice notice-error" role="alert">
          <span aria-hidden="true">!</span><p>{{ locationError }}</p>
        </div>
        <div v-if="error" class="notice notice-error" role="alert">
          <span aria-hidden="true">!</span>
          <p>{{ error }} {{ hospitals.length ? 'As unidades das camadas carregadas continuam disponíveis.' : 'Não apresentamos unidades de exemplo.' }}
            <button class="retry-button" type="button" @click="reload">Tentar novamente</button>
          </p>
        </div>
        <LoadingState v-if="loading" />

        <div class="map-layout">
          <div id="mapa" class="map-panel">
            <div class="map-panel-header">
              <div><span class="map-live-dot"></span><strong>Mapa de unidades sanitárias</strong></div>
              <div class="map-header-actions">
                <span v-if="hospitals.length || mapPlaces.length" class="map-total">{{ hasActiveFilters ? `${matchingHospitals.length} resultados` : `${hospitals.length} unidades` }} <template v-if="updatedAt">· dados de {{ new Date(updatedAt).toLocaleString('pt-MZ') }}</template></span>
              </div>
            </div>
            <HospitalMap
              :hospitals="(nearbyActive ? matchingHospitals : rankedHospitals).map((item) => item.hospital)"
              :user-location="location"
              :selected-id="selectedId"
              :route="route"
              :route-loading="Boolean(routeLoadingId)"
              :route-error="routeError"
              :follow-location="tracking"
              @select="selectHospital"
              @clear-route="clearRoute"
              @retry-route="retryRoute"
            />
            <div class="map-legend">
              <span><i class="legend-dot hospital-dot"></i> Hospital</span>
              <span><i class="legend-dot center-dot"></i> Centro de saúde</span>
              <span><i class="legend-dot post-dot"></i> Posto de saúde</span>
              <span v-if="mapPlaces.length"><i class="legend-dot search-result-dot"></i> Local pesquisado</span>
              <span><i class="legend-dot user-dot"></i> Posição GPS</span>
              <small>Rota rodoviária estimada pelo OSRM.</small>
            </div>
          </div>
          <HospitalList
            :hospitals="visibleHospitals"
            :total-count="matchingHospitals.length"
            :showing-all="showAllResults"
            :selected-id="selectedId"
            :has-user-location="Boolean(location)"
            :locating="locating"
            :location-error="locationError"
            :has-external-results="mapPlaces.length > 0"
            :route-loading-id="routeLoadingId"
            :nearby-active="nearbyActive"
            @select="selectHospital($event, { scroll: false })"
            @directions="showRoute"
            @toggle-all="showAllResults = !showAllResults"
            @retry-location="findNearby"
          />
        </div>
      </div>
    </section>

    <section id="sobre" class="about-section">
      <div class="page-shell about-grid">
        <div class="about-visual">
          <div class="about-map-lines"></div>
          <div class="about-cross"><span></span><i></i></div>
          <span class="about-point point-a"></span><span class="about-point point-b"></span><span class="about-point point-c"></span>
          <div class="about-caption"><span class="live-dot"></span> Saúde mais perto, para todos</div>
        </div>
        <div class="about-copy">
          <div class="section-kicker"><span></span> SOBRE O HOSPITAL FINDER MZ</div>
          <h2>Informação que ajuda a chegar a tempo.</h2>
          <p>Encontrar uma unidade sanitária pode ser difícil quando não conhecemos a região. O Hospital finder MZ reúne dados geográficos públicos para ajudar a descobrir hospitais, perceber onde ficam e iniciar uma rota.</p>
          <div class="about-points">
            <div><span class="check-mark">✓</span><span><strong>Dados abertos</strong><small>Informação geográfica disponibilizada pelo MozGIS.</small></span></div>
            <div><span class="check-mark">✓</span><span><strong>Mais fácil de encontrar</strong><small>Pesquisa por nome e província, com mapa interativo.</small></span></div>
            <div><span class="check-mark">✓</span><span><strong>A sua privacidade importa</strong><small>A localização só é pedida quando escolhe procurar perto de si.</small></span></div>
          </div>
        </div>
      </div>
    </section>
  </main>
  <footer id="contacto" class="site-footer">
    <div class="page-shell footer-main">
      <div class="footer-brand">
        <a class="brand" href="#inicio"><span class="brand-mark" aria-hidden="true"><span></span></span><span>Hospital finder <strong>MZ</strong></span></a>
        <p>Mais perto dos cuidados de saúde em Moçambique.</p>
      </div>
      <div class="footer-column"><strong>Explorar</strong><a href="#encontrar">Encontrar hospitais</a><a href="#sobre">Sobre o projeto</a></div>
      <div class="footer-column"><strong>Fontes</strong><a href="https://www.mozgis.gov.mz/" target="_blank" rel="noreferrer">Dados: MozGIS ↗</a><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Mapa e rotas: OpenStreetMap ↗</a></div>
      <div class="footer-column"><strong>Contacto</strong><span>Contacto do projeto não disponibilizado.</span><span>Projeto informativo</span></div>
    </div>
    <div class="page-shell footer-bottom"><span>© {{ new Date().getFullYear() }} Hospital finder MZ</span><span>Os dados MozGIS no site são atualizados automaticamente a cada 6 horas. Confirme a informação junto da unidade.</span></div>
  </footer>
</template>
