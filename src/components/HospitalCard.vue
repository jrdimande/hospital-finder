<script setup>
import { computed } from 'vue'
import { formatDistance } from '../utils/distance'
import { extractPhoneNumbers } from '../utils/phone'

const props = defineProps({
  hospital: { type: Object, required: true },
  distanceKm: { type: Number, default: null },
  selected: { type: Boolean, default: false },
  hasUserLocation: { type: Boolean, default: false },
  routeLoading: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
})

defineEmits(['select', 'directions', 'toggle-favorite'])

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
      <span class="card-topline-left">
        <span class="hospital-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M4 21V5h16v16M2 21h20M9 9h6M12 6v6M8 16h.01M16 16h.01"/></svg>
        </span>
        <span v-if="distanceKm !== null" class="distance-pill">{{ formatDistance(distanceKm) }}</span>
      </span>
      <button
        type="button"
        class="favorite-toggle"
        :class="{ 'is-active': isFavorite }"
        :aria-pressed="isFavorite"
        :title="isFavorite ? 'Remover dos favoritos' : 'Guardar nos favoritos'"
        @click="$emit('toggle-favorite', hospital)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.35-9.5-8.5C.8 8.1 2.2 4.5 6 4a5 5 0 0 1 6 2 5 5 0 0 1 6-2c3.8.5 5.2 4.1 3.5 7.5C19 15.65 12 20 12 20Z"/></svg>
        <span class="sr-only">{{ isFavorite ? 'Remover dos favoritos' : 'Guardar nos favoritos' }}</span>
      </button>
    </div>
    <h3>{{ hospital.name }}</h3>
    <p v-if="hospital.type" class="hospital-type">{{ hospital.type }}</p>
    <div class="hospital-fields">
      <span v-for="[label, value] in fields" :key="label">
        <strong>{{ label }}:</strong>
        <template v-if="label === 'Contacto' && extractPhoneNumbers(value).length">
          <template v-for="(phone, index) in extractPhoneNumbers(value)" :key="phone">
            <span v-if="index">, </span><a :href="`tel:${phone}`">{{ phone }}</a>
          </template>
        </template>
        <template v-else>{{ value }}</template>
      </span>
    </div>
    <details v-if="detailFields.length" class="hospital-details">
      <summary>Consultar dados disponíveis</summary>
      <dl>
        <template v-for="[key, value] in detailFields" :key="key">
          <dt>{{ key }}</dt>
          <dd>
            <template v-if="extractPhoneNumbers(value).length">
              <template v-for="(phone, index) in extractPhoneNumbers(value)" :key="phone">
                <span v-if="index">, </span><a :href="`tel:${phone}`">{{ phone }}</a>
              </template>
            </template>
            <template v-else>{{ value }}</template>
          </dd>
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
