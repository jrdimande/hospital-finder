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
import { fetchDrivingRoute } from '../services/routingService'
import { haversineDistanceKm } from '../utils/distance'

const { hospitals, loading, error, updatedAt, provinces, reload } = useHospitals()
const { location, locating, tracking, error: locationError, locate } = useGeolocation()
const searchQuery = ref('')
const selectedProvince = ref('')
const distanceFilter = ref('all')
const nearbyActive = ref(false)
const selectedId = ref(null)
const route = ref(null)
const routeError = ref('')
const routeLoadingId = ref(null)
let routeRequestId = 0
let rerouteTimer = null

const searchedHospitals = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('pt')
  return hospitals.value.filter((hospital) => {
    const matchesProvince = !selectedProvince.value || hospital.properties.Provincia === selectedProvince.value
    const searchable = [
      hospital.name,
      hospital.type,
      hospital.properties.Provincia,
      hospital.properties.Distrito,
      hospital.properties.PostoAdministrativo,
    ].filter(Boolean).join(' ').toLocaleLowerCase('pt')
    return matchesProvince && (!query || searchable.includes(query))
  })
})

const rankedHospitals = computed(() => searchedHospitals.value
  .map((hospital) => ({
    hospital,
    distanceKm: location.value ? haversineDistanceKm(location.value, hospital) : null,
  }))
  .sort((a, b) => {
    if (a.distanceKm === null || b.distanceKm === null) return 0
    return a.distanceKm - b.distanceKm
  }))

const visibleHospitals = computed(() => {
  if (!nearbyActive.value) return rankedHospitals.value.slice(0, 6)
  const radius = distanceFilter.value === 'all' ? Infinity : Number(distanceFilter.value)
  return rankedHospitals.value.filter((item) => item.distanceKm <= radius).slice(0, 5)
})

function findNearby() {
  nearbyActive.value = true
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
  if (scroll) document.querySelector('#mapa')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function showRoute(hospital, { scroll = true } = {}) {
  if (!location.value) return
  selectHospital(hospital, { scroll })
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
  } catch (error) {
    if (requestId === routeRequestId) {
      routeError.value = error instanceof Error ? error.message : 'Ocorreu um erro ao calcular a rota.'
    }
  } finally {
    if (requestId === routeRequestId) routeLoadingId.value = null
  }
}

function clearRoute() {
  routeRequestId += 1
  route.value = null
  routeError.value = ''
  routeLoadingId.value = null
}

function retryRoute() {
  const hospital = hospitals.value.find((item) => item.id === selectedId.value)
  if (hospital) showRoute(hospital)
}

watch(location, (currentLocation) => {
  if (!tracking.value || !route.value || !currentLocation) return
  if (haversineDistanceKm(currentLocation, route.value.origin) < 0.1) return

  clearTimeout(rerouteTimer)
  rerouteTimer = setTimeout(() => {
    const destination = hospitals.value.find((hospital) => hospital.id === route.value?.hospitalId)
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
        <div class="finder-intro">
          <div>
            <div class="section-kicker"><span></span> PESQUISE E DESCUBRA</div>
            <h2>Cuidados de saúde, <span>ao seu alcance.</span></h2>
            <p>Pesquise por nome ou localidade, ou veja as opções mais próximas de si.</p>
          </div>
          <div class="data-source"><span class="source-check">✓</span> Hospitais, centros e postos do MozGIS</div>
        </div>

        <SearchBar
          v-model="searchQuery"
          v-model:province-value="selectedProvince"
          :provinces="provinces"
          @search="selectedId = null"
        />

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

        <div id="mapa" class="map-layout">
          <div class="map-panel">
            <div class="map-panel-header">
              <div><span class="map-live-dot"></span><strong>Hospitais, centros e postos de saúde</strong></div>
              <span v-if="tracking" class="map-total live-location-label"><span class="tracking-indicator"></span> GPS em tempo real</span>
              <span v-else-if="hospitals.length" class="map-total">{{ hospitals.length }} unidades <template v-if="updatedAt">· dados de {{ new Date(updatedAt).toLocaleString('pt-MZ') }}</template></span>
            </div>
            <HospitalMap
              :hospitals="nearbyActive && location ? visibleHospitals.map((item) => item.hospital) : hospitals"
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
              <span><i class="legend-dot user-dot"></i> Posição GPS</span>
              <small>Posição atualizada enquanto o acompanhamento estiver ativo; rota rodoviária estimada pelo OSRM.</small>
            </div>
          </div>
          <HospitalList
            :hospitals="visibleHospitals"
            :selected-id="selectedId"
            :has-user-location="Boolean(location)"
            :locating="locating"
            :route-loading-id="routeLoadingId"
            :nearby-active="nearbyActive"
            v-model:distance-filter="distanceFilter"
            @select="selectHospital"
            @directions="showRoute"
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
          <div class="section-kicker"><span></span> SOBRE O SAÚDE MZ</div>
          <h2>Informação que ajuda a chegar a tempo.</h2>
          <p>Encontrar uma unidade sanitária pode ser difícil quando não conhecemos a região. O Saúde MZ reúne dados geográficos públicos para ajudar a descobrir hospitais, perceber onde ficam e iniciar uma rota.</p>
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
        <a class="brand" href="#inicio"><span class="brand-mark" aria-hidden="true"><span></span></span><span>Saúde <strong>MZ</strong></span></a>
        <p>Mais perto dos cuidados de saúde em Moçambique.</p>
      </div>
      <div class="footer-column"><strong>Explorar</strong><a href="#encontrar">Encontrar hospitais</a><a href="#sobre">Sobre o projeto</a></div>
      <div class="footer-column"><strong>Fontes</strong><a href="https://www.mozgis.gov.mz/" target="_blank" rel="noreferrer">Dados: MozGIS ↗</a><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Mapa e rotas: OpenStreetMap ↗</a></div>
      <div class="footer-column"><strong>Contacto</strong><span>Contacto do projeto não disponibilizado.</span><span>Projeto informativo</span></div>
    </div>
    <div class="page-shell footer-bottom"><span>© {{ new Date().getFullYear() }} Saúde MZ</span><span>Os dados MozGIS no site são atualizados automaticamente a cada 6 horas. Confirme a informação junto da unidade.</span></div>
  </footer>
</template>
