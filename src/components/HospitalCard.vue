<script setup>
import { computed } from 'vue'
import { formatDistance } from '../utils/distance'

const props = defineProps({
  hospital: { type: Object, required: true },
  distanceKm: { type: Number, default: null },
  userLocation: { type: Object, default: null },
  routeMode: { type: String, default: 'car' },
  selected: { type: Boolean, default: false },
  hasUserLocation: { type: Boolean, default: false },
  locating: { type: Boolean, default: false },
  routeLoading: { type: Boolean, default: false },
})

defineEmits(['select', 'directions'])

const locationLabel = computed(() => [...new Set([
  props.hospital.properties.PostoAdministrativo || props.hospital.properties.AreaLocalizacao,
  props.hospital.properties.Distrito,
  props.hospital.properties.Provincia,
].filter((value) => value && String(value).trim()))].join(', '))

const googleMapsUrl = computed(() => {
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('destination', `${props.hospital.latitude},${props.hospital.longitude}`)
  if (props.userLocation) {
    url.searchParams.set('origin', `${props.userLocation.latitude},${props.userLocation.longitude}`)
  }
  url.searchParams.set('travelmode', props.routeMode === 'pedestrian' ? 'walking' : 'driving')
  url.searchParams.set('dir_action', 'navigate')
  return url.toString()
})

const detailFields = computed(() => {
  const labels = {
    DescricaoAutoridadeGestora: 'Entidade gestora',
    AutoridadeGestora: 'Entidade gestora',
    ContactoResponsavel: 'Pessoa de contacto',
    Endereco: 'Endereço',
  }
  return Object.entries(props.hospital.properties)
    .filter(([key, value]) => !['Nome', 'Tipo', 'Provincia', 'Distrito', 'PostoAdministrativo', 'AreaLocalizacao', 'Latitude', 'Longitude'].includes(key) && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => [labels[key] || key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' '), value])
})
</script>

<template>
  <article class="hospital-card" :class="{ 'is-selected': selected }">
    <div class="card-topline">
      <span class="hospital-type-label">{{ hospital.type || 'Unidade sanitária' }}</span>
      <span v-if="distanceKm !== null" class="distance-pill">{{ formatDistance(distanceKm) }}</span>
    </div>
    <h3>{{ hospital.name }}</h3>
    <p v-if="locationLabel" class="hospital-location"><span aria-hidden="true">⌖</span>{{ locationLabel }}</p>
    <details v-if="detailFields.length" class="hospital-details">
      <summary>Mais informações</summary>
      <dl>
        <template v-for="[key, value] in detailFields" :key="key">
          <dt>{{ key }}</dt><dd>{{ value }}</dd>
        </template>
      </dl>
    </details>
    <div class="card-actions">
      <button class="button button-outline" type="button" @click="$emit('select', hospital)">Ver no mapa <span aria-hidden="true">↗</span></button>
      <button class="button button-directions" type="button" :disabled="routeLoading || locating" :title="hasUserLocation ? 'Traçar rota no modo selecionado' : 'Ativar localização e traçar uma rota até esta unidade'" @click="$emit('directions', hospital)">
        <span v-if="routeLoading" class="button-spinner" aria-hidden="true"></span>
        {{ routeLoading ? 'A traçar…' : locating && !hasUserLocation ? 'A obter localização…' : !hasUserLocation ? 'Ativar localização' : 'Como chegar' }} <span v-if="!routeLoading && !(locating && !hasUserLocation)" aria-hidden="true">→</span>
      </button>
      <a class="card-google-maps" :href="googleMapsUrl" :aria-label="`Navegar até ${hospital.name} no Google Maps`" target="_blank" rel="noreferrer">
        Navegar no Google Maps <span aria-hidden="true">↗</span>
      </a>
    </div>
  </article>
</template>
