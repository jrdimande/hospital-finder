<script setup>
import BrandMark from './BrandMark.vue'
</script>

<template>
  <header class="site-header">
    <nav class="navbar page-shell" aria-label="Navegação principal">
      <BrandMark />
      <div class="nav-links">
        <a href="#inicio">Início</a>
        <a href="#/info">Info</a>
        <a href="#contacto">Contacto</a>
      </div>
      <a class="nav-action" href="#encontrar">Explorar mapa <span aria-hidden="true">↗</span></a>
    </nav>
  </header>
</template>
