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
  pharmaciesLoading: { type: Boolean, default: false },
  pharmaciesError: { type: String, default: '' },
  pharmacySearchDone: { type: Boolean, default: false },
  hasPharmacies: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'directions', 'toggle-all', 'retry-location', 'retry-pharmacies'])
</script>

<template>
  <section class="results-section" aria-labelledby="results-title">
    <div class="results-heading">
      <div>
        <div class="section-kicker"><span></span> RESULTADOS</div>
        <h2 id="results-title">{{ nearbyActive ? 'Unidades e farmácias próximas' : hasExternalResults ? 'Locais encontrados no mapa' : 'Unidades sanitárias' }}</h2>
        <p v-if="nearbyActive">Unidades e farmácias ordenadas por distância</p>
        <p v-else-if="hasExternalResults">Resultados do OpenStreetMap; consulte a origem em cada cartão.</p>
        <p v-else>Unidades disponíveis nos dados do MozGIS</p>
      </div>
      <span v-if="totalCount" class="result-count">{{ totalCount }} {{ nearbyActive ? totalCount === 1 ? 'local próximo' : 'locais próximos' : hasExternalResults ? totalCount === 1 ? 'local' : 'locais' : totalCount === 1 ? 'unidade' : 'unidades' }}</span>
    </div>
    <p v-if="nearbyActive && pharmaciesLoading" class="pharmacy-search-status" role="status">A procurar farmácias próximas…</p>
    <div v-else-if="nearbyActive && pharmaciesError" class="pharmacy-search-status pharmacy-search-error" role="status">
      <p>Não foi possível carregar farmácias do OpenStreetMap. {{ pharmaciesError }} As unidades sanitárias continuam disponíveis.</p>
      <button type="button" @click="emit('retry-pharmacies')">Tentar novamente</button>
    </div>
    <p v-else-if="nearbyActive && pharmacySearchDone && !hasPharmacies" class="pharmacy-search-status" role="status">Não encontrámos farmácias mapeadas num raio de 10 km. Os dados podem estar incompletos.</p>
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
      <strong>{{ locating ? 'A obter a sua localização…' : nearbyActive && !hasUserLocation ? locationError ? 'Não conseguimos obter a localização.' : 'Ative a localização para ver unidades próximas.' : nearbyActive ? 'Não encontrámos unidades ou farmácias próximas.' : 'Nenhuma unidade encontrada.' }}</strong>
      <p>{{ locating ? 'Assim que estiver disponível, ordenamos as unidades pela distância.' : nearbyActive && !hasUserLocation ? locationError || 'O navegador pode pedir autorização. A sua localização só é usada para calcular distâncias.' : nearbyActive ? 'Tente novamente mais tarde ou pesquise por uma localidade.' : 'Tente alterar a pesquisa.' }}</p>
      <button v-if="nearbyActive && !hasUserLocation && !locating" class="button button-primary empty-retry" type="button" @click="emit('retry-location')">Tentar novamente</button>
    </div>
  </section>
</template>
