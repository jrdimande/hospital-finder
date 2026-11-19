<script setup>
import HospitalCard from './HospitalCard.vue'

defineProps({
  hospitals: { type: Array, default: () => [] },
  totalCount: { type: Number, default: 0 },
  showingAll: { type: Boolean, default: false },
  selectedId: { type: [String, Number], default: null },
  hasUserLocation: { type: Boolean, default: false },
  locating: { type: Boolean, default: false },
  locationError: { type: String, default: '' },
  hasExternalResults: { type: Boolean, default: false },
  routeLoadingId: { type: [String, Number], default: null },
  nearbyActive: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'directions', 'toggle-all', 'retry-location'])
</script>

<template>
  <section class="results-section" aria-labelledby="results-title">
    <div class="results-heading">
      <div>
        <div class="section-kicker"><span></span> RESULTADOS</div>
        <h2 id="results-title">{{ nearbyActive ? 'Unidades próximas de si' : hasExternalResults ? 'Locais encontrados no mapa' : 'Unidades sanitárias' }}</h2>
        <p v-if="nearbyActive">Unidades mais próximas, ordenadas por distância</p>
        <p v-else-if="hasExternalResults">Locais encontrados pela pesquisa</p>
        <p v-else>Unidades disponíveis nos dados do MozGIS</p>
      </div>
      <span v-if="totalCount" class="result-count">{{ totalCount }} {{ nearbyActive ? totalCount === 1 ? 'local próximo' : 'locais próximos' : hasExternalResults ? totalCount === 1 ? 'local' : 'locais' : totalCount === 1 ? 'unidade' : 'unidades' }}</span>
    </div>
    <button
      v-if="showingAll || totalCount > hospitals.length"
      class="show-all-button"
      type="button"
      :aria-expanded="showingAll"
      @click="emit('toggle-all')"
    >{{ showingAll ? 'Mostrar menos' : `Ver todos os ${totalCount} resultados` }} <span aria-hidden="true">{{ showingAll ? '↑' : '↓' }}</span></button>
    <div v-if="hospitals.length" class="hospital-list">
      <HospitalCard
        v-for="item in hospitals"
        :key="item.hospital.id"
        :hospital="item.hospital"
        :distance-km="item.distanceKm"
        :selected="selectedId === item.hospital.id"
        :has-user-location="hasUserLocation"
        :locating="locating"
        :route-loading="routeLoadingId === item.hospital.id"
        @select="emit('select', $event)"
        @directions="emit('directions', $event)"
      />
    </div>
    <div v-else class="empty-state">
      <span class="empty-icon" aria-hidden="true">⌖</span>
      <strong>{{ locating ? 'A obter a sua localização…' : nearbyActive && !hasUserLocation ? locationError ? 'Não conseguimos obter a localização.' : 'Ative a localização para ver unidades próximas.' : nearbyActive ? 'Não encontrámos unidades próximas.' : 'Nenhuma unidade encontrada.' }}</strong>
      <p>{{ locating ? 'Assim que estiver disponível, ordenamos as unidades pela distância.' : nearbyActive && !hasUserLocation ? locationError || 'O navegador pode pedir autorização. A sua localização só é usada para calcular distâncias.' : nearbyActive ? 'Tente novamente mais tarde ou pesquise por uma localidade.' : 'Tente alterar a pesquisa.' }}</p>
      <button v-if="nearbyActive && !hasUserLocation && !locating" class="button button-primary empty-retry" type="button" @click="emit('retry-location')">Tentar novamente</button>
    </div>
  </section>
</template>
