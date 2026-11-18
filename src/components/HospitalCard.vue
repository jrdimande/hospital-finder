<script setup>
import { computed } from 'vue'
import { formatDistance } from '../utils/distance'

const props = defineProps({
  hospital: { type: Object, required: true },
  distanceKm: { type: Number, default: null },
  selected: { type: Boolean, default: false },
  hasUserLocation: { type: Boolean, default: false },
  routeLoading: { type: Boolean, default: false },
})

defineEmits(['select', 'directions'])

const fields = computed(() => {
  const properties = props.hospital.properties
  return [
    ['Província', properties.Provincia],
    ['Distrito', properties.Distrito],
    ['Localidade', properties.PostoAdministrativo || properties.AreaLocalizacao],
    ['Entidade gestora', properties.DescricaoAutoridadeGestora || properties.AutoridadeGestora],
    ['Contacto', properties.ContactoResponsavel],
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
})

const detailFields = computed(() => Object.entries(props.hospital.properties)
  .filter(([key, value]) => !['Nome', 'Tipo', 'Provincia', 'Distrito', 'PostoAdministrativo', 'AreaLocalizacao', 'DescricaoAutoridadeGestora', 'AutoridadeGestora', 'ContactoResponsavel', 'Latitude', 'Longitude'].includes(key) && value !== null && value !== undefined && value !== ''))
</script>

<template>
  <article class="hospital-card" :class="{ 'is-selected': selected }">
    <div class="card-topline">
      <span class="hospital-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M4 21V5h16v16M2 21h20M9 9h6M12 6v6M8 16h.01M16 16h.01"/></svg>
      </span>
      <span v-if="distanceKm !== null" class="distance-pill">{{ formatDistance(distanceKm) }}</span>
    </div>
    <h3>{{ hospital.name }}</h3>
    <p v-if="hospital.type" class="hospital-type">{{ hospital.type }}</p>
    <div class="hospital-fields">
      <span v-for="[label, value] in fields" :key="label"><strong>{{ label }}:</strong> {{ value }}</span>
    </div>
    <details v-if="detailFields.length" class="hospital-details">
      <summary>Consultar dados disponíveis</summary>
      <dl>
        <template v-for="[key, value] in detailFields" :key="key">
          <dt>{{ key }}</dt><dd>{{ value }}</dd>
        </template>
      </dl>
    </details>
    <div class="card-actions">
      <button class="button button-outline" type="button" @click="$emit('select', hospital)">Ver no mapa <span aria-hidden="true">↗</span></button>
      <button class="button button-directions" type="button" :disabled="!hasUserLocation || routeLoading" :title="hasUserLocation ? 'Traçar rota rodoviária no mapa' : 'Partilhe a sua localização para criar uma rota'" @click="$emit('directions', hospital)">
        <span v-if="routeLoading" class="button-spinner" aria-hidden="true"></span>
        {{ routeLoading ? 'A traçar…' : 'Como chegar' }} <span v-if="!routeLoading" aria-hidden="true">→</span>
      </button>
    </div>
  </article>
</template>
