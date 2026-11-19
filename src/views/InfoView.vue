<script setup>
import { computed } from 'vue'
import BrandMark from '../components/BrandMark.vue'
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
          <div class="about-caption">Unidades de saúde em Moçambique</div>
        </div>
        <div class="about-copy">
          <div class="section-kicker"><span></span> SOBRE O SAÚDE PERTO</div>
          <h1>Informação que ajuda a chegar a tempo.</h1>
          <p>O Saúde Perto reúne hospitais, centros e postos de saúde de Moçambique num só mapa. Pesquise uma localidade, veja as unidades próximas e trace o caminho até lá.</p>
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
            <p>A pesquisa por localidade também pode mostrar locais do OpenStreetMap, que não fazem necessariamente parte do cadastro de unidades sanitárias do MozGIS. As rotas a pé usam o perfil pedonal OSRM; carro e mota usam o perfil rodoviário.</p>
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
        <BrandMark />
        <p>Um mapa para encontrar hospitais, centros e postos de saúde em Moçambique.</p>
      </div>
      <div class="footer-column"><strong>Explorar</strong><a href="#inicio">Início</a><a href="#encontrar">Encontrar unidades</a></div>
      <div class="footer-column"><strong>Fontes dos dados</strong><a href="https://www.mozgis.gov.mz/" target="_blank" rel="noreferrer">Unidades sanitárias: MozGIS ↗</a><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">Mapa e locais: OpenStreetMap ↗</a></div>
      <div class="footer-column"><strong>Sobre o projeto</strong><a href="#/info">Como funciona e fontes</a><span>Projeto informativo, sem vínculo de emergência.</span></div>
    </div>
    <div class="page-shell footer-bottom"><span>© {{ new Date().getFullYear() }} Saúde Perto</span><span>Confirme horários e serviços diretamente com a unidade.</span></div>
  </footer>
</template>
