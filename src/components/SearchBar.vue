<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  provinceValue: { type: String, default: '' },
  provinces: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'update:provinceValue', 'search'])
</script>

<template>
  <form class="search-bar" role="search" @submit.prevent="emit('search')">
    <label class="search-input-wrap">
      <span class="sr-only">Pesquisar por hospital, tipo ou localização</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.3 4.3"/></svg>
      <input :value="modelValue" type="search" placeholder="Pesquisar hospital ou localização…" @input="emit('update:modelValue', $event.target.value)" />
    </label>
    <label class="province-select">
      <span class="sr-only">Filtrar por província</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
      <select :value="provinceValue" @change="emit('update:provinceValue', $event.target.value)">
        <option value="">Todas as províncias</option>
        <option v-for="province in provinces" :key="province" :value="province">{{ province }}</option>
      </select>
      <span class="select-chevron" aria-hidden="true">⌄</span>
    </label>
    <button class="button search-button" type="submit">Pesquisar <span aria-hidden="true">→</span></button>
  </form>
</template>
