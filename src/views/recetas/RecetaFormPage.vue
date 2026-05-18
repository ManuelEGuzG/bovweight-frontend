<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/fincas/${idFinca}/animales/${numeroArete}/recetas`" />
        </ion-buttons>
        <ion-title>Nueva Receta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="form-wrapper">
        <div class="info-banner">
          <ion-icon :icon="medkitOutline" />
          <div>
            <p class="banner-title">Receta veterinaria</p>
            <p class="banner-sub">Animal: {{ numeroArete }}</p>
          </div>
        </div>

        <div class="form-field">
          <label>Medicamento *</label>
          <select v-model="form.id_medicamento" class="form-input">
            <option :value="null" disabled>Selecciona un medicamento</option>
            <option v-for="m in medicamentos" :key="m.id_medicamento" :value="m.id_medicamento">
              {{ m.nombre }}
            </option>
          </select>
        </div>

        <div class="form-field">
          <label>Dosis *</label>
          <input v-model="form.dosis" class="form-input" placeholder="Ej: 5 ml o 1 tableta" />
        </div>

        <div class="form-field">
          <label>Frecuencia *</label>
          <input v-model="form.frecuencia" class="form-input" placeholder="Ej: cada 8 horas" />
        </div>

        <div class="form-field">
          <label>Duración (días) *</label>
          <input v-model.number="form.duracion_dias" type="number" min="1" max="365" class="form-input" placeholder="7" />
        </div>

        <div class="form-field">
          <label>Fecha de emisión</label>
          <input v-model="form.fecha_emision" type="date" class="form-input" />
        </div>

        <div class="form-field">
          <label>Diagnóstico</label>
          <textarea v-model="form.diagnostico" class="form-input" rows="3"
            placeholder="Diagnóstico clínico del animal" />
        </div>

        <div class="form-field">
          <label>Notas adicionales</label>
          <textarea v-model="form.notas" class="form-input" rows="2"
            placeholder="Indicaciones especiales, observaciones..." />
        </div>

        <button class="submit-btn" :disabled="saving" @click="handleCreate">
          <ion-icon v-if="!saving" :icon="checkmarkOutline" />
          {{ saving ? 'Emitiendo...' : 'Emitir receta' }}
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon,
} from '@ionic/vue';
import { medkitOutline, checkmarkOutline } from 'ionicons/icons';
import { recetaService } from '@/services/receta.service';
import { catalogoService } from '@/services/catalogo.service';
import { useToast } from '@/composables/useToast';
import type { Medicamento } from '@/types';

const route  = useRoute();
const router = useRouter();
const toast  = useToast();

const idFinca     = Number(route.params.idFinca);
const numeroArete = String(route.params.numeroArete);

const saving = ref(false);
const medicamentos = ref<Medicamento[]>([]);

const form = ref({
  id_medicamento: null as number | null,
  dosis: '',
  frecuencia: '',
  duracion_dias: 7,
  fecha_emision: new Date().toISOString().split('T')[0],
  diagnostico: '',
  notas: '',
});

onMounted(async () => {
  try {
    medicamentos.value = await catalogoService.getMedicamentos();
  } catch {
    await toast.error('Error al cargar medicamentos.');
  }
});

async function handleCreate() {
  if (!form.value.id_medicamento || !form.value.dosis ||
      !form.value.frecuencia || !form.value.duracion_dias) {
    await toast.warning('Completa los campos obligatorios.');
    return;
  }

  saving.value = true;
  try {
    await recetaService.create(idFinca, numeroArete, {
      id_medicamento: form.value.id_medicamento,
      dosis:          form.value.dosis,
      frecuencia:     form.value.frecuencia,
      duracion_dias:  form.value.duracion_dias,
      fecha_emision:  form.value.fecha_emision || undefined,
      diagnostico:    form.value.diagnostico || undefined,
      notas:          form.value.notas || undefined,
    });
    await toast.success('Receta emitida correctamente.');
    router.replace(`/fincas/${idFinca}/animales/${numeroArete}/recetas`);
  } catch (err: any) {
    const msg = err.response?.data?.error
             ?? err.response?.data?.message
             ?? 'Error al emitir la receta.';
    await toast.error(msg);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
ion-content { --background: #071a1a; }

.form-wrapper {
  padding: 20px 16px 100px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-banner {
  background: linear-gradient(135deg, rgba(0,184,148,0.1), rgba(0,184,148,0.05));
  border: 1px solid rgba(0,184,148,0.25);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.info-banner ion-icon {
  font-size: 1.8rem;
  color: #00B894;
  flex-shrink: 0;
}
.banner-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #E8F4F0;
  margin: 0;
}
.banner-sub {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.55);
  margin: 2px 0 0;
}

.form-field { display: flex; flex-direction: column; gap: 6px; }

.form-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.form-input {
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.2);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 0.9rem;
  color: #E8F4F0;
  font-family: inherit;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: #00B894; }

.submit-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  margin-top: 12px;
  box-shadow: 0 4px 16px rgba(0,184,148,0.3);
}
.submit-btn:disabled { opacity: 0.6; }
</style>