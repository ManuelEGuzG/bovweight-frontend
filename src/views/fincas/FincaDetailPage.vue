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
      <div v-if="loading" class="ion-text-center ion-padding spinner-container">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <div v-else-if="finca" class="container animate-fade-in">
        <!-- Tarjeta Principal (Hero) -->
        <div class="hero-card">
          <div class="hero-icon">
            <ion-icon :icon="homeOutline" />
          </div>
          <div class="hero-info">
            <h1>{{ finca.nombre }}</h1>
            <p v-if="finca.ubicacion">
              <ion-icon :icon="locationOutline" class="loc-icon" />
              {{ finca.ubicacion }}
            </p>
          </div>
        </div>

        <!-- Bloque de Contenido Principal Adaptativo -->
        <div class="main-content-layout">
          <!-- Cuadrícula de Estadísticas -->
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

          <!-- Botones de Acción -->
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
        </div>

        <!-- Sección de Notas -->
        <div v-if="finca.notas" class="notes-card">
          <h3>Notas</h3>
          <p>{{ finca.notas }}</p>
        </div>

        <!-- Zona de Peligro -->
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
        <ion-content class="ion-padding modal-form-content">
          <div v-if="editForm" class="form-wrapper">
            <div class="form-field">
              <label>Nombre *</label>
              <input v-model="editForm.nombre" class="form-input" placeholder="Nombre de la finca" />
            </div>
            <div class="form-field">
              <label>Ubicación</label>
              <input v-model="editForm.ubicacion" class="form-input" placeholder="Ubicación geográfica" />
            </div>
            <div class="form-field">
              <label>Hectáreas</label>
              <input v-model="editForm.hectareas" type="number" step="0.01" class="form-input" placeholder="0.00" />
            </div>
            <div class="form-field">
              <label>Notas</label>
              <textarea v-model="editForm.notas" class="form-input form-textarea" rows="3" placeholder="Observaciones adicionales..." />
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
ion-toolbar { 
  --background: #0d2b2b; 
  --color: #E8F4F0; 
  font-family: 'Inter', sans-serif;
}
ion-content { --background: #071a1a; }

.spinner-container {
  padding: 60px 0;
}

.container { 
  padding: 24px 20px 120px; 
  max-width: 1000px;
  margin: 0 auto;
}

/* Tarjeta Hero Principal */
.hero-card {
  background: linear-gradient(135deg, #0F2E2E 0%, #143D3D 100%);
  border: 1.5px solid rgba(0,184,148,0.22);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(7, 26, 26, 0.4);
}

.hero-icon {
  width: 64px; 
  height: 64px;
  background: rgba(0, 184, 148, 0.15);
  border-radius: 16px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  color: #00B894;
  flex-shrink: 0;
  border: 1px solid rgba(0, 184, 148, 0.2);
}
.hero-icon ion-icon { font-size: 1.9rem; }

.hero-info { flex: 1; min-width: 0; }
.hero-info h1 {
  font-size: 1.55rem;
  font-weight: 800;
  color: #E8F4F0;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
  font-family: 'Inter', sans-serif;
}
.hero-info p {
  color: rgba(255,255,255,0.5);
  font-size: 0.88rem;
  margin: 0;
  display: flex; 
  align-items: center; 
  gap: 6px;
  font-weight: 500;
}

.loc-icon {
  color: #00B894;
  font-size: 1rem;
}

/* Layout responsivo intermedio */
.main-content-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

/* Cuadrícula de Datos */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-box {
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.12);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.stat-box:hover {
  border-color: rgba(0,184,148,0.3);
  transform: translateY(-2px);
}

.stat-box ion-icon {
  font-size: 1.6rem;
  color: #00B894;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #E8F4F0;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
}

/* Sección de Acciones */
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  padding: 15px;
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.15);
  color: #E8F4F0;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: inherit;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

.action-btn ion-icon { 
  font-size: 1.25rem; 
  color: #00B894; 
  transition: transform 0.2s ease;
}

.action-btn:hover:not(.primary) {
  border-color: #00B894;
  background: #123434;
}

.action-btn:hover ion-icon {
  transform: scale(1.1);
}

.action-btn.primary {
  background: linear-gradient(135deg, #00B894, #009B7D);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 16px rgba(0, 184, 148, 0.2);
}
.action-btn.primary ion-icon { color: white; }

.action-btn.primary:hover {
  filter: brightness(1.06);
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.3);
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0) !important;
}

/* Bloque de Notas */
.notes-card {
  background: #0F2E2E;
  border: 1.5px solid rgba(0,184,148,0.12);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.notes-card h3 {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin: 0 0 12px;
  font-weight: 700;
}

.notes-card p {
  color: rgba(255,255,255,0.8);
  font-size: 0.92rem;
  line-height: 1.6;
  margin: 0;
}

/* Zona de Peligro */
.danger-zone {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.danger-btn {
  width: 100%;
  padding: 14px;
  background: transparent;
  border: 1.5px solid rgba(231,76,60,0.35);
  color: #E74C3C;
  border-radius: 14px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  transition: all 0.25s ease;
}

.danger-btn:hover {
  background: rgba(231,76,60,0.08);
  border-color: #E74C3C;
}

/* Modales e Inputs Sincronizados */
ion-modal {
  --height: 100%; --width: 100%; --border-radius: 0;
  --background: #071a1a;
}
ion-modal ion-content { --background: #071a1a; }
ion-modal ion-toolbar { --background: #0d2b2b; --color: #E8F4F0; }

.modal-form-content {
  --padding-start: 24px;
  --padding-end: 24px;
  --padding-top: 16px;
}

.form-wrapper { display: flex; flex-direction: column; gap: 18px; padding-top: 8px; }
.form-field { display: flex; flex-direction: column; gap: 8px; }

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
.form-input:focus { 
  border-color: #00B894; 
  background: #123434;
  box-shadow: 0 0 0 4px rgba(0, 184, 148, 0.1);
}
.form-textarea { resize: none; line-height: 1.4; }

.submit-btn {
  width: 100%; 
  height: 50px;
  background: linear-gradient(135deg, #00B894, #009B7D);
  color: white; 
  border: none; 
  border-radius: 14px;
  font-weight: 700; 
  cursor: pointer; 
  font-family: inherit;
  margin-top: 10px;
  box-shadow: 0 4px 16px rgba(0, 184, 148, 0.2);
  transition: all 0.2s ease;
}
.submit-btn:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.3);
}
.submit-btn:disabled { opacity: 0.5; box-shadow: none; }

/* Animaciones */
.animate-fade-in {
  animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Estructura Desktop */
@media (min-width: 768px) {
  .main-content-layout {
    grid-template-columns: 1.2fr 1fr;
    gap: 16px;
  }
  
  .actions {
    justify-content: center;
  }

  ion-modal { 
    --height: 80%; 
    --width: 520px; 
    --max-height: 580px;
    --border-radius: 20px; 
  }
}
</style>