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
  distanceFilter: { type: String, default: 'all' },
})

const emit = defineEmits(['select', 'directions', 'update:distanceFilter', 'toggle-all', 'retry-location'])
</script>

<template>
  <section class="results-section" aria-labelledby="results-title">
    <div class="results-heading">
      <div>
        <div class="section-kicker"><span></span> 2. ESCOLHA UMA UNIDADE</div>
        <h2 id="results-title">{{ nearbyActive ? 'Unidades próximas de si' : hasExternalResults ? 'Locais encontrados no mapa' : 'Unidades sanitárias' }}</h2>
        <p v-if="nearbyActive">Ordenados pela distância em linha reta</p>
        <p v-else-if="hasExternalResults">Resultados do OpenStreetMap; consulte a origem em cada cartão.</p>
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
      <span v-if="totalCount" class="result-count">{{ totalCount }} {{ hasExternalResults && !nearbyActive ? totalCount === 1 ? 'local' : 'locais' : totalCount === 1 ? 'unidade' : 'unidades' }}</span>
    </div>
    <button
      v-if="showingAll || totalCount > hospitals.length"
      class="show-all-button"
      type="button"
      :aria-expanded="showingAll"
      @click="emit('toggle-all')"
    >{{ showingAll ? 'Mostrar menos' : `Ver todas as ${totalCount} unidades` }} <span aria-hidden="true">{{ showingAll ? '↑' : '↓' }}</span></button>
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
      <strong>{{ locating ? 'A obter a sua localização…' : nearbyActive && !hasUserLocation ? locationError ? 'Não conseguimos obter a localização.' : 'Ative a localização para ver unidades próximas.' : nearbyActive ? 'Não encontrámos unidades neste raio.' : 'Nenhuma unidade encontrada.' }}</strong>
      <p>{{ locating ? 'Assim que estiver disponível, ordenamos as unidades pela distância.' : nearbyActive && !hasUserLocation ? locationError || 'O navegador pode pedir autorização. A sua localização só é usada para calcular distâncias.' : nearbyActive ? 'Aumente o raio para procurar numa área maior.' : 'Tente alterar a pesquisa ou o filtro de província.' }}</p>
      <button v-if="nearbyActive && !hasUserLocation && !locating" class="button button-primary empty-retry" type="button" @click="emit('retry-location')">Tentar novamente</button>
      <button v-if="nearbyActive && hasUserLocation" class="button button-outline empty-retry" type="button" @click="emit('update:distanceFilter', 'all')">Ver unidades em qualquer distância</button>
    </div>
  </section>
</template>
