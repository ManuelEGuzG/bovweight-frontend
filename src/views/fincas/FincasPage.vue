<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mis Fincas</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="authStore.canCreateFincas" @click="showForm = true">
            <ion-icon :icon="addOutline" />
          </ion-button>
          <ion-button @click="handleLogout">
            <ion-icon :icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="hero">
        <h2 class="hero-title">{{ saludo }}, {{ authStore.persona?.nombre }}</h2>
        <p class="hero-sub">{{ authStore.persona?.rol?.nombre }} · {{ fincas.length }} {{ fincas.length === 1 ? 'finca' : 'fincas' }}</p>
      </div>

      <div v-if="loading" class="ion-text-center ion-padding spinner-container">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <div v-else-if="fincas.length === 0" class="empty-state animate-fade-in">
        <ion-icon :icon="homeOutline" />
        <h3>No tienes fincas</h3>
        <p v-if="authStore.canCreateFincas">Crea tu primera finca con el botón +</p>
        <p v-else>Espera a que un administrador te asigne una finca.</p>
      </div>

      <div v-else class="fincas-grid">
        <div
          v-for="(finca, index) in fincas"
          :key="finca.id_finca"
          class="finca-card animate-card"
          :style="{ '--delay': index + 1 }"
          @click="$router.push(`/fincas/${finca.id_finca}`)"
        >
          <div class="card-icon">
            <ion-icon :icon="homeOutline" />
          </div>
          <div class="card-info">
            <h3>{{ finca.nombre }}</h3>
            <p v-if="finca.ubicacion">
              <ion-icon :icon="locationOutline" class="loc-icon" />
              {{ finca.ubicacion }}
            </p>
            <div class="card-stats">
              <span class="stat">
                <ion-icon :icon="leafOutline" />
                {{ finca.animales_count ?? 0 }} {{ (finca.animales_count ?? 0) === 1 ? 'animal' : 'animales' }}
              </span>
              <span v-if="finca.hectareas" class="stat">
                <ion-icon :icon="resizeOutline" />
                {{ finca.hectareas }} ha
              </span>
            </div>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="card-chevron" />
        </div>
      </div>

      <ion-modal :is-open="showForm" @did-dismiss="resetForm">
        <ion-header>
          <ion-toolbar>
            <ion-title>Nueva Finca</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="resetForm">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding modal-form-content">
          <div class="form-wrapper">
            <div class="form-field">
              <label>Nombre *</label>
              <input v-model="form.nombre" class="form-input" placeholder="Finca La Esperanza" />
            </div>
            <div class="form-field">
              <label>Ubicación</label>
              <input v-model="form.ubicacion" class="form-input" placeholder="Tilarán, Guanacaste" />
            </div>
            <div class="form-field">
              <label>Hectáreas</label>
              <input v-model="form.hectareas" type="number" step="0.01" class="form-input" placeholder="25.50" />
            </div>
            <div class="form-field">
              <label>Notas</label>
              <textarea v-model="form.notas" class="form-input form-textarea" rows="3" placeholder="Detalles opcionales de la finca..." />
            </div>
            <button class="submit-btn" :disabled="saving" @click="handleCreate">
              {{ saving ? 'Creando...' : 'Crear Finca' }}
            </button>
          </div>
        </ion-content>
      </ion-modal>

      <AppTabBar />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonSpinner, IonModal,
} from '@ionic/vue';
import {
  addOutline, homeOutline, locationOutline, leafOutline,
  resizeOutline, chevronForwardOutline, closeOutline, logOutOutline,
} from 'ionicons/icons';
import { fincaService } from '@/services/finca.service';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';
import AppTabBar from '@/components/AppTabBar.vue';
import type { Finca } from '@/types';

const router    = useRouter();
const authStore = useAuthStore();
const toast     = useToast();

const fincas    = ref<Finca[]>([]);
const loading   = ref(false);
const saving    = ref(false);
const showForm  = ref(false);

const form = ref({ nombre: '', ubicacion: '', hectareas: '', notas: '' });

const saludo = computed(() => {
  const h = new Date().getHours();
  if (h < 12)  return 'Buenos días';
  if (h < 18)  return 'Buenas tardes';
  return 'Buenas noches';
});

onMounted(loadFincas);

