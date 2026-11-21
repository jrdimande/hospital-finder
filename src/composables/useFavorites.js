import { ref, watch } from 'vue'

const STORAGE_KEY = 'saude-mz:favoritos'

function readStoredIds() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const favoriteIds = ref(new Set(readStoredIds()))

watch(
  favoriteIds,
  (ids) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
    } catch {
      // Armazenamento indisponível (ex.: modo privado); os favoritos deixam de ser persistidos.
    }
  },
  { deep: true },
)

export function useFavorites() {
  function isFavorite(id) {
    return favoriteIds.value.has(id)
  }

  function toggleFavorite(id) {
    const next = new Set(favoriteIds.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    favoriteIds.value = next
  }

  return { favoriteIds, isFavorite, toggleFavorite }
}
