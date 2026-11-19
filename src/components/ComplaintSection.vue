<script setup>
import emailjs from '@emailjs/browser'
import { reactive, ref } from 'vue'

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID?.trim()
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID?.trim()
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.trim()
const configured = Boolean(serviceId && templateId && publicKey)
const problemTypes = [
  'Dados incorrectos de uma unidade',
  'Problema com mapa ou rota',
  'Problema técnico',
  'Outro',
]
const emptyFields = { name: '', email: '', problem_type: '', message: '' }
const fields = reactive({ ...emptyFields })
const sending = ref(false)
const status = ref('')
const error = ref('')

async function submitComplaint() {
  if (sending.value || !configured) return
  status.value = ''
  error.value = ''

  if (!fields.name || !fields.email || !problemTypes.includes(fields.problem_type) || !fields.message) {
    error.value = 'Preencha todos os campos para enviar a reclamação.'
    return
  }

  sending.value = true
  try {
    await emailjs.send(serviceId, templateId, { ...fields }, { publicKey })
    Object.assign(fields, emptyFields)
    status.value = 'Reclamação enviada. Obrigado pelo contacto. A equipa vai analisar a sua reclamação.'
  } catch {
    error.value = 'Não foi possível enviar a reclamação. Tente novamente dentro de instantes.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section id="reclamar" class="complaint-section" aria-labelledby="complaint-title">
    <div class="page-shell">
      <div class="complaint-card">
        <div class="about-copy">
          <h2 id="complaint-title">Reclamar</h2>
          <p>Comunique um problema com o Hospital Finder. Evite incluir dados clínicos na descrição.</p>
        </div>
        <p v-if="!configured" class="notice">O envio de reclamações está temporariamente indisponível.</p>

        <form class="complaint-form" @submit.prevent="submitComplaint">
          <fieldset :disabled="sending || !configured">
            <label for="complaint-name">Nome completo</label>
            <input id="complaint-name" v-model.trim="fields.name" name="name" autocomplete="name" maxlength="120" required>

            <label for="complaint-email">E-mail</label>
            <input id="complaint-email" v-model.trim="fields.email" type="email" name="email" autocomplete="email" maxlength="254" required>

            <label for="complaint-type">Tipo de problema</label>
            <select id="complaint-type" v-model="fields.problem_type" name="problem_type" required>
              <option disabled value="">Seleccione uma opção</option>
              <option v-for="type in problemTypes" :key="type" :value="type">{{ type }}</option>
            </select>

            <label for="complaint-message">Descrição da reclamação</label>
            <textarea id="complaint-message" v-model.trim="fields.message" name="message" rows="5" maxlength="3000" required></textarea>

            <button type="submit" class="button button-primary">
              {{ sending ? 'A enviar…' : 'Enviar reclamação' }}
            </button>
          </fieldset>
          <p v-if="status" class="notice" role="status">{{ status }}</p>
          <p v-if="error" class="notice notice-error" role="alert">{{ error }}</p>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.complaint-section {
  padding: clamp(40px, 7vw, 68px) 0;
  background: var(--pale);
}

.complaint-card {
  max-width: 640px;
  margin: 0 auto;
  padding: clamp(18px, 4vw, 32px);
  background: white;
  border: 1px solid #e7eef1;
  border-radius: 10px;
  box-shadow: 0 6px 24px #17364b07;
}

.complaint-form fieldset {
  display: grid;
  gap: 8px;
  min-width: 0;
  margin: 20px 0 0;
  padding: 0;
  border: 0;
}

.complaint-form label {
  color: var(--navy);
  font-size: 13px;
  font-weight: 700;
}

.complaint-form :is(input, select, textarea) {
  width: 100%;
  margin-bottom: 8px;
  padding: 10px 12px;
  border: 1px solid #d5e0e5;
  border-radius: 7px;
  color: var(--navy);
  background: white;
  font: inherit;
  font-size: 16px;
}

.complaint-form textarea {
  resize: vertical;
}

.complaint-form button {
  justify-self: start;
  min-height: 44px;
  padding: 10px 16px;
}
</style>
