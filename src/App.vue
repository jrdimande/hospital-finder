<script setup>
import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import HomeView from './views/HomeView.vue'
import InfoView from './views/InfoView.vue'

const currentPage = ref(window.location.hash === '#/info' ? 'info' : 'home')

function syncPage() {
  const hash = window.location.hash
  const nextPage = hash === '#/info' ? 'info' : 'home'
  currentPage.value = nextPage
  nextTick(() => {
    if (nextPage === 'home' && hash && !hash.startsWith('#/')) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
      return
    }
    window.scrollTo(0, 0)
  })
}

onMounted(() => window.addEventListener('hashchange', syncPage))
onBeforeUnmount(() => window.removeEventListener('hashchange', syncPage))
</script>

<template>
  <HomeView v-if="currentPage === 'home'" />
  <InfoView v-else />
</template>
