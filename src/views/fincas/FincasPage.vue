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

      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <div v-else-if="fincas.length === 0" class="empty-state">
        <ion-icon :icon="homeOutline" />
        <h3>No tienes fincas</h3>
        <p v-if="authStore.canCreateFincas">Crea tu primera finca con el botón +</p>
        <p v-else>Espera a que un administrador te asigne una finca.</p>
      </div>

      <div v-else class="fincas-grid">
        <div
          v-for="finca in fincas"
          :key="finca.id_finca"
          class="finca-card"
          @click="$router.push(`/fincas/${finca.id_finca}`)"
        >
          <div class="card-icon">
            <ion-icon :icon="homeOutline" />
          </div>
          <div class="card-info">
            <h3>{{ finca.nombre }}</h3>
            <p v-if="finca.ubicacion">
              <ion-icon :icon="locationOutline" />
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

      <!-- Modal nueva finca -->
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
        <ion-content class="ion-padding">
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
              <textarea v-model="form.notas" class="form-input" rows="3" />
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
ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
ion-content { --background: #071a1a; }

.hero {
  padding: 24px 20px 16px;
}

.hero-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #E8F4F0;
  margin: 0;
  letter-spacing: -0.5px;
}

.hero-sub {
  color: rgba(255,255,255,0.45);
  font-size: 0.85rem;
  margin: 4px 0 0;
}

.empty-state {
  text-align: center;
  padding: 80px 32px;
  color: rgba(255,255,255,0.4);
}

.empty-state ion-icon {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: rgba(255,255,255,0.7);
  font-weight: 600;
  margin: 0 0 8px;
}

.empty-state p { font-size: 0.9rem; margin: 0; }

.fincas-grid {
  padding: 0 16px 100px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.finca-card {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.2s;
}

.finca-card:hover {
  border-color: rgba(0,184,148,0.4);
  transform: translateY(-2px);
}

.card-icon {
  width: 52px; height: 52px;
  background: rgba(0,184,148,0.15);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  color: #00B894;
  flex-shrink: 0;
}
.card-icon ion-icon { font-size: 1.6rem; }

.card-info { flex: 1; min-width: 0; }
.card-info h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #E8F4F0;
  margin: 0 0 4px;
}
.card-info p {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.5);
  margin: 0 0 8px;
  display: flex; align-items: center; gap: 4px;
}
.card-info p ion-icon { font-size: 0.9rem; }

.card-stats {
  display: flex;
  gap: 14px;
}

.stat {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.6);
  display: flex; align-items: center; gap: 4px;
}
.stat ion-icon {
  font-size: 0.85rem;
  color: #00B894;
}

.card-chevron {
  color: rgba(255,255,255,0.3);
  font-size: 1.2rem;
  flex-shrink: 0;
}

/* Modal */
ion-modal {
  --height: 100%; --width: 100%; --border-radius: 0;
  --background: #071a1a;
}
ion-modal ion-content { --background: #071a1a; --color: #E8F4F0; }
ion-modal ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }

@media (min-width: 768px) {
  ion-modal {
    --height: 70%; --width: 500px;
    --max-height: 600px; --border-radius: 20px;
  }
}

.form-wrapper {
  display: flex; flex-direction: column; gap: 16px;
  padding-top: 8px;
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
}

.form-input:focus {
  border-color: #00B894;
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  font-family: inherit;
}

.submit-btn:disabled { opacity: 0.6; }
</style>