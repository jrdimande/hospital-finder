<script setup>
import { computed } from 'vue'
import Navbar from '../components/Navbar.vue'
import { useHospitals } from '../composables/useHospitals'

const { hospitals, loading, error, updatedAt } = useHospitals()
const formattedUpdate = computed(() => updatedAt.value
  ? new Intl.DateTimeFormat('pt-MZ', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(updatedAt.value))
  : '')
</script>

<template>
  <Navbar />
  <main>
    <section class="about-section info-page">
      <div class="page-shell about-grid">
        <div class="about-visual">
          <div class="about-map-lines"></div>
          <div class="about-cross"><span></span><i></i></div>
          <span class="about-point point-a"></span><span class="about-point point-b"></span><span class="about-point point-c"></span>
          <div class="about-caption"><span class="live-dot"></span> Saúde mais perto, para todos</div>
        </div>
        <div class="about-copy">
          <div class="section-kicker"><span></span> SOBRE O HOSPITAL FINDER MZ</div>
          <h1>Informação que ajuda a chegar a tempo.</h1>
          <p>O Hospital finder MZ ajuda a encontrar hospitais, centros e postos de saúde em Moçambique, consultar a sua localização no mapa e iniciar uma rota.</p>
          <div class="about-points">
            <div><span class="check-mark">✓</span><span><strong>Dados geográficos abertos</strong><small>As unidades sanitárias são obtidas das camadas públicas do MozGIS.</small></span></div>
            <div><span class="check-mark">✓</span><span><strong>Pesquisa e mapa</strong><small>Pesquise unidades e localidades; locais adicionais podem vir do OpenStreetMap.</small></span></div>
            <div><span class="check-mark">✓</span><span><strong>Privacidade da localização</strong><small>A localização só é solicitada quando escolhe procurar unidades próximas ou pedir uma rota.</small></span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="info-data-section">
      <div class="page-shell">
        <div class="section-kicker"><span></span> DADOS E ATUALIZAÇÃO</div>
        <h2>De onde vêm as informações</h2>
        <p class="info-intro">Consulte as fontes usadas no mapa e quando os dados publicados foram gerados.</p>

        <div class="info-card-grid">
          <article class="info-card">
            <span class="info-card-icon">◎</span>
            <h3>Unidades sanitárias</h3>
            <p>Hospitais, centros de saúde e postos de saúde vêm do serviço geográfico público do MozGIS.</p>
            <a href="https://www.mozgis.gov.mz/" target="_blank" rel="noreferrer">Consultar MozGIS ↗</a>
          </article>
          <article class="info-card">
            <span class="info-card-icon green">↗</span>
            <h3>Mapa, pesquisa e rotas</h3>
            <p>O mapa e a pesquisa de locais usam OpenStreetMap. As rotas rodoviárias são estimadas pelo OSRM.</p>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Créditos OpenStreetMap ↗</a>
          </article>
          <article class="info-card">
            <span class="info-card-icon">◷</span>
            <h3>Atualização dos dados</h3>
            <p v-if="loading">A carregar a informação de atualização…</p>
            <p v-else-if="formattedUpdate">Última geração dos dados publicados: <strong>{{ formattedUpdate }}</strong>.</p>
            <p v-else>O serviço consultado não forneceu uma data de geração para esta sessão.</p>
            <p class="info-update-note">Os dados publicados são gerados durante cada publicação do site. A atualização ocorre quando há uma nova publicação, não num horário fixo.</p>
            <small v-if="!error && hospitals.length">{{ hospitals.length }} unidades carregadas nesta sessão.</small>
            <small v-if="error" class="info-error">Não foi possível confirmar o estado atual dos dados.</small>
          </article>
        </div>

        <p class="info-disclaimer">Os dados podem estar incompletos ou desatualizados. Confirme horários, serviços e disponibilidade diretamente junto da unidade sanitária.</p>
      </div>
    </section>
  </main>
  <footer id="contacto" class="site-footer">
    <div class="page-shell footer-main">
      <div class="footer-brand">
        <a class="brand" href="#inicio"><span class="brand-mark" aria-hidden="true"><span></span></span><span>Hospital finder <strong>MZ</strong></span></a>
        <p>Mais perto dos cuidados de saúde em Moçambique.</p>
      </div>
      <div class="footer-column"><strong>Explorar</strong><a href="#inicio">Início</a><a href="#encontrar">Encontrar hospitais</a></div>
      <div class="footer-column"><strong>Fontes</strong><a href="https://www.mozgis.gov.mz/" target="_blank" rel="noreferrer">Dados: MozGIS ↗</a><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Mapa: OpenStreetMap ↗</a></div>
      <div class="footer-column"><strong>Contacto</strong><span>Contacto do projeto não disponibilizado.</span><span>Projeto informativo</span></div>
    </div>
    <div class="page-shell footer-bottom"><span>© {{ new Date().getFullYear() }} Hospital finder MZ</span><span>Confirme a informação diretamente junto da unidade sanitária.</span></div>
  </footer>
</template>
