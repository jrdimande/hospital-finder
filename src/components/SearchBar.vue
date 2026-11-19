<script setup>
defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'search'])
</script>

<template>
  <form class="search-bar" role="search" @submit.prevent="emit('search')">
    <label class="search-input-wrap">
      <span class="field-label">Pesquisar por</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.3 4.3"/></svg>
      <input :value="modelValue" type="search" placeholder="Ex.: Hospital Central de Maputo" @input="emit('update:modelValue', $event.target.value)" />
    </label>
    <button class="button search-button" type="submit"><span>Pesquisar</span><span aria-hidden="true">→</span></button>
  </form>
</template>
