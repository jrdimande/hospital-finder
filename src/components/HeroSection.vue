<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  locating: { type: Boolean, default: false },
  tracking: { type: Boolean, default: false },
})

defineEmits(['locate'])
</script>

<template>
  <section id="inicio" class="hero page-shell">
    <div class="hero-copy">
      <h1>Encontre uma unidade sanitária <span>perto de si.</span></h1>
      <p>Descubra hospitais, centros e postos de saúde em Moçambique, veja a sua posição atual e encontre o melhor caminho.</p>
      <button class="button button-primary hero-button" :class="{ 'button-tracking': tracking }" :disabled="loading" :aria-busy="locating" @click="$emit('locate')">
        <span v-if="locating" class="button-spinner" aria-hidden="true"></span>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg>
        {{ locating ? 'A obter localização…' : tracking ? 'Parar localização' : 'Encontrar unidades perto de mim' }}
        <span v-if="tracking && !locating" class="tracking-indicator" aria-hidden="true"></span>
      </button>
      <div class="hero-note"><span class="privacy-icon" aria-hidden="true">⌖</span> A sua localização só é usada com a sua autorização.</div>
    </div>
    <div class="hero-art" aria-label="Ilustração de cuidados de saúde">
      <div class="art-glow"></div>
      <div class="art-cross"><span></span><i></i></div>
      <div class="art-orbit orbit-one"></div>
      <div class="art-orbit orbit-two"></div>
      <div class="art-location location-one"><span class="location-pulse"></span><span class="location-pin">+</span></div>
      <div class="art-location location-two"><span class="location-pin">+</span></div>
      <div class="hero-art-label"><span class="live-dot"></span> Moçambique, cuidado perto</div>
      <div class="hero-art-caption">Informação para cuidar melhor.</div>
    </div>
    <div class="hero-stats" aria-label="Resumo da plataforma">
      <div><span class="stat-icon">⌖</span><strong>Em todo o país</strong><small>Unidades sanitárias de Moçambique</small></div>
      <div><span class="stat-icon green">↗</span><strong>Mais perto de si</strong><small>Resultados ordenados por distância</small></div>
      <div><span class="stat-icon blue">◎</span><strong>Dados geográficos</strong><small>Fonte oficial MozGIS</small></div>
    </div>
  </section>
</template>
