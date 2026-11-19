<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import BrandMark from './BrandMark.vue'

const menuOpen = ref(false)
const menuRoot = ref(null)

function handleOutsideClick(event) {
  if (!menuRoot.value?.contains(event.target)) menuOpen.value = false
}

function handleEscape(event) {
  if (event.key === 'Escape') menuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <header class="site-header">
    <nav class="navbar page-shell" aria-label="Navegação principal">
      <BrandMark />
      <div ref="menuRoot" class="nav-menu-wrap">
        <button class="menu-toggle" type="button" :aria-label="menuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'" aria-controls="site-navigation-menu" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
          <span></span><span></span><span></span>
        </button>
        <nav v-if="menuOpen" id="site-navigation-menu" class="nav-menu" aria-label="Navegação">
          <a href="#inicio" @click="menuOpen = false">Início</a>
          <a href="#encontrar" @click="menuOpen = false">Encontrar unidades</a>
          <a href="#/info" @click="menuOpen = false">Informações do projeto</a>
        </nav>
      </div>
      <a class="nav-action" href="#encontrar">Explorar mapa <span aria-hidden="true">↗</span></a>
    </nav>
  </header>
</template>
