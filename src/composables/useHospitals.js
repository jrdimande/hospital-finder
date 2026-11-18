import { computed, onMounted, ref } from 'vue'
import { fetchHospitals } from '../services/hospitalService'

export function useHospitals() {
  const hospitals = ref([])
  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)

  const provinces = computed(() => {
    const values = hospitals.value
      .map((hospital) => hospital.properties.Provincia)
      .filter((province) => typeof province === 'string' && province.trim())
    return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'pt'))
  })

  async function loadHospitals() {
    loading.value = true
    error.value = ''

    try {
      const { facilities, errors } = await fetchHospitals()
      if (!facilities.length) {
        hospitals.value = []
        error.value = 'A API do MozGIS não devolveu unidades sanitárias com coordenadas válidas.'
        return
      }
      hospitals.value = facilities
      if (errors.length) {
        error.value = `Algumas categorias não puderam ser carregadas: ${errors.join(' ')}`
      }
      loaded.value = true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Ocorreu um erro ao carregar as unidades sanitárias.'
    } finally {
      loading.value = false
    }
  }

  onMounted(loadHospitals)

  return { hospitals, loading, error, loaded, provinces, reload: loadHospitals }
}
