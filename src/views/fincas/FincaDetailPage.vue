<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/fincas" />
        </ion-buttons>
        <ion-title>Detalle Finca</ion-title>
        <ion-buttons v-if="canEdit" slot="end">
          <ion-button @click="showEdit = true">
            <ion-icon :icon="createOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <div v-else-if="finca" class="container">
        <div class="hero-card">
          <div class="hero-icon">
            <ion-icon :icon="homeOutline" />
          </div>
          <div class="hero-info">
            <h1>{{ finca.nombre }}</h1>
            <p v-if="finca.ubicacion">
              <ion-icon :icon="locationOutline" />
              {{ finca.ubicacion }}
            </p>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <ion-icon :icon="leafOutline" />
            <span class="stat-value">{{ finca.animales_count ?? 0 }}</span>
            <span class="stat-label">Animales</span>
          </div>
          <div class="stat-box">
            <ion-icon :icon="resizeOutline" />
            <span class="stat-value">{{ finca.hectareas ?? '—' }}</span>
            <span class="stat-label">Hectáreas</span>
          </div>
        </div>

        <div class="actions">
          <button class="action-btn primary" @click="$router.push(`/fincas/${idFinca}/animales`)">
            <ion-icon :icon="leafOutline" />
            <span>Ver animales</span>
          </button>
          <button class="action-btn" @click="$router.push(`/fincas/${idFinca}/reporte`)">
            <ion-icon :icon="documentTextOutline" />
            <span>Reporte de la finca</span>
          </button>
        </div>

        <div v-if="finca.notas" class="notes-card">
          <h3>Notas</h3>
          <p>{{ finca.notas }}</p>
        </div>

        <div v-if="canDelete" class="danger-zone">
          <button class="danger-btn" @click="confirmDelete">
            <ion-icon :icon="trashOutline" />
            Eliminar finca
          </button>
        </div>
      </div>

      <!-- Modal editar -->
      <ion-modal :is-open="showEdit" @did-dismiss="showEdit = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Editar Finca</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showEdit = false">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div v-if="editForm" class="form-wrapper">
            <div class="form-field">
              <label>Nombre *</label>
              <input v-model="editForm.nombre" class="form-input" />
            </div>
            <div class="form-field">
              <label>Ubicación</label>
              <input v-model="editForm.ubicacion" class="form-input" />
            </div>
            <div class="form-field">
              <label>Hectáreas</label>
              <input v-model="editForm.hectareas" type="number" step="0.01" class="form-input" />
            </div>
            <div class="form-field">
              <label>Notas</label>
              <textarea v-model="editForm.notas" class="form-input" rows="3" />
            </div>
            <button class="submit-btn" :disabled="saving" @click="handleUpdate">
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
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
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonBackButton, IonIcon, IonSpinner,
  IonModal, alertController,
} from '@ionic/vue';
import {
  homeOutline, locationOutline, leafOutline, resizeOutline,
  documentTextOutline, createOutline, trashOutline, closeOutline,
} from 'ionicons/icons';
import { fincaService } from '@/services/finca.service';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/composables/useToast';
import AppTabBar from '@/components/AppTabBar.vue';
import type { Finca } from '@/types';

const route     = useRoute();
const router    = useRouter();
const authStore = useAuthStore();
const toast     = useToast();

const idFinca   = Number(route.params.idFinca);
const finca     = ref<Finca | null>(null);
const loading   = ref(false);
const saving    = ref(false);
const showEdit  = ref(false);
const editForm  = ref<any>(null);

const canEdit   = computed(() => authStore.canEditFincas);
const canDelete = computed(() => authStore.canDeleteFincas);

onMounted(loadFinca);

async function loadFinca() {
  loading.value = true;
  try {
    finca.value = await fincaService.getOne(idFinca);
    editForm.value = {
      nombre:    finca.value.nombre,
      ubicacion: finca.value.ubicacion ?? '',
      hectareas: finca.value.hectareas ?? '',
      notas:     finca.value.notas ?? '',
    };
  } catch {
    await toast.error('Error al cargar la finca.');
  } finally {
    loading.value = false;
  }
}

async function handleUpdate() {
  saving.value = true;
  try {
    await fincaService.update(idFinca, {
      nombre:    editForm.value.nombre,
      ubicacion: editForm.value.ubicacion || undefined,
      hectareas: editForm.value.hectareas ? Number(editForm.value.hectareas) : undefined,
      notas:     editForm.value.notas || undefined,
    });
    await toast.success('Finca actualizada.');
    showEdit.value = false;
    await loadFinca();
  } catch {
    await toast.error('Error al actualizar.');
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  const alert = await alertController.create({
    header: 'Eliminar finca',
    message: `¿Seguro que deseas eliminar ${finca.value?.nombre}?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Eliminar', role: 'destructive', handler: handleDelete },
    ],
  });
  await alert.present();
}

async function handleDelete() {
  try {
    await fincaService.delete(idFinca);
    await toast.success('Finca eliminada.');
    router.replace('/fincas');
  } catch {
    await toast.error('Error al eliminar.');
  }
}
</script>

<style scoped>
ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }
ion-content { --background: #071a1a; }

.container { padding: 20px 16px 100px; }

.hero-card {
  background: linear-gradient(135deg, #0F2E2E, #164545);
  border: 1px solid rgba(0,184,148,0.2);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.hero-icon {
  width: 60px; height: 60px;
  background: rgba(0,184,148,0.2);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  color: #00B894;
}
.hero-icon ion-icon { font-size: 1.8rem; }

.hero-info { flex: 1; min-width: 0; }
.hero-info h1 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #E8F4F0;
  margin: 0 0 4px;
}
.hero-info p {
  color: rgba(255,255,255,0.55);
  font-size: 0.85rem;
  margin: 0;
  display: flex; align-items: center; gap: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.stat-box {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}

.stat-box ion-icon {
  font-size: 1.5rem;
  color: #00B894;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #E8F4F0;
}

.stat-label {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.action-btn {
  width: 100%;
  padding: 14px;
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.15);
  color: #E8F4F0;
  border-radius: 14px;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
}

.action-btn ion-icon { font-size: 1.2rem; color: #00B894; }

.action-btn.primary {
  background: linear-gradient(135deg, #00B894, #009B7D);
  border-color: transparent;
  color: white;
}
.action-btn.primary ion-icon { color: white; }

.notes-card {
  background: #0F2E2E;
  border: 1px solid rgba(0,184,148,0.1);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.notes-card h3 {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 10px;
}

.notes-card p {
  color: rgba(255,255,255,0.8);
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
}

.danger-zone {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.danger-btn {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1.5px solid rgba(231,76,60,0.4);
  color: #E74C3C;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
}

ion-modal { --height: 100%; --width: 100%; --border-radius: 0; --background: #071a1a; }
ion-modal ion-content { --background: #071a1a; }
ion-modal ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }

@media (min-width: 768px) {
  ion-modal { --height: 70%; --width: 500px; --border-radius: 20px; }
}

.form-wrapper { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label {
  font-size: 0.75rem; font-weight: 600;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase; letter-spacing: 0.8px;
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
.form-input:focus { border-color: #00B894; }
.submit-btn {
  width: 100%; height: 48px;
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white; border: none; border-radius: 12px;
  font-weight: 600; cursor: pointer; font-family: inherit;
  margin-top: 8px;
}
.submit-btn:disabled { opacity: 0.6; }
</style>