async function loadFincas() {
  loading.value = true;
  try {
    fincas.value = await fincaService.getAll();
  } catch {
    await toast.error('Error al cargar las fincas.');
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  if (!form.value.nombre) {
    await toast.warning('El nombre es requerido.');
    return;
  }

  saving.value = true;
  try {
    const data = {
      nombre:    form.value.nombre,
      ubicacion: form.value.ubicacion || undefined,
      hectareas: form.value.hectareas ? Number(form.value.hectareas) : undefined,
      notas:     form.value.notas || undefined,
    };
    await fincaService.create(data);
    await toast.success('Finca creada.');
    resetForm();
    await loadFincas();
  } catch {
    await toast.error('Error al crear la finca.');
  } finally {
    saving.value = false;
  }
}

function resetForm() {
  showForm.value = false;
  form.value = { nombre: '', ubicacion: '', hectareas: '', notas: '' };
}

async function handleLogout() {
  await authStore.logout();
  router.replace('/login');
}
</script>

<style scoped>
ion-toolbar { 
  --background: #0d2b2b; 
  --color: #E8F4F0; 
  font-family: 'Inter', sans-serif;
}
ion-content { --background: #071a1a; }

.hero {
  padding: 32px 24px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #E8F4F0;
  margin: 0;
  letter-spacing: -0.5px;
  font-family: 'Inter', sans-serif;
}

.hero-sub {
  color: rgba(255,255,255,0.45);
  font-size: 0.9rem;
  margin: 6px 0 0;
  font-weight: 500;
}

.spinner-container {
  padding: 60px 0;
}

.empty-state {
  text-align: center;
  padding: 100px 32px;
  color: rgba(255,255,255,0.4);
  max-width: 400px;
  margin: 0 auto;
}

.empty-state ion-icon {
  font-size: 4.5rem;
  color: #00B894;
  opacity: 0.25;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #E8F4F0;
  font-weight: 700;
  font-size: 1.2rem;
  margin: 0 0 8px;
}

.empty-state p { 
  font-size: 0.92rem; 
  line-height: 1.5;
  color: rgba(255,255,255,0.45); 
}

/* Rejilla de Fincas Mejorada */
.fincas-grid {
  padding: 0 24px 120px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.finca-card {
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.12);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-card {
  opacity: 0;
  animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: calc(var(--delay) * 0.08s);
}

.finca-card:hover {
  border-color: #00B894;
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 184, 148, 0.12);
}

.card-icon {
  width: 56px; 
  height: 56px;
  background: rgba(0, 184, 148, 0.12);
  border-radius: 14px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  color: #00B894;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.finca-card:hover .card-icon {
  background: rgba(0, 255, 183, 0.18);
  color: #00FFB7;
  transform: scale(1.02);
}

.card-icon ion-icon { font-size: 1.65rem; }

.card-info { flex: 1; min-width: 0; }

.card-info h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #E8F4F0;
  margin: 0 0 6px;
  letter-spacing: -0.2px;
}

.card-info p {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.45);
  margin: 0 0 10px;
  display: flex; 
  align-items: center; 
  gap: 5px;
}

.loc-icon { 
  font-size: 0.95rem; 
  color: rgba(0, 184, 148, 0.7);
}

.card-stats {
  display: flex;
  gap: 16px;
}

.stat {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.6);
  display: flex; 
  align-items: center; 
  gap: 5px;
  font-weight: 500;
}

.stat ion-icon {
  font-size: 0.9rem;
  color: #00B894;
}

.card-chevron {
  color: rgba(255,255,255,0.25);
  font-size: 1.25rem;
  margin-left: 4px;
  flex-shrink: 0;
  transition: transform 0.25s;
}

.finca-card:hover .card-chevron {
  transform: translateX(3px);
  color: #00FFB7;
}

/* Modal Estilizado */
ion-modal {
  --height: 100%; 
  --width: 100%; 
  --border-radius: 0;
  --background: #071a1a;
}
ion-modal ion-content { --background: #071a1a; --color: #E8F4F0; }
ion-modal ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }

.modal-form-content {
  --padding-start: 24px;
  --padding-end: 24px;
  --padding-top: 16px;
}

.form-wrapper {
  display: flex; 
  flex-direction: column; 
  gap: 18px;
}

.form-field { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
}

.form-field label {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.form-input {
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.15);
  border-radius: 12px;
  padding: 13px 16px;
  font-size: 0.95rem;
  color: #E8F4F0;
  font-family: inherit;
  outline: none;
  transition: all 0.25s ease;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: rgba(255,255,255,0.25);
}

.form-input:focus {
  border-color: #00B894;
  background: #123434;
  box-shadow: 0 0 0 4px rgba(0, 184, 148, 0.1);
}

.form-textarea {
  resize: none;
  line-height: 1.4;
}

.submit-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 10px;
  font-family: inherit;
  box-shadow: 0 4px 16px rgba(0, 184, 148, 0.2);
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled { 
  opacity: 0.5; 
  cursor: not-allowed;
  box-shadow: none;
}

/* Animaciones */
.animate-fade-in {
  animation: fadeIn 0.5s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── Media Queries para Responsividad Superior ──────────────── */
@media (min-width: 576px) {
  .fincas-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  ion-modal {
    --height: 80%; 
    --width: 520px;
    --max-height: 580px; 
    --border-radius: 20px;
  }
}

@media (min-width: 992px) {
  .fincas-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}
</style>