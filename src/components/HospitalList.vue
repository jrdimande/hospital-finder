<script setup>
import HospitalCard from './HospitalCard.vue'

defineProps({
  hospitals: { type: Array, default: () => [] },
  selectedId: { type: [String, Number], default: null },
  hasUserLocation: { type: Boolean, default: false },
  locating: { type: Boolean, default: false },
  routeLoadingId: { type: [String, Number], default: null },
  nearbyActive: { type: Boolean, default: false },
  distanceFilter: { type: String, default: 'all' },
  isFavorite: { type: Function, default: () => false },
  favoritesOnly: { type: Boolean, default: false },
  favoritesCount: { type: Number, default: 0 },
})

const emit = defineEmits(['select', 'directions', 'update:distanceFilter', 'toggle-favorite', 'update:favoritesOnly'])
</script>

<template>
  <section class="results-section" aria-labelledby="results-title">
    <div class="results-heading">
      <div>
        <div class="section-kicker"><span></span> RESULTADOS</div>
        <h2 id="results-title">{{ nearbyActive ? 'Unidades próximas de ti' : 'Unidades sanitárias' }}</h2>
        <p v-if="nearbyActive">Ordenados pela distância em linha reta</p>
        <p v-else>Unidades disponíveis nos dados do MozGIS</p>
      </div>
      <label v-if="nearbyActive" class="radius-filter">
        <span>Raio</span>
        <select :value="distanceFilter" @change="emit('update:distanceFilter', $event.target.value)">
          <option value="5">Até 5 km</option>
          <option value="10">Até 10 km</option>
          <option value="20">Até 20 km</option>
          <option value="all">Todos</option>
        </select>
      </label>
      <label v-if="favoritesCount" class="favorites-filter">
        <input type="checkbox" :checked="favoritesOnly" @change="emit('update:favoritesOnly', $event.target.checked)" />
        <span>Só favoritos ({{ favoritesCount }})</span>
      </label>
      <span v-if="hospitals.length" class="result-count">{{ hospitals.length }} {{ hospitals.length === 1 ? 'unidade' : 'unidades' }}</span>
    </div>
    <div v-if="hospitals.length" class="hospital-list">
      <HospitalCard
        v-for="item in hospitals"
        :key="item.hospital.id"
        :hospital="item.hospital"
        :distance-km="item.distanceKm"
        :selected="selectedId === item.hospital.id"
        :has-user-location="hasUserLocation"
        :route-loading="routeLoadingId === item.hospital.id"
        :is-favorite="isFavorite(item.hospital.id)"
        @select="emit('select', $event)"
        @directions="emit('directions', $event)"
        @toggle-favorite="emit('toggle-favorite', $event)"
      />
    </div>
    <div v-else class="empty-state">
      <span class="empty-icon" aria-hidden="true">⌖</span>
      <strong>{{ locating ? 'A obter a sua localização…' : favoritesOnly ? 'Ainda não tem unidades nos favoritos.' : nearbyActive && !hasUserLocation ? 'Partilhe a sua localização para encontrar hospitais próximos.' : nearbyActive ? 'Não encontrámos hospitais neste raio.' : 'Nenhuma unidade encontrada.' }}</strong>
      <p>{{ locating ? 'Assim que a localização estiver disponível, mostramos as unidades mais próximas.' : favoritesOnly ? 'Toque na estrela de uma unidade para a guardar aqui.' : nearbyActive && !hasUserLocation ? 'A localização só é usada depois da sua autorização.' : nearbyActive ? 'Experimente aumentar o raio ou escolher “Todos os hospitais”.' : 'Tente alterar a pesquisa ou o filtro de província.' }}</p>
    </div>
  </section>
</template>
