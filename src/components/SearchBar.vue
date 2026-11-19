<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  suggestions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'search'])
const focused = ref(false)
const activeIndex = ref(-1)
const suggestionsOpen = computed(() => focused.value && props.suggestions.length > 0)

watch(() => props.modelValue, () => { activeIndex.value = -1 })

function chooseSuggestion(suggestion) {
  emit('update:modelValue', suggestion.name)
  focused.value = false
  activeIndex.value = -1
}

function onKeydown(event) {
  if (event.key === 'ArrowDown' && props.suggestions.length) {
    event.preventDefault()
    focused.value = true
    activeIndex.value = (activeIndex.value + 1) % props.suggestions.length
  } else if (event.key === 'ArrowUp' && props.suggestions.length) {
    event.preventDefault()
    focused.value = true
    activeIndex.value = activeIndex.value <= 0 ? props.suggestions.length - 1 : activeIndex.value - 1
  } else if (event.key === 'Escape') {
    focused.value = false
    activeIndex.value = -1
  } else if (event.key === 'Enter' && suggestionsOpen.value && activeIndex.value >= 0) {
    event.preventDefault()
    chooseSuggestion(props.suggestions[activeIndex.value])
  }
}
</script>

<template>
  <form class="search-bar" role="search" @submit.prevent="emit('search')">
    <div class="search-autocomplete">
      <label class="search-input-wrap">
        <span class="field-label">Pesquisar por</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.3 4.3"/></svg>
        <input
          :value="modelValue"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="place-suggestions"
          :aria-expanded="suggestionsOpen"
          :aria-activedescendant="activeIndex >= 0 ? `place-suggestion-${activeIndex}` : undefined"
          placeholder="Ex.: Hospital Central de Maputo"
          @focus="focused = true"
          @blur="focused = false; activeIndex = -1"
          @keydown="onKeydown"
          @input="emit('update:modelValue', $event.target.value)"
        />
      </label>
      <ul v-if="suggestionsOpen" id="place-suggestions" class="search-suggestions" role="listbox" aria-label="Sugestões de unidades sanitárias">
        <li v-for="(suggestion, index) in suggestions" :key="suggestion.id" role="presentation">
          <button :id="`place-suggestion-${index}`" type="button" role="option" :aria-selected="activeIndex === index" :class="{ 'is-active': activeIndex === index }" @mousedown.prevent="chooseSuggestion(suggestion)">
            <span>{{ suggestion.name }}</span>
            <small>{{ [suggestion.type, suggestion.location].filter(Boolean).join(' · ') }}</small>
          </button>
        </li>
      </ul>
    </div>
    <button class="button search-button" type="submit"><span>Pesquisar</span><span aria-hidden="true">→</span></button>
  </form>
</template>
