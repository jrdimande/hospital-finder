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
        <div class="complaint-heading">
          <div>
            <span class="complaint-kicker">APOIO AO PROJECTO</span>
            <h2 id="complaint-title">Comunicar um problema</h2>
            <p>Ajude-nos a corrigir informações ou melhorar o mapa.</p>
          </div>
          <p class="complaint-privacy-note">Por segurança, não inclua dados clínicos na mensagem.</p>
        </div>
        <p v-if="!configured" class="complaint-unavailable" role="status">
          O envio de reclamações está temporariamente indisponível.
        </p>

        <form class="complaint-form" @submit.prevent="submitComplaint">
          <fieldset :disabled="sending || !configured" :aria-busy="sending">
            <div class="complaint-fields">
              <div class="complaint-field">
                <label for="complaint-name">Nome completo</label>
                <input id="complaint-name" v-model.trim="fields.name" name="name" autocomplete="name" maxlength="120" required>
              </div>
              <div class="complaint-field">
                <label for="complaint-email">E-mail</label>
                <input id="complaint-email" v-model.trim="fields.email" type="email" name="email" autocomplete="email" maxlength="254" required>
              </div>
              <div class="complaint-field complaint-field-wide">
                <label for="complaint-type">Tipo de problema</label>
                <select id="complaint-type" v-model="fields.problem_type" name="problem_type" required>
                  <option disabled value="">Seleccione uma opção</option>
                  <option v-for="type in problemTypes" :key="type" :value="type">{{ type }}</option>
                </select>
              </div>
              <div class="complaint-field complaint-field-wide">
                <label for="complaint-message">Descrição</label>
                <textarea id="complaint-message" v-model.trim="fields.message" name="message" rows="5" maxlength="3000" required></textarea>
                <small>Descreva o problema sem incluir informação clínica.</small>
              </div>
              <div class="complaint-submit-row">
                <span>Os campos são obrigatórios.</span>
                <button type="submit" class="button button-primary">
                  {{ sending ? 'A enviar…' : 'Enviar mensagem' }}
                  <span v-if="!sending" aria-hidden="true">→</span>
                  <span v-else class="complaint-submit-spinner" aria-hidden="true"></span>
                </button>
              </div>
            </div>
          </fieldset>
          <p v-if="status" class="complaint-feedback complaint-success" role="status">{{ status }}</p>
          <p v-if="error" class="complaint-feedback complaint-error" role="alert">{{ error }}</p>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.complaint-section {
  padding: clamp(52px, 8vw, 92px) 0;
  background: linear-gradient(180deg, #f3f8fa 0%, #edf4f6 100%);
}

.complaint-card {
  max-width: 820px;
  margin: 0 auto;
  padding: clamp(22px, 5vw, 44px);
  background: white;
  border: 1px solid #e1eaee;
  border-radius: 16px;
  box-shadow: 0 18px 48px #17364b0b;
}

.complaint-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #edf1f3;
}

.complaint-kicker {
  color: #26836d;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 1.1px;
}

.complaint-heading h2 {
  margin: 8px 0 6px;
  color: var(--navy);
  font-size: clamp(23px, 4vw, 30px);
  letter-spacing: -.8px;
  line-height: 1.2;
}

.complaint-heading > div > p {
  margin: 0;
  color: #718492;
  font-size: 13px;
  line-height: 1.6;
}

.complaint-privacy-note {
  max-width: 230px;
  margin: 0;
  padding: 11px 13px;
  border: 1px solid #e5eee9;
  border-radius: 8px;
  background: #f5faf7;
  color: #547363;
  font-size: 11px;
  line-height: 1.5;
}

.complaint-unavailable {
  margin: 18px 0 0;
  padding: 12px 14px;
  border: 1px solid #e7e9e9;
  border-radius: 8px;
  background: #f7f8f8;
  color: #657783;
  font-size: 12px;
}

.complaint-form fieldset {
  min-width: 0;
  margin: 24px 0 0;
  padding: 0;
  border: 0;
}

.complaint-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 16px;
}

.complaint-field {
  display: grid;
  align-content: start;
  gap: 7px;
  min-width: 0;
}

.complaint-field-wide,
.complaint-submit-row {
  grid-column: 1 / -1;
}

.complaint-form label {
  color: #314d60;
  font-size: 12px;
  font-weight: 700;
}

.complaint-form :is(input, select, textarea) {
  width: 100%;
  min-height: 46px;
  padding: 11px 13px;
  border: 1px solid #dbe5e9;
  border-radius: 8px;
  color: #243f52;
  background: white;
  font: inherit;
  font-size: 14px;
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}

.complaint-form :is(input, select, textarea):hover:not(:disabled) {
  border-color: #b8cbd3;
}

.complaint-form :is(input, select, textarea):focus {
  border-color: #3987a4;
  outline: 0;
  box-shadow: 0 0 0 3px #3987a41c;
}

.complaint-form :is(input, select, textarea):disabled {
  color: #82919a;
  background: #f6f8f8;
  cursor: not-allowed;
}

.complaint-form textarea {
  min-height: 145px;
  resize: vertical;
}

.complaint-field small {
  color: #82919a;
  font-size: 11px;
  line-height: 1.4;
}

.complaint-submit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 2px;
}

.complaint-submit-row > span {
  color: #82919a;
  font-size: 11px;
}

.complaint-form button {
  min-height: 48px;
  padding: 0 19px;
  border-radius: 8px;
  font-size: 13px;
}

.complaint-submit-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff66;
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

.complaint-feedback {
  margin: 18px 0 0;
  padding: 13px 15px;
  border: 1px solid;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.55;
}

.complaint-success {
  border-color: #cce8d9;
  background: #f1faf4;
  color: #286044;
}

.complaint-error {
  border-color: #f0d2cd;
  background: #fff5f3;
  color: #88483e;
}

@media (max-width: 620px) {
  .complaint-heading {
    align-items: stretch;
    flex-direction: column;
    gap: 15px;
  }

  .complaint-privacy-note {
    max-width: none;
  }

  .complaint-fields {
    grid-template-columns: minmax(0, 1fr);
    gap: 15px;
  }

  .complaint-field-wide,
  .complaint-submit-row {
    grid-column: auto;
  }

  .complaint-submit-row {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .complaint-submit-row .button {
    width: 100%;
  }
}
</style>
